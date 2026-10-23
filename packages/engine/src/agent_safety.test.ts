import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkAgentProposal, AgentSafetyContext } from './agent_safety.js';

const fx = JSON.parse(readFileSync(new URL('../../contracts/fixtures/safety_cases.json', import.meta.url), 'utf8'));

for (const c of fx.cases) {
  test(`SAFETY CHECK: ${c.name}`, () => {
    const ctx: AgentSafetyContext = { ...fx.base_context, ...c.context };
    const v = checkAgentProposal(c.proposal, ctx);
    assert.equal(v.verdict, c.expect.verdict, v.reason);
    if (c.expect.invariant) assert.equal(v.invariant, c.expect.invariant);
    if ('needs_human' in c.expect) assert.equal(v.needs_human, c.expect.needs_human);
    if (c.expect.modified_minutes) assert.equal(v.modified_params?.minutes, c.expect.modified_minutes);
  });
}
