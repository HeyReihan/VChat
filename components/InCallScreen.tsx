import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import ChatPanel from './ChatPanel';
import NetworkQualityIndicator from './NetworkQualityIndicator';
import { HangUpIcon, MicOnIcon, MicOffIcon, VideoOnIcon, VideoOffIcon, ChatIcon, VolumeIcon, FlashOnIcon, FlashOffIcon } from './Icons';
import type { Message, NetworkQuality, AppState } from '../types';

interface InCallScreenProps {
  appState: AppState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onHangup: () => void;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onSendMessage: (content: string, type: 'text' | 'image' | 'file', fileName?: string) => void;
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
  messages: Message[];
  remoteNetworkQuality: NetworkQuality;
}

const InCallScreen: React.FC<InCallScreenProps> = ({
  appState,
  localStream,
  remoteStream,
  onHangup,
  onToggleMic,
  onToggleVideo,
  onSendMessage,
  isMicEnabled,
  isVideoEnabled,
  messages,
  remoteNetworkQuality,
}) => {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [volume, setVolume] = useState(1);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  // Check for torch capability
  useEffect(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        // @ts-ignore - getCapabilities is standard but typescript definition might be missing in some versions
        const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        if (capabilities.torch) {
          setHasTorch(true);
        }
      }
    }
  }, [localStream]);

  const toggleTorch = async () => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (track) {
      try {
        const newState = !isTorchOn;
        // @ts-ignore - applyConstraints for torch
        await track.applyConstraints({ advanced: [{ torch: newState }] });
        setIsTorchOn(newState);
      } catch (err) {
        console.error('Error toggling torch:', err);
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-900 text-white">
      <div className="flex-grow flex flex-col relative">
        <div className="flex-grow relative bg-black">
          {remoteStream ? (
            <VideoPlayer stream={remoteStream} volume={volume} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Waiting for peer to connect...</p>
              </div>
            </div>
          )}
          
          {appState === 'reconnecting' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                    <h3 className="text-xl font-bold text-white mb-2">Connection Lost</h3>
                    <p className="text-gray-300">Attempting to reconnect...</p>
                </div>
            </div>
          )}

          <div className="absolute top-4 right-4 z-10">
            <NetworkQualityIndicator quality={remoteNetworkQuality} />
          </div>

          <div className="absolute bottom-4 left-4 z-10 bg-black/50 p-2 rounded-lg backdrop-blur-sm flex items-center space-x-2">
            <VolumeIcon />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              title="Remote Audio Volume"
            />
          </div>

          <div className="absolute bottom-4 right-4 w-1/4 max-w-xs rounded-lg overflow-hidden shadow-lg z-10 border-2 border-gray-700 group">
            <VideoPlayer stream={localStream} isMuted={true} isLocal={true} />
            {hasTorch && (
                <button 
                    onClick={toggleTorch}
                    className="absolute top-2 right-2 p-1.5 bg-gray-800/70 hover:bg-gray-700 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Toggle Flashlight"
                >
                    {isTorchOn ? <FlashOnIcon /> : <FlashOffIcon />}
                </button>
            )}
          </div>
        </div>
        <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
          <button
            onClick={onToggleMic}
            title={isMicEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
            className={`p-3 rounded-full transition-colors duration-200 ${
              isMicEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {isMicEnabled ? <MicOnIcon /> : <MicOffIcon />}
          </button>
          <button
            onClick={onToggleVideo}
            title={isVideoEnabled ? 'Disable Camera' : 'Enable Camera'}
            className={`p-3 rounded-full transition-colors duration-200 ${
              isVideoEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {isVideoEnabled ? <VideoOnIcon /> : <VideoOffIcon />}
          </button>
          <button
            onClick={onHangup}
            title="Hang Up"
            className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors duration-200"
          >
            <HangUpIcon />
          </button>
          <button
            onClick={() => setIsChatVisible(!isChatVisible)}
            title="Toggle Chat"
            className={`p-3 rounded-full transition-colors duration-200 ${isChatVisible ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
          >
            <ChatIcon />
          </button>
        </div>
      </div>
      {isChatVisible && (
        <div className="w-full md:w-80 lg:w-96 flex-shrink-0 bg-gray-800 border-l border-gray-700">
          <ChatPanel messages={messages} onSendMessage={onSendMessage} />
        </div>
      )}
    </div>
  );
};

export default InCallScreen;