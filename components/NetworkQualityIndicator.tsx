import React from 'react';
import type { NetworkQuality } from '../types';

interface NetworkQualityIndicatorProps {
  quality: NetworkQuality;
}

const qualityMap = {
  excellent: { text: 'Excellent Connection', bars: 4 },
  good: { text: 'Good Connection', bars: 3 },
  fair: { text: 'Fair Connection', bars: 2 },
  poor: { text: 'Poor Connection', bars: 1 },
  unknown: { text: 'Connection Status Unknown', bars: 0 },
};

const NetworkQualityIndicator: React.FC<NetworkQualityIndicatorProps> = ({ quality }) => {
  if (quality === 'unknown') return null;

  const { text, bars } = qualityMap[quality];

  const barColor = (barIndex: number) => {
    if (bars >= barIndex) {
        if (quality === 'excellent') return 'bg-green-400';
        if (quality === 'good') return 'bg-green-400';
        if (quality === 'fair') return 'bg-yellow-400';
        if (quality === 'poor') return 'bg-red-500';
    }
    return 'bg-gray-600';
  }

  return (
    <div title={text} className="flex items-end space-x-1 h-5 w-5">
      <span
        className={`w-1 h-2 rounded-sm transition-colors duration-300 ${barColor(1)}`}
      ></span>
      <span
        className={`w-1 h-3 rounded-sm transition-colors duration-300 ${barColor(2)}`}
      ></span>
      <span
        className={`w-1 h-4 rounded-sm transition-colors duration-300 ${barColor(3)}`}
      ></span>
      <span
        className={`w-1 h-5 rounded-sm transition-colors duration-300 ${barColor(4)}`}
      ></span>
    </div>
  );
};

export default NetworkQualityIndicator;
