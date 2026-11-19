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
export const RUNTIME_DIR = process.env.SOLARDA_RUNTIME_DIR ?? resolve(HERE, '../../../data/runtime');
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
  name: z.string({ required_error: 'Enter your name' }).trim().min(1, 'Enter your name').max(80, 'Name is too long'),
  email: z.string({ required_error: 'Enter your email' }).trim().email('Enter a valid email address').max(120, 'Email is too long'),
  password: z.string({ required_error: 'Enter a password' }).min(8, 'Password must be at least 8 characters').max(200, 'Password is too long'),
});
const LoginSchema = z.object({ email: z.string().trim(), password: z.string() });

export const authRouter = Router();

authRouter.post('/auth/signup', (req: Request, res: Response) => {
  const p = SignupSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message ?? 'invalid input' });
  const users = readUsers();
  const email = p.data.email.toLowerCase();
  if (users.some((u) => u.email === email)) return res.status(409).json({ error: 'An account with this email already exists' });
  // Everyone starts as a farmer; an admin promotes users on the Users page.
  const user: StoredUser = { id: randomUUID(), name: p.data.name, email, role: 'farmer', password: hashPassword(p.data.password) };
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

// One-click demo sign-in: the seeded account for a role. Set SOLARDA_DEMO_LOGIN=0 to switch it off on a real deployment.
const DemoSchema = z.object({ role: z.enum(['farmer', 'agronomist', 'admin']) });
authRouter.post('/auth/demo', (req: Request, res: Response) => {
  if (process.env.SOLARDA_DEMO_LOGIN === '0') return res.status(404).json({ error: 'Demo sign-in is switched off' });
  const p = DemoSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Choose farmer, agronomist or admin' });
  const seeded: Array<{ email: string; role: Role }> = existsSync(SEED_FILE) ? JSON.parse(readFileSync(SEED_FILE, 'utf8')) : [];
  const email = seeded.find((u) => u.role === p.data.role)?.email.toLowerCase();
  const user = readUsers().find((u) => u.email === email && u.role === p.data.role);
  if (!user) return res.status(404).json({ error: 'No demo account for this role' });
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

// Admin: list users and change roles. The last admin cannot be demoted, so the site never locks itself out.
authRouter.get('/admin/users', requireRole('admin'), (_req: Request, res: Response) => {
  res.json({ users: readUsers().map(toPublic) });
});

const RoleSchema = z.object({ role: z.enum(['farmer', 'agronomist', 'admin']) });
authRouter.patch('/admin/users/:id', requireRole('admin'), (req: Request, res: Response) => {
  const p = RoleSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Role must be farmer, agronomist or admin' });
  const users = readUsers();
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'No such user' });
  if (user.email.endsWith('@solarda.demo')) {
    return res.status(409).json({ error: 'Demo accounts keep their roles so the one-click demo always works. Promote a real account instead.' });
  }
  if (user.role === 'admin' && p.data.role !== 'admin' && users.filter((u) => u.role === 'admin').length === 1) {
    return res.status(409).json({ error: 'This is the only admin. Make someone else an admin first.' });
  }
  user.role = p.data.role;
  writeUsers(users);
  res.json({ user: toPublic(user) });
});

// Shared secret between this API and the agent runtime (make dev writes it to the runtime dir; Docker start.sh exports it).
// With no key configured (old scripts), agent-only routes stay open as before.
export function internalKey(): string {
  if (process.env.SOLARDA_INTERNAL_KEY) return process.env.SOLARDA_INTERNAL_KEY;
  const f = join(RUNTIME_DIR, '.internal_key');
  return existsSync(f) ? readFileSync(f, 'utf8').trim() : '';
}

export function fromAgentRuntime(req: Request): boolean {
  const key = internalKey();
  const got = req.header('X-Solarda-Internal') ?? '';
  if (!key) return true;
  return got.length === key.length && timingSafeEqual(Buffer.from(got), Buffer.from(key));
}

export const requireAgentRuntime: RequestHandler = (req, res, next) =>
  fromAgentRuntime(req) ? next() : res.status(403).json({ error: 'Only the Solarda agent runtime can call this' });

export const zodMessage = (e: z.ZodError) => {
  const i = e.issues[0];
  return i ? `${i.path.length ? i.path.join('.') + ': ' : ''}${i.message}` : 'Invalid request';
};
