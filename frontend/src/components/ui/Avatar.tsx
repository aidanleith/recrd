import React from 'react';

interface AvatarProps {
  username: string;
  size?: number;
  className?: string;
}

// Generate a consistent color based on username (similar to Gmail)
const getColorFromUsername = (username: string): string => {
  // List of nice colors for avatars
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B739', // Orange
    '#52BE80', // Green
    '#EC7063', // Coral
    '#5DADE2', // Light Blue
    '#F1948A', // Pink
    '#7FB3D3', // Steel Blue
    '#82E0AA', // Light Green
  ];

  // Simple hash function to get consistent color for same username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export const Avatar: React.FC<AvatarProps> = ({ username, size = 160, className = '' }) => {
  const firstLetter = username.charAt(0).toUpperCase();
  const backgroundColor = getColorFromUsername(username);
  const fontSize = size * 0.5; // Letter should be about half the size

  return (
    <div
      className={`rounded-full shadow-lg flex items-center justify-center text-white font-bold ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: backgroundColor,
        fontSize: `${fontSize}px`,
      }}
    >
      {firstLetter}
    </div>
  );
};

