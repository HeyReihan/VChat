import React, { useState, useMemo } from 'react';
import VideoPlayer from './VideoPlayer';
import { CopyIcon } from './Icons';
import type { AppState } from '../types';
import { compressData } from '../utils';

interface SetupScreenProps {
  localStream: MediaStream | null;
  onCreateOffer: () => void;
  onReceiveOffer: (offer: string) => void;
  onReceiveAnswer: (answer: string) => void;
  offerSdp: string | null;
  answerSdp: string | null;
  isLoading: boolean;
  appState: AppState;
  connectionState: RTCPeerConnectionState | null;
}

const SetupScreen: React.FC<SetupScreenProps> = ({
  localStream,
  onCreateOffer,
  onReceiveOffer,
  onReceiveAnswer,
  offerSdp,
  answerSdp,
  isLoading,
  appState,
  connectionState,
}) => {
  const [peerOfferCode, setPeerOfferCode] = useState('');
  const [peerAnswerCode, setPeerAnswerCode] = useState('');

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
        alert(`${type} copied to clipboard!`);
    }, (err) => {
        console.error('Could not copy text: ', err);
        alert(`Failed to copy ${type}.`);
    });
  };

  const connectButtonText = useMemo(() => {
    if (isLoading && appState === 'connecting') {
      switch (connectionState) {
        case 'connecting': return 'Connecting...';
        case 'new': return 'Initializing...';
        default: return 'Connecting...';
      }
    }
    return 'Connect';
  }, [isLoading, appState, connectionState]);
  
  const renderInitialState = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <button 
        onClick={onCreateOffer} 
        disabled={isLoading}
        className="w-full max-w-sm bg-green-600 hover:bg-green-700 disabled:bg-green-800 font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center text-lg"
      >
        {isLoading && appState === 'creating_offer' ? (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : 'Create Call & Get Code'}
      </button>
      <div className="flex items-center w-full max-w-sm">
        <hr className="flex-grow border-t border-gray-600" />
        <span className="px-4 text-gray-400 font-semibold">OR</span>
        <hr className="flex-grow border-t border-gray-600" />
      </div>
      <div className="w-full max-w-sm flex flex-col items-center space-y-2">
        <label htmlFor="peer-offer-code" className="text-gray-300 self-start">Have a code? Paste it here to join:</label>
        <textarea
          id="peer-offer-code"
          value={peerOfferCode}
          onChange={(e) => setPeerOfferCode(e.target.value)}
          className="w-full p-2 bg-gray-900 text-gray-300 rounded-md resize-none h-24 text-sm"
          placeholder="Paste peer's connection code..."
        />
        <button
          onClick={() => onReceiveOffer(peerOfferCode)}
          disabled={!peerOfferCode.trim() || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center"
        >
          {isLoading && appState === 'creating_answer' ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          ) : 'Join Call'}
        </button>
      </div>
    </div>
  );

  const renderCreatorState = () => {
    // Compress the SDP for the link to make it shorter
    const compressedSdp = offerSdp ? compressData(offerSdp) : '';
    const shareLink = compressedSdp ? `${window.location.origin}${window.location.pathname}#c=${compressedSdp}` : '';
    
    return (
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 h-full">
        <div className="flex-1 flex flex-col space-y-4">
          <div className="p-4 bg-gray-900 rounded-lg">
            <h3 className="font-bold text-lg mb-2 text-green-400">Step 1: Invite Your Peer</h3>
            <p className="text-sm text-gray-400 mb-3">Send this link for a one-click join:</p>
            <div className="relative">
              <input type="text" readOnly value={shareLink} className="w-full p-2 pr-10 bg-gray-700 text-gray-300 rounded-md text-sm" onFocus={e => e.target.select()} />
              <button onClick={() => copyToClipboard(shareLink, 'Link')} className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 bg-gray-600 hover:bg-gray-500 rounded text-gray-300"><CopyIcon/></button>
            </div>
            <p className="text-xs text-gray-500 mt-3">Or, have them paste this manual code:</p>
            <textarea readOnly value={offerSdp || ''} className="w-full h-24 p-2 mt-1 bg-gray-700 text-gray-300 rounded-md resize-none text-xs" />
             <button onClick={() => copyToClipboard(offerSdp || '', 'Code')} className="mt-2 w-full text-sm bg-gray-600 hover:bg-gray-500 rounded py-1">Copy Manual Code</button>
          </div>
        </div>
        <div className="flex-1 flex flex-col p-4 bg-gray-900 rounded-lg">
          <h3 className="font-bold text-lg mb-2 text-blue-400">Step 2: Connect</h3>
          <label htmlFor="peer-answer-code" className="text-sm text-gray-400 mb-2">Paste your peer's code here:</label>
          <textarea
            id="peer-answer-code"
            value={peerAnswerCode}
            onChange={(e) => setPeerAnswerCode(e.target.value)}
            className="w-full flex-grow p-2 bg-gray-700 text-gray-300 rounded-md resize-none mb-3"
            placeholder="Their code will appear here..."
          />
          <button
            onClick={() => onReceiveAnswer(peerAnswerCode)}
            disabled={!peerAnswerCode.trim() || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center"
          >
            {isLoading && appState === 'connecting' && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            )}
            {connectButtonText}
          </button>
        </div>
      </div>
    );
  };
  
  const renderJoinerState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="p-6 bg-gray-900 rounded-lg max-w-md w-full">
            <h3 className="font-bold text-lg mb-2 text-green-400">You're In!</h3>
            <p className="text-sm text-gray-400 mb-4">Just one last step. Copy the code below and send it back to the person who invited you.</p>
            <textarea
                readOnly
                value={answerSdp || ''}
                className="w-full h-32 p-2 bg-gray-700 text-gray-300 rounded-md resize-none text-xs"
            />
            <button onClick={() => copyToClipboard(answerSdp || '', 'Code')} className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                Copy Your Code
            </button>
            <p className="text-xs text-gray-500 mt-4">The call will begin automatically once they use your code. Keep this window open.</p>
        </div>
    </div>
  );

  const renderContent = () => {
    if (offerSdp) return renderCreatorState();
    if (answerSdp) return renderJoinerState();
    return renderInitialState();
  }

  return (
    <div className="flex flex-col h-full space-y-4">
        <div className="w-full md:w-1/2 lg:w-1/3 self-center rounded-lg overflow-hidden shadow-lg flex-shrink-0">
            <VideoPlayer stream={localStream} isMuted={true} isLocal={true} />
        </div>
        <div className="flex-grow bg-gray-800 p-4 rounded-lg flex flex-col">
            {renderContent()}
        </div>
    </div>
  );
};

export default SetupScreen;