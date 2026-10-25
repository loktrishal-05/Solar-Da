// Builds the Solarda hackathon deck (12 slides, 16:9). Needs `npm i pptxgenjs` (kept out of the repo's dependencies).
//   node docs/deck/build_deck.js "C:/Users/<you>/Downloads/Solarda_Hackathon_Deck.pptx"
// Images come from docs/img (real screenshots of the running app and the two diagrams).
const pptxgen = require('pptxgenjs');
const path = require('path');

const OUT = process.argv[2] || 'Solarda_Hackathon_Deck.pptx';
const IMG = (f) => path.resolve(__dirname, '../img', f);
const C = { g9: '0B2E22', g8: '12452F', g7: '195C3E', lime: 'B7F34A', cream: 'F6F3E8', ink: '0D1B14', mut: '5B6B62', soft: 'C5DCCF', amber: 'F2A93B', red: 'E0645F', white: 'FFFFFF' };
const HEAD = 'Cambria';
const BODY = 'Calibri';

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10 x 5.625 in
pres.title = 'Solarda: Agentic Smart Agriculture';
pres.author = 'Team Solarda';

const shadow = () => ({ type: 'outer', color: '000000', blur: 8, offset: 2, angle: 90, opacity: 0.35 });

function base(slide, title, kicker) {
  slide.background = { color: C.g9 };
  slide.addShape(pres.ShapeType.ellipse, { x: 7.6, y: -2.2, w: 5.2, h: 5.2, fill: { color: C.g7, transparency: 70 }, line: { color: C.g7, transparency: 100 } });
  if (kicker) slide.addText(kicker.toUpperCase(), { x: 0.5, y: 0.28, w: 6, h: 0.25, fontFace: BODY, fontSize: 11, bold: true, color: C.lime, charSpacing: 4, margin: 0, isTextBox: true });
  slide.addText(title, { x: 0.5, y: 0.5, w: 9, h: 0.6, fontFace: HEAD, fontSize: 32, bold: true, color: C.cream, margin: 0, isTextBox: true });
}
function footer(slide, n) {
  slide.addText('Solarda · Agentic AI Hackathon 2026', { x: 0.5, y: 5.3, w: 5, h: 0.22, fontFace: BODY, fontSize: 10, color: C.soft, margin: 0, isTextBox: true });
  slide.addText(String(n), { x: 9.0, y: 5.3, w: 0.5, h: 0.22, fontFace: BODY, fontSize: 10, color: C.soft, align: 'right', margin: 0, isTextBox: true });
}
function card(slide, x, y, w, h, fill, name) {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { color: fill, transparency: 100 }, shadow: shadow(), objectName: name || 'card' });
}
function pic(slide, file, x, y, w, h, name) {
  slide.addShape(pres.ShapeType.roundRect, { x: x - 0.05, y: y - 0.05, w: w + 0.1, h: h + 0.1, rectRadius: 0.08, fill: { color: C.g8 }, line: { color: C.lime, width: 1.25 }, shadow: shadow(), objectName: (name || 'frame') + ' frame' });
  slide.addImage({ path: IMG(file), x, y, w, h, objectName: name || file, altText: name || file });
}
function badge(slide, n, x, y, fill, color) {
  slide.addShape(pres.ShapeType.ellipse, { x, y, w: 0.42, h: 0.42, fill: { color: fill || C.lime }, line: { color: fill || C.lime, transparency: 100 }, objectName: 'badge ' + n });
  slide.addText(String(n), { x, y, w: 0.42, h: 0.42, align: 'center', valign: 'middle', fontFace: BODY, fontSize: 14, bold: true, color: color || C.g9, margin: 0, isTextBox: true });
}
function bullets(slide, items, x, y, w, h, size, color) {
  slide.addText(items.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < items.length - 1, paraSpaceAfter: 7 } })),
    { x, y, w, h, fontFace: BODY, fontSize: size || 14, color: color || C.cream, valign: 'top', margin: 0, isTextBox: true });
}

