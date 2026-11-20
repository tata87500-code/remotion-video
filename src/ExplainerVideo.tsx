import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { CartoonSkyAndGround, TempleVector, LabelBadge } from './AbuSimbelScenes';

export const FPS = 30;
export const DURATION_IN_FRAMES = 1560;

const CAPTIONS = [
  { start: 0, end: 110, normal: 'تخيل صحيت الصبح', highlight: 'ولقيت مديرك بيقولك:' },
  { start: 110, end: 240, normal: 'مية السد العالي', highlight: 'هتغرق معبد أبو سمبل!' },
  { start: 240, end: 370, normal: 'لو إنت المهندس', highlight: 'هتربطه بونش وترفعه؟' },
  { start: 370, end: 510, normal: 'ده منحوت جوه الجبل،', highlight: 'كله هيقع فوق دماغك!' },
  { start: 510, end: 660, normal: 'المهندسين سنة 1964', highlight: 'فكروا في فكرة مجنونة..' },
  { start: 660, end: 810, normal: 'قطعوا المعبد بالمناشير', highlight: 'بالظبط 1036 بلوك!' },
  { start: 810, end: 945, normal: 'ورقّموا كل حجر', highlight: 'زي لعبة البازل بالظبط،' },
  { start: 945, end: 1080, normal: 'ورفعوهم بالراحة', highlight: '65 متر لفوق!' },
  { start: 1080, end: 1230, normal: 'وعشان ميبانش متركب،', highlight: 'بنوا قبة خرسانية عملاقة' },
  { start: 1230, end: 1380, normal: 'وردموها بالرمل عشان يبان', highlight: 'جوه الجبل الطبيعي!' },
  { start: 1380, end: 1470, normal: 'وبكده أنقذوا', highlight: 'التاريخ من الغرق..' },
  { start: 1470, end: 1560, normal: 'لو كنت مكانهم', highlight: 'كنت هتحلها إزاي؟' },
];

