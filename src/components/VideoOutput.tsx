import React from 'react';
import { AlertTriangle, Film, CheckCircle2, Circle, Clapperboard } from 'lucide-react';

type AppState = 'IDLE' | 'GENERATING_ATMOSPHERE' | 'GENERATING_PROMPT' | 'GENERATING_VIDEO' | 'VIDEO_READY';
type LogType = 'info' | 'success' | 'warn' | 'error';
interface LogEntry { id: string; message: string; type: LogType; image?: string }

interface VideoOutputProps {
  appState: AppState;
  videoUrl: string | null;
  logs: LogEntry[];
  hasProduct?: boolean;
  hasAtmosphere?: boolean;
  /** CSS filter string from the post-production panel, applied to the player. */
  gradeFilter?: string;
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
  gradeFilter,
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
          ? 'min-h-[260px] h-auto py-8 px-6 border-red-900/60 bg-zinc-950 shadow-2xl shadow-black/50'
          : 'aspect-video overflow-hidden border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50'
      }`}
    >
      {/* HUD CORNER BRACKETS FOR CINEMATIC STUDIO LOOK */}
      {!hasError && (
        <>
          <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-white/20 rounded-tl-sm pointer-events-none transition-colors duration-500" />
          <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-white/20 rounded-tr-sm pointer-events-none transition-colors duration-500" />
          <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-white/20 rounded-bl-sm pointer-events-none transition-colors duration-500" />
          <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-white/20 rounded-br-sm pointer-events-none transition-colors duration-500" />
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
          style={{ filter: gradeFilter || undefined }}
          className="w-full h-full object-contain bg-black rounded-2xl"
        />
      ) : generating ? (
        /* GENERATION PIPELINE VIEW */
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 py-8 overflow-hidden bg-zinc-950/95 backdrop-blur-md">
          {/* Soft radial glow behind the pipeline */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.045),transparent_65%)] pointer-events-none" />

          {/* Spinning conic ring + breathing amber core */}
          <div className="relative shrink-0 pulse-glow rounded-full">
            <div className="w-14 h-14 rounded-full conic-spin"
              style={{ background: 'conic-gradient(from 0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 25%, rgba(255,255,255,0) 45%)' }}
            >
              <div className="absolute inset-[3px] rounded-full bg-zinc-950" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-zinc-100" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>

          <div className="relative font-mono text-xs uppercase tracking-widest text-zinc-100 font-bold shrink-0">
            {appState === 'GENERATING_ATMOSPHERE' ? 'Synthesizing Atmosphere' : appState === 'GENERATING_PROMPT' ? 'Translating Prompt Directive' : 'Rendering Cinematic Video'}
            <span className="block text-center text-[9px] font-normal text-zinc-500 tracking-[0.3em] mt-1">PLEASE WAIT</span>
          </div>

          {/* Pipeline progress rail — three stages mirror the app state */}
          <div className="relative w-full max-w-md flex items-center gap-1.5 px-1">
            {(['GENERATING_ATMOSPHERE', 'GENERATING_PROMPT', 'GENERATING_VIDEO'] as const).map((stage, i) => {
              const stageOrder = ['GENERATING_ATMOSPHERE', 'GENERATING_PROMPT', 'GENERATING_VIDEO'];
              const currentIdx = stageOrder.indexOf(appState);
              const done = currentIdx > i;
              const active = currentIdx === i;
              const unreachable = currentIdx === -1;
              return (
                <React.Fragment key={stage}>
                  {i > 0 && <span className={`h-px w-2 shrink-0 ${done || active ? 'bg-white/40' : 'bg-zinc-800'}`} />}
                  <span
                    title={stage === 'GENERATING_ATMOSPHERE' ? 'Atmosphere' : stage === 'GENERATING_PROMPT' ? 'Prompt' : 'Video render'}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      done ? 'bg-emerald-400/70' : active ? 'bg-white shimmer' : unreachable ? 'bg-zinc-800' : 'bg-zinc-800'
                    }`}
                  />
                </React.Fragment>
              );
            })}
          </div>

          <div className="relative w-full max-w-md min-h-0 space-y-1.5 font-mono text-[11px] text-left p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shadow-inner">
            {recentLogs.map((log) => (
              <div key={log.id} className={`log-enter ${logColor(log.type)}`}>
                <div className="truncate flex items-center gap-1.5">
                  <span className="text-zinc-600 font-bold">›</span>
                  <span>{log.message}</span>
                </div>
                {log.image && (
                  <img
                    src={log.image}
                    alt="Generated atmosphere reference"
                    className="mt-2.5 h-36 md:h-44 w-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg"
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
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6 text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
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
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-lg shadow-black/40 mb-5">
            <Film className="w-7 h-7 text-zinc-400" />
          </div>

          <h3 className="font-mono text-sm uppercase tracking-wider text-zinc-100 font-bold mb-2">
            Cinematic Viewport
          </h3>
          <p className="font-mono text-xs text-zinc-400 leading-relaxed max-w-sm mb-7">
            Configure your product reference photo and atmosphere in the left builder panel to generate your video sequence.
          </p>

          {/* Dynamic input checklist */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
            <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[11px] font-mono transition-all ${
              hasProduct
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-white/[0.03] border-zinc-800 text-zinc-500'
            }`}>
              {hasProduct ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Circle className="w-3.5 h-3.5 text-zinc-600" />}
              <span>Product Image</span>
            </div>

            <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[11px] font-mono transition-all ${
              hasAtmosphere
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-white/[0.03] border-zinc-800 text-zinc-500'
            }`}>
              {hasAtmosphere ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Circle className="w-3.5 h-3.5 text-zinc-600" />}
              <span>Atmosphere Scene</span>
            </div>
          </div>

          {/* Error Banner when failure occurs */}
          {lastLog?.type === 'error' && (
            <div id="render-error-card" className="mt-6 w-full flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3.5 text-left shadow-lg shadow-red-950/20">
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