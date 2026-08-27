import React from 'react';
import { TraceabilityPassportView } from './SolarDa/TraceabilityPassportView';

export const DarkQrPassportsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <TraceabilityPassportView />
    </div>
  );
};
