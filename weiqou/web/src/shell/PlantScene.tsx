import React, { useEffect, useRef, useState } from 'react';

// A small real-time 3D garden for the sign-in panel: procedural stems and leaves that sway, drifting pollen, a low sun
// (echoing the logo), and a camera that follows the mouse a little. three.js is loaded only here (its own chunk).
// Reduced motion renders one still frame; no WebGL falls back to an SVG.

type Three = typeof import('three');

const PALETTE = [0x2f7d4f, 0x3e8e5a, 0x5fa35c, 0x7fb24a, 0xa3c94b];

function leafGeometry(T: Three, length: number, width: number, curl: number) {
  const s = new T.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(width, length * 0.25, width * 0.8, length * 0.8, 0, length);
  s.bezierCurveTo(-width * 0.8, length * 0.8, -width, length * 0.25, 0, 0);
  const g = new T.ShapeGeometry(s, 14);
  const p = g.attributes.position as import('three').BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    // Curl along the length and fold along the midrib, so leaves are not flat cards.
    p.setZ(i, Math.pow(y / length, 2) * curl + Math.abs(x) * 0.35);
  }
  g.computeVertexNormals();
  return g;
}

function buildScene(T: Three, canvas: HTMLCanvasElement, still: boolean) {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene();
  scene.background = new T.Color(0x0c261c);
  scene.fog = new T.Fog(0x0c261c, 7, 17);
  const camera = new T.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.set(0, 2.1, 8);

  scene.add(new T.HemisphereLight(0xd6edc6, 0x0c261c, 1.0));
  const sun = new T.DirectionalLight(0xffe0a0, 1.8);
  sun.position.set(5, 7, 3);
  scene.add(sun);

  // Low sun glow, like the dot in the logo.
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const ctx = glowCanvas.getContext('2d')!;
  const grd = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(242,193,78,1)'); grd.addColorStop(0.25, 'rgba(242,193,78,0.55)'); grd.addColorStop(1, 'rgba(242,193,78,0)');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 128, 128);
  const glow = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(glowCanvas), depthWrite: false, fog: false }));
  glow.scale.set(5, 5, 1);
  glow.position.set(3.6, 5.4, -9);
  scene.add(glow);

  const ground = new T.Mesh(new T.CircleGeometry(14, 48), new T.MeshStandardMaterial({ color: 0x12352a, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Plants: deterministic pseudo-random so the panel looks the same every visit.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const plants: Array<{ group: import('three').Group; leaves: import('three').Object3D[]; phase: number }> = [];
  const stemMat = new T.MeshStandardMaterial({ color: 0x3e7a3a, roughness: 0.7 });
  for (let n = 0; n < 15; n++) {
    const group = new T.Group();
    const angle = -1.1 + (n / 14) * 2.2 + (rnd() - 0.5) * 0.2;
    const radius = 1.4 + rnd() * 3.6;
    group.position.set(Math.sin(angle) * radius + 0.6, 0, -Math.cos(angle) * radius * 0.9 + 0.4);
    const h = 1.4 + rnd() * 2.2;
    const lean = (rnd() - 0.5) * 0.6;
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(0, 0, 0), new T.Vector3(lean * 0.3, h * 0.35, 0), new T.Vector3(lean * 0.7, h * 0.7, 0.05), new T.Vector3(lean, h, 0),
    ]);
    group.add(new T.Mesh(new T.TubeGeometry(curve, 24, 0.028 + rnd() * 0.012, 6), stemMat));
    const leaves: import('three').Object3D[] = [];
    const count = 5 + Math.floor(rnd() * 5);
    for (let k = 0; k < count; k++) {
      const t = 0.3 + (k / count) * 0.7;
      const pivot = new T.Group();
      pivot.position.copy(curve.getPoint(t));
      pivot.rotation.y = k * 2.4 + rnd();
      const size = (1 - t * 0.45) * (0.55 + rnd() * 0.35);
      const leaf = new T.Mesh(
        leafGeometry(T, size, size * 0.42, 0.25 + rnd() * 0.25),
        new T.MeshStandardMaterial({ color: PALETTE[Math.floor(rnd() * PALETTE.length)], roughness: 0.55, side: T.DoubleSide }),
      );
      leaf.rotation.z = -(0.7 + rnd() * 0.5);
      pivot.add(leaf);
      group.add(pivot);
      leaves.push(pivot);
    }
    scene.add(group);
    plants.push({ group, leaves, phase: rnd() * Math.PI * 2 });
  }

  // Pollen drifting up through the light.
  const N = 260;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (rnd() - 0.5) * 12; pos[i * 3 + 1] = rnd() * 6; pos[i * 3 + 2] = (rnd() - 0.5) * 8 - 1; }
  const pollenGeo = new T.BufferGeometry();
  pollenGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
  const pollen = new T.Points(pollenGeo, new T.PointsMaterial({ color: 0xd8ef9a, size: 0.045, transparent: true, opacity: 0.75, depthWrite: false }));
  scene.add(pollen);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    mouse.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const clock = new T.Clock();
  const frame = () => {
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    camera.position.x = mouse.x * 0.7;
    camera.position.y = 2.1 - mouse.y * 0.35;
    camera.lookAt(0.3, 1.5, 0);
    for (const p of plants) {
      p.group.rotation.z = Math.sin(t * 0.7 + p.phase) * 0.035;
      p.group.rotation.x = Math.cos(t * 0.5 + p.phase) * 0.02;
      p.leaves.forEach((l, i) => { l.rotation.x = Math.sin(t * 1.3 + p.phase + i) * 0.06; });
    }
    const a = pollenGeo.attributes.position as import('three').BufferAttribute;
    for (let i = 0; i < N; i++) {
      let y = a.getY(i) + 0.004;
      if (y > 6) y = 0;
      a.setY(i, y);
      a.setX(i, a.getX(i) + Math.sin(t + i) * 0.0015);
    }
    a.needsUpdate = true;
    renderer.render(scene, camera);
  };

  const onVisibility = () => renderer.setAnimationLoop(document.hidden || still ? null : frame);
  if (still) frame(); else renderer.setAnimationLoop(frame);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    renderer.setAnimationLoop(null);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pointermove', onMove);
    ro.disconnect();
    scene.traverse((o) => {
      const m = o as import('three').Mesh;
      m.geometry?.dispose();
      const mat = m.material as import('three').Material | import('three').Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
    });
    renderer.dispose();
  };
}

