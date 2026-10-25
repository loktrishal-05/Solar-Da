# %% [markdown]
# # Solarda leaf-disease model v2 (Phase I)
# v2 changes vs v1 (same EfficientNetV2-B0, so size/latency/memory are unchanged): stronger field-style augmentation
# (translation, wider zoom, saturation/hue jitter), 800 lab images per class, PlantDoc oversampled 8x, label smoothing 0.1,
# up to 8 fine-tune epochs. Same PlantDoc test split, so numbers compare directly with v1 (field accuracy 0.6102).
# Fine-tunes EfficientNetV2-B0 on PlantVillage (lab) plus the PlantDoc training split (field),
# evaluates lab vs field accuracy, calibrates with temperature scaling, picks an abstain
# threshold on validation, and exports ONNX for `services/vision`.
#
# Runtime: Colab GPU (T4). Run all cells; the last cell downloads `solarda_vision.zip`.
# Data: PlantVillage (spMohanty/PlantVillage-Dataset, CC BY-SA 3.0), PlantDoc
# (pratikkayal/PlantDoc-Dataset, CC BY 4.0).

# %%
!nvidia-smi -L
!pip -q install tf2onnx onnx onnxruntime
import os, json, random, pathlib, time
import numpy as np
import tensorflow as tf
print(tf.__version__, tf.config.list_physical_devices('GPU'))
SEED = 1337
random.seed(SEED); np.random.seed(SEED); tf.random.set_seed(SEED)
IMG = 224
BATCH = 64

# %%
%cd /content
if not os.path.exists('PlantVillage-Dataset'):
    !git clone -q --depth 1 --filter=blob:none --sparse https://github.com/spMohanty/PlantVillage-Dataset
    !cd PlantVillage-Dataset && git sparse-checkout set raw/color
if not os.path.exists('PlantDoc-Dataset'):
    !git clone -q --depth 1 https://github.com/pratikkayal/PlantDoc-Dataset
PV = pathlib.Path('/content/PlantVillage-Dataset/raw/color')
PD = pathlib.Path('/content/PlantDoc-Dataset')
CLASSES = sorted(p.name for p in PV.iterdir() if p.is_dir())
print(len(CLASSES), CLASSES[:5])
assert len(CLASSES) == 38

# %%
# PlantDoc folder -> PlantVillage class, by keywords that must all appear in the PV class name.
PD_KEYS = {
    'apple scab leaf': ('apple', 'scab'), 'apple leaf': ('apple', 'healthy'), 'apple rust leaf': ('apple', 'rust'),
    'bell_pepper leaf': ('pepper', 'healthy'), 'bell_pepper leaf spot': ('pepper', 'bacterial'),
    'blueberry leaf': ('blueberry', 'healthy'), 'cherry leaf': ('cherry', 'healthy'),
    'corn gray leaf spot': ('corn', 'gray'), 'corn leaf blight': ('corn', 'blight'), 'corn rust leaf': ('corn', 'rust'),
    'peach leaf': ('peach', 'healthy'), 'potato leaf early blight': ('potato', 'early'),
    'potato leaf late blight': ('potato', 'late'), 'raspberry leaf': ('raspberry', 'healthy'),
    'soyabean leaf': ('soybean', 'healthy'), 'squash powdery mildew leaf': ('squash', 'powdery'),
    'strawberry leaf': ('strawberry', 'healthy'), 'tomato early blight leaf': ('tomato', 'early'),
    'tomato septoria leaf spot': ('tomato', 'septoria'), 'tomato leaf': ('tomato', 'healthy'),
    'tomato leaf bacterial spot': ('tomato', 'bacterial'), 'tomato leaf late blight': ('tomato', 'late'),
    'tomato leaf mosaic virus': ('tomato', 'mosaic'), 'tomato leaf yellow virus': ('tomato', 'yellow'),
    'tomato mold leaf': ('tomato', 'mold'), 'tomato two spotted spider mites leaf': ('tomato', 'spider'),
    'grape leaf': ('grape', 'healthy'), 'grape leaf black rot': ('grape', 'black_rot'),
}
def pd_class(folder):
    keys = PD_KEYS.get(folder.lower().strip())
    if not keys: return None
    hits = [c for c in CLASSES if all(k in c.lower() for k in keys)]
    return hits[0] if len(hits) == 1 else None

