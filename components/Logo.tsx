import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = 'h-12 w-12' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="P2P Video Chat Logo"
  >
    <path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2"
      stroke="currentColor"
      className="text-indigo-500"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22"
      stroke="currentColor"
      className="text-emerald-500"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" className="fill-current text-gray-300" />
  </svg>
);

export default Logo;
