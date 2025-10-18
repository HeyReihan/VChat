export type VideoQuality = '480p' | '720p' | '1080p';

export interface QualityOption {
  label: VideoQuality;
  constraints: MediaStreamConstraints['video'];
}

export type AppState =
  | 'idle'
  | 'starting_camera'
  | 'setup'
  | 'creating_offer'
  | 'creating_answer'
  | 'connecting'
  | 'connected'
  | 'disconnected';

export interface Message {
  sender: 'me' | 'peer';
  text: string;
  timestamp: number;
}

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export interface EncryptedMessage {
  type: 'chat';
  payload: string;
}

export interface PublicKeyMessage {
  type: 'key_exchange';
  payload: JsonWebKey;
}

export type SignalingMessage = EncryptedMessage | PublicKeyMessage;
