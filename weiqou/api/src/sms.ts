import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Demo SMS gateway. Real SMS services cost money, so every alert is written to an outbox (shown as a phone message in the
// UI, labelled SIMULATED). If TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set, the same text is also pushed to a real phone
// through a free Telegram bot. ponytail: Telegram stands in for SMS; swap `deliver` for Twilio/MSG91 when a paid account exists.
const RUNTIME_DIR = process.env.SOLARDA_RUNTIME_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '../../../data/runtime');
mkdirSync(RUNTIME_DIR, { recursive: true });
const FILE = resolve(RUNTIME_DIR, 'sms_outbox.jsonl');
const DEDUPE_MS = 10 * 60_000; // a looping replay repeats the same alert; send each text once per 10 minutes

export type Severity = 'CRITICAL' | 'WARNING' | 'INFO';
export interface SmsRecord { id: string; at: string; severity: Severity; text: string; channel: 'simulated' | 'telegram'; status: string }

export const readOutbox = (): SmsRecord[] =>
  existsSync(FILE) ? readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];

async function deliver(text: string): Promise<Pick<SmsRecord, 'channel' | 'status'>> {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat } = process.env;
  if (!token || !chat) return { channel: 'simulated', status: 'SIMULATED: logged only, not sent to any phone' };
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text }),
    });
    return { channel: 'telegram', status: r.ok ? 'DELIVERED via Telegram bot' : `FAILED (Telegram ${r.status})` };
  } catch {
    return { channel: 'telegram', status: 'FAILED (network)' };
  }
}

export async function sendAlertSms(severity: Severity, text: string): Promise<SmsRecord | null> {
  const recent = readOutbox().slice(-50);
  if (recent.some((r) => r.text === text && Date.now() - Date.parse(r.at) < DEDUPE_MS)) return null;
  const rec: SmsRecord = { id: `sms_${Date.now()}`, at: new Date().toISOString(), severity, text, ...(await deliver(`[${severity}] ${text}`)) };
  appendFileSync(FILE, JSON.stringify(rec) + '\n');
  return rec;
}
