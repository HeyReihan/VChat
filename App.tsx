import React, { useState, useRef, useCallback, useEffect } from 'react';
import IdleScreen from './components/IdleScreen';
import SetupScreen from './components/SetupScreen';
import InCallScreen from './components/InCallScreen';
import { ICE_SERVERS, QUALITY_OPTIONS } from './constants';
import type { AppState, Message, VideoQuality, NetworkQuality, SignalingMessage, ChatChunkMessage } from './types';
import { generateKeyPair, exportPublicKey, importPublicKey, deriveSharedSecret, encryptMessage, decryptMessage } from './crypto';
import { playConnectSound, playDisconnectSound, playMessageSound } from './sounds';
import { decompressData } from './utils';

const CHUNK_SIZE = 16 * 1024; // 16KB

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [offerSdp, setOfferSdp] = useState<string | null>(null);
  const [answerSdp, setAnswerSdp] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [remoteNetworkQuality, setRemoteNetworkQuality] = useState<NetworkQuality>('unknown');
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | null>(null);
  
  const pc = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const keyPair = useRef<CryptoKeyPair | null>(null);
  const sharedSecret = useRef<CryptoKey | null>(null);
  
  const reconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttempts = useRef(0);

  // Store incoming chunks: messageId -> { chunks: { index: payload }, total: number }
  const incomingChunks = useRef<Record<string, { chunks: Record<number, string>, total: number }>>({});

  const cleanup = useCallback(() => {
    if (pc.current) {
      pc.current.ontrack = null;
      pc.current.onicecandidate = null;
      pc.current.onconnectionstatechange = null;
      pc.current.ondatachannel = null;
      pc.current.close();
      pc.current = null;
    }
    if (dataChannel.current) {
      dataChannel.current.onmessage = null;
      dataChannel.current.onopen = null;
      dataChannel.current.onclose = null;
      dataChannel.current.close();
      dataChannel.current = null;
    }
    
    if (reconnectTimerRef.current) {
      clearInterval(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttempts.current = 0;
    incomingChunks.current = {};

    localStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setOfferSdp(null);
    setAnswerSdp(null);
    setMessages([]);
    setIsMicEnabled(true);
    setIsVideoEnabled(true);
    sharedSecret.current = null;
    keyPair.current = null;
    setAppState('idle');
    setRemoteNetworkQuality('unknown');
  }, [localStream]);

  // Monitor Network Quality
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (appState === 'connected') {
      interval = setInterval(async () => {
        if (pc.current) {
          const stats = await pc.current.getStats();
          let packetsLost = 0;
          let packetsReceived = 0;
          
          stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              packetsLost += report.packetsLost || 0;
              packetsReceived += report.packetsReceived || 0;
            }
          });
          
          if (packetsReceived > 0) {
            const lossRate = packetsLost / (packetsLost + packetsReceived);
            if (lossRate < 0.01) setRemoteNetworkQuality('excellent');
            else if (lossRate < 0.05) setRemoteNetworkQuality('good');
            else if (lossRate < 0.1) setRemoteNetworkQuality('fair');
            else setRemoteNetworkQuality('poor');
          } else {
             // Fallback if no packets yet
             if (pc.current.iceConnectionState === 'connected') {
                 setRemoteNetworkQuality('good');
             } else {
                 setRemoteNetworkQuality('unknown');
             }
          }
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [appState]);

  const setupPeerConnection = useCallback(() => {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // This is where you would send the candidate to the other peer.
        // For this manual setup, we rely on the SDP containing candidates.
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      setConnectionState(state);
      
      if (state === 'connected') {
        setAppState('connected');
        playConnectSound();
        if (reconnectTimerRef.current) {
          clearInterval(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        reconnectAttempts.current = 0;
      } else if (state === 'disconnected') {
        setAppState('reconnecting');
        setRemoteNetworkQuality('unknown');
        
        // Start retry logic if not already running
        if (!reconnectTimerRef.current) {
          reconnectAttempts.current = 0;
          // Check every 2 seconds, max 5 retries (approx 10 seconds total)
          reconnectTimerRef.current = setInterval(() => {
            reconnectAttempts.current += 1;
            console.log(`Reconnection attempt ${reconnectAttempts.current}/5`);
            
            // Note: The browser automatically attempts ICE restarts/recovery in the background.
            // We monitor if it succeeds.
            
            if (peerConnection.connectionState === 'connected') {
              // Recovery handled by the 'connected' block above, but we clean up timer here just in case
              if (reconnectTimerRef.current) {
                clearInterval(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
              }
              return;
            }

            if (reconnectAttempts.current >= 5) {
              if (reconnectTimerRef.current) {
                clearInterval(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
              }
              setAppState('disconnected');
              playDisconnectSound();
              setTimeout(cleanup, 3000);
            }
          }, 2000);
        }
      } else if (['failed', 'closed'].includes(state)) {
        setAppState('disconnected');
        playDisconnectSound();
        if (reconnectTimerRef.current) {
          clearInterval(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        setTimeout(cleanup, 3000);
      }
    };

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
    
    localStream?.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    pc.current = peerConnection;
  }, [localStream, cleanup]);

  const handleDecryptedMessage = (decryptedText: string) => {
      try {
          // Try parsing as structured message (JSON)
          const data = JSON.parse(decryptedText);
          if (data && data.content && data.type) {
             setMessages(prev => [...prev, { 
                 sender: 'peer', 
                 content: data.content, 
                 type: data.type, 
                 fileName: data.fileName, 
                 timestamp: Date.now() 
             }]);
             playMessageSound();
             return;
          }
      } catch (e) {
          // Ignore, fallback to text
      }

      // Fallback for legacy plain text messages
      setMessages(prev => [...prev, { 
          sender: 'peer', 
          content: decryptedText, 
          type: 'text', 
          timestamp: Date.now() 
      }]);
      playMessageSound();
  };

  const setupDataChannel = useCallback(async () => {
    if (!pc.current) return;
  
    const handleDataChannel = (dc: RTCDataChannel) => {
      dataChannel.current = dc;
      dc.onopen = async () => {
        console.log('Data channel is open');
        if (!keyPair.current) {
            keyPair.current = await generateKeyPair();
        }
        const pubKey = await exportPublicKey(keyPair.current);
        const message: SignalingMessage = { type: 'key_exchange', payload: pubKey };
        dc.send(JSON.stringify(message));
      };
  
      dc.onmessage = async (event) => {
        try {
          const message: SignalingMessage = JSON.parse(event.data);
          
          if (message.type === 'key_exchange') {
            const peerPubKey = await importPublicKey(message.payload);
            const secret = await deriveSharedSecret(keyPair.current!.privateKey, peerPubKey);
            sharedSecret.current = secret;
            // If we are the initiator, send our key back
            if(appState === 'creating_offer' || offerSdp) {
                if (!keyPair.current) {
                    keyPair.current = await generateKeyPair();
                }
                const pubKey = await exportPublicKey(keyPair.current);
                const responseMessage: SignalingMessage = { type: 'key_exchange', payload: pubKey };
                dc.send(JSON.stringify(responseMessage));
            }

          } else if (message.type === 'chat') {
            if (sharedSecret.current) {
              const decryptedText = await decryptMessage(sharedSecret.current, message.payload);
              handleDecryptedMessage(decryptedText);
            } else {
              console.warn('Received chat message before shared secret was derived.');
            }
          } else if (message.type === 'chat_chunk') {
             if (sharedSecret.current) {
                const { messageId, chunkIndex, totalChunks, payload } = message;
                
                if (!incomingChunks.current[messageId]) {
                    incomingChunks.current[messageId] = { chunks: {}, total: totalChunks };
                }
                
                incomingChunks.current[messageId].chunks[chunkIndex] = payload;
                
                // Check if complete
                const receivedCount = Object.keys(incomingChunks.current[messageId].chunks).length;
                if (receivedCount === totalChunks) {
                    // Reassemble
                    const orderedChunks = [];
                    for (let i = 0; i < totalChunks; i++) {
                        orderedChunks.push(incomingChunks.current[messageId].chunks[i]);
                    }
                    const fullEncryptedPayload = orderedChunks.join('');
                    
                    // Decrypt
                    const decryptedText = await decryptMessage(sharedSecret.current, fullEncryptedPayload);
                    handleDecryptedMessage(decryptedText);
                    
                    // Cleanup
                    delete incomingChunks.current[messageId];
                }
             }
          }
        } catch (e) {
          console.error("Error processing data channel message: ", e);
        }
      };
    };

    pc.current.ondatachannel = (event) => {
      handleDataChannel(event.channel);
    };

    // Creator of the call initiates the data channel
    if (appState === 'creating_offer') {
      const dc = pc.current.createDataChannel('chat');
      handleDataChannel(dc);
    }
  }, [appState, offerSdp]);
  
  const handleStart = useCallback(async (quality: VideoQuality) => {
    setAppState('starting_camera');
    try {
      const qualitySettings = QUALITY_OPTIONS.find(q => q.label === quality) || QUALITY_OPTIONS[0];
      const stream = await navigator.mediaDevices.getUserMedia({
        video: qualitySettings.constraints,
        audio: true,
      });
      setLocalStream(stream);
      setAppState('setup');
    } catch (error) {
      console.error('Error accessing media devices.', error);
      alert('Could not access your camera or microphone. Please check permissions and try again.');
      setAppState('idle');
    }
  }, []);

  const handleCreateOffer = useCallback(async () => {
    setAppState('creating_offer');
    setupPeerConnection();
    await setupDataChannel();
    if (!pc.current) return;
    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);
    
    await new Promise<void>(resolve => {
        if (pc.current?.iceGatheringState === 'complete') {
            resolve();
        } else {
            const checkState = () => {
                if (pc.current?.iceGatheringState === 'complete') {
                    pc.current.removeEventListener('icegatheringstatechange', checkState);
                    resolve();
                }
            }
            pc.current?.addEventListener('icegatheringstatechange', checkState);
        }
    });

    setOfferSdp(JSON.stringify(pc.current.localDescription));
  }, [setupPeerConnection, setupDataChannel]);

  const handleReceiveOffer = useCallback(async (offerString: string) => {
    if (!localStream) {
      alert("Please start your camera first.");
      return;
    }
    setAppState('creating_answer');
    try {
        const offer = JSON.parse(offerString);
        setupPeerConnection();
        await setupDataChannel();
        if (!pc.current) return;
        
        await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);

        await new Promise<void>(resolve => {
            if (pc.current?.iceGatheringState === 'complete') {
                resolve();
            } else {
                const checkState = () => {
                    if (pc.current?.iceGatheringState === 'complete') {
                        pc.current.removeEventListener('icegatheringstatechange', checkState);
                        resolve();
                    }
                }
                pc.current?.addEventListener('icegatheringstatechange', checkState);
            }
        });

        setAnswerSdp(JSON.stringify(pc.current.localDescription));
        setAppState('setup');
    } catch (e) {
        console.error("Invalid offer code:", e);
        alert("Invalid connection code. Please check and try again.");
        setAppState('setup');
    }
  }, [localStream, setupPeerConnection, setupDataChannel]);

  const handleReceiveAnswer = useCallback(async (answerString: string) => {
    setAppState('connecting');
    try {
        const answer = JSON.parse(answerString);
        if (pc.current && pc.current.signalingState !== 'have-local-offer') {
            console.error('Peer connection is not in the correct state to receive an answer.');
            return;
        }
        await pc.current?.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (e) {
        console.error("Invalid answer code:", e);
        alert("Invalid connection code. Please check and try again.");
        setAppState('setup');
    }
  }, []);

  const handleSendMessage = useCallback(async (content: string, type: 'text' | 'image' | 'file' = 'text', fileName?: string) => {
    if (dataChannel.current && dataChannel.current.readyState === 'open' && sharedSecret.current) {
        try {
            // Construct the structured payload
            const rawPayload = JSON.stringify({ content, type, fileName });
            
            // Encrypt the entire payload
            const encryptedText = await encryptMessage(sharedSecret.current, rawPayload);
            
            // Check size to decide strategy
            if (encryptedText.length <= CHUNK_SIZE) {
                // Send as single message
                const message: SignalingMessage = { type: 'chat', payload: encryptedText };
                dataChannel.current.send(JSON.stringify(message));
            } else {
                // Send as chunks
                const messageId = Math.random().toString(36).substring(7);
                const totalChunks = Math.ceil(encryptedText.length / CHUNK_SIZE);
                
                for (let i = 0; i < totalChunks; i++) {
                    const start = i * CHUNK_SIZE;
                    const end = start + CHUNK_SIZE;
                    const chunk = encryptedText.substring(start, end);
                    
                    const chunkMessage: ChatChunkMessage = {
                        type: 'chat_chunk',
                        messageId,
                        chunkIndex: i,
                        totalChunks,
                        payload: chunk
                    };
                    dataChannel.current.send(JSON.stringify(chunkMessage));
                }
            }

            setMessages(prev => [...prev, { sender: 'me', content, type, fileName, timestamp: Date.now() }]);
        } catch (e) {
            console.error("Encryption/Send failed:", e);
        }
    }
  }, []);

  const handleToggleMic = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMicEnabled(prev => !prev);
    }
  }, [localStream]);

  const handleToggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsVideoEnabled(prev => !prev);
    }
  }, [localStream]);

  // Handle incoming connection code from URL hash
  useEffect(() => {
    const hash = window.location.hash;
    let sdp = '';
    
    if (hash.startsWith('#c=')) {
        // Compressed format
        const compressed = hash.substring('#c='.length);
        const decompressed = decompressData(compressed);
        if (decompressed) {
            sdp = decompressed;
        }
    } else if (hash.startsWith('#code=')) {
        // Legacy base64 format
        const encodedSdp = hash.substring('#code='.length);
        try {
            sdp = atob(decodeURIComponent(encodedSdp));
        } catch (e) {
             console.error("Failed to decode connection code from URL:", e);
        }
    }

    if (sdp) {
         try {
            // Automatically start the join flow if we have a local stream
            if (localStream) {
                handleReceiveOffer(sdp);
                // Clean the hash
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        } catch (e) {
            console.error("Failed to process SDP:", e);
        }
    }
  }, [localStream, handleReceiveOffer]);

  const renderContent = () => {
    switch (appState) {
      case 'idle':
      case 'starting_camera':
        return <IdleScreen onStart={handleStart} isLoading={appState === 'starting_camera'} />;
      case 'setup':
      case 'creating_offer':
      case 'creating_answer':
      case 'connecting':
        return (
          <SetupScreen
            localStream={localStream}
            onCreateOffer={handleCreateOffer}
            onReceiveOffer={handleReceiveOffer}
            onReceiveAnswer={handleReceiveAnswer}
            offerSdp={offerSdp}
            answerSdp={answerSdp}
            isLoading={['creating_offer', 'creating_answer', 'connecting'].includes(appState)}
            appState={appState}
            connectionState={connectionState}
          />
        );
      case 'connected':
      case 'reconnecting':
      case 'disconnected':
        return (
          <InCallScreen
            appState={appState}
            localStream={localStream}
            remoteStream={remoteStream}
            onHangup={cleanup}
            onSendMessage={handleSendMessage}
            messages={messages}
            isMicEnabled={isMicEnabled}
            isVideoEnabled={isVideoEnabled}
            onToggleMic={handleToggleMic}
            onToggleVideo={handleToggleVideo}
            remoteNetworkQuality={remoteNetworkQuality}
          />
        );
      default:
        return <div>Unknown state</div>;
    }
  };

  return (
    <main className="bg-gray-900 text-white h-screen w-screen flex flex-col p-4">
      <div className="flex-grow flex flex-col relative overflow-hidden min-h-0">
        {renderContent()}
      </div>
      <footer className="mt-2 text-center text-gray-500 text-xs shrink-0">
        {new Date().getFullYear()} &copy; P2P v-call
      </footer>
    </main>
  );
};

export default App;