// 1 · Title
{
  const s = pres.addSlide();
  s.background = { color: C.g9 };
  s.addShape(pres.ShapeType.ellipse, { x: 5.2, y: -1.8, w: 7, h: 7, fill: { color: C.g7, transparency: 65 }, line: { color: C.g7, transparency: 100 } });
  s.addShape(pres.ShapeType.roundRect, { x: 0.6, y: 0.6, w: 3.2, h: 0.36, rectRadius: 0.18, fill: { color: C.g8 }, line: { color: C.lime, width: 1 } });
  s.addText('AGENTIC AI HACKATHON 2026', { x: 0.6, y: 0.6, w: 3.2, h: 0.36, align: 'center', valign: 'middle', fontFace: BODY, fontSize: 11, bold: true, color: C.lime, charSpacing: 3, margin: 0, isTextBox: true });
  s.addText('Solarda', { x: 0.6, y: 1.25, w: 4.6, h: 1.0, fontFace: HEAD, fontSize: 60, bold: true, color: C.lime, margin: 0, isTextBox: true });
  s.addText('Agentic smart agriculture', { x: 0.6, y: 2.25, w: 4.6, h: 0.5, fontFace: HEAD, fontSize: 24, color: C.cream, margin: 0, isTextBox: true });
  s.addText('Safety-gated AI farm agents, a six-language farm assistant, plant-disease vision and learned sensor forecasting.', { x: 0.6, y: 2.95, w: 4.3, h: 0.9, fontFace: BODY, fontSize: 14, color: C.soft, margin: 0, isTextBox: true });
  s.addText('The LLM only proposes. The TypeScript safety engine decides.', { x: 0.6, y: 4.2, w: 4.3, h: 0.7, fontFace: HEAD, fontSize: 15, italic: true, color: C.amber, margin: 0, isTextBox: true });
  pic(s, 'app-home.jpg', 5.45, 0.85, 4.1, 1.6, 'Solarda home screen');
  pic(s, 'app-agent-console.jpg', 5.45, 2.8, 4.1, 1.8, 'Agent Console');
  s.addText('Real screenshots of the running app', { x: 5.45, y: 4.78, w: 4.1, h: 0.25, fontFace: BODY, fontSize: 10, color: C.soft, margin: 0, isTextBox: true });
  s.addNotes('Solarda is an agentic smart-agriculture system. The core rule: the language model only proposes; a deterministic TypeScript safety engine decides; a human approves anything risky.');
}

// 2 · Problem
{
  const s = pres.addSlide(); base(s, 'Risky decisions, too little data', 'The problem');
  const items = [
    ['1', 'Little data, no expert', 'Smallholder farms decide irrigation, nutrients and disease control with almost no support nearby.'],
    ['2', 'One wrong dose costs a crop', 'Over-dosing, missed irrigation or the wrong spray can destroy a whole harvest.'],
    ['3', 'LLMs are fluent, not safe', 'A language model can be confidently wrong, so it must never hold the controls.'],
    ['4', 'Many languages, no trust', 'Farmers speak six languages and mix them; most AI demos show numbers with no source.'],
  ];
  items.forEach(([n, h, t], i) => {
    const x = 0.5 + (i % 2) * 4.55, y = 1.35 + Math.floor(i / 2) * 1.85;
    card(s, x, y, 4.35, 1.65, C.cream, 'problem card ' + n);
    badge(s, n, x + 0.2, y + 0.2);
    s.addText(h, { x: x + 0.75, y: y + 0.18, w: 3.4, h: 0.45, fontFace: HEAD, fontSize: 16, bold: true, color: C.ink, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(t, { x: x + 0.25, y: y + 0.75, w: 3.9, h: 0.8, fontFace: BODY, fontSize: 13, color: C.mut, margin: 0, valign: 'top', isTextBox: true });
  });
  footer(s, 2);
}

// 3 · Idea
{
  const s = pres.addSlide(); base(s, 'Propose, decide, approve', 'Our idea');
  const cols = [
    ['LLM proposes', 'Specialists (irrigation, fertigation, climate, disease) return actions with rationale, evidence and confidence. They cannot act.', C.amber, C.cream],
    ['Engine decides', '13 interlocks plus agent rules return ALLOW, NEEDS_HUMAN or VETO. The model cannot override the TypeScript engine.', C.lime, C.cream],
    ['Human approves', 'Pesticide doses and spray rates always escalate to an expert. Risky actions wait in an approvals inbox.', C.red, C.cream],
  ];
  cols.forEach(([h, t, accent, fill], i) => {
    const x = 0.5 + i * 3.05;
    card(s, x, 1.4, 2.85, 2.6, fill, 'idea card ' + (i + 1));
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.25, y: 1.62, w: 0.5, h: 0.5, fill: { color: accent }, line: { color: accent, transparency: 100 } });
    s.addText(String(i + 1), { x: x + 0.25, y: 1.62, w: 0.5, h: 0.5, align: 'center', valign: 'middle', fontFace: BODY, fontSize: 16, bold: true, color: C.g9, margin: 0, isTextBox: true });
    s.addText(h, { x: x + 0.25, y: 2.25, w: 2.4, h: 0.4, fontFace: HEAD, fontSize: 18, bold: true, color: C.ink, margin: 0, isTextBox: true });
    s.addText(t, { x: x + 0.25, y: 2.7, w: 2.4, h: 1.2, fontFace: BODY, fontSize: 12.5, color: C.mut, margin: 0, valign: 'top', isTextBox: true });
  });
  card(s, 0.5, 4.25, 9.0, 0.8, C.g8, 'data honesty banner');
  s.addText([{ text: 'Data honesty  ', options: { bold: true, color: C.lime } }, { text: 'Every reading shows its source tag (replay, simulated, twin). Replayed data is never presented as live.', options: { color: C.cream } }],
    { x: 0.75, y: 4.25, w: 8.5, h: 0.8, fontFace: BODY, fontSize: 14, valign: 'middle', margin: 0, isTextBox: true });
  footer(s, 3);
}

