import React from 'react';
import { createGenesisPassportBlock, appendPassportBlock, verifyPassportChainIntegrity } from '@terrasub-solarda/engine';
import { QrCode, ShieldCheck, Link2, CheckCircle2, Lock, FileCheck } from 'lucide-react';

export const TraceabilityPassportView: React.FC = () => {
  const genesis = createGenesisPassportBlock('LOT_2026_LETTUCE_01', 'Butterhead Lettuce', Date.now() - 86400000);
  const block1 = appendPassportBlock(
    genesis,
    ['Dose 15ml MasterBlend NPK', 'Dose 5ml Calcium Nitrate'],
    ['Root Inspection Clean'],
    true,
    '94% Solar Energy',
    Date.now() - 43200000
  );
  const block2 = appendPassportBlock(
    block1,
    ['Dose 3ml pH Down'],
    [],
    true,
    '98% Solar Energy',
    Date.now() - 3600000
  );

  const chain = [genesis, block1, block2];
  const verification = verifyPassportChainIntegrity(chain);

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <QrCode className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Traceability Passport & Cryptographic QR Verification</h2>
          </div>
          <p className="text-xs text-slate-400">
            Append-only, cryptographically chained block hash (SHA-256). QR-scannable verification page for retail buyers.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-700 text-xs font-bold text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Chain Verification: {verification.isChainValid ? 'VALID & VERIFIED' : 'TAMPER DETECTED'}</span>
        </div>
      </div>

      {/* QR Code Scannable Public Preview Banner */}
      <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white rounded-xl shadow-md">
            {/* SVG QR Code Simulation */}
            <div className="w-20 h-20 bg-slate-900 rounded p-1 flex items-center justify-center text-[10px] font-mono text-white text-center border">
              QR SCAN VERIFY
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <span>Harvest Lot #LOT_2026_LETTUCE_01</span>
            </h3>
            <p className="text-xs text-slate-300">Crop: Butterhead Lettuce (45.0 kg Harvested)</p>
            <span className="text-[11px] text-cyan-400 font-mono block">
              Public verification link: https://terrasub-solarda.ag/verify/passport/LOT_2026_LETTUCE_01
            </span>
          </div>
        </div>

        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-2">
          <Link2 className="w-4 h-4" />
          <span>Copy Public Passport QR</span>
        </button>
      </div>

      {/* Cryptographic Passport Block Chain History Tree */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Cryptographic Block Chain Audit Trail ({chain.length} Blocks)
        </h3>
        <div className="space-y-3">
          {chain.map((block) => (
            <div key={block.index} className="bg-slate-900/90 p-4 rounded-xl border border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 font-mono">Block #{block.index}</span>
                <span className="text-[10px] text-slate-400 font-mono">Timestamp: {new Date(block.timestampMs).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">Previous Block Hash:</span>
                  <span className="truncate block text-slate-400">{block.previousHash}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Block Hash (SHA-256):</span>
                  <span className="truncate block text-cyan-300 font-bold">{block.blockHash}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Dosages: {block.dosagesSummary.join(', ')}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Harvest Block Compliant
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-yellow-300">
                  Energy: {block.energyMixSummary}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
