import React from 'react';

export const LabelBadge: React.FC<{ text: string; bg?: string; color?: string; x: number; y: number }> = ({
  text,
  bg = '#FFFFFF',
  color = '#0F172A',
  x,
  y,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      backgroundColor: bg,
      color,
      padding: '10px 26px',
      borderRadius: 40,
      border: '4px solid #0F172A',
      fontSize: 32,
      fontWeight: 900,
      boxShadow: '0 6px 0 #0F172A',
      whiteSpace: 'nowrap',
      zIndex: 15,
    }}
  >
    {text}
  </div>
);

export const CartoonSkyAndGround: React.FC<{ frame: number }> = ({ frame }) => {
  const cloudX = (frame * 0.6) % 1200;
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: '#7DD3FC' }} />
      <svg width="180" height="180" viewBox="0 0 180 180" style={{ position: 'absolute', top: 30, left: 30, transform: `rotate(${frame * 0.5}deg)` }}>
        <circle cx="90" cy="90" r="52" fill="#FACC15" stroke="#0F172A" strokeWidth="5" />
        <circle cx="75" cy="82" r="5" fill="#0F172A" />
        <circle cx="105" cy="82" r="5" fill="#0F172A" />
        <path d="M 75 100 Q 90 115 105 100" stroke="#0F172A" strokeWidth="5" fill="none" strokeLinecap="round" />
      </svg>
      <svg width="240" height="100" viewBox="0 0 240 100" style={{ position: 'absolute', top: 190, left: cloudX - 200 }}>
        <path d="M40 80 H190 A30 30 0 0 0 190 25 A45 45 0 0 0 105 20 A35 35 0 0 0 40 80 Z" fill="#FFF" stroke="#0F172A" strokeWidth="4" />
      </svg>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, backgroundColor: '#A16207', borderTop: '6px solid #0F172A' }} />
    </>
  );
};

export const TempleVector: React.FC<{ x?: number; y?: number; scale?: number }> = ({ x = 320, y = 520, scale = 1 }) => (
  <svg width="460" height="360" viewBox="0 0 460 360" style={{ position: 'absolute', left: x, top: y, transform: `scale(${scale})` }}>
    <polygon points="10,350 110,40 350,40 450,350" fill="#D97706" stroke="#0F172A" strokeWidth="6" />
    <rect x="115" y="120" width="230" height="230" fill="#F59E0B" stroke="#0F172A" strokeWidth="6" rx="8" />
    <rect x="135" y="165" width="36" height="140" fill="#B45309" stroke="#0F172A" strokeWidth="4" rx="6" />
    <rect x="182" y="165" width="36" height="140" fill="#B45309" stroke="#0F172A" strokeWidth="4" rx="6" />
    <rect x="242" y="165" width="36" height="140" fill="#B45309" stroke="#0F172A" strokeWidth="4" rx="6" />
    <rect x="289" y="165" width="36" height="140" fill="#B45309" stroke="#0F172A" strokeWidth="4" rx="6" />
    <rect x="212" y="255" width="36" height="95" fill="#451A03" stroke="#0F172A" strokeWidth="4" />
  </svg>
);
