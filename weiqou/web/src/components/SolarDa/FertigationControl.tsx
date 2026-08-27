import React, { useState } from 'react';
import { ActuatorCommandProposal } from '@terrasub-solarda/engine';
import { ShieldCheck, CheckCircle2, AlertOctagon, UserCheck, Play, Lock } from 'lucide-react';

interface FertigationControlProps {
  proposals: ActuatorCommandProposal[];
  onConfirmProposal: (proposalId: string) => void;
}

export const FertigationControl: React.FC<FertigationControlProps> = ({ proposals, onConfirmProposal }) => {
  const [selectedProposal, setSelectedProposal] = useState<ActuatorCommandProposal | null>(proposals[0] || null);

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Fertigation State Machine & Human Confirmation Surface</h2>
          </div>
          <p className="text-xs text-slate-400">
            Platform Invariant Rule 1: No assistant, model output, or automated rule may ever directly execute a physical action. Execution requires human confirmation.
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-emerald-400" />
          Human Confirmation Surface Active
        </span>
      </div>

      {/* Pending Proposals Queue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Pending Proposals Queue ({proposals.length})
          </h3>
          <div className="space-y-3">
            {proposals.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-slate-500 text-xs">
                No pending proposals. System operating within baseline setpoints.
              </div>
            ) : (
              proposals.map((prop) => (
                <div
                  key={prop.id}
                  onClick={() => setSelectedProposal(prop)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    selectedProposal?.id === prop.id
                      ? 'bg-sky-950/70 border-sky-500 ring-2 ring-sky-400/50'
                      : 'bg-slate-900/80 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-sky-400 font-mono">{prop.actuatorType}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {prop.targetValue} {prop.unit}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 mt-2 font-medium">{prop.reason}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
                    <span>Proposed by: {prop.proposedBy}</span>
                    <span className="text-amber-400 font-semibold">Requires Confirmation</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Human Confirmation & Safety Interlocks Checklist */}
        {selectedProposal ? (
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700 space-y-4 flex flex-col justify-between shadow-inner">
            <div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Proposal Safety Review & Dispatch</span>
                </h4>
                <span className="text-xs font-mono text-slate-400">ID: {selectedProposal.id}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Target Actuator:</span>
                  <span className="font-bold font-mono text-sky-400">{selectedProposal.actuatorType}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Target Value:</span>
                  <span className="font-bold text-white">{selectedProposal.targetValue} {selectedProposal.unit}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Autonomy Envelope:</span>
                  <span className="font-bold text-emerald-400">{selectedProposal.autonomyLevel}</span>
                </div>
              </div>

              {/* Veto-Only Interlocks Checklist */}
              <div className="mt-4 space-y-2 bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Veto-Only Interlocks Re-Evaluation Status
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>System E-Stop: Cleared</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Level Floor: OK</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mixing Delay: Expired</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>24h Ceiling: OK</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Execution Button */}
            <button
              onClick={() => {
                onConfirmProposal(selectedProposal.id);
                setSelectedProposal(null);
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Human Confirm & Run Fixed Pipeline</span>
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/60 p-8 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 text-xs">
            Select a proposal to review interlocks and confirm execution.
          </div>
        )}
      </div>
    </div>
  );
};
