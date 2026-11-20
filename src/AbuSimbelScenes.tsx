import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, interpolateColors, spring, staticFile, useCurrentFrame} from 'remotion';

export const FPS = 30;
export const DURATION_IN_FRAMES = 1560;

const INK = '#0F172A';
const SW = 5;
const FONT = "'Cairo','Tajawal','Noto Sans Arabic',Arial,sans-serif";
const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lerp = (f: number, a: number, b: number, x: number, y: number) => interpolate(f, [a, b], [x, y], CL);
const pop = (f: number, start: number) => (f < start ? 0 : spring({frame: f - start, fps: FPS, config: {damping: 9, stiffness: 140}}));
const ease = (t: number) => t * t * (3 - 2 * t);

type Mood = 'worry' | 'happy' | 'shock';
type Cap = {from: number; to: number; text: string; hi: string};

const CAPTIONS: Cap[] = [
  {from: 0, to: 96, text: 'تخيل صحيت الصبح لقيت مديرك بيقولك:', hi: 'مديرك'},
  {from: 96, to: 271, text: 'مية السد العالي هتغرق معبد أبو سمبل، قدامك كام شهر وتنقله فوق الجبل!', hi: 'هتغرق'},
  {from: 271, to: 393, text: 'لو إنت المهندس هتعمل إيه؟ هتربطه بونش وترفعه؟', hi: 'بونش'},
  {from: 393, to: 561, text: 'ده معبد منحوت جوه الجبل نفسه، لو شدّيته الجبل كله هيقع فوق دماغك!', hi: 'هيقع'},
  {from: 561, to: 674, text: 'المهندسين سنة 1964 فكروا في فكرة مجنونة..', hi: 'مجنونة'},
  {from: 674, to: 849, text: 'جابوا مناشير يدوية وقطعوا المعبد والجبل حتت صغيرة، بالظبط 1036 بلوك!', hi: '1036'},
  {from: 849, to: 936, text: 'ورقّموا كل حجر زي لعبة البازل،', hi: 'البازل'},
  {from: 936, to: 1067, text: 'ورفعوهم بالراحة 65 متر لفوق عشان يهربوا من المية.', hi: '65'},
  {from: 1067, to: 1221, text: 'وعشان المعبد ميبانش إنه متركب، بنوا وراه قبة خرسانية عملاقة', hi: 'قبة'},
  {from: 1221, to: 1359, text: 'وردموها بالرمل عشان يبان كأنه لسه جوه الجبل الطبيعي!', hi: 'بالرمل'},
  {from: 1359, to: 1449, text: 'وبكده أنقذوا التاريخ من الغرق..', hi: 'التاريخ'},
  {from: 1449, to: 1560, text: 'قولنا بقى، لو كنت مكانهم كنت هتحلها إزاي؟', hi: 'هتحلها'},
];

const PHASES = [
  {from: 0, color: '#FACC15', text: 'تخيّل معايا'},
  {from: 96, color: '#F87171', text: 'المشكلة: السد العالي'},
  {from: 561, color: '#34D399', text: 'الحل الهندسي'},
  {from: 1359, color: '#FACC15', text: 'سؤال ليك'},
];

const Face: React.FC<{x: number; y: number; s?: number; mood: Mood}> = ({x, y, s = 1, mood}) => {
  const f = useCurrentFrame();
  const blink = f % 80 < 4 ? 0.1 : 1;
  const tx = mood === 'happy' ? 0 : Math.sin(f * 1.6) * 3;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-38, 38].map((ex) => (
        <g key={ex} transform={`translate(${ex} 0) scale(1 ${blink})`}>
          <circle r={24} fill="#fff" stroke={INK} strokeWidth={4} />
          <circle cx={tx} cy={mood === 'happy' ? 3 : 0} r={10} fill={INK} />
        </g>
      ))}
      {mood === 'worry' && <path d="M-62 -30 L-16 -52 M62 -30 L16 -52" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />}
      {mood === 'happy' && <path d="M-60 -38 Q-38 -56 -16 -38 M60 -38 Q38 -56 16 -38" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />}
      {mood === 'shock' && <path d="M-60 -50 Q-38 -68 -16 -50 M60 -50 Q38 -68 16 -50" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />}
      {mood === 'worry' && <path d="M-30 58 Q-15 40 0 58 T30 58" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />}
      {mood === 'happy' && <path d="M-36 42 Q0 92 36 42 Z" fill="#7F1D1D" stroke={INK} strokeWidth={5} strokeLinejoin="round" />}
      {mood === 'shock' && <ellipse cx={0} cy={58} rx={15} ry={20} fill="#7F1D1D" stroke={INK} strokeWidth={5} />}
    </g>
  );
};

