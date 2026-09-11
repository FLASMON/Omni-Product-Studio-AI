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
  // The idle viewport is deliberately frameless: no card, no border — the page
  // backdrop itself is the stage, with everything centred on both axes.
  const idle = !generating && appState !== 'VIDEO_READY' && !hasError;

  return (
    <div
      id="video-viewport-container"
      className={`w-full relative flex items-center justify-center transition-all duration-300 ${
        hasError
          ? 'min-h-[260px] h-auto py-8 px-6 rounded-2xl border border-red-200 bg-zinc-950 shadow-2xl shadow-black/50 dark:border-red-900/60'
          : idle
          ? 'min-h-[420px] md:h-full md:min-h-0'
          : generating
          ? '' /* the pipeline is its own card, sized to its content */
          : 'aspect-video overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50'
      }`}
    >
      {/* HUD CORNER BRACKETS FOR CINEMATIC STUDIO LOOK */}
      {!hasError && !idle && !generating && (
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
        /* GENERATION PIPELINE VIEW — a card in the normal flow: the log rail
           decides the height, so nothing is ever clipped by the player frame. */
        <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-8 shadow-2xl shadow-black/50 md:py-10">
          {/* Soft radial glow behind the pipeline */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(230,0,35,0.05),transparent_65%)] pointer-events-none" />

          <div className="relative flex min-w-0 flex-col items-center gap-4">
          {/* Spinning conic ring + breathing amber core */}
          <div className="relative shrink-0 pulse-glow rounded-full">
            <div className="w-14 h-14 rounded-full conic-spin"
              style={{ background: 'conic-gradient(from 0deg, rgba(230,0,35,0) 0%, #e60023 25%, rgba(230,0,35,0) 45%)' }}
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
          <div className="relative flex w-full min-w-0 max-w-md items-center gap-1.5 px-1">
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

          <div className="relative w-full min-w-0 max-w-md max-h-72 space-y-1.5 overflow-y-auto overflow-x-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 text-left font-mono text-[11px] shadow-inner thin-scrollbar">
            {recentLogs.map((log) => (
              <div key={log.id} className={`log-enter min-w-0 ${logColor(log.type)}`}>
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="shrink-0 font-bold text-zinc-600">›</span>
                  <span className="min-w-0 truncate">{log.message}</span>
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
        </div>
      ) : (
        /* EMPTY STATE / AWAITING RENDER VIEWPORT — frameless, centred, calm */
        <div id="empty-state-viewport" className="relative z-10 flex w-full max-w-xl flex-col items-center justify-center px-6 py-10 text-center">
          {/* Ambient light behind the whole block */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(230,0,35,0.07),transparent_68%)]" />

          {/* Status line */}
          <div className="mb-9 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.28em] text-zinc-600">
            <span className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${readyToGenerate ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'}`} />
              {readyToGenerate ? 'Standby · ready' : 'Inputs pending'}
            </span>
            <span className="text-zinc-800">/</span>
            <span>16:9</span>
            <span className="text-zinc-800">/</span>
            <span>1080p</span>
          </div>

          {/* Aperture badge with a soft halo */}
          <div className="relative mb-8">
            <span
              className={`absolute -inset-3 rounded-full blur-2xl transition-colors duration-500 ${
                readyToGenerate ? 'bg-emerald-400/15' : 'bg-white/[0.05]'
              }`}
            />
            <span className="relative grid h-20 w-20 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
              <Film className="h-8 w-8 text-zinc-400" />
            </span>
          </div>

          <h3 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
            Your stage is empty
          </h3>
          <p className="mt-2.5 max-w-md text-sm leading-relaxed text-zinc-400">
            Add a product reference and an atmosphere in the builder, then generate — your cinematic render lands right here.
          </p>

          {/* Input checklist — soft filled chips, no outlines */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-medium transition-all duration-300 ${
              hasProduct ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/[0.12] dark:text-emerald-300' : 'bg-white/[0.04] text-zinc-500'
            }`}>
              {hasProduct ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5 text-zinc-600" />}
              <span>Product reference</span>
            </div>

            <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-medium transition-all duration-300 ${
              hasAtmosphere ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/[0.12] dark:text-emerald-300' : 'bg-white/[0.04] text-zinc-500'
            }`}>
              {hasAtmosphere ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5 text-zinc-600" />}
              <span>Atmosphere scene</span>
            </div>
          </div>

          {/* Error Banner when failure occurs */}
          {lastLog?.type === 'error' && (
            <div id="render-error-card" className="mt-6 flex w-full items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-left shadow-lg shadow-red-950/5 dark:border-red-500/40 dark:bg-red-950/40 dark:shadow-red-950/20">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <div className="flex-1 min-w-0">
                <span className="mb-0.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Notice
                </span>
                <p className="font-mono text-xs leading-relaxed text-red-700 break-words dark:text-red-200">
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