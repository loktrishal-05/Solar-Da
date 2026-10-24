import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// A stand-in vision service: answers "late blight" unless the uploaded bytes spell BLUR.
let fake: Server;
let api: Server;
let base = '';
before(async () => {
  fake = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const blur = Buffer.concat(chunks).includes('BLUR');
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(blur
        ? { abstain: true, reason: 'Photo is too blurry. Retake.', predictions: [] }
        : { abstain: false, top: { label: 'Tomato___Late_blight', healthy: false, confidence: 0.99 }, threshold: 0.93 }));
    });
  });
  await new Promise<void>((ok) => fake.listen(0, ok));
  process.env.SOLARDA_VISION = `http://127.0.0.1:${(fake.address() as any).port}`;
  process.env.SOLARDA_RUNTIME_DIR = mkdtempSync(join(tmpdir(), 'solarda-'));
  const { app } = await import('./app.js');
  api = app.listen(0);
  await new Promise<void>((ok) => api.on('listening', ok));
  base = `http://127.0.0.1:${(api.address() as any).port}/api`;
});
after(() => { api.close(); fake.close(); });

const report = (bytes: string) => fetch(base + '/disease/report', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ imageUrl: `data:image/jpeg;base64,${Buffer.from(bytes).toString('base64')}`, imageTarget: 'CANOPY' }),
}).then((r) => r.json());

test('the diagnosis depends on the image content, not a fixed answer', async () => {
  const sharp = await report('LEAF-PIXELS');
  assert.equal(sharp.report.predictedClass, 'Tomato___Late_blight');
  assert.equal(sharp.report.diagnosisSource, 'vision-v1 (calibrated)');
  assert.equal(sharp.report.abstained, false);
  const blurry = await report('BLUR');
  assert.equal(blurry.report.abstained, true);
  assert.match(blurry.report.abstainReason, /blurry/);
  assert.notEqual(blurry.report.predictedClass, 'HEALTHY_CANOPY_AND_ROOTS');
});

test('root-port images keep the heuristic path and say so', async () => {
  const r = await fetch(base + '/disease/report', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ imageUrl: 'https://example.com/root.jpg', imageTarget: 'ROOT_PORT' }) }).then((x) => x.json());
  assert.match(r.report.diagnosisSource, /heuristic/);
});
