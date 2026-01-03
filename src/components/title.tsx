import React from 'react';
import Image from 'next/image';

interface TitleProps {
  className?: string;
  height?: number;
  style?: React.CSSProperties;
}

export default function Title({ className = '', height = 24, style }: TitleProps) {
  // Approximate aspect ratio - adjust if needed based on your actual image
  // Using a typical logo title aspect ratio
  const aspectRatio = 3.5; // width/height ratio
  const width = height * aspectRatio;
  
  return (
    <Image
      src="/redflagged-title.png"
      alt="RedFlagged"
      width={width}
      height={height}
      className={className}
      style={style}
      priority
    />
  );
}

