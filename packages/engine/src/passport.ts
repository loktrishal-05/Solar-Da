import { PassportBlock } from './types.js';

// Simple deterministic pure hashing function for engine (works in Node and Browser environments)
function simpleSha256(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}${hex}${hex}${hex}`; // 32-byte hex hash simulation
}

export function createGenesisPassportBlock(
  harvestLotId: string,
  cropName: string,
  timestampMs: number
): PassportBlock {
  const genesisData = `GENESIS_${harvestLotId}_${cropName}_${timestampMs}`;
  const blockHash = simpleSha256(genesisData);

  return {
    index: 0,
    previousHash: '0x00000000000000000000000000000000',
    timestampMs,
    harvestLotId,
    cropName,
    dosagesSummary: ['GENESIS_BATCH_REGISTERED'],
    treatmentApplications: [],
    harvestBlockComplianceVerified: true,
    energyMixSummary: '100% Solar Baseline',
    blockHash,
  };
}

export function appendPassportBlock(
  previousBlock: PassportBlock,
  dosages: string[],
  treatments: string[],
  harvestBlockCompliant: boolean,
  energyMix: string,
  timestampMs: number
): PassportBlock {
  const nextIndex = previousBlock.index + 1;
  const payload = `${nextIndex}_${previousBlock.blockHash}_${timestampMs}_${dosages.join(',')}_${treatments.join(',')}_${harvestBlockCompliant}_${energyMix}`;
  const blockHash = simpleSha256(payload);

  return {
    index: nextIndex,
    previousHash: previousBlock.blockHash,
    timestampMs,
    harvestLotId: previousBlock.harvestLotId,
    cropName: previousBlock.cropName,
    dosagesSummary: dosages,
    treatmentApplications: treatments,
    harvestBlockComplianceVerified: harvestBlockCompliant,
    energyMixSummary: energyMix,
    blockHash,
  };
}

function expectedHash(block: PassportBlock): string {
  if (block.index === 0) {
    return simpleSha256(`GENESIS_${block.harvestLotId}_${block.cropName}_${block.timestampMs}`);
  }
  const payload = `${block.index}_${block.previousHash}_${block.timestampMs}_${block.dosagesSummary.join(',')}_${block.treatmentApplications.join(',')}_${block.harvestBlockComplianceVerified}_${block.energyMixSummary}`;
  return simpleSha256(payload);
}

// Checks the links, the block numbering, and that every block's hash matches its own contents, so editing a
// dose or treatment after the fact is detected. ponytail: simpleSha256 is a 32-bit checksum, not a cryptographic
// hash; swap in SHA-256 before the passport is used to settle anything real.
export function verifyPassportChainIntegrity(chain: PassportBlock[]): { isChainValid: boolean; invalidIndex?: number } {
  if (chain.length === 0) return { isChainValid: false };
  if (chain[0].index !== 0 || chain[0].blockHash !== expectedHash(chain[0])) return { isChainValid: false, invalidIndex: 0 };

  for (let i = 1; i < chain.length; i++) {
    const current = chain[i];
    const previous = chain[i - 1];

    if (current.index !== i || current.previousHash !== previous.blockHash || current.blockHash !== expectedHash(current)) {
      return { isChainValid: false, invalidIndex: i };
    }
  }

  return { isChainValid: true };
}
