import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function Logo({ className = '', width = 24, height = 24 }: LogoProps) {
  return (
    <Image
      src="/redflagged-logo.png"
      alt="RedFlagged Logo"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}