const LabelBadge: React.FC<{text: string; x: number; y: number; start: number; color?: string}> = ({text, x, y, start, color = '#FFFFFF'}) => {
  const f = useCurrentFrame();
  const sc = pop(f, start);
  const w = Math.max(170, text.length * 30 + 70);
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`} opacity={sc > 0.01 ? 1 : 0}>
      <rect x={-w / 2} y={-26} width={w} height={76} rx={38} fill={INK} />
      <rect x={-w / 2} y={-34} width={w} height={76} rx={38} fill={color} stroke={INK} strokeWidth={4} />
      <text x={0} y={18} textAnchor="middle" fontSize={38} fontWeight={900} fill={INK} fontFamily={FONT} direction="rtl">
        {text}
      </text>
    </g>
  );
};

const Water: React.FC<{y: number; f: number}> = ({y, f}) => {
  let d = `M0 1460 L0 ${y}`;
  for (let x = 0; x <= 1080; x += 30) d += ` L${x} ${y + Math.sin((x + f * 8) / 55) * 12}`;
  d += ' L1080 1460 Z';
  return <path d={d} fill="#38BDF8" fillOpacity={0.85} stroke={INK} strokeWidth={SW} />;
};

const Mountain: React.FC = () => (
  <g>
    <path d="M-20 1100 L200 800 L380 560 L540 440 L700 560 L880 800 L1100 1100 Z" fill="#C2864B" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <path d="M300 700 L360 760 M770 700 L710 770 M520 520 L560 580" stroke="#92400E" strokeWidth={6} strokeLinecap="round" />
  </g>
);

const Temple: React.FC<{mood: Mood; s?: number}> = ({mood, s = 1}) => (
  <g transform={`translate(540 1100) scale(${s})`}>
    <path d="M-280 0 L-250 -380 L250 -380 L280 0 Z" fill="#FED7AA" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <rect x={-270} y={-424} width={540} height={46} rx={8} fill="#FB923C" stroke={INK} strokeWidth={SW} />
    {[-220, -120, 120, 220].map((cx) => (
      <g key={cx}>
        <rect x={cx - 35} y={-170} width={70} height={140} rx={10} fill="#FDBA74" stroke={INK} strokeWidth={4} />
        <circle cx={cx} cy={-198} r={28} fill="#FDBA74" stroke={INK} strokeWidth={4} />
      </g>
    ))}
    <path d="M-44 0 L-44 -110 Q0 -170 44 -110 L44 0 Z" fill="#7C2D12" stroke={INK} strokeWidth={4} />
    <Face x={0} y={-300} s={1.2} mood={mood} />
  </g>
);

const Layer: React.FC<{len: number; shake?: number; children: React.ReactNode}> = ({len, shake = 0, children}) => {
  const f = useCurrentFrame();
  const z = 1 + 0.05 * (f / len);
  const sx = Math.sin(f * 1.2) * 8 * shake;
  const op = lerp(f, 0, 6, 0, 1);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1460, opacity: op, transform: `translateX(${sx}px) scale(${z})`, transformOrigin: '540px 1100px'}}>
      <svg width={1080} height={1460} viewBox="0 0 1080 1460" style={{position: 'absolute', left: 0, top: 0}}>
        {children}
      </svg>
    </div>
  );
};

const SceneA: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Layer len={271} shake={f > 96 ? lerp(f, 96, 271, 0.2, 1) : 0}>
      <Mountain />
      <Temple mood={f < 96 ? 'happy' : 'worry'} />
      <Water y={lerp(f, 0, 271, 1260, 860)} f={f} />
      <LabelBadge text="مية السد العالي" x={300} y={600} start={100} color="#BAE6FD" />
      <LabelBadge text="قدامك كام شهر؟" x={790} y={700} start={170} color="#FECACA" />
    </Layer>
  );
};

const SceneB: React.FC = () => {
  const f = useCurrentFrame();
  const lift = lerp(f, 50, 100, 0, 34) + (f > 100 ? Math.sin(f * 0.9) * 3 : 0);
  const cp = lerp(f, 120, 170, 0, 1);
  const ropeEnd = 676 - lift;
  return (
    <Layer len={290} shake={f > 150 ? 1 : 0.3}>
      <Mountain />
      <path d="M260 1100 L290 720 L790 720 L820 1100 Z" fill="#7C2D12" stroke={INK} strokeWidth={SW} opacity={lift > 1 ? 1 : 0} />
      <path d="M540 470 L520 540 L565 600 L520 660 L555 720" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={300} strokeDashoffset={(1 - cp) * 300} />
      <path d="M400 600 L440 650 L410 700 L450 760" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={250} strokeDashoffset={(1 - cp) * 250} />
      <g transform={`translate(0 ${-lift})`}>
        <Temple mood={f > 150 ? 'shock' : 'worry'} />
      </g>
      <g>
        <rect x={90} y={1040} width={240} height={60} rx={12} fill="#FACC15" stroke={INK} strokeWidth={SW} />
        <circle cx={130} cy={1100} r={26} fill="#334155" stroke={INK} strokeWidth={SW} />
        <circle cx={290} cy={1100} r={26} fill="#334155" stroke={INK} strokeWidth={SW} />
        <rect x={170} y={559} width={40} height={481} fill="#F59E0B" stroke={INK} strokeWidth={SW} />
        <rect x={100} y={930} width={140} height={110} rx={14} fill="#FACC15" stroke={INK} strokeWidth={SW} />
        <Face x={170} y={982} s={0.55} mood={f > 150 ? 'shock' : 'worry'} />
        <rect x={90} y={520} width={90} height={44} rx={8} fill="#64748B" stroke={INK} strokeWidth={SW} />
        <rect x={170} y={525} width={470} height={34} rx={8} fill="#FACC15" stroke={INK} strokeWidth={SW} />
        <line x1={540} y1={559} x2={540} y2={ropeEnd} stroke={INK} strokeWidth={6} />
        <circle cx={540} cy={ropeEnd} r={14} fill="#E2E8F0" stroke={INK} strokeWidth={4} />
      </g>
      {[380, 540, 700].map((rx, i) => {
        const t = (f - 150 - i * 22) % 56;
        if (f < 150 + i * 22) return null;
        const ry = 480 + t * t * 0.2;
        return <polygon key={rx} points="-26,-12 -8,-30 20,-22 28,6 6,26 -22,18" transform={`translate(${rx} ${ry}) rotate(${t * 9})`} fill="#92400E" stroke={INK} strokeWidth={4} />;
      })}
      <LabelBadge text="هنرفعه بونش؟" x={800} y={520} start={20} />
      <LabelBadge text="منحوت جوه الجبل" x={540} y={300} start={125} color="#FEF08A" />
      <LabelBadge text="الجبل هيقع!" x={540} y={390} start={190} color="#FECACA" />
    </Layer>
  );
};

const SceneC: React.FC = () => {
  const f = useCurrentFrame();
  const cols = 8;
  const rows = 6;
  const g = lerp(f, 150, 240, 0, 16);
  const pitch = 70 + g;
  const x0 = 540 - (cols * pitch - g) / 2;
  const palette = ['#FDBA74', '#FB923C', '#FCD34D', '#FCA5A5'];
  const sawX = 540 + Math.sin(f * 0.6) * 150;
  const sawY = lerp(f, 10, 140, 720, 1040);
  let teeth = 'M-130 22';
  for (let i = 0; i < 10; i++) teeth += ' l13 16 l13 -16';
  return (
    <Layer len={375}>
      <Mountain />
      <g opacity={lerp(f, 110, 170, 1, 0)}>
        <Temple mood="shock" />
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <line key={'v' + i} x1={260 + i * 70} y1={680} x2={260 + i * 70} y2={680 + lerp(f, 10 + i * 10, 40 + i * 10, 0, 1) * 420} stroke={INK} strokeWidth={4} />
        ))}
        {[1, 2, 3, 4, 5].map((j) => (
          <line key={'h' + j} x1={260} y1={680 + j * 70} x2={260 + lerp(f, 10 + j * 12, 50 + j * 12, 0, 1) * 560} y2={680 + j * 70} stroke={INK} strokeWidth={4} />
        ))}
      </g>
      <g opacity={lerp(f, 110, 170, 0, 1)}>
        {Array.from({length: rows * cols}).map((_, k) => {
          const r = Math.floor(k / cols);
          const c = k % cols;
          const x = x0 + c * pitch;
          const y = 1100 - (rows - r) * pitch + g + (g > 8 ? Math.sin(f * 0.12 + k) * 4 : 0);
          const col = interpolateColors(f, [200, 250], ['#FED7AA', palette[(r + c) % 4]]);
          return (
            <g key={k}>
              <rect x={x} y={y} width={64} height={64} rx={8} fill={col} stroke={INK} strokeWidth={4} />
              <text x={x + 32} y={y + 42} textAnchor="middle" fontSize={26} fontWeight={900} fill={INK} fontFamily={FONT} opacity={pop(f, 200 + (k % 12) * 2)}>
                {k + 1}
              </text>
            </g>
          );
        })}
      </g>
      <g transform={`translate(${sawX} ${sawY}) rotate(-6)`} opacity={lerp(f, 130, 150, 1, 0)}>
        <rect x={-130} y={-22} width={260} height={44} fill="#E2E8F0" stroke={INK} strokeWidth={4} />
        <path d={teeth} fill="#E2E8F0" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <rect x={130} y={-30} width={70} height={60} rx={20} fill="#EF4444" stroke={INK} strokeWidth={4} />
        <Face x={-20} y={0} s={0.42} mood="happy" />
      </g>
      <LabelBadge text="فكرة مجنونة!" x={540} y={300} start={8} color="#FEF08A" />
      <LabelBadge text="مناشير يدوية" x={300} y={520} start={50} />
      <LabelBadge text="1036 بلوك!" x={540} y={390} start={118} color="#86EFAC" />
      <LabelBadge text="ترقيم زي البازل" x={540} y={480} start={290} color="#FDE68A" />
    </Layer>
  );
};

const SceneD: React.FC = () => {
  const f = useCurrentFrame();
  const palette = ['#FCD34D', '#FB923C', '#FCA5A5', '#A7F3D0'];
  return (
    <Layer len={131}>
      <path d="M600 1100 L720 520 L1080 520 L1080 1100 Z" fill="#C2864B" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <rect x={720} y={500} width={360} height={26} rx={8} fill="#4ADE80" stroke={INK} strokeWidth={SW} />
      <path d="M250 1090 L900 505" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeDasharray="4 16" fill="none" />
      <line x1={560} y1={540} x2={560} y2={1085} stroke={INK} strokeWidth={6} />
      <polygon points="560,520 540,560 580,560" fill={INK} />
      <polygon points="560,1105 540,1065 580,1065" fill={INK} />
      <line x1={540} y1={520} x2={720} y2={520} stroke={INK} strokeWidth={4} strokeDasharray="10 10" />
      {[0, 1, 2, 3].map((i) => {
        const e = ease(lerp(f, 5 + i * 14, 85 + i * 14, 0, 1));
        const ex = 780 + i * 85;
        const x = 250 + e * (ex - 250);
        const y = 1040 - e * 585;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${Math.sin(f * 0.4 + i) * 4})`}>
            <rect x={-42} y={-42} width={84} height={84} rx={10} fill={palette[i]} stroke={INK} strokeWidth={5} />
            {i === 0 ? <Face x={0} y={-2} s={0.5} mood="happy" /> : <text x={0} y={14} textAnchor="middle" fontSize={44} fontWeight={900} fill={INK} fontFamily={FONT}>{i + 1}</text>}
          </g>
        );
      })}
      <Water y={lerp(f, 0, 131, 1180, 1020)} f={f} />
      <LabelBadge text="65 متر" x={400} y={800} start={6} color="#FEF08A" />
      <LabelBadge text="بالراحة.. بلوك بلوك" x={540} y={300} start={60} color="#A7F3D0" />
    </Layer>
  );
};

