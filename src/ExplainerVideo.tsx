import React, { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  continueRender,
  delayRender,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* ============================================================
   الإعدادات العامة
   ============================================================ */
export const FPS = 30;
export const DURATION_IN_FRAMES = 1500; // 50 ثانية

const INK = "#1E293B";
const FONT = "Cairo, Tajawal, 'Segoe UI', sans-serif";
const SCENE_Y = 330; // بداية منطقة المشهد (تحت الـ Pill وفوق الترجمة)

/* ============================================================
   دوال مساعدة للحركة
   ============================================================ */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ramp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const ease = (p: number) => p * p * (3 - 2 * p);
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const rampE = (t: number, a: number, b: number) => ease(ramp(t, a, b));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
// ظهور بارتداد (easeOutBack)
const popScale = (t: number, a: number, d = 0.4) => {
  const p = ramp(t, a, a + d);
  if (p <= 0) return 0;
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

/* ============================================================
   توقيتات الـ SRT (بعد حذف رسالة TurboScribe وتصحيح كلمتين)
   ============================================================ */
type Cue = { start: number; end: number; text: string };
const CUES: Cue[] = [
  { start: 0.23, end: 3.47, text: "لو أنت المهندس، وطلبوا منك تنقل سفينة عملاقة" },
  { start: 3.47, end: 6.39, text: "من بحر واطي لبحر عالي فوق جبل في" },
  { start: 6.39, end: 10.31, text: "قناة بانما، المشكلة أن السفينة وزنها 100 ألف" },
  { start: 10.31, end: 13.01, text: "طن، والمية ما بتطلعش ما طلع مائل." },
  { start: 13.33, end: 16.65, text: "لو حفرت القناة كلها لمستوى البحر، هتحتاج تهد" },
  { start: 16.65, end: 18.63, text: "جبال وتصرف مليارات." },
  { start: 18.99, end: 22.91, text: "ولو رفعتها بوينش، الحبال هتتقطع والسفينة هتغرق." },
  { start: 23.11, end: 27.71, text: "فالحل، تبني أسانسير مية، تبني أحواض عملاقة ببوابات" },
  { start: 27.71, end: 31.91, text: "حديد، تدخل السفينة وتقفل وراها البوابة، وبعدين تفتح" },
  { start: 31.91, end: 34.89, text: "محابس مية من البحيرة العالية بالجاذبية." },
  { start: 35.21, end: 39.13, text: "المية تملى الحوض وترفع السفينة لفوق 26 متر" },
  { start: 39.13, end: 42.83, text: "من غير موتور واحد، وتكمل طريقها للمحيط التاني." },
  { start: 43.17, end: 45.77, text: "عايز تعرف إزاي بيحفروا أنفاق تحت البحر؟" },
  { start: 45.77, end: 47.61, text: "اكتب في الكومنتات نفق." },
];

type Word = { text: string; start: number; end: number };
type Chunk = { start: number; end: number; words: Word[] };

// تقسيم كل جملة إلى مجموعات من 2-3 كلمات مع توزيع زمني متساوٍ للكلمات
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  CUES.forEach((cue) => {
    const words = cue.text.split(/\s+/).filter(Boolean);
    const n = words.length;
    const per = (cue.end - cue.start) / n;
    const timed: Word[] = words.map((w, i) => ({
      text: w,
      start: cue.start + i * per,
      end: cue.start + (i + 1) * per,
    }));
    const k = Math.max(1, Math.ceil(n / 3));
    for (let j = 0; j < k; j++) {
      const a = Math.round((j * n) / k);
      const b = Math.round(((j + 1) * n) / k);
      const ws = timed.slice(a, b);
      if (ws.length) {
        out.push({
          start: ws[0].start,
          end: ws[ws.length - 1].end + (j === k - 1 ? 0.15 : 0),
          words: ws,
        });
      }
    }
  });
  return out;
})();

/* ============================================================
   تحميل خط Cairo
   ============================================================ */
const useCairo = () => {
  const [handle] = useState(() => delayRender("load-cairo-font"));
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cairo:wght@900&family=Tajawal:wght@900&display=swap";
    link.onload = () => {
      document.fonts
        .load("900 78px Cairo", "ابتثجحخ")
        .catch(() => undefined)
        .finally(() => continueRender(handle));
    };
    link.onerror = () => continueRender(handle);
    document.head.appendChild(link);
  }, [handle]);
};

/* ============================================================
   المؤثرات الصوتية المولّدة برمجياً (WAV Base64)
   ============================================================ */
type SfxKind = "whoosh" | "pop" | "ding" | "buzz" | "horn";
const SR = 22050;
const SFX_DUR: Record<SfxKind, number> = {
  whoosh: 0.8,
  pop: 0.2,
  ding: 1.1,
  buzz: 0.5,
  horn: 1.3,
};

const gen = (dur: number, fn: (t: number) => number) => {
  const n = Math.floor(dur * SR);
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = fn(i / SR);
  return a;
};

