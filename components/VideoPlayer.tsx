import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isMuted?: boolean;
  isLocal?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ stream, isMuted = false, isLocal = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      className={`w-full h-full object-cover bg-gray-800 rounded-lg ${isLocal ? 'transform -scale-x-100' : ''}`}
    />
  );
};

export default VideoPlayer;