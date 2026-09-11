import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ArrowRight, ChevronRight, Download, Wand2, SlidersHorizontal, Sparkles, Clapperboard, Film, History, X, Sun, Moon } from 'lucide-react';
import { PRODUCTS, ATMOSPHERES, MediaSelection } from './data.js';
import { ImageUploader } from './components/ImageUploader.js';
import { VideoOutput } from './components/VideoOutput.js';
import { ScrollRow } from './components/ScrollRow.js';
import { PostPanel } from './components/PostPanel.js';
import { VideoGrades, DEFAULT_GRADES, buildGradeFilter } from './filters.js';
import { captureVideoFrame } from './videoFrame.js';
import { AppSidebar, PageHeading, AppPage } from './components/AppSidebar.js';
import { Theme, readTheme, applyTheme } from './theme.js';
import { MediaLibrary, LibraryItem, LibraryAction } from './components/MediaLibrary.js';
import { STOCK_VIDEOS, STOCK_CATEGORY_LABEL, FILTER_PREVIEW_STILL } from './stockVideos.js';
import { toInlineImages, InlineImage } from './images.js';

type LogType = 'info' | 'success' | 'warn' | 'error';
type AppState = 'IDLE' | 'GENERATING_ATMOSPHERE' | 'GENERATING_PROMPT' | 'GENERATING_VIDEO' | 'VIDEO_READY';

interface VideoVersion {
  label: string;          // 'V1', 'V2', ...
  interactionId: string;  // Omni interaction id — chained from for edits
  videoUrl: string;
  prompt: string;         // the cinematic directive (V1) or the edit instructions
}

// Label shown next to the brand in the header for the active page.
const PAGE_TITLE: Record<AppPage, string> = {
  studio: 'Studio',
  media: 'Media Library',
  renders: 'Renders',
};

