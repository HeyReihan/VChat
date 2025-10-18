import React from 'react';
import type { VideoQuality } from '../types';
import { QUALITY_OPTIONS } from '../constants';
import Logo from './Logo';

interface IdleScreenProps {
  onStart: (quality: VideoQuality) => void;
  isLoading: boolean;
}

const IdleScreen: React.FC<IdleScreenProps> = ({ onStart, isLoading }) => {
  const [selectedQuality, setSelectedQuality] = React.useState<VideoQuality>('720p');

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Logo className="h-24 w-24 md:h-32 md:w-32 mb-6" />
      <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8">
        Connect directly with anyone, anywhere. Secure, private, and high-quality video calls powered by WebRTC.
      </p>
      <div className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md">
        <div className="mb-4">
          <label htmlFor="quality" className="block text-sm font-medium text-gray-300 mb-2">Select Video Quality</label>
          <select
            id="quality"
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value as VideoQuality)}
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            disabled={isLoading}
          >
            {QUALITY_OPTIONS.map(option => (
              <option key={option.label} value={option.label}>{option.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => onStart(selectedQuality)}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center"
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : 'Start Camera & Get Ready'}
        </button>
      </div>
    </div>
  );
};

export default IdleScreen;
