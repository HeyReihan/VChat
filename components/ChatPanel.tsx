import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../types';
import { SendIcon, LockIcon } from './Icons';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-700 flex flex-col items-center justify-center">
        <h2 className="text-lg font-bold text-center">Chat</h2>
        <div className="flex items-center text-xs text-green-400 mt-1" title="Messages are end-to-end encrypted">
          <LockIcon />
          <span className="ml-1">E2EE Active</span>
        </div>
      </header>
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender === 'me' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                <p className="text-sm">{msg.text}</p>
              </div>
              <span className="text-xs text-gray-500 mt-1 px-1">
                {formatTimestamp(msg.timestamp)}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <footer className="p-4 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          />
          <button type="submit" title="Send" className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-blue-800" disabled={!inputText.trim()}>
            <SendIcon />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatPanel;
