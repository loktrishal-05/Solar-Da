import React from 'react';
import { PowerSchedulerView } from './SolarDa/PowerSchedulerView';

export const DarkPowerModelTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <PowerSchedulerView />
    </div>
  );
};
