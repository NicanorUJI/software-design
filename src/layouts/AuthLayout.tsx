// src/layouts/AuthLayout.tsx
import type { ReactNode } from 'react';
import mapBg from '../assests/map-bg.png';

type Props = { children: ReactNode };

export default function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${mapBg})` }}
      />

      <div className="absolute inset-0 bg-white/1" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
}
