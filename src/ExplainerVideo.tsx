import React from 'react';
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

export const FPS = 30;
export const DURATION_IN_FRAMES = 1560;

export const ExplainerVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isScene1 = frame < 240;
  const isScene2 = frame >= 240 && frame < 510;
  const isScene3 = frame >= 510 && frame < 810;
  const isScene4 = frame >= 810 && frame < 1080;
  const isScene5 = frame >= 1080 && frame < 1380;
  const isScene6 = frame >= 1380;

  const waterRise = Math.min(65, Math.max(20, 20 + (frame / 220) * 45));

  const cranePull = spring({
    frame: frame - 270,
    fps,
    config: { damping: 8, stiffness: 80 },
  });

  const cutProgress = Math.min(1, Math.max(0, (frame - 530) / 150));

  const liftHeight = Math.min(0, Math.max(-220, -((frame - 830) / 190) * 220));

  const domeScale = spring({
    frame: frame - 1110,
    fps,
    config: { damping: 12 },
  });

  const ctaPop = spring({
    frame: frame - 1400,
    fps,
    config: { damping: 10 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1E1B18',
        fontFamily: 'Cairo, Tahoma, Arial, sans-serif',
        color: '#FFFFFF',
        overflow: 'hidden',
        direction: 'rtl',
      }}
    >
      <Audio src={staticFile('abusimbel.mp3')} volume={1} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, #0F172A 0%, #1E293B 55%, #78350F 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 50,
          right: 50,
          textAlign: 'center',
          backgroundColor: '#F59E0B',
          color: '#0F172A',
          padding: '20px 30px',
          borderRadius: 50,
          fontSize: 42,
          fontWeight: 'bold',
          boxShadow: '0 10px 25px rgba(0,0,0,0.45)',
          zIndex: 20,
        }}
      >
        لو إنت المهندس 👷‍♂️ | إنقاذ معبد أبو سمبل
      </div>

      {isScene1 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div
            style={{
              position: 'absolute',
              top: 250,
              left: 40,
              right: 40,
              fontSize: 58,
              fontWeight: 'bold',
              textAlign: 'center',
              backgroundColor: 'rgba(0,0,0,0.65)',
              padding: '24px 36px',
              borderRadius: 24,
              lineHeight: 1.4,
            }}
          >
            معبد أبو سمبل مهدد بالغرق بالكامل! 😱
          </div>

          <svg width="850" height="550" viewBox="0 0 700 450" style={{ marginTop: 100 }}>
            <polygon points="50,420 220,80 480,80 650,420" fill="#B45309" />
            <rect x="240" y="180" width="220" height="240" fill="#D97706" rx="10" />
            <rect x="260" y="230" width="32" height="140" fill="#92400E" rx="6" />
            <rect x="305" y="230" width="32" height="140" fill="#92400E" rx="6" />
            <rect x="363" y="230" width="32" height="140" fill="#92400E" rx="6" />
            <rect x="408" y="230" width="32" height="140" fill="#92400E" rx="6" />
            <rect x="332" y="310" width="36" height="110" fill="#451A03" />
          </svg>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${waterRise}%`,
              backgroundColor: 'rgba(14, 165, 233, 0.82)',
              borderTop: '10px solid #38BDF8',
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 35,
            }}
          >
            <span style={{ fontSize: 48, fontWeight: 'bold', color: '#E0F2FE' }}>
              🌊 ارتفاع مياه السد العالي!
            </span>
          </div>
        </AbsoluteFill>
      )}

      {isScene2 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div
            style={{
              position: 'absolute',
              top: 260,
              left: 40,
              right: 40,
              fontSize: 60,
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#FCA5A5',
              lineHeight: 1.4,
            }}
          >
            تربطه بونش وترفعه؟
            <br />
            مستحيل! ❌
          </div>

          <div
            style={{
              transform: `rotate(${Math.sin(frame * 0.8) * (cranePull * 4)}deg)`,
              marginTop: 220,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 160 }}>🏗️</div>
            <div
              style={{
                width: 12,
                height: 140,
                backgroundColor: '#EF4444',
                margin: '0 auto',
              }}
            />
            <div
              style={{
                width: 560,
                height: 300,
                backgroundColor: '#B45309',
                borderRadius: 30,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: 48,
                fontWeight: 'bold',
                border: '6px dashed #EF4444',
                padding: 20,
              }}
            >
              ⛰️ منحوت جوه الجبل نفسه!
            </div>
          </div>
        </AbsoluteFill>
      )}

      {isScene3 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div
            style={{
              position: 'absolute',
              top: 250,
              left: 40,
              right: 40,
              fontSize: 58,
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#FDE047',
              lineHeight: 1.4,
            }}
          >
            الحل المجنون (1964):
            <br />
            تقطيع الجبل بالمناشير! 🪚
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 210px)',
              gap: `${14 + cutProgress * 30}px`,
              marginTop: 140,
            }}
          >
            {Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: 210,
                  height: 140,
                  backgroundColor: '#D97706',
                  border: '4px solid #FEF08A',
                  borderRadius: 16,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: 38,
                  fontWeight: 'bold',
                  transform: `translateY(${(idx % 2 === 0 ? -1 : 1) * cutProgress * 18}px)`,
                }}
              >
                #{(idx + 1) * 86}
              </div>
            ))}
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 180,
              left: 50,
              right: 50,
              textAlign: 'center',
              fontSize: 52,
              fontWeight: 'bold',
              backgroundColor: '#0F172A',
              padding: '24px 36px',
              borderRadius: 24,
              border: '3px solid #F59E0B',
            }}
          >
            1,036 بلوك حجري بالظبط!
          </div>
        </AbsoluteFill>
      )}

      {isScene4 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div
            style={{
              position: 'absolute',
              top: 250,
              left: 40,
              right: 40,
              fontSize: 58,
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#34D399',
              lineHeight: 1.4,
            }}
          >
            ترقيم مثل البازل
            <br />
            ورفع 65 متر لأعلى ⬆️
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 60,
              marginTop: 320,
            }}
          >
            <div
              style={{
                transform: `translateY(${liftHeight}px)`,
                backgroundColor: '#D97706',
                padding: '50px 80px',
                borderRadius: 30,
                border: '6px solid #34D399',
                textAlign: 'center',
                boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ fontSize: 100 }}>🏛️</div>
              <div style={{ fontSize: 48, fontWeight: 'bold', marginTop: 15 }}>
                +65 متر أعلى الجبل
              </div>
            </div>

            <div
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                lineHeight: 1.7,
                textAlign: 'center',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                padding: '24px 44px',
                borderRadius: 24,
              }}
            >
              🧩 كل حجر برقم وكود
              <br />
              ✅ بعيد تماماً عن المياه
            </div>
          </div>
        </AbsoluteFill>
      )}

      {isScene5 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div
            style={{
              position: 'absolute',
              top: 250,
              left: 40,
              right: 40,
              fontSize: 58,
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#60A5FA',
              lineHeight: 1.4,
            }}
          >
            الخدعة السرية:
            <br />
            قبة خرسانية عملاقة! 🏗️
          </div>

          <div
            style={{
