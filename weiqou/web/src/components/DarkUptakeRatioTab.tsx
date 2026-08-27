import React from 'react';
import { UptakeRatioVisualizer } from './SolarDa/UptakeRatioVisualizer';

export const DarkUptakeRatioTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <UptakeRatioVisualizer />
    </div>
  );
};