// 4 · Capabilities
{
  const s = pres.addSlide(); base(s, 'What Solarda does', 'Capabilities');
  const caps = [
    ['Farm-shift agent', 'Event-triggered LangGraph runs, ingest to audit'],
    ['Irrigation twin', 'AquaCrop compares hold, irrigate now, irrigate tonight'],
    ['Sensor models', '30 min and 2 h forecasts with bands, anomaly detector'],
    ['Disease vision', 'Calibrated model that abstains and asks for a retake'],
    ['Farm assistant', 'Gemini chat in 6 languages with voice and tools'],
    ['Safety engine', 'Interlocks, E-STOP, idempotent dispatch, audit log'],
    ['Market outlook', '4-week onion price outlook from Agmarknet data'],
    ['Harvest passport', 'SHA-256 hash-chained, tamper-evident record'],
    ['Alerts', 'SMS outbox (simulated) plus optional Telegram delivery'],
  ];
  caps.forEach(([h, t], i) => {
    const x = 0.5 + (i % 3) * 3.05, y = 1.3 + Math.floor(i / 3) * 1.3;
    card(s, x, y, 2.85, 1.15, C.cream, 'capability ' + (i + 1));
    s.addText(h, { x: x + 0.2, y: y + 0.12, w: 2.5, h: 0.35, fontFace: HEAD, fontSize: 15, bold: true, color: C.g8, margin: 0, isTextBox: true });
    s.addText(t, { x: x + 0.2, y: y + 0.5, w: 2.5, h: 0.58, fontFace: BODY, fontSize: 11.5, color: C.mut, margin: 0, valign: 'top', isTextBox: true });
  });
  footer(s, 4);
}

// 5 · Architecture
{
  const s = pres.addSlide(); s.background = { color: C.g9 };
  s.addImage({ path: IMG('architecture.png'), x: 0, y: 0, w: 10, h: 5.625, objectName: 'Architecture diagram', altText: 'Solarda system architecture: presentation, entry proxy, four services, data and external sources' });
  s.addNotes('Five processes behind one origin: nginx fronts the TypeScript safety engine and API, the LangGraph agent runtime, the AquaCrop twin and the ONNX vision service.');
}

// 6 · Workflow
{
  const s = pres.addSlide(); s.background = { color: C.g9 };
  s.addImage({ path: IMG('workflow.png'), x: 0, y: 0, w: 10, h: 5.625, objectName: 'Workflow diagram', altText: 'Eleven-step farm shift workflow from trigger to audit' });
  s.addNotes('Event-driven, never a blind timer. The LLM proposes in step 4; the TypeScript engine decides in step 6; humans approve in step 7; every step is audited and replayable.');
}