const toWav = (samples: Float32Array): string => {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const ws = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  ws(0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  ws(8, "WAVE");
  ws(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, SR, true);
  v.setUint32(28, SR * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ws(36, "data");
  v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return "data:audio/wav;base64," + btoa(bin);
};

let _sfx: Record<SfxKind, string> | null = null;
const getSfx = (): Record<SfxKind, string> => {
  if (_sfx) return _sfx;
  let seed = 12345;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed / 4294967296) * 2 - 1;
  };
  let lp = 0;
  const whoosh = gen(SFX_DUR.whoosh, (t) => {
    const p = t / SFX_DUR.whoosh;
    const env = Math.pow(Math.sin(Math.PI * p), 2);
    const a = 0.03 + 0.4 * p; // فلتر يفتح تدريجياً
    lp += a * (rnd() - lp);
    return lp * env * 3;
  });
  const pop = gen(SFX_DUR.pop, (t) => {
    // تردد 300Hz -> 600Hz
    const phase = 2 * Math.PI * (300 * t + 750 * t * t);
    return Math.sin(phase) * Math.exp(-t * 18) * 0.9;
  });
  const ding = gen(SFX_DUR.ding, (t) => {
    const att = Math.min(1, t / 0.005);
    return (
      (Math.sin(2 * Math.PI * 880 * t) + 0.6 * Math.sin(2 * Math.PI * 1320 * t)) *
      0.5 *
      Math.exp(-t * 4.5) *
      att
    );
  });
  const buzz = gen(SFX_DUR.buzz, (t) => {
    const saw = 2 * ((t * 110) % 1) - 1;
    return saw * Math.min(1, t / 0.01) * Math.exp(-t * 3) * 0.8;
  });
  const horn = gen(SFX_DUR.horn, (t) => {
    const rel = t > 1.0 ? Math.max(0, (1.3 - t) / 0.3) : 1;
    const env = Math.min(1, t / 0.12) * rel;
    const tone = (f: number) =>
      Math.sin(2 * Math.PI * f * t) +
      0.5 * Math.sin(4 * Math.PI * f * t) +
      0.3 * Math.sin(6 * Math.PI * f * t);
    return (tone(130.8) + tone(196)) * 0.3 * env;
  });
  _sfx = {
    whoosh: toWav(whoosh),
    pop: toWav(pop),
    ding: toWav(ding),
    buzz: toWav(buzz),
    horn: toWav(horn),
  };
  return _sfx;
};

const SFX_CUES: { t: number; k: SfxKind }[] = [
  { t: 0.3, k: "pop" },
  { t: 3.5, k: "pop" },
  { t: 3.6, k: "whoosh" },
  { t: 7.3, k: "pop" },
  { t: 8.85, k: "pop" },
  { t: 12.0, k: "buzz" },
  { t: 13.35, k: "pop" },
  { t: 17.0, k: "whoosh" },
  { t: 17.9, k: "buzz" },
  { t: 19.0, k: "pop" },
  { t: 19.35, k: "whoosh" },
  { t: 21.25, k: "buzz" },
  { t: 22.0, k: "whoosh" },
  { t: 23.15, k: "pop" },
  { t: 23.4, k: "whoosh" },
  { t: 25.3, k: "whoosh" },
  { t: 26.85, k: "whoosh" },
  { t: 27.9, k: "horn" },
  { t: 29.6, k: "whoosh" },
  { t: 31.4, k: "whoosh" },
  { t: 34.4, k: "whoosh" },
  { t: 35.21, k: "pop" },
  { t: 38.2, k: "ding" },
  { t: 39.3, k: "whoosh" },
  { t: 39.7, k: "ding" },
  { t: 40.95, k: "horn" },
  { t: 43.0, k: "whoosh" },
  { t: 43.2, k: "pop" },
  { t: 45.8, k: "pop" },
  { t: 47.1, k: "ding" },
];

const Sfx: React.FC = () => {
  const sfx = useMemo(() => getSfx(), []);
  const { fps } = useVideoConfig();
  return (
    <>
      {SFX_CUES.map((c, i) => (
        <Sequence
          key={i}
          layout="none"
          from={Math.round(c.t * fps)}
          durationInFrames={Math.ceil(SFX_DUR[c.k] * fps) + 2}
        >
          <Audio src={sfx[c.k]} volume={0.25} />
        </Sequence>
      ))}
    </>
  );
};

/* ============================================================
   عناصر رسومية مشتركة
   ============================================================ */
const Eyes: React.FC<{ x: number; y: number; t: number; gap?: number; r?: number }> = ({
  x,
  y,
  t,
  gap = 18,
  r = 10,
}) => {
  const px = Math.sin(t * 1.7) * r * 0.28;
  const py = Math.cos(t * 1.3) * r * 0.2;
  const blink = t % 3.4 < 0.12 ? 0.12 : 1;
  return (
    <g transform={`translate(${x} ${y})`}>
      {[-gap, gap].map((cx, i) => (
        <g key={i}>
          <ellipse cx={cx} cy={0} rx={r} ry={r * 1.2 * blink} fill="#fff" stroke={INK} strokeWidth={3} />
          {blink === 1 && <circle cx={cx + px} cy={py} r={r * 0.45} fill={INK} />}
        </g>
      ))}
    </g>
  );
};

const Tag: React.FC<{
  x: number;
  y: number;
  w: number;
  h?: number;
  text: string;
  fill?: string;
  color?: string;
  size?: number;
  scale?: number;
  opacity?: number;
}> = ({ x, y, w, h = 64, text, fill = "#fff", color = INK, size = 34, scale = 1, opacity = 1 }) => {
  if (scale <= 0 || opacity <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={INK} strokeWidth={4} />
      <text
        x={0}
        y={2}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={FONT}
        fontWeight={900}
        fontSize={size}
        fill={color}
      >
        {text}
      </text>
    </g>
  );
};

const Cross: React.FC<{ x: number; y: number; scale: number }> = ({ x, y, scale }) =>
  scale <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle r={44} fill="#F43F5E" stroke={INK} strokeWidth={5} />
      <path d="M-18 -18 L18 18 M18 -18 L-18 18" stroke="#fff" strokeWidth={10} strokeLinecap="round" />
    </g>
  );