const Fallback: React.FC = () => (
  <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
    <rect width="400" height="400" fill="#0C261C" />
    <circle cx="300" cy="90" r="60" fill="#F2C14E" opacity="0.25" />
    {[60, 140, 220, 300].map((x, i) => (
      <g key={x} transform={`translate(${x} 400)`}>
        <path d={`M0 0 C 4 -80 -6 -160 ${i % 2 ? 8 : -8} -${200 + i * 20}`} stroke="#3E7A3A" strokeWidth="4" fill="none" />
        <path d="M0 -90 C 40 -110 60 -150 50 -170 C 20 -160 5 -130 0 -90Z" fill="#5FA35C" />
        <path d="M0 -140 C -40 -160 -60 -200 -50 -220 C -20 -210 -5 -180 0 -140Z" fill="#A3C94B" />
      </g>
    ))}
  </svg>
);

export const PlantScene: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  // The panel is hidden below 1024px: don't download three.js or run a render loop nobody can see.
  const [wide] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    if (!wide) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    import('three')
      .then((T) => { if (!cancelled && ref.current) cleanup = buildScene(T, ref.current, still); })
      .catch(() => setFailed(true));
    return () => { cancelled = true; cleanup?.(); };
  }, [wide]);
  if (!wide) return null;
  if (failed) return <Fallback />;
  return <canvas ref={ref} className="block h-full w-full" aria-hidden />;
};