export default function App() {
  // Top-level page: the builder, the stock media library, or this session's renders.
  const [page, setPage] = useState<AppPage>('studio');

  const [product, setProduct] = useState<MediaSelection | null>(null);
  const [atmosphere, setAtmosphere] = useState<MediaSelection | null>(null);
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [submittedImages, setSubmittedImages] = useState<string[]>([]);

  // "Generate your own atmosphere": a setting the user types instead of picking
  // or uploading an atmosphere image. On submit it's expanded by Flash Lite and
  // rendered by the image model, then fed into the video pipeline as the reference.
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');

  const [versions, setVersions] = useState<VideoVersion[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const versionCount = useRef(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [promptOpen, setPromptOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Dark (default) or light studio theme — persisted, applied on <html>.
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => { applyTheme(theme); }, [theme]);

  // Desktop-only: collapses the builder panel to a slim rail. Mobile keeps the
  // stacked layout and ignores this state entirely.
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Right post-production panel (desktop): open by default, collapsible.
  const [postOpen, setPostOpen] = useState(true);

  // Live video grade — lighting, color correction and filter presets. Pure
  // client-side CSS filters; the underlying renders are never modified.
  const [grades, setGrades] = useState<VideoGrades>({ ...DEFAULT_GRADES });

  // A still from the current render, used to preview every filter look. Until a
  // video exists the panel previews the looks on a license-free stock still.
  const [filterPreview, setFilterPreview] = useState<string | null>(null);

  // Mobile-only bottom sheet holding the grade + filter panel.
  const [sheetOpen, setSheetOpen] = useState(false);

  const [logs, setLogs] = useState<{ id: string; timestamp: string; message: string; type: LogType; image?: string }[]>([]);

  const addLog = (message: string, type: LogType = 'info', image?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString().split('T')[1].substring(0, 12),
      message,
      type,
      image
    }]);
  };

  const describe = (sel: MediaSelection) => sel.description || `${sel.images.length} uploaded image${sel.images.length > 1 ? 's' : ''}`;

  // Typing a setting is an alternative to picking/uploading an atmosphere image.
  const usingGenerate = !atmosphere && generatePrompt.trim().length > 0;
  const hasAtmosphere = !!atmosphere || usingGenerate;

  // Choosing a suggestion or uploading supersedes a typed prompt — clear it so the
  // two paths never both feed submit. Updater-form calls only touch an existing
  // selection (by which point generate is already cleared), so ignore those.
  const selectAtmosphere: React.Dispatch<React.SetStateAction<MediaSelection | null>> = (value) => {
    setAtmosphere(value);
    if (typeof value !== 'function' && value) {
      setGenerateOpen(false);
      setGeneratePrompt('');
    }
  };

  const isGenerating = appState === 'GENERATING_ATMOSPHERE' || appState === 'GENERATING_PROMPT' || appState === 'GENERATING_VIDEO';
  const canSubmit = !!product && hasAtmosphere && !isGenerating;

  // Explains why the submit button is unavailable (shown as a tooltip).
  const submitHint = isGenerating
    ? 'Generating your video — please wait'
    : !product && !hasAtmosphere
    ? 'Add a product image and an atmosphere to start'
    : !product
    ? 'Add a product image to start'
    : !hasAtmosphere
    ? 'Add an atmosphere to start'
    : undefined;

  // Nothing rendered and nothing broken yet → the frameless empty stage.
  const idleStage = appState === 'IDLE' && logs[logs.length - 1]?.type !== 'error';

  const selected = versions.find(v => v.label === selectedLabel) ?? null;
  const otherVersions = versions.filter(v => v.label !== selectedLabel);
  const gradeFilter = buildGradeFilter(grades);

  // Keep the filter thumbnails showing the footage they will actually grade.
  const selectedUrl = selected?.videoUrl ?? null;
  useEffect(() => {
    if (!selectedUrl) {
      setFilterPreview(null);
      return;
    }
    let cancelled = false;
    captureVideoFrame(selectedUrl)
      .then(frame => { if (!cancelled) setFilterPreview(frame); })
      .catch(() => { if (!cancelled) setFilterPreview(null); });
    return () => { cancelled = true; };
  }, [selectedUrl]);

  // Lock the page behind the mobile grade sheet.
  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [sheetOpen]);

  // ── Media library sources ────────────────────────────────────────────────
  // The curated stock footage, normalised into the library card shape.
  const stockItems: LibraryItem[] = useMemo(
    () =>
      STOCK_VIDEOS.map(v => ({
        id: `stock-${v.id}`,
        title: v.title,
        subtitle: v.tags.join(' · '),
        category: STOCK_CATEGORY_LABEL[v.category],
        keywords: v.tags,
        poster: v.poster,
        src: v.src,
        downloadUrl: v.download,
        badge: v.res,
      })),
    [],
  );

  // Everything rendered this session, carrying the live post-production grade.
  const renderItems: LibraryItem[] = useMemo(
    () =>
      versions.map(v => ({
        id: `render-${v.label}`,
        title: `Version ${v.label.replace(/^V/, '')}`,
        subtitle: v.prompt.replace(/\s+/g, ' ').trim().slice(0, 140) + (v.prompt.length > 140 ? '…' : ''),
        category: 'My renders',
        keywords: ['render', 'omni', v.label, 'commercial'],
        src: v.videoUrl,
        badge: v.label,
        filter: gradeFilter || undefined,
        preload: 'metadata' as const,
      })),
    [versions, gradeFilter],
  );

  const renderActions = (item: LibraryItem): LibraryAction[] => {
    const version = versions.find(v => v.label === item.badge);
    if (!version) return [];
    return [
      {
        label: 'Open in Studio',
        icon: <Wand2 className="w-3.5 h-3.5" />,
        primary: true,
        onClick: () => {
          selectVersion(version.label);
          setPage('studio');
        },
      },
      {
        label: downloading ? 'Downloading…' : 'Download',
        icon: downloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        ),
        onClick: () => downloadVideo(version),
      },
    ];
  };

  const handleNavigate = (next: AppPage) => {
    setPage(next);
    setEditOpen(false);
    setPromptOpen(false);
    setSheetOpen(false);
  };

  const addVersion = (interactionId: string, fileId: string, promptText: string) => {
    const label = `V${++versionCount.current}`;
    setVersions(prev => [...prev, { label, interactionId, videoUrl: `/api/video/${fileId}`, prompt: promptText }]);
    setSelectedLabel(label);
  };

  // Polls Omni until the render is ACTIVE, then records the version.
  const pollVideoStatus = (fileId: string, interactionId: string, promptText: string, isInitial: boolean) => {
    addLog('Polling Omni for render status...', 'warn');
    let lastState = '';

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/file-status/${fileId}`);
        const data = await res.json();

        if (data.state === 'ACTIVE') {
          clearInterval(interval);
          addLog('Render complete. Stream ready.', 'success');
          addVersion(interactionId, fileId, promptText);
          setAppState('VIDEO_READY');
          if (isInitial) {
            // Reset the upload sidebar for the next run.
            setProduct(null);
            setAtmosphere(null);
            setGenerateOpen(false);
            setGeneratePrompt('');
          }
        } else if (data.state === 'FAILED') {
          clearInterval(interval);
          addLog('Omni backend reported FAILED state.', 'error');
          setAppState(isInitial ? 'IDLE' : 'VIDEO_READY');
        } else if (data.state !== lastState) {
          lastState = data.state;
          addLog(`Render status: ${data.state}`);
        }
      } catch (e: any) {
        addLog(`Polling error: ${e.message}`, 'error');
      }
    }, 5000);
  };

  // Initial generation from the sidebar: optionally render an atmosphere image
  // first, then write the prompt and render V1.
  const handleSubmit = async () => {
    if (!product || !hasAtmosphere) {
      addLog('Please add a product and an atmosphere.', 'error');
      return;
    }
    const settingInput = generatePrompt.trim();

    versionCount.current = 0;
    setVersions([]);
    setSelectedLabel(null);
    setEditOpen(false);
    setPromptOpen(false);

    try {
      const productImages = await toInlineImages(product.images);
      const productLabel = product.source === 'suggestion' ? product.id : 'product';

      // The atmosphere can come from a selection/upload or be generated on the fly.
      let atmosphereImages: InlineImage[];
      let atmosphereDesc: string;
      let atmosphereSources: string[];   // surfaced later in the "sources" strip

      if (usingGenerate) {
        // Stage 0: Flash Lite writes an image prompt; Nano Banana 2 Lite renders it.
        setAppState('GENERATING_ATMOSPHERE');
        addLog(`Generating atmosphere from: "${settingInput}"`, 'info');
        addLog('Writing image prompt (Gemini Flash Lite)…', 'warn');
        addLog('Rendering atmosphere with Nano Banana 2 Lite…', 'warn');

        const atmoRes = await fetch('/api/generate-atmosphere', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: settingInput })
        });
        const atmoData = await atmoRes.json();
        if (!atmoRes.ok) throw new Error(atmoData.error || 'Failed to generate atmosphere');

        const atmoDataUrl = `data:${atmoData.image.mimeType};base64,${atmoData.image.data}`;
        addLog('Atmosphere image ready.', 'success', atmoDataUrl);
        atmosphereImages = [{ data: atmoData.image.data, mimeType: atmoData.image.mimeType }];
        atmosphereDesc = (atmoData.prompt as string) || settingInput;
        atmosphereSources = [atmoDataUrl];
      } else {
        setAppState('GENERATING_PROMPT');
        addLog('Analyzing images...');
        addLog(`Product: ${describe(product)}`, 'info');
        addLog(`Atmosphere: ${describe(atmosphere!)}`, 'info');
        addLog('Encoding images...', 'warn');
        atmosphereImages = await toInlineImages(atmosphere!.images);
        atmosphereDesc = atmosphere!.description.replace(/\{product_id\}/g, productLabel);
        atmosphereSources = atmosphere!.images;
      }

      // Hidden until now: the user first sees a generated atmosphere here.
      setSubmittedImages([...product.images, ...atmosphereSources]);

      setAppState('GENERATING_PROMPT');
      addLog('Requesting Gemini Flash prompt translation...', 'warn');
      const promptRes = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productDesc: product.description, atmosphereDesc, productImages, atmosphereImages })
      });
      const promptData = await promptRes.json();
      if (!promptRes.ok) throw new Error(promptData.error || 'Failed to generate prompt');

      const generatedPrompt = promptData.prompt as string;
      addLog('Prompt generation complete.', 'success');

      setAppState('GENERATING_VIDEO');
      addLog('Initializing Omni Video Generation pipeline...');
      addLog('Transmitting payloads to Omni...', 'warn');

      const videoRes = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generatedPrompt, productImages, atmosphereImages })
      });
      const videoData = await videoRes.json();
      if (!videoRes.ok) throw new Error(videoData.error || 'Failed to start video generation');

      addLog(`Interaction created successfully. ID: ${videoData.interactionId}`, 'success');
      pollVideoStatus(videoData.fileId, videoData.interactionId, generatedPrompt, true);
    } catch (e: any) {
      setAppState('IDLE');
      addLog(`Error: ${e.message}`, 'error');
    }
  };

  // Edit the selected version via Omni's stateful chaining → produces a new version.
  const handleEdit = async () => {
    if (!selected || !editText.trim() || isGenerating) return;
    const instructions = editText.trim();
    const fromLabel = selected.label;
    const fromInteractionId = selected.interactionId;

    setEditOpen(false);
    setEditText('');
    setAppState('GENERATING_VIDEO');
    addLog(`Editing ${fromLabel}: ${instructions}`, 'warn');
    addLog('Transmitting edit to Omni...', 'warn');

    try {
      const res = await fetch('/api/edit-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previousInteractionId: fromInteractionId, instructions })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Edit failed');

      addLog(`Edit interaction created: ${data.interactionId}`, 'success');
      pollVideoStatus(data.fileId, data.interactionId, instructions, false);
    } catch (e: any) {
      setAppState('VIDEO_READY');
      addLog(`Edit failed: ${e.message}`, 'error');
    }
  };

  const selectVersion = (label: string) => {
    setSelectedLabel(label);
    setEditOpen(false);
  };

  // Fetch the video as a blob from within the authenticated app context, then save
  // it from a local object URL. The native player download triggers a navigational
  // request that AI Studio's auth proxy intercepts (returning its cookie-check page
  // instead of the video), so we download it ourselves.
  const downloadVideo = async (version: VideoVersion) => {
    setDownloading(true);
    try {
      const res = await fetch(version.videoUrl, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omni-${version.label.toLowerCase()}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      addLog(`Download failed: ${e.message}`, 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="md:h-screen w-full flex flex-col md:overflow-hidden bg-zinc-950 font-sans">

      {/* HEADER — app-level bar with branding and panel toggles (desktop) */}
      <header id="app-header" className="shrink-0 border-b border-zinc-800 bg-zinc-900 px-4 md:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-8 h-8 shrink-0 rounded-lg bg-primary/15 border border-primary/35 flex items-center justify-center shadow-sm">
            <Clapperboard className="w-4 h-4 text-primary" />
          </span>
          <div className="min-w-0 leading-tight">
            <h1 id="app-title" className="text-sm font-semibold text-white truncate">
              Omni Product Studio
            </h1>
            <p className="text-[10px] text-zinc-400 truncate">Cinematic AI commercial suite</p>
          </div>
          {/* Breadcrumb-ish page label */}
          <span className="hidden sm:inline-flex items-center gap-1.5 min-w-0 ml-1 pl-3 border-l border-zinc-800">
            <span className="text-xs font-medium text-zinc-300 truncate">{PAGE_TITLE[page]}</span>
          </span>
          <span className="hidden lg:inline-flex ml-2 items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide text-zinc-300 bg-zinc-800 border border-zinc-700 uppercase">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-400" />
            </span>
            Pipeline v1.1
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="theme-toggle"
            type="button"
            onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
            aria-pressed={theme === 'light'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {page === 'studio' && (
          <span className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${
            canSubmit ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
            : isGenerating ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
            : 'text-zinc-400 bg-zinc-800 border-zinc-700'
          }`}>
            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {isGenerating ? 'Rendering' : canSubmit ? 'Ready' : 'Awaiting inputs'}
          </span>
          )}
          {page === 'studio' && <span className="hidden sm:block h-5 w-px bg-zinc-800" />}
          {/* The builder toggle now lives in the nav rail; only the
              post-production toggle stays in the header. */}
          {page === 'studio' && (<>
          <button
            id="right-panel-toggle"
            onClick={() => setPostOpen(o => !o)}
            aria-pressed={postOpen}
            aria-label={postOpen ? 'Collapse post-production panel' : 'Expand post-production panel'}
            title={postOpen ? 'Collapse post-production panel' : 'Expand post-production panel'}
            className={`hidden md:flex w-8 h-8 items-center justify-center rounded-lg border transition-colors ${
              postOpen
                ? 'border-primary/60 bg-primary/10 text-primary hover:bg-primary/20'
                : 'border-zinc-700 bg-zinc-800 text-zinc-500 hover:border-primary/50 hover:text-primary'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          </>)}
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 flex flex-col md:flex-row md:min-h-0 md:overflow-hidden">

        {/* APP NAVIGATION — switch between the builder, the media library and renders */}
        <AppSidebar
          page={page}
          onNavigate={handleNavigate}
          renderCount={versions.length}
          builder={page === 'studio' ? { open: sidebarOpen, onToggle: () => setSidebarOpen(o => !o) } : undefined}
        />

        {page === 'studio' ? (
        <>

        {/* LEFT - BUILDER */}
        <div
          id="studio-left-sidebar"
          className={`relative w-full md:shrink-0 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-900 flex flex-col justify-between transition-[width] duration-300 ease-in-out overflow-hidden ${
            sidebarOpen
              ? 'md:w-[440px] p-6 md:p-7 md:overflow-y-auto md:overflow-x-hidden thin-scrollbar'
              : 'md:w-[56px] p-6 md:py-8 md:px-0 md:overflow-hidden'
          }`}
        >
          {/* Collapsed rail (desktop) — vertical branding only. The expand
              control lives in the nav rail, next to the other icon buttons. */}
          {!sidebarOpen && (
            <div className="hidden md:flex flex-col items-center gap-4 h-full pt-1">
              <div className="flex-1 flex flex-col items-center gap-5 text-zinc-500">
                <span className="text-[11px] font-medium uppercase tracking-[0.25em] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap select-none">
                  Omni Studio
                </span>
                <Wand2 className="w-4 h-4 text-zinc-600" />
              </div>
            </div>
          )}

          {/* Expanded content — `md:hidden` when collapsed; always visible on mobile
              so a desktop collapse can never blank the mobile layout */}
          <div className={sidebarOpen ? '' : 'md:hidden'}>
            <div>
              <header className="mb-7">
                <h2 className="text-lg font-semibold tracking-tight text-white mb-1.5">
                  Build your <span className="text-zinc-400 font-normal">commercial</span>
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
                  Compose, style, and render high-fidelity cinematic video commercials.
                </p>
              </header>

              <ImageUploader
                title="Product Reference"
                type="product"
                stepNumber="01"
                suggestions={PRODUCTS}
                selection={product}
                onSelect={setProduct}
                disabled={isGenerating}
              />

              <ImageUploader
                title="Atmosphere & Environment"
                type="atmosphere"
                stepNumber="02"
                suggestions={ATMOSPHERES}
                selection={atmosphere}
                onSelect={selectAtmosphere}
                disabled={isGenerating}
              />
            </div>

            {/* Persistent submit — writes the prompt and renders in one go.
                Wrapper carries the tooltip: a disabled button emits no hover events. */}
            <div id="submit-section" className="pt-4 pb-4">
              <div title={submitHint} className={submitHint ? 'cursor-not-allowed' : undefined}>
                <button
                  id="generate-video-submit-btn"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-xs uppercase tracking-widest rounded-xl transition-all duration-200 w-full shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none bg-primary hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/25 text-on-primary border border-primary disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border-zinc-800"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2.5 w-4 h-4 animate-spin text-on-primary" />
                      Generating Cinematic Shot…
                    </>
                  ) : (
                    <>
                      <span>Generate Cinematic Video</span>
                      <ArrowRight className="ml-2.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
              {/* Stage progress rail under the CTA */}
              <div className="mt-3 px-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`h-1 flex-1 rounded-full transition-all duration-500 ${isGenerating || appState === 'VIDEO_READY' ? 'bg-zinc-300' : canSubmit ? 'bg-zinc-600' : 'bg-zinc-800'}`} />
                  <span className={`h-1 flex-1 rounded-full transition-all duration-500 ${appState === 'GENERATING_VIDEO' || appState === 'VIDEO_READY' ? 'bg-zinc-300' : 'bg-zinc-800'}`} />
                  <span className={`h-1 flex-1 rounded-full transition-all duration-500 ${appState === 'VIDEO_READY' ? 'bg-emerald-400/80' : appState === 'GENERATING_VIDEO' ? 'bg-zinc-300 shimmer' : 'bg-zinc-800'}`} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="font-medium">Pipeline Stage 03</span>
                  <span className={canSubmit && !isGenerating ? 'text-emerald-400 font-medium' : isGenerating ? 'text-amber-300/90 font-medium' : 'text-zinc-500'}>
                    {isGenerating ? '◌ Rendering in progress…' : canSubmit ? '✓ Ready to render' : submitHint || 'Inputs required'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER - OUTPUT */}
        <div className="w-full md:flex-1 p-6 md:p-8 min-h-[50vh] md:min-h-0 md:overflow-y-auto thin-scrollbar grid-backdrop md:flex md:flex-col">

          {/* Every row shares a left gutter so the version thumbnails, the main
              video, the input carousel and the prompt all line up on one edge —
              the version label + EDIT occupy the gutter only on the video row. */}

          {/* PREVIOUS VERSIONS — click to bring one back into the main view */}
          {otherVersions.length > 0 && (
            <div className="flex gap-3 md:gap-4 mb-8">
              <div className="flex-none w-12" />
              <ScrollRow className="flex-1 min-w-0" rowClassName="gap-4" deps={[otherVersions.length]}>
                {otherVersions.map(v => (
                  <button key={v.label} onClick={() => selectVersion(v.label)} className="group flex-none text-left">
                    <div className="text-xs font-medium uppercase tracking-widest text-zinc-400 group-hover:text-primary mb-1.5 transition-colors">{v.label}</div>
                    <video
                      src={v.videoUrl}
                      muted
                      playsInline
                      preload="metadata"
                      style={{ filter: gradeFilter || undefined }}
                      className="w-40 aspect-video object-cover bg-black rounded-lg ring-1 ring-zinc-800 opacity-70 group-hover:opacity-100 group-hover:ring-primary/60 transition-all"
                    />
                  </button>
                ))}
              </ScrollRow>
            </div>
          )}

          {/* MAIN: version label + EDIT in the gutter, video/loading aligned with the rest */}
          {/* When nothing has been rendered yet the row grows to fill the column,
              which is what centres the empty stage on both axes. */}
          <div className={`flex gap-3 md:gap-4 ${idleStage ? 'md:flex-1 md:min-h-0' : ''}`}>
            <div className="flex-none w-12 pt-1">
              {appState === 'VIDEO_READY' && selected && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setEditOpen(o => !o)}
                    className="text-sm font-medium uppercase tracking-widest text-white text-left hover:text-primary transition-colors"
                  >
                    {selected.label}
                  </button>
                  <button
                    onClick={() => setEditOpen(o => !o)}
                    className={`text-xs font-medium uppercase tracking-widest text-left transition-colors ${editOpen ? 'text-primary' : 'text-zinc-500 hover:text-primary'}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => downloadVideo(selected)}
                    disabled={downloading}
                    aria-label={`Download ${selected.label}`}
                    title="Download video"
                    className="w-fit p-1 -m-1 rounded-md text-zinc-500 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                  >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
            <div className={`flex-1 min-w-0 ${idleStage ? 'md:h-full' : ''}`}>
              <VideoOutput
                appState={appState}
                videoUrl={selected?.videoUrl ?? null}
                logs={logs}
                hasProduct={!!product}
                hasAtmosphere={hasAtmosphere}
                gradeFilter={gradeFilter}
              />

              {/* Mobile: the post-production panel slides up on demand once a
                  render exists (desktop keeps the docked panel). */}
              {appState === 'VIDEO_READY' && selected && (
                <button
                  type="button"
                  id="mobile-grade-btn"
                  onClick={() => setSheetOpen(true)}
                  className="md:hidden mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs font-semibold text-zinc-100 transition-colors hover:border-primary/50 hover:text-primary active:scale-[0.98]"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Grade & Filters
                </button>
              )}
            </div>
          </div>

          {/* EDIT FORM */}
          <AnimatePresence initial={false}>
            {editOpen && appState === 'VIDEO_READY' && selected && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-3 md:gap-4 mt-4">
                  <div className="flex-none w-12" />
                  <div className="flex-1 min-w-0">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder={`Describe your changes to ${selected.label} — e.g. "warmer lighting", "slow orbit", "swap the backdrop"…`}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/40 transition-colors resize-y min-h-[100px] placeholder:text-zinc-600 shadow-inner"
                    />
                    <button
                      onClick={handleEdit}
                      disabled={!editText.trim()}
                      className="group mt-3 inline-flex items-center justify-center px-8 py-3 font-semibold uppercase tracking-widest text-on-primary bg-primary hover:bg-primary-hover rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:shadow-none"
                    >
                      Submit Edit
                      <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* INPUT REFERENCE IMAGES (shared across versions) */}
          {appState === 'VIDEO_READY' && submittedImages.length > 0 && (
            <div className="flex gap-3 md:gap-4 mt-6">
              <div className="flex-none w-12" />
              <ScrollRow className="flex-1 min-w-0" rowClassName="gap-2" deps={[submittedImages.length]}>
                {submittedImages.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Input ${i + 1}`}
                    className="flex-none w-24 h-16 object-cover bg-zinc-900 rounded-lg ring-1 ring-zinc-800"
                  />
                ))}
              </ScrollRow>
            </div>
          )}

          {/* PROMPT for the selected version */}
          {appState === 'VIDEO_READY' && selected?.prompt && (
            <div className="flex gap-3 md:gap-4 mt-5">
              <div className="flex-none w-12" />
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setPromptOpen(o => !o)}
                  className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white hover:text-primary transition-colors"
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${promptOpen ? 'rotate-90' : ''}`} />
                  Prompt
                </button>
                <AnimatePresence initial={false}>
                  {promptOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                        {selected.prompt}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT - POST-PRODUCTION (desktop) */}
        <aside
          id="post-panel"
          className={`hidden md:flex md:shrink-0 flex-col border-l border-zinc-800 bg-zinc-900 transition-[width] duration-300 ease-in-out overflow-hidden ${
            postOpen ? 'md:w-[320px]' : 'md:w-0 border-l-0'
          }`}
        >
          <div className={postOpen ? 'w-[320px] h-full min-h-0' : 'w-0 h-full min-h-0'}>
            <PostPanel
              grades={grades}
              onChange={setGrades}
              videoReady={appState === 'VIDEO_READY' && !!selected}
              previewSrc={filterPreview ?? FILTER_PREVIEW_STILL}
            />
          </div>
        </aside>

        </>
        ) : page === 'media' ? (
          <MediaLibrary
            key="library-media"
            items={stockItems}
            emptyTitle="No clips match your filters"
            emptyBody="Try another category, or clear the search to browse the full stock library again."
          >
            <PageHeading
              icon={Film}
              title="Media Library"
              subtitle="License-free stock footage — hover a card to play it, click to enlarge."
            >
              <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                {STOCK_VIDEOS.length} clips · Mixkit Free License
              </span>
            </PageHeading>
          </MediaLibrary>
        ) : (
          <MediaLibrary
            key="library-renders"
            items={renderItems}
            emptyTitle="No renders yet"
            emptyBody="Pick a product and an atmosphere in the Studio, then generate your first cinematic shot — every version lands here."
            getActions={renderActions}
            noun="render"
          >
            <PageHeading
              icon={History}
              title="Renders"
              subtitle="Every version generated this session, shown with the live post-production grade."
            >
              <button
                type="button"
                onClick={() => setPage('studio')}
                className="inline-flex items-center gap-2 rounded-xl border border-primary bg-primary px-4 py-2 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-hover active:scale-[0.98]"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Open Studio
              </button>
            </PageHeading>
          </MediaLibrary>
        )}
      </div>

      {/* MOBILE GRADE SHEET — the post-production panel on demand */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Grade and filters"
              initial={{ y: '8%' }}
              animate={{ y: 0 }}
              exit={{ y: '8%' }}
              transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
              className="relative flex h-[86vh] w-full flex-col overflow-hidden rounded-t-lg border-t border-zinc-700 bg-zinc-900 shadow-2xl shadow-black"
            >
              <div className="relative shrink-0 px-5 pb-1 pt-3">
                <span className="mx-auto block h-1 w-10 rounded-full bg-zinc-700" />
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Close grade panel"
                  className="absolute right-4 top-3 grid h-8 w-8 place-items-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 active:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <PostPanel
                  grades={grades}
                  onChange={setGrades}
                  videoReady={appState === 'VIDEO_READY' && !!selected}
                  previewSrc={filterPreview ?? FILTER_PREVIEW_STILL}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER — Clean, modern studio bar with minimal text */}
      <footer id="studio-footer" className="shrink-0 border-t border-zinc-800 bg-zinc-900 px-6 md:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 font-medium text-zinc-200">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-400" />
            </span>
            Omni Product Studio
          </span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-400 text-[11px]">Gemini Omni 1.1 Flash</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span>AI Commercial Generation</span>
          <span className="text-zinc-700">•</span>
          <a
            href="https://policies.google.com/terms/generative-ai/use-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 rounded-md text-zinc-300 hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/40 transition-colors underline underline-offset-4 decoration-zinc-700"
          >
            Prohibited Use Policy
          </a>
        </div>
      </footer>

    </div>
  );
}