export const ExplainerVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const waterHeight = Math.min(480, Math.max(120, 120 + (frame / 230) * 340));
  const shake = frame >= 360 && frame < 510 ? Math.sin(frame * 1.2) * 8 : 0;
  const cutGap = Math.min(28, Math.max(0, ((frame - 640) / 140) * 28));
  const liftY = Math.min(0, Math.max(-240, -((frame - 930) / 140) * 240));
  const domePop = spring({ frame: frame - 1100, fps, config: { damping: 12 } });

  const currentCap = CAPTIONS.find((c) => frame >= c.start && frame < c.end) || CAPTIONS[CAPTIONS.length - 1];

  let topBanner = 'لو إنت المهندس...';
  let bannerBg = '#FACC15';
  if (frame >= 240 && frame < 510) { topBanner = 'المشكلة؟'; bannerBg = '#F87171'; }
  else if (frame >= 510 && frame < 1080) { topBanner = 'الحل: تقطيع البازل'; bannerBg = '#34D399'; }
  else if (frame >= 1080 && frame < 1380) { topBanner = 'الخدعة السرية'; bannerBg = '#60A5FA'; }
  else if (frame >= 1380) { topBanner = 'عايز تعرف أكتر؟'; bannerBg = '#FACC15'; }

  return (
    <AbsoluteFill style={{ backgroundColor: '#111827', fontFamily: 'Cairo, Tahoma, Arial, sans-serif', direction: 'rtl' }}>
      <Audio src={staticFile('abusimbel.mp3')} volume={1} />

      {/* الجزء العلوي الكرتوني (76% من الشاشة) */}
      <div style={{ position: 'relative', width: '100%', height: 1460, overflow: 'hidden', borderBottom: '8px solid #0F172A' }}>
        <CartoonSkyAndGround frame={frame} />

        {/* الكبسولة العلوية */}
        <div style={{ position: 'absolute', top: 90, left: '50%', transform: 'translateX(-50%)', backgroundColor: bannerBg, color: '#0F172A', padding: '16px 54px', borderRadius: 50, border: '5px solid #0F172A', fontSize: 44, fontWeight: 900, boxShadow: '0 8px 0 #0F172A', zIndex: 30, whiteSpace: 'nowrap' }}>
          {topBanner}
        </div>

        {/* المشهد 1: ارتفاع المياه */}
        {frame < 240 && (
          <>
            <TempleVector x={310} y={880} scale={1.1} />
            <LabelBadge text="معبد أبو سمبل" x={430} y={810} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: waterHeight, backgroundColor: 'rgba(2, 132, 199, 0.85)', borderTop: '6px solid #0F172A' }}>
              <LabelBadge text="مياه السد العالي" bg="#38BDF8" x={120} y={30} />
            </div>
          </>
        )}

        {/* المشهد 2: الونش الفاشل */}
        {frame >= 240 && frame < 510 && (
          <div style={{ transform: `translateX(${shake}px)` }}>
            <TempleVector x={310} y={880} scale={1.1} />
            {/* ونش كرتوني */}
            <svg width="300" height="240" viewBox="0 0 300 240" style={{ position: 'absolute', left: 390, top: 480 }}>
              <rect x="80" y="60" width="140" height="90" rx="16" fill="#F97316" stroke="#0F172A" strokeWidth="5" />
              <circle cx="120" cy="100" r="14" fill="#FFF" stroke="#0F172A" strokeWidth="4" />
              <circle cx="180" cy="100" r="14" fill="#FFF" stroke="#0F172A" strokeWidth="4" />
              <line x1="150" y1="150" x2="150" y2="240" stroke="#0F172A" strokeWidth="8" />
            </svg>
            <LabelBadge text="منحوت جوه الجبل!" bg="#FCA5A5" x={390} y={810} />
          </div>
        )}

        {/* المشهد 3: التقطيع إلى 1036 بلوك */}
        {frame >= 510 && frame < 810 && (
          <>
            <LabelBadge text="1,036 بلوك حجري" bg="#FACC15" x={390} y={340} />
            <div style={{ position: 'absolute', top: 470, left: 210, display: 'grid', gridTemplateColumns: 'repeat(3, 200px)', gap: 12 + cutGap }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ width: 200, height: 150, backgroundColor: '#D97706', border: '5px solid #0F172A', borderRadius: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 38, fontWeight: 900, color: '#FFF' }}>
                  #{100 + i * 115}
                </div>
              ))}
            </div>
          </>
        )}

        {/* المشهد 4: الرفع 65 متر */}
        {frame >= 810 && frame < 1080 && (
          <>
            <LabelBadge text="رفع +65 متر لأعلى" bg="#34D399" x={380} y={340} />
            <div style={{ transform: `translateY(${liftY}px)` }}>
              <TempleVector x={310} y={880} scale={1.1} />
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 260, backgroundColor: 'rgba(2, 132, 199, 0.85)', borderTop: '6px solid #0F172A' }} />
          </>
        )}

        {/* المشهد 5: القبة الخرسانية */}
        {frame >= 1080 && frame < 1380 && (
          <>
            <LabelBadge text="قبة خرسانية مفرغة" bg="#93C5FD" x={380} y={340} />
            <div style={{ position: 'absolute', left: 220, top: 620, width: 640, height: 420, backgroundColor: '#94A3B8', borderTopLeftRadius: 320, borderTopRightRadius: 320, border: '6px solid #0F172A', transform: `scale(${domePop})` }} />
            <TempleVector x={310} y={880} scale={1.1} />
          </>
        )}

        {/* المشهد 6: الخاتمة */}
        {frame >= 1380 && (
          <>
            <TempleVector x={310} y={880} scale={1.1} />
            <LabelBadge text="اكتب رأيك في الكومنتات 👇" bg="#FACC15" x={330} y={480} />
          </>
        )}
      </div>

      {/* الجزء السفلي: شريط الترجمة الكحلي الاحترافي (24% من الشاشة) */}
      <div style={{ height: 460, backgroundColor: '#111827', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 50px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.45, color: '#FFFFFF' }}>
          {currentCap.normal}{' '}
          <span style={{ color: '#FACC15' }}>{currentCap.highlight}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