IMG_EXT = {'.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'}
def list_split(root):
    items, skipped = [], set()
    for d in sorted(root.iterdir()):
        if not d.is_dir(): continue
        c = pd_class(d.name)
        if c is None: skipped.add(d.name); continue
        items += [(str(f), CLASSES.index(c)) for f in d.iterdir() if f.suffix in IMG_EXT]
    return items, skipped
pd_train_all, sk1 = list_split(PD / 'train')
pd_test, sk2 = list_split(PD / 'test')
print('PlantDoc unmapped folders:', sk1 | sk2)
print('PlantDoc train', len(pd_train_all), 'test', len(pd_test))

pv = [(str(f), i) for i, c in enumerate(CLASSES) for f in sorted((PV / c).iterdir()) if f.suffix in IMG_EXT]
random.shuffle(pv); random.shuffle(pd_train_all)
n = len(pv)
pv_train, pv_val, pv_test = pv[:int(.8*n)], pv[int(.8*n):int(.9*n)], pv[int(.9*n):]
# Cap lab images per class in training (Colab has 2 CPUs; JPEG decoding is the bottleneck). Val/test keep the full splits.
PV_PER_CLASS = 800
per_class = {}
capped = []
for item in pv_train:
    per_class[item[1]] = per_class.get(item[1], 0) + 1
    if per_class[item[1]] <= PV_PER_CLASS:
        capped.append(item)
pv_train = capped
k = int(.85 * len(pd_train_all))
pd_train, pd_val = pd_train_all[:k], pd_train_all[k:]
print('PV', len(pv_train), len(pv_val), len(pv_test), '| PD', len(pd_train), len(pd_val), len(pd_test))

# %%
def load(path, label):
    img = tf.io.decode_image(tf.io.read_file(path), channels=3, expand_animations=False)
    return tf.image.resize(img, (IMG, IMG)), tf.one_hot(label, 38)

augment = tf.keras.Sequential([
    tf.keras.layers.RandomFlip('horizontal_and_vertical'), tf.keras.layers.RandomRotation(0.2),
    tf.keras.layers.RandomZoom((-0.4, 0.15)), tf.keras.layers.RandomTranslation(0.15, 0.15),
    tf.keras.layers.RandomContrast(0.4), tf.keras.layers.RandomBrightness(0.35, value_range=(0, 255)),
])

def colour_jitter(x):  # field photos vary in white balance and saturation far more than lab scans
    x = tf.image.random_saturation(x / 255.0, 0.6, 1.4)
    x = tf.image.random_hue(x, 0.04)
    return tf.clip_by_value(x, 0, 1) * 255.0

def ds(items, train=False):
    paths, labels = zip(*items)
    d = tf.data.Dataset.from_tensor_slices((list(paths), list(labels)))
    if train: d = d.shuffle(len(items), seed=SEED, reshuffle_each_iteration=True)
    d = d.map(load, num_parallel_calls=tf.data.AUTOTUNE).ignore_errors()
    d = d.batch(BATCH)
    if train: d = d.map(lambda x, y: (colour_jitter(augment(x, training=True)), y), num_parallel_calls=tf.data.AUTOTUNE)
    return d.prefetch(tf.data.AUTOTUNE)

# Oversample field photos 8x so the model sees field conditions, not only lab backgrounds.
train_items = pv_train + pd_train * 8
random.shuffle(train_items)
train_ds = ds(train_items, train=True)
val_ds = ds(pv_val + pd_val)

# %%
def build(weights='imagenet'):
    base = tf.keras.applications.EfficientNetV2B0(include_top=False, weights=weights,
                                                  input_shape=(IMG, IMG, 3), include_preprocessing=True)
    inp = tf.keras.Input((IMG, IMG, 3), name='image')  # raw RGB 0..255
    x = base(inp, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    # float32 logits even under mixed precision; softmax is applied after temperature scaling
    logits = tf.keras.layers.Dense(len(CLASSES), name='logits', dtype='float32')(x)
    return tf.keras.Model(inp, logits), base

tf.keras.mixed_precision.set_global_policy('mixed_float16')  # T4 tensor cores
model, base = build()
loss = tf.keras.losses.CategoricalCrossentropy(from_logits=True, label_smoothing=0.1)

base.trainable = False
model.compile(tf.keras.optimizers.Adam(1e-3), loss, metrics=['accuracy'])
model.fit(train_ds, validation_data=val_ds, epochs=2)

base.trainable = True
for layer in base.layers:
    if isinstance(layer, tf.keras.layers.BatchNormalization): layer.trainable = False
model.compile(tf.keras.optimizers.Adam(1e-4), loss, metrics=['accuracy'])
model.fit(train_ds, validation_data=val_ds, epochs=8,
          callbacks=[tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True)])