// 7 · Safety
{
  const s = pres.addSlide(); base(s, 'Safety by design', 'Trust');
  bullets(s, [
    '13 original interlocks plus agent rules: max dose per hour, tank limits, sensor trust, autonomy tier',
    'L1 propose: everything waits for a human. L2 act: only inside a safe envelope',
    'Idempotency-Key on every action, so a retry can never double-dose',
    'Append-only SHA-256 hash-chained audit log; replay any run from a checkpoint',
    'E-STOP freezes dispatch instantly',
  ], 0.5, 1.4, 5.1, 3.6, 14);
  card(s, 5.95, 1.4, 3.55, 1.7, C.cream, 'veto card');
  s.addText('Example veto', { x: 6.15, y: 1.52, w: 3.2, h: 0.3, fontFace: BODY, fontSize: 11, bold: true, color: C.mut, charSpacing: 2, margin: 0, isTextBox: true });
  s.addText('MAX_DOSE_PER_HOUR', { x: 6.15, y: 1.85, w: 3.2, h: 0.4, fontFace: 'Courier New', fontSize: 15, bold: true, color: C.red, margin: 0, isTextBox: true });
  s.addText('The agent keeps proposing pH-down; the gate refuses and nothing is dispatched.', { x: 6.15, y: 2.3, w: 3.2, h: 0.7, fontFace: BODY, fontSize: 12, color: C.ink, margin: 0, valign: 'top', isTextBox: true });
  card(s, 5.95, 3.3, 3.55, 1.7, C.lime, 'envelope card');
  s.addText('Honest limit', { x: 6.15, y: 3.42, w: 3.2, h: 0.3, fontFace: BODY, fontSize: 11, bold: true, color: C.g8, charSpacing: 2, margin: 0, isTextBox: true });
  s.addText('Envelope numbers are placeholders until an agronomist verifies them.', { x: 6.15, y: 3.8, w: 3.2, h: 1.1, fontFace: HEAD, fontSize: 14, bold: true, color: C.g9, margin: 0, valign: 'top', isTextBox: true });
  footer(s, 7);
}

// 8 · Live demo
{
  const s = pres.addSlide(); base(s, 'Live demo: the Agent Console', 'Real screenshots');
  pic(s, 'app-agent-console.jpg', 0.6, 1.35, 4.2, 1.84, 'Live feed and trigger');
  pic(s, 'app-disease-trace.jpg', 5.2, 1.35, 4.2, 1.84, 'Reasoning trace to approval');
  s.addText('Live feed: every reading is tagged replay. When two pH probes disagree by more than 0.4, a quality-fault run starts.', { x: 0.6, y: 3.45, w: 4.2, h: 1.2, fontFace: BODY, fontSize: 13, color: C.cream, margin: 0, valign: 'top', isTextBox: true });
  s.addText('Reasoning trace: ingest, assess, specialists, arbiter, safety gate. The treatment is allowed but needs a human in the approvals inbox.', { x: 5.2, y: 3.45, w: 4.2, h: 1.2, fontFace: BODY, fontSize: 13, color: C.cream, margin: 0, valign: 'top', isTextBox: true });
  footer(s, 8);
}

// 9 · Farm assistant
{
  const s = pres.addSlide(); base(s, 'Farm assistant in six languages', 'Voice and chat');
  pic(s, 'app-farm-assistant.jpg', 0.55, 1.4, 5.0, 2.19, 'Farm assistant');
  s.addText('Tamil, English, Hindi, Telugu, Kannada, Malayalam, or mixed (Tanglish, Hinglish).', { x: 0.55, y: 3.85, w: 5.0, h: 0.8, fontFace: BODY, fontSize: 13, color: C.soft, margin: 0, valign: 'top', isTextBox: true });
  bullets(s, [
    'Streaming Gemini answers with voice input and read-out',
    'Read-only tools: farm status, alerts, forecasts, approved sources, live weather, mandi prices',
    'Parallel risk gate: pesticide doses and spray rates get a fixed escalation to a human expert',
    'Replayed data is always labelled, never passed off as live',
  ], 6.0, 1.4, 3.5, 2.7, 13);
  card(s, 6.0, 4.2, 3.5, 0.85, C.lime, 'fixed escalation callout');
  s.addText('Escalation wording is fixed, not generated by the model.', { x: 6.2, y: 4.2, w: 3.1, h: 0.85, fontFace: HEAD, fontSize: 13, bold: true, color: C.g9, valign: 'middle', margin: 0, isTextBox: true });
  footer(s, 9);
}