const waveTop = (x0: number, x1: number, y: number, amp: number, len: number, ph: number) => {
  const pts: string[] = [];
  let x = x0;
  while (x < x1) {
    pts.push(`${x} ${y + Math.sin(ph + (x / len) * Math.PI * 2) * amp}`);
    x += 12;
  }
  pts.push(`${x1} ${y + Math.sin(ph + (x1 / len) * Math.PI * 2) * amp}`);
  return "M " + pts.join(" L ");
};

const Water: React.FC<{
  x0: number;
  x1: number;
  y: number;
  bottom: number;
  t: number;
  opacity?: number;
  amp?: number;
  x1Bottom?: number;
}> = ({ x0, x1, y, bottom, t, opacity = 0.85, amp = 5, x1Bottom }) => {
  const top = waveTop(x0, x1, y, amp, 90, t * 2.2);
  return (
    <g opacity={opacity}>
      <path d={`${top} L ${x1Bottom ?? x1} ${bottom} L ${x0} ${bottom} Z`} fill="#38BDF8" />
      <path d={top} fill="none" stroke="#0369A1" strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

const Ship: React.FC<{ t: number }> = ({ t }) => (
  <g>
    {[0, 1, 2].map((i) => {
      const p = (t * 0.6 + i / 3) % 1;
      return (
        <circle
          key={i}
          cx={5 + p * 30}
          cy={-132 - p * 70}
          r={10 + p * 16}
          fill="#fff"
          stroke={INK}
          strokeWidth={3}
          opacity={1 - p}
        />
      );
    })}
    {/* المدخنة */}
    <rect x={-12} y={-124} width={34} height={50} rx={8} fill="#FACC15" stroke={INK} strokeWidth={4} />
    <rect x={-16} y={-132} width={42} height={14} rx={6} fill="#F43F5E" stroke={INK} strokeWidth={4} />
    {/* الحاويات */}
    <rect x={-122} y={-62} width={50} height={42} rx={6} fill="#38BDF8" stroke={INK} strokeWidth={4} />
    <rect x={-122} y={-104} width={50} height={42} rx={6} fill="#FB923C" stroke={INK} strokeWidth={4} />
    <rect x={62} y={-62} width={52} height={42} rx={6} fill="#10B981" stroke={INK} strokeWidth={4} />
    <rect x={62} y={-104} width={52} height={42} rx={6} fill="#A78BFA" stroke={INK} strokeWidth={4} />
    {/* الكابينة بعيون */}
    <rect x={-58} y={-92} width={112} height={72} rx={14} fill="#F8FAFC" stroke={INK} strokeWidth={4} />
    <Eyes x={-2} y={-62} gap={20} r={12} t={t} />
    <path d="M-14 -40 Q-2 -30 10 -40" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    {/* الهيكل */}
    <path
      d="M-138 -22 L138 -22 L112 30 Q106 38 96 38 L-96 38 Q-106 38 -112 30 Z"
      fill="#F43F5E"
      stroke={INK}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path d="M-132 -10 L132 -10" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
    {[-80, -40, 0, 40, 80].map((cx) => (
      <circle key={cx} cx={cx} cy={14} r={6} fill="#fff" stroke={INK} strokeWidth={3} />
    ))}
  </g>
);

const Engineer: React.FC<{ t: number }> = ({ t }) => {
  const wave = Math.sin(t * 6) * 8;
  return (
    <g>
      <rect x={-12} y={-12} width={10} height={14} rx={3} fill={INK} />
      <rect x={2} y={-12} width={10} height={14} rx={3} fill={INK} />
      <rect x={-14} y={-48} width={28} height={38} rx={8} fill="#38BDF8" stroke={INK} strokeWidth={4} />
      <path d={`M14 -40 L36 ${-62 + wave}`} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <circle cx={0} cy={-68} r={22} fill="#FDE68A" stroke={INK} strokeWidth={4} />
      <path d="M-24 -74 Q0 -104 24 -74 Z" fill="#FACC15" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <rect x={-29} y={-76} width={58} height={9} rx={4} fill="#FACC15" stroke={INK} strokeWidth={4} />
      <circle cx={-8} cy={-64} r={3} fill={INK} />
      <circle cx={8} cy={-64} r={3} fill={INK} />
      <path d="M-7 -55 Q0 -50 7 -55" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

/* ============================================================
   الخلفية (سماء + شمس بعيون + سحب + تلال)
   ============================================================ */
const Cloud: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => {
  const shapes = (
    <>
      <circle cx={0} cy={0} r={34} />
      <circle cx={40} cy={-16} r={44} />
      <circle cx={86} cy={0} r={34} />
      <rect x={-34} y={0} width={154} height={34} rx={17} />
    </>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g fill={INK} stroke={INK} strokeWidth={14}>
        {shapes}
      </g>
      <g fill="#fff">{shapes}</g>
    </g>
  );
};

const Background: React.FC<{ t: number }> = ({ t }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7DD3FC" />
        <stop offset="1" stopColor="#E0F2FE" />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill={INK} />
    <rect width={1080} height={1430} fill="url(#sky)" />
    {/* الشمس */}
    <g transform="translate(940 130)">
      <g transform={`rotate(${t * 20})`}>
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1={78}
            y1={0}
            x2={108}
            y2={0}
            stroke="#F59E0B"
            strokeWidth={10}
            strokeLinecap="round"
            transform={`rotate(${i * 30})`}
          />
        ))}
      </g>
      <circle r={64} fill="#FACC15" stroke={INK} strokeWidth={4} />
      <Eyes x={0} y={-6} gap={22} r={11} t={t} />
      <path d="M-18 24 Q0 40 18 24" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    </g>
    {/* السحب */}
    <Cloud x={((100 + t * 18) % 1400) - 250} y={420} s={0.9} />
    <Cloud x={((620 + t * 12) % 1400) - 250} y={560} s={0.7} />
    <Cloud x={((1000 + t * 24) % 1400) - 250} y={380} s={0.6} />
    {/* تلال بعيدة */}
    <path
      d="M0 1010 Q200 850 420 970 T820 920 T1080 990 L1080 1430 L0 1430 Z"
      fill="#86EFAC"
      stroke={INK}
      strokeWidth={4}
    />
  </svg>
);

/* ============================================================
   المشهد 1: بانوراما (من 0 إلى 23 ثانية)
   ============================================================ */
const MOUNT = "M 240 900 L 520 300 L 780 420 L 780 900 Z";

const Panorama: React.FC<{ t: number }> = ({ t }) => {
  const op = 1 - rampE(t, 23.0, 23.5);
  if (op <= 0) return null;

  // ارتفاع الجبل (حفر ثم رجوع)
  const ms = 1 - 0.78 * rampE(t, 13.5, 17.6) + 0.78 * rampE(t, 18.9, 19.4);

  // وضعية السفينة
  const bob = Math.sin(t * 2.4) * 4;
  let sx = 130;
  let sy = 720 + bob;
  let sr = 0;
  if (t < 21.25) {
    const lift = rampE(t, 19.3, 21.2);
    sx = 130 + 110 * lift;
    sy = 720 + bob - 210 * lift;
    sr = -22 * lift;
  } else {
    const dt = t - 21.25;
    const fall = Math.min(0.77, dt);
    const yy = Math.min(720, 510 + 0.5 * 700 * fall * fall);
    const k = ramp(dt, 0, 0.8);
    const sink = rampE(t, 22.2, 23.1);
    sx = 240 - 110 * k;
    sr = -22 * (1 - k) + 18 * sink;
    sy = yy + 70 * sink + (dt > 0.77 ? bob * 0.5 : 0);
  }

  // الونش والكابل
  const W = { x: 505, y: 282 };
  const ax = sx + 40;
  const ay = sy - 60;
  const winchOn = popScale(t, 19.3, 0.4);
  const snapM = { x: 392.5, y: 365 };
  const q = rampE(t, 21.25, 21.9);

  // السهم المنحني + علامة الاستفهام
  const arrowP = rampE(t, 3.5, 6.4);
  const arrowOp = 1 - rampE(t, 7.4, 7.9);

  // قطرة الماء التي لا تصعد
  const dropOn = t >= 10.9 && t < 13.4;
  const u = 0.3 + 0.26 * Math.sin(Math.PI * ramp(t, 10.9, 13.1));
  const dropX = 240 + 280 * u - 0.906 * 34;
  const dropY = 900 - 600 * u - 0.423 * 34;

  // رذاذ الغرق
  const splashP = ramp(t, 22.0, 22.8);

  return (
    <g opacity={op}>
      {/* الأرض */}
      <rect x={0} y={900} width={1080} height={200} fill="#C08457" stroke={INK} strokeWidth={4} />
      {[
        [120, 990, 26],
        [330, 1040, 18],
        [560, 975, 22],
        [800, 1050, 28],
        [980, 995, 16],
      ].map(([px, py, pr], i) => (
        <ellipse key={i} cx={px} cy={py} rx={pr} ry={pr * 0.6} fill="#A16207" stroke={INK} strokeWidth={3} />
      ))}

      {/* الجبل */}
      <g transform={`translate(0 900) scale(1 ${ms}) translate(0 -900)`}>
        <path d={MOUNT} fill="#D6A25F" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path
          d="M 478 392 L 520 300 L 556 321 L 538 352 L 512 336 L 496 360 Z"
          fill="#fff"
          stroke={INK}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <path
          d="M 380 640 l 30 -20 M 600 520 l 24 14 M 450 760 l 40 -10 M 660 700 l 36 -18"
          stroke="#A16207"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* غبار الحفر */}
      {t > 13.5 && t < 17.8 &&
        [0, 1, 2, 3, 4].map((i) => {
          const p = (t * 0.8 + i * 0.2) % 1;
          return (
            <circle
              key={i}
              cx={300 + i * 100}
              cy={880 - p * 120}
              r={14 + p * 22}
              fill="#E7E5E4"
              stroke={INK}
              strokeWidth={3}
              opacity={1 - p}
            />
          );
        })}

      {/* سد البحيرة العالية + البحيرة */}
      <rect x={768} y={410} width={24} height={490} fill="#D6A25F" stroke={INK} strokeWidth={4} />
      <Water x0={792} x1={1080} y={420} bottom={900} t={t} opacity={0.9} />

      {/* المهندس */}
      {t < 9.3 && (
        <g
          transform={`translate(740 401) scale(${1.1 * popScale(t, 0.3)})`}
          opacity={1 - rampE(t, 8.8, 9.3)}
        >
          <Engineer t={t} />
        </g>
      )}

      {/* السهم المنحني */}
      {arrowOp > 0 && arrowP > 0 && (
        <g opacity={arrowOp}>
          <path
            d="M 180 570 Q 520 40 900 330"
            fill="none"
            stroke="#F43F5E"
            strokeWidth={12}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${arrowP * 100} 100`}
          />
          {arrowP > 0.97 && (
            <g transform="translate(900 330) rotate(37.4)">
              <polygon points="0,0 -38,-22 -38,22" fill="#F43F5E" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            </g>
          )}
          {t > 5.3 && (
            <g transform={`translate(522 190) scale(${popScale(t, 5.3)})`}>
              <circle r={38} fill="#FACC15" stroke={INK} strokeWidth={4} />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={FONT}
                fontWeight={900}
                fontSize={56}
                fill={INK}
                y={3}
              >
                ؟
              </text>
            </g>
          )}
        </g>
      )}

      {/* الونش */}
      {winchOn > 0 && (
        <g transform={`translate(520 300) scale(${winchOn})`}>
          <rect x={-46} y={-60} width={92} height={60} rx={10} fill="#F97316" stroke={INK} strokeWidth={4} />
          <Eyes x={-4} y={-36} gap={16} r={9} t={t} />
          <g transform={`translate(54 -30) rotate(${t > 19.3 && t < 21.25 ? t * 300 : 0})`}>
            <circle r={16} fill="#E2E8F0" stroke={INK} strokeWidth={4} />
            <path d="M-16 0 L16 0 M0 -16 L0 16" stroke={INK} strokeWidth={4} />
          </g>
        </g>
      )}

      {/* الكابل */}
      {t >= 19.3 && t < 21.25 && (
        <line x1={W.x} y1={W.y} x2={ax} y2={ay} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      )}
      {t >= 21.25 && (
        <g stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none">
          <path
            d={`M ${W.x} ${W.y} L ${lerp(snapM.x, W.x - 10, q)} ${lerp(snapM.y, W.y + 130, q)}`}
          />
          <path d={`M ${ax} ${ay} L ${lerp(snapM.x, ax - 10, q)} ${lerp(snapM.y, ay - 90, q)}`} />
        </g>
      )}
      {t >= 21.25 && t < 21.7 && (
        <g
          transform={`translate(${snapM.x} ${snapM.y}) scale(${easeOut(ramp(t, 21.25, 21.7)) * 1.6})`}
          opacity={1 - ramp(t, 21.25, 21.7)}
        >
          <polygon
            points="0,-34 9,-11 33,-11 14,4 21,28 0,14 -21,28 -14,4 -33,-11 -9,-11"
            fill="#FACC15"
            stroke={INK}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* السفينة */}
      <g transform={`translate(${sx} ${sy}) rotate(${sr}) scale(0.9)`}>
        <Ship t={t} />
      </g>

      {/* ماء البحر الواطي (أمام السفينة) */}
      <Water x0={0} x1={324} y={720} bottom={900} x1Bottom={240} t={t} opacity={0.82} />

      {/* رذاذ الغرق */}
      {splashP > 0 && splashP < 1 &&
        [0, 1, 2, 3, 4, 5, 6].map((i) => {
          const a = -Math.PI + (i / 6) * Math.PI;
          return (
            <circle
              key={i}
              cx={135 + Math.cos(a) * 110 * splashP}
              cy={720 + Math.sin(a) * 130 * splashP + 160 * splashP * splashP}
              r={10}
              fill="#38BDF8"
              stroke={INK}
              strokeWidth={3}
              opacity={1 - splashP * splashP}
            />
          );
        })}

      {/* قطرة الماء التي ترفض الصعود */}
      {dropOn && (
        <g
          transform={`translate(${dropX} ${dropY}) scale(${popScale(t, 10.9, 0.3)})`}
          opacity={1 - rampE(t, 13.0, 13.4)}
        >
          <path
            d="M0 -30 C 20 -5 26 8 26 18 A26 26 0 0 1 -26 18 C -26 8 -20 -5 0 -30 Z"
            fill="#38BDF8"
            stroke={INK}
            strokeWidth={4}
          />
          <Eyes x={0} y={10} gap={10} r={6} t={t} />
        </g>
      )}
      {t >= 11.9 && t < 13.4 && (
        <g opacity={1 - rampE(t, 13.0, 13.4)}>
          <Cross x={300} y={470} scale={popScale(t, 11.9)} />
        </g>
      )}

      {/* وسم الوزن */}
      {t >= 8.85 && t < 13.5 && (
        <g
          transform={`translate(150 500) scale(${popScale(t, 8.85)})`}
          opacity={1 - rampE(t, 13.0, 13.4)}
        >
          <path d="M-18 40 L0 68 L18 40 Z" fill="#FACC15" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <rect x={-150} y={-42} width={300} height={84} rx={26} fill="#FACC15" stroke={INK} strokeWidth={4} />
          <path d="M-18 38 L18 38" stroke="#FACC15" strokeWidth={8} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={FONT}
            fontWeight={900}
            fontSize={42}
            fill={INK}
            y={2}
          >
            100 ألف طن
          </text>
        </g>
      )}

      {/* العملات والمليارات */}
      {t >= 16.7 && t < 19.2 && (
        <g opacity={1 - rampE(t, 18.8, 19.2)}>
          {[0, 1, 2, 3, 4].map((i) => {
            const p = ((t - 16.7) * 0.8 + i * 0.22) % 1;
            return (
              <g
                key={i}
                transform={`translate(${300 + i * 120} ${780 - p * 420})`}
                opacity={Math.min(1, p * 5) * (1 - p * 0.6)}
              >
                <circle r={26} fill="#FACC15" stroke={INK} strokeWidth={4} />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily={FONT}
                  fontWeight={900}
                  fontSize={32}
                  fill={INK}
                  y={2}
                >
                  $
                </text>
              </g>
            );
          })}
          <Tag
            x={540}
            y={200}
            w={280}
            text="مليارات!"
            fill="#F43F5E"
            color="#fff"
            size={40}
            scale={popScale(t, 16.7)}
          />
          <Cross x={540} y={480} scale={popScale(t, 17.8)} />
        </g>
      )}

      {/* وسوم المواقع */}
      <Tag x={130} y={810} w={210} text="بحر واطي" fill="#fff" size={34} scale={popScale(t, 3.6)} />
      <Tag x={935} y={640} w={250} text="بحيرة عالية" fill="#fff" size={34} scale={popScale(t, 4.3)} />
      <Tag
        x={560}
        y={640}
        w={150}
        text="جبل"
        fill="#fff"
        size={34}
        scale={popScale(t, 5.1)}
        opacity={1 - rampE(t, 13.3, 13.8)}
      />
    </g>
  );
};

/* ============================================================
   المشهد 2: الأهوسة (من 23 إلى 43 ثانية)
   ============================================================ */
const Gate: React.FC<{ x: number; off: number; op: number }> = ({ x, off, op }) => (
  <g transform={`translate(${x} ${off})`} opacity={op}>
    <rect x={0} y={380} width={28} height={520} rx={8} fill="#64748B" stroke={INK} strokeWidth={4} />
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={i} x={4} y={400 + i * 100} width={20} height={26} rx={5} fill="#FACC15" stroke={INK} strokeWidth={3} />
    ))}
  </g>
);

const LockScene: React.FC<{ t: number }> = ({ t }) => {
  const op = rampE(t, 23.0, 23.5) * (1 - rampE(t, 43.0, 43.5));
  if (op <= 0) return null;

  const floorIn = 1 - rampE(t, 23.3, 24.6);
  const gateOp = ramp(t, 24.4, 24.7);
  const wallOn = rampE(t, 24.2, 25.2);

  let lower = 520;
  if (t < 26.8) lower = 520 * (1 - rampE(t, 25.2, 26.3));
  else if (t < 29.6) lower = 520 * rampE(t, 26.8, 27.6);
  else lower = 520 * (1 - rampE(t, 29.6, 30.4));

  const upper = t < 39.2 ? 520 * (1 - rampE(t, 25.5, 26.6)) : 520 * rampE(t, 39.2, 40.0);

  const lvl = rampE(t, 34.4, 39.0);
  const yc = 720 - 300 * lvl;
  const chamberOn = rampE(t, 26.8, 27.6);

  let shipX = -220;
  if (t >= 27.8 && t < 40.9) shipX = lerp(-220, 560, easeOut(ramp(t, 27.8, 30.0)));
  if (t >= 40.9) shipX = 560 + 700 * rampE(t, 40.9, 43.3);
  const shipY = yc + Math.sin(t * 3) * 3;

  const valve = rampE(t, 31.4, 32.2);
  const flow = rampE(t, 32.2, 32.8);

  return (
    <g opacity={op} clipPath="url(#sceneClip)">
      <defs>
        <clipPath id="sceneClip">
          <rect x={0} y={0} width={1080} height={1100} />
        </clipPath>
      </defs>

      {/* جدار الحوض الخلفي */}
      <g opacity={wallOn}>
        <rect x={264} y={380} width={572} height={520} fill="#CBD5E1" stroke={INK} strokeWidth={4} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M 264 ${440 + i * 80} L 836 ${440 + i * 80}`} stroke="#94A3B8" strokeWidth={3} />
        ))}
      </g>

      {/* قاع البحر والبحيرة */}
      <rect x={0} y={900} width={236} height={200} fill="#E9C98C" stroke={INK} strokeWidth={4} />
      <rect x={864} y={900} width={216} height={200} fill="#E9C98C" stroke={INK} strokeWidth={4} />

      {/* السفينة */}
      <g transform={`translate(${shipX} ${shipY}) scale(0.9)`}>
        <Ship t={t} />
      </g>

      {/* المياه (أمام السفينة) */}
      <Water x0={0} x1={236} y={720} bottom={900} t={t} />
      <Water x0={864} x1={1080} y={420} bottom={900} t={t} />
      <g opacity={chamberOn}>
        <Water x0={264} x1={836} y={yc} bottom={900} t={t} />
        {t > 34.4 && t < 39.2 &&
          [0, 1, 2, 3, 4].map((i) => {
            const p = (t * 0.9 + i * 0.2) % 1;
            return (
              <circle
                key={i}
                cx={520 + (i - 2) * 9 + Math.sin(t * 5 + i) * 6}
                cy={900 - p * (900 - yc)}
                r={6}
                fill="#fff"
                stroke="#0369A1"
                strokeWidth={2}
                opacity={0.8}
              />
            );
          })}
      </g>

      {/* البوابات الحديدية */}
      <Gate x={236} off={lower} op={gateOp} />
      <Gate x={836} off={upper} op={gateOp} />

      {/* أرضية الهويس + المواسير */}
      <g transform={`translate(0 ${floorIn * 320})`}>
        <rect x={236} y={900} width={628} height={200} fill="#94A3B8" stroke={INK} strokeWidth={4} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path key={i} d={`M ${236 + i * 100} 900 L ${186 + i * 100} 1100`} stroke="#64748B" strokeWidth={3} />
        ))}
        {/* ماسورة المياه من البحيرة */}
        <rect x={520} y={935} width={390} height={50} rx={14} fill="#F1F5F9" stroke={INK} strokeWidth={4} />
        <rect x={504} y={900} width={32} height={40} fill={flow > 0 ? "#38BDF8" : "#F1F5F9"} stroke={INK} strokeWidth={3} />
        <rect x={872} y={900} width={36} height={40} fill={flow > 0 ? "#38BDF8" : "#F1F5F9"} stroke={INK} strokeWidth={3} />
        <g opacity={flow}>
          <rect x={526} y={941} width={378} height={38} rx={10} fill="#38BDF8" />
          <path
            d="M 900 960 L 526 960"
            stroke="#fff"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray="14 22"
            strokeDashoffset={t * 140}
          />
        </g>
        {/* المحبس */}
        <g transform={`translate(700 960)`}>
          <circle r={26} fill="#F59E0B" stroke={INK} strokeWidth={4} />
          <g transform={`rotate(${valve * 180})`}>
            <path d="M-20 0 L20 0 M0 -20 L0 20" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          </g>
        </g>
      </g>

      {/* وسوم */}
      <Tag x={110} y={830} w={200} text="بحر واطي" size={32} scale={popScale(t, 23.5)} />
      <Tag x={965} y={640} w={240} text="بحيرة عالية" size={32} scale={popScale(t, 23.7)} />
      <Tag
        x={250}
        y={335}
        w={250}
        text="بوابة حديد"
        fill="#FACC15"
        size={32}
        scale={popScale(t, 25.4)}
        opacity={1 - rampE(t, 28.0, 28.5)}
      />
      <Tag
        x={560}
        y={335}
        w={260}
        text="حوض عملاق"
        fill="#38BDF8"
        size={32}
        scale={popScale(t, 26.0)}
        opacity={1 - rampE(t, 28.0, 28.5)}
      />
      <Tag x={700} y={1045} w={140} text="محبس" fill="#F59E0B" size={30} scale={popScale(t, 31.5)} />
      <Tag x={460} y={1045} w={230} text="بالجاذبية" fill="#FACC15" size={30} scale={popScale(t, 33.8)} />

      {/* قياس 26 متر */}
      {t > 38.0 && (
        <g opacity={ramp(t, 38.0, 38.4)}>
          <path d="M 84 420 L 236 420 M 84 720 L 236 720" stroke={INK} strokeWidth={3} strokeDasharray="10 8" />
          <path d="M 84 430 L 84 710" stroke="#F43F5E" strokeWidth={7} strokeLinecap="round" />
          <polygon points="84,418 70,446 98,446" fill="#F43F5E" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <polygon points="84,722 70,694 98,694" fill="#F43F5E" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <Tag x={84} y={570} w={150} text="26 متر" fill="#FACC15" size={34} scale={popScale(t, 38.1)} />
        </g>
      )}

      {/* بدون موتور */}
      {t > 39.6 && (
        <g transform={`translate(540 190) scale(${popScale(t, 39.6)})`}>
          <rect x={-60} y={-34} width={120} height={68} rx={16} fill="#94A3B8" stroke={INK} strokeWidth={4} />
          <rect x={60} y={-12} width={26} height={24} rx={6} fill="#64748B" stroke={INK} strokeWidth={4} />
          <rect x={-78} y={-12} width={18} height={24} rx={6} fill="#64748B" stroke={INK} strokeWidth={4} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={FONT}
            fontWeight={900}
            fontSize={40}
            fill={INK}
            y={2}
          >
            M
          </text>
          <g transform="scale(0.9)">
            <circle r={52} fill="none" stroke="#F43F5E" strokeWidth={10} />
            <path d="M-36 -36 L36 36" stroke="#F43F5E" strokeWidth={10} strokeLinecap="round" />
          </g>
          <Tag x={0} y={96} w={280} text="من غير موتور" fill="#10B981" color="#fff" size={34} />
        </g>
      )}
    </g>
  );
};

