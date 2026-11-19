// Local sign-in for the demo: users in a JSON file under the runtime dir, scrypt hashes, HMAC-signed session cookie.
// Roles decide who may approve agent actions; they never change what the safety engine allows.
import { Router, type Request, type Response, type RequestHandler } from 'express';
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export type Role = 'farmer' | 'agronomist' | 'admin';
export type PublicUser = { id: string; name: string; email: string; role: Role };
type StoredUser = PublicUser & { password: string };

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNTIME_DIR = process.env.SOLARDA_RUNTIME_DIR ?? resolve(HERE, '../../../data/runtime');
const USERS_FILE = join(RUNTIME_DIR, 'users.json');
const SEED_FILE = resolve(HERE, '../seed/users.json');
const COOKIE = 'solarda_session';
const MAX_AGE_S = 7 * 24 * 3600;

mkdirSync(RUNTIME_DIR, { recursive: true });

function loadSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const f = join(RUNTIME_DIR, '.session_secret');
  if (!existsSync(f)) writeFileSync(f, randomBytes(32).toString('hex'), { mode: 0o600 });
  return readFileSync(f, 'utf8').trim();
}
const SECRET = loadSecret();

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString('hex')}$${scryptSync(pw, salt, 64).toString('hex')}`;
}

function verifyPassword(pw: string, stored: string): boolean {
  const [, salt, hash] = stored.split('$');
  if (!salt || !hash) return false;
  return timingSafeEqual(scryptSync(pw, Buffer.from(salt, 'hex'), 64), Buffer.from(hash, 'hex'));
}

function readUsers(): StoredUser[] {
  if (existsSync(USERS_FILE)) return JSON.parse(readFileSync(USERS_FILE, 'utf8'));
  const seed: Array<Omit<StoredUser, 'id'>> = existsSync(SEED_FILE) ? JSON.parse(readFileSync(SEED_FILE, 'utf8')) : [];
  const users = seed.map((u) => ({ ...u, id: randomUUID(), email: u.email.toLowerCase(), password: hashPassword(u.password) }));
  writeUsers(users);
  return users;
}

function writeUsers(users: StoredUser[]) {
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

const toPublic = ({ password: _p, ...u }: StoredUser): PublicUser => u;
const sign = (payload: string) => createHmac('sha256', SECRET).update(payload).digest('hex');

function sessionCookie(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE_S * 1000 })).toString('base64url');
  return `${COOKIE}=${payload}.${sign(payload)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_S}`;
}

export function currentUser(req: Request): PublicUser | null {
  const raw = (req.headers.cookie ?? '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  const [payload, mac] = (raw ?? '').split('.');
  if (!payload || !/^[0-9a-f]{64}$/.test(mac ?? '')) return null;
  if (!timingSafeEqual(Buffer.from(sign(payload), 'hex'), Buffer.from(mac, 'hex'))) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (Date.now() > exp) return null;
    const u = readUsers().find((x) => x.id === uid);
    return u ? toPublic(u) : null;
  } catch {
    return null;
  }
}

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, res, next) => {
    const user = currentUser(req);
    if (!user) return res.status(401).json({ error: 'Sign in first' });
    if (!roles.includes(user.role)) return res.status(403).json({ error: `Only ${roles.join(' or ')} accounts can do this` });
    (req as Request & { user?: PublicUser }).user = user;
    next();
  };
}

const SignupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(200),
  role: z.enum(['farmer', 'agronomist']).default('farmer'),
});
const LoginSchema = z.object({ email: z.string().trim(), password: z.string() });

export const authRouter = Router();

authRouter.post('/auth/signup', (req: Request, res: Response) => {
  const p = SignupSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message ?? 'invalid input' });
  const users = readUsers();
  const email = p.data.email.toLowerCase();
  if (users.some((u) => u.email === email)) return res.status(409).json({ error: 'An account with this email already exists' });
  const user: StoredUser = { id: randomUUID(), name: p.data.name, email, role: p.data.role, password: hashPassword(p.data.password) };
  writeUsers([...users, user]);
  res.status(201).setHeader('Set-Cookie', sessionCookie(user.id)).json({ user: toPublic(user) });
});

authRouter.post('/auth/login', (req: Request, res: Response) => {
  const p = LoginSchema.safeParse(req.body);
  const user = p.success ? readUsers().find((u) => u.email === p.data.email.toLowerCase()) : undefined;
  if (!p.success || !user || !verifyPassword(p.data.password, user.password)) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }
  res.setHeader('Set-Cookie', sessionCookie(user.id)).json({ user: toPublic(user) });
});

authRouter.post('/auth/logout', (_req: Request, res: Response) => {
  res.status(204).setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`).end();
});

authRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  res.json({ user });
});
