import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { agentSchemas } from './agent.js';

const load = (f: string) => JSON.parse(readFileSync(new URL(`../fixtures/${f}`, import.meta.url), 'utf8'));
const valid = load('valid.json');
const invalid = load('invalid.json');

for (const [name, schema] of Object.entries(agentSchemas)) {
  test(`${name}: valid fixture parses and round-trips`, () => {
    const parsed = schema.parse(valid[name]);
    assert.deepEqual(JSON.parse(JSON.stringify(parsed)), valid[name]);
  });
  test(`${name}: invalid fixture rejected`, () => {
    assert.equal(schema.safeParse(invalid[name]).success, false);
  });
}
