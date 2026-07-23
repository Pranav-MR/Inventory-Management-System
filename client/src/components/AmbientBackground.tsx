import type { CSSProperties } from 'react';

const DIAGONAL_GRID_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><g fill='none' stroke-width='1'>" +
  "<path d='M0 0 L120 120' stroke='rgba(56,130,246,0.16)'/><path d='M0 120 L120 0' stroke='rgba(34,211,238,0.12)'/>" +
  "<path d='M0 60 L60 0' stroke='rgba(56,130,246,0.1)'/><path d='M60 120 L120 60' stroke='rgba(34,211,238,0.1)'/>" +
  "</g></svg>";
const DIAGONAL_GRID_URL = `url("data:image/svg+xml,${encodeURIComponent(DIAGONAL_GRID_SVG)}")`;

const DIAGONAL_GRID_SVG_BLACK =
  "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><g fill='none' stroke-width='1'>" +
  "<path d='M0 0 L120 120' stroke='rgba(0,0,0,0.16)'/><path d='M0 120 L120 0' stroke='rgba(0,0,0,0.13)'/>" +
  "<path d='M0 60 L60 0' stroke='rgba(0,0,0,0.09)'/><path d='M60 120 L120 60' stroke='rgba(0,0,0,0.09)'/>" +
  "</g></svg>";
const DIAGONAL_GRID_URL_BLACK = `url("data:image/svg+xml,${encodeURIComponent(DIAGONAL_GRID_SVG_BLACK)}")`;

function blob(style: CSSProperties): CSSProperties {
  return { position: 'absolute', borderRadius: '9999px', mixBlendMode: 'screen', pointerEvents: 'none', ...style };
}

export const loginBlobs: CSSProperties[] = [
  blob({ top: -100, left: -80, width: 520, height: 520, background: 'radial-gradient(circle,rgba(74,222,128,0.4),transparent 70%)', filter: 'blur(10px)', animation: 'drift 22s ease-in-out infinite alternate' }),
  blob({ bottom: -140, right: -100, width: 600, height: 600, background: 'radial-gradient(circle,rgba(34,211,238,0.35),transparent 70%)', filter: 'blur(10px)', animation: 'drift2 26s ease-in-out infinite alternate' }),
  blob({ top: '40%', left: '55%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(16,185,129,0.35),transparent 70%)', filter: 'blur(20px)', animation: 'drift 18s ease-in-out infinite alternate' }),
];

export function AmbientBackground({ blobs }: { blobs: CSSProperties[] }) {
  return (
    <div className="bg-background pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="hidden dark:block">
        {blobs.map((style, i) => (
          <div key={i} style={style} />
        ))}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: DIAGONAL_GRID_URL,
            backgroundSize: '120px 120px',
            backgroundRepeat: 'repeat',
            mixBlendMode: 'screen',
            animation: 'topoDrift 30s linear infinite',
          }}
        />
      </div>
      <div
        className="absolute -top-24 -right-10 h-[520px] w-[520px] rounded-full dark:hidden"
        style={{ background: 'radial-gradient(circle,rgba(74,222,128,0.14),transparent 70%)' }}
      />
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundImage: DIAGONAL_GRID_URL_BLACK,
          backgroundSize: '120px 120px',
          backgroundRepeat: 'repeat',
          animation: 'topoDrift 30s linear infinite',
        }}
      />
    </div>
  );
}
