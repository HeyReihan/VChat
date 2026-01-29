import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isMuted?: boolean;
  isLocal?: boolean;
  volume?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ stream, isMuted = false, isLocal = false, volume = 1 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (videoRef.current) {
        // If isMuted is explicitly true (for local preview), it overrides volume
        if (isMuted) {
            videoRef.current.muted = true;
            videoRef.current.volume = 0;
        } else {
            videoRef.current.muted = false;
            videoRef.current.volume = volume;
        }
    }
  }, [volume, isMuted]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className={`w-full h-full object-cover bg-gray-800 rounded-lg ${isLocal ? 'transform -scale-x-100' : ''}`}
    />
  );
};

export default VideoPlayer;