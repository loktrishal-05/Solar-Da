import React from 'react';
import { FertigationControl } from './SolarDa/FertigationControl';
import { ActuatorCommandProposal } from '@terrasub-solarda/engine';

interface DarkHumanConfirmationSurfaceTabProps {
  proposals: ActuatorCommandProposal[];
  onConfirmProposal: (id: string) => void;
}

export const DarkHumanConfirmationSurfaceTab: React.FC<DarkHumanConfirmationSurfaceTabProps> = ({
  proposals,
  onConfirmProposal,
}) => {
  return (
    <div className="space-y-6">
      <FertigationControl proposals={proposals} onConfirmProposal={onConfirmProposal} />
    </div>
  );
};
