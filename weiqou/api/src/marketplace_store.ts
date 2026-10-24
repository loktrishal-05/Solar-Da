import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { InMemoryStore } from './store.js';

// Listings posted through the API survive a restart (append-only JSONL beside the audit log).
// ponytail: file append, no edit/delete; move to SQLite if listings ever need status updates.
type Listing = InMemoryStore['marketplaceListings'][number];

const RUNTIME_DIR = process.env.SOLARDA_RUNTIME_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '../../../data/runtime');
mkdirSync(RUNTIME_DIR, { recursive: true });
const FILE = resolve(RUNTIME_DIR, 'marketplace.jsonl');

export const appendMarketplaceListing = (l: Listing) => appendFileSync(FILE, JSON.stringify(l) + '\n');

export const loadMarketplaceListings = (): Listing[] =>
  existsSync(FILE) ? readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((x) => JSON.parse(x)) : [];