/* ============================================================
   المشهد 3: نفق تحت البحر (من 43 ثانية للنهاية)
   ============================================================ */
const TunnelScene: React.FC<{ t: number }> = ({ t }) => {
  const op = rampE(t, 42.9, 43.5);
  if (op <= 0) return null;

  const tbmX = t < 43.4 ? 40 : 40 + 250 * (t - 43.4);
  const reveal = Math.min(tbmX, 1040);
  const tbmScale = popScale(t, 43.4, 0.5);

  const dots = t >= 45.8 && t < 47.0;
  const textOn = t >= 47.1;

  return (
    <g opacity={op}>
      <defs>
        <clipPath id="revealClip">
          <rect x={0} y={700} width={reveal} height={400} />
        </clipPath>
      </defs>

      {/* التربة تحت البحر */}
      <rect x={0} y={700} width={1080} height={400} fill="#E9C98C" stroke={INK} strokeWidth={4} />
      <rect x={0} y={760} width={1080} height={340} fill="#C08457" />
      {[
        [140, 1040, 22],
        [420, 1060, 16],
        [760, 1030, 24],
        [960, 1060, 18],
      ].map(([px, py, pr], i) => (
        <ellipse key={i} cx={px} cy={py} rx={pr} ry={pr * 0.6} fill="#A16207" stroke={INK} strokeWidth={3} />
      ))}

      {/* النفق (يظهر مع تقدم آلة الحفر) */}
      <g clipPath="url(#revealClip)">
        <rect x={40} y={790} width={1000} height={180} rx={70} fill="#94A3B8" stroke={INK} strokeWidth={4} />
        <rect x={64} y={812} width={952} height={136} rx={52} fill="#F1F5F9" stroke={INK} strokeWidth={4} />
        <rect x={100} y={916} width={880} height={24} rx={10} fill="#475569" />
        {Array.from({ length: 8 }).map((_, i) => (
          <circle
            key={i}
            cx={140 + i * 130}
            cy={834}
            r={9}
            fill="#FACC15"
            stroke={INK}
            strokeWidth={3}
            opacity={0.7 + 0.3 * Math.sin(t * 4 + i)}
          />
        ))}
      </g>

      {/* آلة الحفر */}
      {tbmScale > 0 && (
        <g transform={`translate(${tbmX} 880) scale(${tbmScale})`}>
          <rect x={-175} y={50} width={160} height={22} rx={10} fill={INK} />
          <rect x={-170} y={-62} width={150} height={118} rx={22} fill="#FACC15" stroke={INK} strokeWidth={4} />
          <polygon points="-20,-62 64,0 -20,56" fill="#F97316" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={4 + k * 6} cy={Math.sin(t * 10 + k * 2) * 20} r={5} fill="#fff" stroke={INK} strokeWidth={2} />
          ))}
          <Eyes x={-96} y={-8} gap={26} r={15} t={t} />
          <path d="M-112 26 Q-96 40 -80 26" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </g>
      )}

      {/* البحر + سفينة صغيرة */}
      <g transform="translate(820 340) scale(0.5)">
        <g transform={`translate(0 ${Math.sin(t * 2.4) * 6})`}>
          <Ship t={t} />
        </g>
      </g>
      <Water x0={0} x1={1080} y={340} bottom={700} t={t} opacity={0.88} />
      <Tag x={300} y={560} w={270} text="تحت البحر" fill="#0EA5E9" color="#fff" size={34} scale={popScale(t, 43.6)} />

      {/* فقاعة تعليق: نفق */}
      {t >= 45.8 && (
        <g transform={`translate(540 150) scale(${popScale(t, 45.8, 0.5)})`}>
          <polygon points="-20,66 10,66 -10,110" fill="#fff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <rect x={-190} y={-70} width={380} height={140} rx={40} fill="#fff" stroke={INK} strokeWidth={5} />
          <path d="M-22 66 L10 66" stroke="#fff" strokeWidth={9} />
          {dots &&
            [-50, 0, 50].map((cx, i) => (
              <circle key={i} cx={cx} cy={Math.sin(t * 9 + i * 1.3) * -8} r={12} fill={INK} />
            ))}
          {textOn && (
            <g transform={`scale(${popScale(t, 47.1, 0.4)})`}>
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={FONT}
                fontWeight={900}
                fontSize={96}
                fill="#F43F5E"
                y={4}
              >
                نفق
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
};

/* ============================================================
   شريط الحالة العلوي (Pill) عند y = 220
   ============================================================ */
const PHASES = [
  { t: 0, text: "لو إنت المهندس...", bg: "#FACC15", fg: INK },
  { t: 3.47, text: "نقل سفينة فوق جبل", bg: "#FACC15", fg: INK },
  { t: 7.3, text: "المشكلة؟", bg: "#F43F5E", fg: "#fff" },
  { t: 13.33, text: "لو حفرنا القناة", bg: "#F43F5E", fg: "#fff" },
  { t: 18.99, text: "لو رفعناها بونش", bg: "#F43F5E", fg: "#fff" },
  { t: 23.11, text: "الحل: أسانسير مية", bg: "#10B981", fg: "#fff" },
  { t: 35.21, text: "المية بترفع السفينة", bg: "#38BDF8", fg: INK },
  { t: 43.17, text: "عايز تعرف أكتر؟", bg: "#FACC15", fg: INK },
  { t: 45.77, text: "اكتب: نفق", bg: "#FACC15", fg: INK },
];

const Pill: React.FC<{ t: number }> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = PHASES.reduce((acc, p, i) => (t >= p.t ? i : acc), 0);
  const ph = PHASES[idx];
  const s = spring({
    frame: frame - Math.round(ph.t * fps),
    fps,
    config: { damping: 11, stiffness: 160 },
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 220,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${Math.max(0.01, s)})`,
          background: ph.bg,
          color: ph.fg,
          border: `4px solid ${INK}`,
          borderRadius: 40,
          padding: "14px 48px",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 54,
          boxShadow: `0 8px 0 ${INK}`,
          direction: "rtl",
          whiteSpace: "nowrap",
        }}
      >
        {ph.text}
      </div>
    </div>
  );
};

/* ============================================================
   ترجمة الكاريوكي عند y = 1550
   ============================================================ */
const Captions: React.FC<{ t: number }> = ({ t }) => {
  const chunk = CHUNKS.find((c) => t >= c.start && t < c.end);
  if (!chunk) return null;
  const s = popScale(t, chunk.start, 0.25);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 1550,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 22,
        padding: "0 40px",
        direction: "rtl",
        transform: `translateY(-50%) scale(${0.85 + 0.15 * s})`,
      }}
    >
      {chunk.words.map((w, i) => {
        const active = t >= w.start && t < w.end;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: FONT,
              fontSize: 78,
              fontWeight: 900,
              lineHeight: 1.3,
              color: active ? "#FACC15" : "#FFFFFF",
              WebkitTextStroke: "8px #000",
              paintOrder: "stroke fill",
              transform: `scale(${active ? 1.12 : 1})`,
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

/* ============================================================
   المكوّن الرئيسي
   ============================================================ */
export const ExplainerVideo: React.FC = () => {
  useCairo();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: INK, overflow: "hidden" }}>
      <Audio src={import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
 } volume={1} />
      <Sfx />
      <Background t={t} />
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <g transform={`translate(0 ${SCENE_Y})`}>
          <Panorama t={t} />
          <LockScene t={t} />
          <TunnelScene t={t} />
        </g>
      </svg>
      <Pill t={t} />
      <Captions t={t} />
    </AbsoluteFill>
  );
};
