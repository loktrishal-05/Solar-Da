// Writes one JSON Schema per agent contract to packages/contracts/schemas/.
import { zodToJsonSchema } from 'zod-to-json-schema';
import { agentSchemas } from '../dist/agent.js';
import { writeFileSync } from 'node:fs';

for (const [name, schema] of Object.entries(agentSchemas)) {
  const json = zodToJsonSchema(schema, { name, $refStrategy: 'none' });
  writeFileSync(new URL(`../schemas/${name}.schema.json`, import.meta.url), JSON.stringify(json.definitions[name], null, 2) + '\n');
}
