import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../types';
import { SendIcon, LockIcon, AttachmentIcon, DownloadIcon, FileIcon } from './Icons';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string, type: 'text' | 'image' | 'file', fileName?: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText, 'text');
      setInputText('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size exceeds 5MB limit.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const type = file.type.startsWith('image/') ? 'image' : 'file';
        onSendMessage(base64, type, file.name);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = (msg: Message) => {
    switch (msg.type) {
      case 'image':
        return (
          <div className="space-y-1">
             <img src={msg.content} alt={msg.fileName || 'Image'} className="max-w-full rounded-lg max-h-48 object-cover cursor-pointer" onClick={() => window.open(msg.content, '_blank')} />
             {msg.fileName && <div className="text-xs text-gray-300 truncate opacity-75">{msg.fileName}</div>}
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center space-x-3 p-1">
            <div className="bg-gray-800 p-2 rounded-lg">
                <FileIcon />
            </div>
            <div className="flex-grow min-w-0">
                <p className="text-sm font-medium truncate">{msg.fileName || 'Unknown File'}</p>
                <a href={msg.content} download={msg.fileName || 'download'} className="text-xs text-blue-300 hover:text-blue-200 flex items-center mt-1">
                    <span className="mr-1">Download</span>
                    <DownloadIcon />
                </a>
            </div>
          </div>
        );
      default:
        return <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>;
    }
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
              <div className={`max-w-[85%] md:max-w-[75%] p-3 rounded-lg ${msg.sender === 'me' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                {renderMessageContent(msg)}
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
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            title="Attach File"
          >
            <AttachmentIcon />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
          />
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