# Rebuild in float32 for evaluation and ONNX export, with the trained weights.
tf.keras.mixed_precision.set_global_policy('float32')
fp32, _ = build(weights=None)
fp32.set_weights(model.get_weights())
model = fp32

# %%
def logits_of(items):
    out, ys = [], []
    for x, y in ds(items):
        out.append(model(x, training=False).numpy()); ys.append(y.numpy().argmax(1))
    return np.concatenate(out), np.concatenate(ys)

def softmax(z): z = z - z.max(1, keepdims=True); e = np.exp(z); return e / e.sum(1, keepdims=True)

def ece(p, y, bins=15):
    conf, pred = p.max(1), p.argmax(1); e = 0.0
    for lo in np.linspace(0, 1, bins, endpoint=False):
        m = (conf > lo) & (conf <= lo + 1 / bins)
        if m.any(): e += m.mean() * abs((pred[m] == y[m]).mean() - conf[m].mean())
    return float(e)

zv, yv = logits_of(pv_val + pd_val)
# Temperature scaling: 1-D search minimising validation NLL.
def nll(T): p = softmax(zv / T); return -np.log(p[np.arange(len(yv)), yv] + 1e-12).mean()
Ts = np.linspace(0.5, 5, 91); T = float(Ts[np.argmin([nll(t) for t in Ts])])
print('temperature', T)

# Abstain threshold: lowest confidence where accepted *field* validation predictions reach 90% accuracy.
zf, yf = logits_of(pd_val)
pf = softmax(zf / T)
threshold = 0.95
for t in np.arange(0.30, 0.96, 0.01):
    m = pf.max(1) >= t
    if m.sum() >= 20 and (pf.argmax(1)[m] == yf[m]).mean() >= 0.90:
        threshold = float(round(t, 2)); break
print('abstain threshold', threshold)

# %%
def report(items, name):
    z, y = logits_of(items); p = softmax(z / T); pred, conf = p.argmax(1), p.max(1)
    acc = float((pred == y).mean()); keep = conf >= threshold
    return {f'{name}_n': int(len(y)), f'{name}_accuracy': round(acc, 4),
            f'{name}_ece_raw': round(ece(softmax(z), y), 4), f'{name}_ece_calibrated': round(ece(p, y), 4),
            f'{name}_abstain_rate': round(float(1 - keep.mean()), 4),
            f'{name}_accuracy_when_answered': round(float((pred[keep] == y[keep]).mean()) if keep.any() else 0.0, 4)}

metrics = {'model': 'EfficientNetV2-B0', 'version': 'v2', 'img_size': IMG, 'seed': SEED, 'temperature': T,
           'abstain_threshold': threshold, 'classes': len(CLASSES),
           'train': {'plantvillage': len(pv_train), 'plantvillage_cap_per_class': PV_PER_CLASS,
                     'plantdoc': len(pd_train), 'plantdoc_oversample': 8, 'epochs': '2 frozen + up to 8 fine-tune', 'label_smoothing': 0.1,
                     'mixed_precision': True},
           **report(pv_test, 'lab_plantvillage_test'), **report(pd_test, 'field_plantdoc_test'),
           'note': 'Field = PlantDoc test split, mapped classes only. PlantWild not evaluated.'}
print(json.dumps(metrics, indent=2))

# %%
import tf2onnx, onnxruntime as ort
os.makedirs('export', exist_ok=True)
spec = (tf.TensorSpec((None, IMG, IMG, 3), tf.float32, name='image'),)
tf2onnx.convert.from_keras(model, input_signature=spec, opset=17, output_path='export/leaf_disease.onnx')
sess = ort.InferenceSession('export/leaf_disease.onnx')
xb, _ = next(iter(ds(pd_test[:16])))
diff = np.abs(sess.run(None, {'image': xb.numpy()})[0] - model(xb, training=False).numpy()).max()
print('onnx vs keras max abs diff', diff); assert diff < 1e-2

json.dump(CLASSES, open('export/labels.json', 'w'), indent=1)
json.dump({'temperature': T, 'abstain_threshold': threshold, 'input': 'RGB uint8 range as float32, NHWC 224x224, no normalisation'},
          open('export/calibration.json', 'w'), indent=1)
json.dump(metrics, open('export/metrics.json', 'w'), indent=1)
!cd export && zip -q -r ../solarda_vision.zip . && ls -la

# %%
from google.colab import files
files.download('solarda_vision.zip')