// 10 · Results
{
  const s = pres.addSlide(); base(s, 'Results (replay and simulation)', 'Evidence');
  const stats = [
    ['-32%', 'water vs an ET controller, Chennai 2021 and 2023, at about equal yield'],
    ['98.2%', 'lab accuracy of the disease model (PlantVillage)'],
    ['61%', 'on field photos; 87% right when it answers, abstains on 60%'],
    ['0 min', 'agent reaction time vs 5 to 10 min for a fixed tick'],
  ];
  stats.forEach(([n, t], i) => {
    const x = 0.5 + i * 2.28;
    card(s, x, 1.4, 2.1, 2.5, C.g8, 'stat ' + (i + 1));
    s.addText(n, { x: x + 0.1, y: 1.6, w: 1.9, h: 0.9, fontFace: HEAD, fontSize: 38, bold: true, color: C.lime, align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    s.addText(t, { x: x + 0.15, y: 2.6, w: 1.8, h: 1.2, fontFace: BODY, fontSize: 12, color: C.cream, align: 'center', valign: 'top', margin: 0, isTextBox: true });
  });
  s.addText([{ text: 'Kept on purpose:  ', options: { bold: true, color: C.amber } }, { text: 'the pH forecaster, dry-season rain forecast and harvest-date forecast did not beat the baseline. We show them, not hide them.', options: { color: C.cream } }],
    { x: 0.5, y: 4.2, w: 9.0, h: 0.8, fontFace: BODY, fontSize: 14, valign: 'middle', margin: 0, isTextBox: true });
  footer(s, 10);
}

// 11 · Evidence
{
  const s = pres.addSlide(); base(s, 'Evidence, not claims', 'Benchmark');
  pic(s, 'app-benchmark-irrigation.jpg', 0.55, 1.4, 5.2, 2.28, 'Irrigation benchmark');
  s.addText('Water and yield against fixed and ET schedules, with the no-gain list shown on screen.', { x: 0.55, y: 3.95, w: 5.2, h: 0.8, fontFace: BODY, fontSize: 13, color: C.soft, margin: 0, valign: 'top', isTextBox: true });
  bullets(s, [
    'Every number links to a source file and a re-run command',
    'Caveat shown in the app: the twin is both advisor and judge',
    'All models run on ONNX Runtime',
    'Whole stack fits in about 450 MB in one Docker container',
  ], 6.1, 1.4, 3.4, 2.7, 13);
  card(s, 6.1, 4.2, 3.4, 0.85, C.lime, 'honest by design callout');
  s.addText('Where the agent does no better is listed beside where it wins.', { x: 6.3, y: 4.2, w: 3.0, h: 0.85, fontFace: HEAD, fontSize: 13, bold: true, color: C.g9, valign: 'middle', margin: 0, isTextBox: true });
  footer(s, 11);
}

// 12 · Close
{
  const s = pres.addSlide(); s.background = { color: C.g9 };
  s.addShape(pres.ShapeType.ellipse, { x: -2.2, y: 2.4, w: 7, h: 7, fill: { color: C.g7, transparency: 65 }, line: { color: C.g7, transparency: 100 } });
  s.addText('Run it, then take it further', { x: 0.6, y: 0.5, w: 8.8, h: 0.7, fontFace: HEAD, fontSize: 32, bold: true, color: C.cream, margin: 0, isTextBox: true });
  card(s, 0.6, 1.5, 4.3, 3.2, C.cream, 'run card');
  s.addText('Run the full demo', { x: 0.85, y: 1.65, w: 3.8, h: 0.4, fontFace: HEAD, fontSize: 17, bold: true, color: C.g8, margin: 0, isTextBox: true });
  s.addText('powershell -File scripts/demo.ps1', { x: 0.85, y: 2.15, w: 3.8, h: 0.4, fontFace: 'Courier New', fontSize: 12, bold: true, color: C.ink, margin: 0, isTextBox: true });
  s.addText('One command with Docker; opens http://localhost:3000. Works offline except chat, live weather and mandi prices.', { x: 0.85, y: 2.65, w: 3.8, h: 0.95, fontFace: BODY, fontSize: 12.5, color: C.mut, margin: 0, valign: 'top', isTextBox: true });
  s.addText('github.com/loktrishal-05/Solar-Da', { x: 0.85, y: 3.75, w: 3.8, h: 0.3, fontFace: BODY, fontSize: 13, bold: true, color: C.g8, margin: 0, isTextBox: true, hyperlink: { url: 'https://github.com/loktrishal-05/Solar-Da' } });
  s.addText('solarda.vercel.app (UI preview)', { x: 0.85, y: 4.1, w: 3.8, h: 0.3, fontFace: BODY, fontSize: 13, bold: true, color: C.g8, margin: 0, isTextBox: true, hyperlink: { url: 'https://solarda.vercel.app' } });
  s.addText('Next', { x: 5.3, y: 1.5, w: 4.1, h: 0.4, fontFace: HEAD, fontSize: 17, bold: true, color: C.lime, margin: 0, isTextBox: true });
  bullets(s, [
    'Real sensor adapters',
    'Agronomist-verified safety envelope',
    'Paid SMS gateway',
    'Field trials and better field-photo accuracy',
  ], 5.3, 2.0, 4.1, 2.0, 14);
  s.addText('Thank you · Questions', { x: 5.3, y: 4.2, w: 4.1, h: 0.5, fontFace: HEAD, fontSize: 22, italic: true, color: C.amber, margin: 0, isTextBox: true });
}

pres.writeFile({ fileName: OUT }).then((f) => console.log('wrote', f));