const SceneE: React.FC = () => {
  const f = useCurrentFrame();
  const h = lerp(f, 150, 280, 0, 660);
  const dome = pop(f, 0);
  const sandCol = interpolateColors(f, [230, 292], ['#FDE68A', '#C2864B']);
  return (
    <Layer len={292}>
      <g transform={`translate(540 1100) scale(${dome}) translate(-540 -1100)`}>
        <path d="M140 1100 A400 400 0 0 1 940 1100 Z" fill="#94A3B8" stroke={INK} strokeWidth={SW} />
        <path d="M300 1100 Q300 760 540 700 Q780 760 780 1100 M420 1100 Q420 760 540 700 Q660 760 660 1100 M540 700 L540 1100" stroke={INK} strokeWidth={4} fill="none" />
      </g>
      {h > 0 && (
        <path d={`M-20 1100 L200 ${1100 - h * 0.4545} L380 ${1100 - h * 0.818} L540 ${1100 - h} L700 ${1100 - h * 0.818} L880 ${1100 - h * 0.4545} L1100 1100 Z`} fill={sandCol} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      )}
      {f > 150 && f < 280 &&
        Array.from({length: 14}).map((_, i) => (
          <circle key={i} cx={540 + ((i * 53) % 300) - 150} cy={330 + ((f * 10 + i * 83) % 700)} r={8} fill="#FDE68A" stroke={INK} strokeWidth={3} />
        ))}
      <Temple mood={f < 200 ? 'worry' : 'happy'} s={0.9} />
      <LabelBadge text="قبة خرسانية عملاقة" x={540} y={300} start={15} />
      <LabelBadge text="ردم بالرمل" x={540} y={385} start={154} color="#FDE68A" />
    </Layer>
  );
};

