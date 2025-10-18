import type { QualityOption } from './types';

export const QUALITY_OPTIONS: QualityOption[] = [
  { label: '720p', constraints: { width: 1280, height: 720 } },
  { label: '1080p', constraints: { width: 1920, height: 1080 } },
  { label: '480p', constraints: { width: 640, height: 480 } },
];

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};
