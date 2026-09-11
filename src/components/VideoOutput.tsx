import React from 'react';
import { Loader2, AlertTriangle, Film, CheckCircle2, Circle, Sparkles, Video, Play } from 'lucide-react';

type AppState = 'IDLE' | 'GENERATING_ATMOSPHERE' | 'GENERATING_PROMPT' | 'GENERATING_VIDEO' | 'VIDEO_READY';
type LogType = 'info' | 'success' | 'warn' | 'error';
interface LogEntry { id: string; message: string; type: LogType; image?: string }

interface VideoOutputProps {
  appState: AppState;
  videoUrl: string | null;
  logs: LogEntry[];
  hasProduct?: boolean;
  hasAtmosphere?: boolean;
}

const logColor = (type: LogType) =>
  type === 'error' ? 'text-red-400' :
  type === 'warn' ? 'text-amber-400' :
  type === 'success' ? 'text-emerald-400' :
  'text-zinc-400';

// Errors often arrive as a raw API payload, e.g.
// `Error: 400 {"error":{"message":"...","code":"..."}}`. Pull out the
// human-readable message so we don't dump JSON at the user.
const readableError = (raw: string): string => {
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      const message = parsed?.error?.message ?? parsed?.message;
      if (typeof message === 'string' && message.trim()) return message;
    } catch {
      // fall through to the raw string
    }
  }
  return raw.replace(/^Error:\s*/, '').trim();
};

export function VideoOutput({
  appState,
  videoUrl,
  logs,
  hasProduct = false,
  hasAtmosphere = false,
}: VideoOutputProps) {
  const generating = appState === 'GENERATING_ATMOSPHERE' || appState === 'GENERATING_PROMPT' || appState === 'GENERATING_VIDEO';
  const lastLog = logs[logs.length - 1];
  const recentLogs = logs.slice(-6);
  const hasError = lastLog?.type === 'error';
  const readyToGenerate = hasProduct && hasAtmosphere;

  return (
    <div
      id="video-viewport-container"
      className={`w-full relative flex items-center justify-center transition-all duration-300 rounded-2xl border ${
        hasError
          ? 'min-h-[260px] h-auto py-8 px-6 border-red-950/60 bg-zinc-950/90 shadow-2xl'
          : 'aspect-video overflow-hidden border-zinc-800/80 bg-zinc-950/70 shadow-2xl shadow-black/50'
      }`}
    >
      {/* HUD CORNER BRACKETS FOR CINEMATIC STUDIO LOOK */}
      {!hasError && (
        <>
          <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-zinc-700/60 pointer-events-none" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-zinc-700/60 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-zinc-700/60 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-zinc-700/60 pointer-events-none" />
        </>
      )}

      {appState === 'VIDEO_READY' && videoUrl ? (
        <video
          id="rendered-video-player"
          // Omni always returns audio and offers no way to disable it; mute on
          // playback. Set via ref too — React's `muted` prop alone is unreliable.
          ref={(el) => { if (el) el.muted = true; }}
          src={videoUrl}
          controls
          controlsList="nodownload"
          autoPlay
          loop
          playsInline
          muted
          className="w-full h-full object-contain bg-black rounded-2xl"
        />
      ) : generating ? (
        /* GENERATION PIPELINE VIEW */
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 px-6 py-8 overflow-hidden bg-zinc-950/90 backdrop-blur-sm">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-zinc-200 animate-spin" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>

          <div className="font-mono text-xs uppercase tracking-widest text-zinc-100 font-bold shrink-0">
            {appState === 'GENERATING_ATMOSPHERE' ? 'Synthesizing Atmosphere' : appState === 'GENERATING_PROMPT' ? 'Translating Prompt Directive' : 'Rendering Cinematic Video'}
          </div>

          <div className="w-full max-w-md min-h-0 space-y-1.5 font-mono text-[11px] text-left p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            {recentLogs.map((log) => (
              <div key={log.id} className={logColor(log.type)}>
                <div className="truncate flex items-center gap-1.5">
                  <span className="text-zinc-600 font-bold">›</span>
                  <span>{log.message}</span>
                </div>
                {log.image && (
                  <img
                    src={log.image}
                    alt="Generated atmosphere reference"
                    className="mt-2.5 h-36 md:h-44 w-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-md"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* EMPTY STATE / AWAITING RENDER VIEWPORT */
        <div id="empty-state-viewport" className="flex flex-col items-center justify-center text-center px-6 w-full max-w-lg relative z-10 py-6">
          {/* Top HUD indicator */}
          <div className="flex items-center gap-3 mb-5 text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${readyToGenerate ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              {readyToGenerate ? 'STANDBY • READY' : 'INPUTS PENDING'}
            </span>
            <span className="text-zinc-700">|</span>
            <span>16:9 • 1080P</span>
            <span className="text-zinc-700">|</span>
            <span>00:00:00:00</span>
          </div>

          {/* Central camera / film aperture badge */}
          <div className="w-14 h-14 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center shadow-lg shadow-black/40 text-zinc-400 mb-4 group hover:border-zinc-700 transition-colors">
            <Film className="w-6 h-6 text-zinc-300" />
          </div>

          <h3 className="font-mono text-sm uppercase tracking-wider text-zinc-100 font-bold mb-1.5">
            Cinematic Viewport
          </h3>
          <p className="font-mono text-xs text-zinc-400 leading-relaxed max-w-sm mb-6">
            Configure your product reference photo and atmosphere in the left builder panel to generate your video sequence.
          </p>

          {/* Dynamic input checklist */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-mono transition-all ${
              hasProduct
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-500'
            }`}>
              {hasProduct ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Circle className="w-3.5 h-3.5 text-zinc-600" />}
              <span>Product Image</span>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-mono transition-all ${
              hasAtmosphere
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-500'
            }`}>
              {hasAtmosphere ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Circle className="w-3.5 h-3.5 text-zinc-600" />}
              <span>Atmosphere Scene</span>
            </div>
          </div>

          {/* Error Banner when failure occurs */}
          {lastLog?.type === 'error' && (
            <div id="render-error-card" className="mt-5 w-full flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-left shadow-lg">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[10px] uppercase tracking-wider text-red-400 font-bold block mb-0.5">
                  Notice
                </span>
                <p className="font-mono text-xs leading-relaxed text-red-200 break-words">
                  {readableError(lastLog.message)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}