const SceneF: React.FC = () => {
  const f = useCurrentFrame();
  const stars = [[260, 620], [820, 640], [420, 520], [680, 520], [160, 900], [930, 930]];
  return (
    <Layer len={201}>
      <Mountain />
      <Temple mood="happy" />
      {stars.map(([sx, sy], i) => {
        const sc = 0.6 + 0.4 * Math.abs(Math.sin(f * 0.1 + i));
        return <polygon key={i} points="0,-28 8,-8 28,0 8,8 0,28 -8,8 -28,0 -8,-8" transform={`translate(${sx} ${sy}) scale(${sc})`} fill="#FACC15" stroke={INK} strokeWidth={4} />;
      })}
      <text x={900} y={760 + Math.sin(f * 0.2) * 14} textAnchor="middle" fontSize={260} fontWeight={900} fill="#FACC15" stroke={INK} strokeWidth={10} paintOrder="stroke" fontFamily={FONT} transform={`rotate(${Math.sin(f * 0.15) * 8} 900 700)`}>
        ؟
      </text>
      <LabelBadge text="أنقذوا التاريخ!" x={540} y={300} start={10} color="#86EFAC" />
      <LabelBadge text="إنت كنت هتعمل إيه؟" x={540} y={385} start={90} color="#FEF08A" />
    </Layer>
  );
};

const Cloud: React.FC<{f: number; off: number; y: number; sp: number}> = ({f, off, y, sp}) => (
  <g transform={`translate(${((f * sp + off) % 1500) - 250} ${y})`} fill="#fff" stroke={INK} strokeWidth={4}>
    <circle cx={0} cy={0} r={34} />
    <circle cx={45} cy={-18} r={44} />
    <circle cx={95} cy={0} r={34} />
    <rect x={0} y={0} width={95} height={34} stroke="none" />
  </g>
);

const Sun: React.FC<{f: number}> = ({f}) => (
  <g transform="translate(930 330)">
    <g transform={`rotate(${f * 0.6})`}>
      {Array.from({length: 12}).map((_, i) => (
        <rect key={i} x={-9} y={-112} width={18} height={36} rx={9} fill="#FACC15" stroke={INK} strokeWidth={4} transform={`rotate(${i * 30})`} />
      ))}
    </g>
    <circle r={70} fill="#FDE047" stroke={INK} strokeWidth={5} />
    <circle cx={-24} cy={-10} r={8} fill={INK} />
    <circle cx={24} cy={-10} r={8} fill={INK} />
    <path d="M-30 14 Q0 44 30 14" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
  </g>
);

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const c = CAPTIONS.find((x) => f >= x.from && f < x.to);
  if (!c) return null;
  const lf = f - c.from;
  const enter = pop(lf, 0);
  const hs = pop(lf, 6);
  return (
    <div style={{position: 'absolute', left: 0, top: 1460, width: 1080, height: 460, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{direction: 'rtl', textAlign: 'center', padding: '0 48px', fontFamily: FONT, fontSize: 64, fontWeight: 900, lineHeight: 1.35, color: '#FFFFFF', opacity: Math.min(1, enter * 1.5), transform: `translateY(${(1 - enter) * 30}px)`, textShadow: '0 4px 0 #000'}}>
        {c.text.split(' ').map((w, i) => {
          const isHi = w.replace(/[!؟?،,.:…]/g, '') === c.hi;
          return (
            <span key={i} style={{display: 'inline-block', margin: '0 9px', color: isHi ? '#FACC15' : '#FFFFFF', transform: isHi ? `scale(${1 + 0.06 * hs})` : undefined}}>
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const ExplainerVideo: React.FC = () => {
  const f = useCurrentFrame();
  const ph = [...PHASES].reverse().find((p) => f >= p.from) ?? PHASES[0];
  const phS = 0.85 + 0.15 * pop(f - ph.from, 0);
  return (
    <AbsoluteFill style={{background: '#111827', fontFamily: FONT}}>
      <Audio src={staticFile('abusimbel.mp3')} volume={1} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1460, background: '#7DD3FC', borderBottom: `8px solid ${INK}`, boxSizing: 'border-box', overflow: 'hidden'}}>
        <svg width={1080} height={1460} viewBox="0 0 1080 1460" style={{position: 'absolute', left: 0, top: 0}}>
          <Sun f={f} />
          <Cloud f={f} off={100} y={300} sp={0.7} />
          <Cloud f={f} off={800} y={440} sp={0.45} />
          <rect x={0} y={1100} width={1080} height={360} fill="#A16207" />
          <line x1={0} y1={1100} x2={1080} y2={1100} stroke={INK} strokeWidth={SW} />
        </svg>
        <Sequence from={0} durationInFrames={271}><SceneA /></Sequence>
        <Sequence from={271} durationInFrames={290}><SceneB /></Sequence>
        <Sequence from={561} durationInFrames={375}><SceneC /></Sequence>
        <Sequence from={936} durationInFrames={131}><SceneD /></Sequence>
        <Sequence from={1067} durationInFrames={292}><SceneE /></Sequence>
        <Sequence from={1359} durationInFrames={201}><SceneF /></Sequence>
        <div style={{position: 'absolute', top: 90, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{background: ph.color, border: `4px solid ${INK}`, boxShadow: `0 8px 0 ${INK}`, borderRadius: 999, padding: '16px 56px', fontSize: 54, fontWeight: 900, color: INK, direction: 'rtl', transform: `scale(${phS})`}}>{ph.text}</div>
        </div>
        <div style={{position: 'absolute', left: 0, bottom: 0, height: 10, width: `${(f / DURATION_IN_FRAMES) * 100}%`, background: '#FACC15'}} />
      </div>
      <Captions />
    </AbsoluteFill>
  );
};

export default ExplainerVideo;
