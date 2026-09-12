import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Film,
  ArrowRight,
  Download,
  Layers,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Wand2,
  CheckCircle2,
  Image as ImageIcon,
  X,
  History,
  Clock,
  SlidersHorizontal,
  RotateCcw as ResetIcon,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface MediaState {
  url: string;
  data: string;
  mimeType: string;
}

export interface Segment {
  url: string;
  data: string;
  mimeType: string;
  kind: 'transition' | 'extension';
}

export interface HistoryItem {
  id: string;
  segments: Segment[];
  prompt: string;
  timestamp: Date;
}

interface TransitionStudioProps {
  history?: HistoryItem[];
  setHistory?: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  activeHistoryId?: string | null;
  setActiveHistoryId?: React.Dispatch<React.SetStateAction<string | null>>;
  onViewAllInLibrary?: () => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

/* ── Transition techniques (ported from omni-transition-studio) ────────── */

const TRANSITIONS = [
  {
    id: 'object-portal',
    name: 'Object Portal',
    hint: 'Enter a real opening in scene one and emerge naturally into scene two',
    block: `TECHNIQUE — OBJECT PORTAL:
Use a visible object or opening in the FIRST scene as a physical gateway into the LAST scene: door, window, mirror, tunnel, circular opening, or similar form.

START: Move the camera continuously toward the chosen opening until its interior dominates the frame.
BRIDGE: Pass physically THROUGH the opening. At the midpoint, the opening or its dark/interior surface must fill 100% of the frame, completely hiding the surrounding scene.
TRANSITION: While the frame is fully occupied by the portal interior, transform that interior space into the corresponding entry point of the LAST scene. NO VFX / Motion Graphics for the transition.
END: Continue the same camera movement out of the portal into the LAST scene and settle naturally into the target composition.

Maintain one uninterrupted camera move. No visible cut, dissolve, teleport, or abrupt perspective change. Make sure the scenes are matched and transition seamlessly. The portal itself must motivate and conceal the scene change.`,
  },
  {
    id: 'whip-pan',
    name: 'Whip Pan',
    hint: 'A rapid pan creates full-frame motion blur that hides the scene change',
    block: `TECHNIQUE — WHIP PAN:
Transition between scenes using one continuous, high-speed horizontal camera pan.

START: Begin in the FIRST scene, then rapidly accelerate the camera left or right.
BRIDGE: The pan becomes fast enough to create strong directional motion blur across the ENTIRE frame. No recognizable environment should remain visible at peak speed.
TRANSITION: Change from the FIRST environment to the LAST environment only while the image is completely obscured by motion blur.
END: Continue the pan in the SAME direction and with consistent momentum, then smoothly decelerate until the camera lands precisely on the LAST frame's composition.

The transition must feel like one physical camera movement. Match pan direction, camera height, lens perspective, and apparent velocity across the hidden midpoint. No flash, dissolve, jump cut, or reversal of direction.`,
  },
  {
    id: 'match-cut-morph',
    name: 'Match Morph',
    hint: 'A shared shape stays aligned while its material and world transform around it',
    block: `TECHNIQUE — MATCH MORPH:
Find the strongest visual geometry shared by the FIRST and LAST frames: a circle, face, silhouette, doorway, horizon, vehicle, building edge, centered object, or other matching form.

START: Reframe or move the camera so the shared shape in the FIRST scene aligns with the position, scale, angle, and silhouette of its counterpart in the LAST scene.
BRIDGE: Lock that geometry in place as the visual anchor. Its outer contour should remain stable while its texture, material, lighting, and identity gradually transform.
TRANSITION: Morph the surrounding environment at the same time, radiating naturally outward from the matched shape until the FIRST scene has fully become the LAST scene.
END: Finish with the matching geometry now belonging entirely to the LAST scene, aligned exactly with the target frame.

Prioritize silhouette continuity and spatial alignment. Avoid melting, random deformation, double exposure, or independent object movement that breaks the matched geometry. The transformation should read as one object/world evolving into another, not a crossfade.`,
  },
  {
    id: 'sky-drop',
    name: 'Sky Drop',
    hint: 'Leave one world through an overhead surface and descend from it into the next',
    block: `TECHNIQUE — SKY DROP:
Use an overhead visual field as the seamless bridge between the FIRST and LAST scenes: open sky, clouds, ceiling, canopy, lights, fog, tree cover, water surface, or similar texture.

START: From the FIRST scene, tilt, crane, rise, or fly the camera upward until the overhead surface completely fills the frame and the original ground environment disappears.
BRIDGE: Continue moving through the full-frame sky/ceiling texture. During this visually ambiguous overhead moment, gradually transform its color, lighting, weather, structure, or texture into the overhead environment of the LAST scene.
TRANSITION: Preserve camera momentum and orientation while the overhead field becomes unmistakably part of the new world.
END: Reverse the framing movement by tilting or descending out of the new overhead surface, revealing the LAST scene below and settling into its target composition.

The overhead texture must fully conceal the environment change. No hard cut or arbitrary dissolve. The motion should feel like the camera traveled continuously through one vertical passage between worlds.`,
  },
  {
    id: 'through-the-crowd',
    name: 'Foreground Wipe',
    hint: 'A close foreground object fully covers the lens and reveals the next scene behind it',
    block: `TECHNIQUE — FOREGROUND WIPE:
Use a believable foreground subject to physically wipe across the camera and hide the transition: person, coat, vehicle, wall, pillar, door, tree trunk, sign, fabric, or another large object passing very close to the lens.

START: Begin in the FIRST scene while the wiping element approaches or crosses the camera's view.
BRIDGE: The foreground element passes so close to the lens that it covers 100% of the frame for a brief moment.
TRANSITION: Change the environment only while the lens is completely occluded.
END: As the SAME or visually compatible foreground element clears the lens, reveal the LAST scene behind it and continue the existing camera or subject motion naturally.

Match the wipe's direction, speed, scale, color, and depth on both sides of the transition. The foreground object should plausibly exist in both scenes. Do not reveal the new environment until the frame has been fully covered. No dissolve or visible cut.`,
  },
  {
    id: 'time-machine',
    name: 'Time Machine',
    hint: 'The viewpoint stays fixed while the same location transforms through time',
    block: `TECHNIQUE — TIME MACHINE:
Interpret the FIRST and LAST frames as the SAME physical location viewed at different moments, seasons, years, or historical eras.

START: Establish the FIRST scene and lock the camera to a stable viewpoint. A very slow push-in is acceptable, but the spatial perspective must remain consistent.
BRIDGE: Accelerate the passage of time around the camera. Show continuous temporal change through moving sunlight and shadows, weather, seasons, construction, decay, vegetation growth, traffic, crowds, aging materials, changing signage, or evolving architecture.
TRANSITION: Preserve permanent landmarks, major geometry, horizon position, and spatial layout so the viewer always understands this is the same place changing through time.
END: Gradually slow the temporal motion until the world settles completely into the LAST frame's era, lighting, environment, and exact composition.

The CAMERA does not travel through space; TIME travels around the camera. Avoid teleporting objects, unrelated morphing, or changing the location's fundamental geometry unless the change is motivated by visible construction, destruction, growth, or decay.`,
  },
] as const;

/* ── Component ────────────────────────────────────────────────────────── */

export function TransitionStudio(props: TransitionStudioProps = {}) {
  const [prompt, setPrompt] = useState('');
  const [technique, setTechnique] = useState<string | null>(null);
  const [extendPrompt, setExtendPrompt] = useState('');
  const [image1, setImage1] = useState<MediaState | null>(null);
  const [image2, setImage2] = useState<MediaState | null>(null);
  const [references, setReferences] = useState<MediaState[]>([]);
  const [isGenerating, setGenerating] = useState(false);
  const [generatingLabel, setGeneratingLabel] = useState('Rendering…');
  const [error, setError] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0);
  const [internalHistory, setInternalHistory] = useState<HistoryItem[]>([]);
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const [dragOver1, setDragOver1] = useState(false);
  const [dragOver2, setDragOver2] = useState(false);
  const [techniquePanelOpen, setTechniquePanelOpen] = useState(true);
  const [techniqueSheetOpen, setTechniqueSheetOpen] = useState(false);

  const history = props.history ?? internalHistory;
  const setHistory = props.setHistory ?? setInternalHistory;
  const activeHistoryId = props.activeHistoryId ?? internalActiveId;
  const setActiveHistoryId = props.setActiveHistoryId ?? setInternalActiveId;
  const sidebarOpen = props.sidebarOpen ?? true;

  useEffect(() => {
    if (!activeHistoryId) return;
    const item = history.find((h) => h.id === activeHistoryId);
    if (item && item.segments !== segments) {
      setSegments(item.segments);
      setSelectedSegmentIndex(0);
      if (item.prompt && !prompt) setPrompt(item.prompt);
    }
  }, [activeHistoryId, history]);

  useEffect(() => {
    if (!techniqueSheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [techniqueSheetOpen]);

  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);
  const fileInputRefRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setMedia: React.Dispatch<React.SetStateAction<MediaState | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('File size exceeds 50MB limit.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, WEBP).');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(',')[1];
        setMedia({ url: result, data: base64Data, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRefFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && references.length < 3) {
      if (file.size > 100 * 1024 * 1024) {
        setError('File size exceeds 100MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(',')[1];
        setReferences((prev) => [...prev, { url: result, data: base64Data, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const pollJob = async (jobId: string): Promise<{ url: string; data: string; mimeType: string }> => {
    const started = Date.now();
    while (true) {
      await new Promise((r) => setTimeout(r, 4000));
      const elapsed = Math.round((Date.now() - started) / 1000);
      setGeneratingLabel((prev) => prev.replace(/( \· \d+s)?$/, ` · ${elapsed}s`));
      const statusRes = await fetch(`/api/job/${jobId}`);
      if (!statusRes.ok) throw new Error('Lost connection to the render job.');
      const status = await statusRes.json();
      if (status.status === 'error') throw new Error(status.error || 'Render processing failed.');
      if (status.status === 'done') {
        const resultRes = await fetch(`/api/job/${jobId}/result`);
        if (!resultRes.ok) throw new Error('Failed to retrieve finished render.');
        const blob = await resultRes.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ url: URL.createObjectURL(blob), data: (reader.result as string).split(',')[1], mimeType: blob.type || 'video/mp4' });
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    }
  };

  const handleGenerate = async () => {
    if ((!prompt.trim() && !technique) || !image1 || !image2) {
      setError('Please select a transition technique or provide scene direction, and supply both keyframe images.');
      return;
    }
    setError(null);
    setGenerating(true);
    setGeneratingLabel('Rendering Transition…');
    try {
      const mediaParts = [
        { data: image1.data, mimeType: image1.mimeType },
        { data: image2.data, mimeType: image2.mimeType },
      ];
      const selected = TRANSITIONS.find((t) => t.id === technique);
      const fullPrompt = `Task: Create one continuous, uncut cinematic transition from the First frame to the Last frame.
${selected ? selected.block : 'TECHNIQUE — DIRECTOR\'S CHOICE: Choose the single most visually striking transition technique that suits these two frames (object portal, whip pan, match morph, sky drop, foreground wipe, or time-lapse transformation). Commit to it fully.'}
Additional user instructions: ${prompt || 'None.'}
CRITICAL RULES:
1. Single continuous camera move; begin exactly on the First frame and end exactly on the Last frame.
2. Execute the named technique boldly — this is a showcase transition, not a subtle dissolve.
3. No hard cuts, no crossfades, no new characters.`;

      const res = await fetch('/api/omni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          format: 'video',
          media: mediaParts,
          references: references.map((r) => ({ data: r.data, mimeType: r.mimeType })),
        }),
      });
      const { jobId, error: jobError } = await res.json();
      if (jobError || !jobId) throw new Error(jobError || 'Failed to initiate render queue.');
      const data = await pollJob(jobId);

      const newSeg: Segment = { url: data.url, data: data.data, mimeType: data.mimeType, kind: 'transition' };
      setSegments([newSeg]);
      setSelectedSegmentIndex(0);

      const newId = Date.now().toString();
      setActiveHistoryId(newId);
      setHistory((prev) => {
        const newHistory = [
          {
            id: newId,
            segments: [newSeg],
            prompt: `${selected ? selected.name + ': ' : ''}${prompt || 'Direction applied'}`,
            timestamp: new Date(),
          },
          ...prev,
        ];
        const kept = newHistory.slice(0, 10);
        const dropped = newHistory.slice(10);
        dropped.forEach((item) => {
          item.segments.forEach((seg) => {
            if (seg.url && seg.url.startsWith('blob:')) URL.revokeObjectURL(seg.url);
          });
        });
        return kept;
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during rendering.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExtend = async () => {
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment) return;
    setError(null);
    setGenerating(true);
    setGeneratingLabel('Extending Scene…');
    try {
      const res = await fetch('/api/omni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'extend',
          video: lastSegment.data,
          mimeType: lastSegment.mimeType,
          sourceMedia: [image1, image2].filter(Boolean).map((m) => ({ data: m!.data, mimeType: m!.mimeType })),
          prompt: extendPrompt,
        }),
      });
      const { jobId, error: jobError } = await res.json();
      if (jobError || !jobId) throw new Error(jobError || 'Failed to initiate extension queue.');
      const data = await pollJob(jobId);

      const newSeg: Segment = { url: data.url, data: data.data, mimeType: data.mimeType, kind: 'extension' };
      const newSegments = [...segments, newSeg];
      setSegments(newSegments);
      setSelectedSegmentIndex(newSegments.length - 1);
      setHistory((hist) => hist.map((h) => (h.id === activeHistoryId ? { ...h, segments: newSegments } : h)));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during extension.');
    } finally {
      setGenerating(false);
    }
  };

  const handleStartOver = () => {
    if (isGenerating) return;
    setImage1(null);
    setImage2(null);
    setReferences([]);
    setPrompt('');
    setTechnique(null);
    setExtendPrompt('');
    setSegments([]);
    setSelectedSegmentIndex(0);
    setActiveHistoryId(null);
    setError(null);
    if (fileInput1Ref.current) fileInput1Ref.current.value = '';
    if (fileInput2Ref.current) fileInput2Ref.current.value = '';
    if (fileInputRefRef.current) fileInputRefRef.current.value = '';
  };

  const handleExport = () => {
    if (segments.length === 0) return;
    segments.forEach((seg, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = seg.url;
        let ext = 'mp4';
        const mimeMatch = seg.mimeType.match(/video\/(.+)/);
        if (mimeMatch && mimeMatch[1]) ext = mimeMatch[1];
        a.download = segments.length > 1 ? `transition-studio-take-${i + 1}.${ext}` : `transition-studio-take.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, i * 400);
    });
  };

  const canGenerate = !isGenerating && !!image1 && !!image2 && (!!prompt.trim() || !!technique);

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0 w-full bg-zinc-950 text-white overflow-hidden font-sans">
      {/* ── LEFT: Source Media — exact Studio Build sidebar, collapsible ────── */}
      <aside
        id="transition-left-sidebar"
        className={`relative w-full md:shrink-0 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-900 flex flex-col justify-between transition-[width] duration-300 ease-in-out overflow-hidden ${
          sidebarOpen ? 'md:w-[440px] p-6 md:p-7 md:overflow-y-auto md:overflow-x-hidden thin-scrollbar' : 'md:w-[56px] p-6 md:py-8 md:px-0 md:overflow-hidden'
        }`}
      >
        {/* Collapsed rail — vertical branding only, expand via AppSidebar */}
        {!sidebarOpen && (
          <div className="hidden md:flex flex-col items-center gap-4 h-full pt-1">
            <div className="flex-1 flex flex-col items-center gap-5 text-zinc-500">
              <span className="text-[11px] font-medium uppercase tracking-[0.25em] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap select-none">Omni Transitions</span>
              <Layers className="w-4 h-4 text-zinc-600" />
            </div>
          </div>
        )}

        {/* Expanded content — hidden on desktop when collapsed, always visible on mobile */}
        <div className={sidebarOpen ? 'flex flex-col flex-1 min-h-0' : 'md:hidden flex flex-col flex-1 min-h-0'}>
          {/* Branding — matches Studio header */}
          <div className="mb-7">
            <h2 className="text-lg font-semibold tracking-tight text-white mb-1.5">
              Bridge your <span className="text-zinc-400 font-normal">transition</span>
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">Compose, style, and bridge two frames into one uncut cinematic move — seamless, editorial, premium.</p>
          </div>

          {/* Head Frame — exact Studio Build card */}
          <div className={`mb-6 p-5 rounded-2xl border transition-all duration-200 ${image1 ? 'bg-zinc-950 border-zinc-700 shadow-lg shadow-black/30' : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-semibold flex items-center justify-center shadow-sm">01</span>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Head Frame (In)</h3>
              </div>
              {image1 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  Configured
                </span>
              ) : (
                <span className="text-[10px] font-medium tracking-wider uppercase text-zinc-500">Required</span>
              )}
            </div>
            {image1 ? (
              <div className="space-y-3">
                <div className="relative group w-full aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/90 shadow-inner">
                  <img src={image1.url} alt="Head frame preview" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out" referrerPolicy="no-referrer" />
                  <button
                    onClick={() => {
                      setImage1(null);
                      if (fileInput1Ref.current) fileInput1Ref.current.value = '';
                    }}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-black/80 hover:bg-primary/90 text-white/90 hover:text-white rounded-full border border-white/20 hover:border-primary backdrop-blur-sm shadow-sm transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-3 pt-8">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ImageIcon className="w-3 h-3 text-white/70" />
                      <span className="text-[10px] font-medium uppercase tracking-widest text-white/70">Departure · Initial Point</span>
                    </div>
                    <p className="text-xs text-white line-clamp-2 leading-relaxed">First frame of the seamless transition</p>
                  </div>
                </div>
                {!isGenerating && (
                  <button
                    onClick={() => {
                      setImage1(null);
                      if (fileInput1Ref.current) fileInput1Ref.current.value = '';
                    }}
                    className="w-full py-2.5 px-5 text-xs font-medium uppercase tracking-wider text-zinc-400 hover:text-primary transition-all bg-zinc-900 hover:bg-primary/10 border border-zinc-800 hover:border-primary/40 rounded-xl flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                    Replace Reference
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={() => !isGenerating && fileInput1Ref.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isGenerating) setDragOver1(true);
                }}
                onDragLeave={() => setDragOver1(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver1(false);
                  if (isGenerating) return;
                  const f = e.dataTransfer.files?.[0];
                  if (f) {
                    const dt = new DataTransfer();
                    dt.items.add(f);
                    handleFileChange({ target: { files: dt.files } } as any, setImage1);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`group relative aspect-video rounded-xl border border-dashed p-5 text-center cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all duration-200 ${isGenerating ? 'opacity-40 pointer-events-none' : ''} ${dragOver1 ? 'border-primary bg-primary/10 scale-[1.01] shadow-lg shadow-primary/10' : 'border-zinc-700/80 bg-zinc-900/70 hover:border-primary/50 hover:bg-primary/5'}`}
              >
                {dragOver1 && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none" />}
                <div className="relative flex flex-col items-center justify-center gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 ${dragOver1 ? 'bg-primary text-on-primary border-primary scale-110' : 'bg-zinc-800 border-zinc-700 group-hover:border-primary/50 group-hover:bg-primary/15 group-hover:scale-105'}`}>
                    <Upload className={`w-4 h-4 transition-colors ${dragOver1 ? 'text-on-primary' : 'text-zinc-300 group-hover:text-primary'}`} />
                  </div>
                  <span className={`text-xs transition-colors ${dragOver1 ? 'text-primary' : 'text-zinc-300'}`}>
                    {dragOver1 ? 'Release to upload' : <><span>Drop image here or </span><span className="underline underline-offset-4 text-primary decoration-primary/50">browse</span></>}
                  </span>
                  <span className="text-[10px] text-zinc-500">JPEG, PNG, WebP up to 10MB · First frame</span>
                </div>
              </div>
            )}
            <input type="file" ref={fileInput1Ref} onChange={(e) => handleFileChange(e, setImage1)} accept="image/*" className="hidden" />
          </div>

          {/* Tail Frame — exact Studio Build card */}
          <div className={`mb-6 p-5 rounded-2xl border transition-all duration-200 ${image2 ? 'bg-zinc-950 border-zinc-700 shadow-lg shadow-black/30' : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-semibold flex items-center justify-center shadow-sm">02</span>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Tail Frame (Out)</h3>
              </div>
              {image2 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  Configured
                </span>
              ) : (
                <span className="text-[10px] font-medium tracking-wider uppercase text-zinc-500">Required</span>
              )}
            </div>
            {image2 ? (
              <div className="space-y-3">
                <div className="relative group w-full aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/90 shadow-inner">
                  <img src={image2.url} alt="Tail frame preview" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out" referrerPolicy="no-referrer" />
                  <button
                    onClick={() => {
                      setImage2(null);
                      if (fileInput2Ref.current) fileInput2Ref.current.value = '';
                    }}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-black/80 hover:bg-primary/90 text-white/90 hover:text-white rounded-full border border-white/20 hover:border-primary backdrop-blur-sm shadow-sm transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-3 pt-8">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ImageIcon className="w-3 h-3 text-white/70" />
                      <span className="text-[10px] font-medium uppercase tracking-widest text-white/70">Arrival · Landing Point</span>
                    </div>
                    <p className="text-xs text-white line-clamp-2 leading-relaxed">Last frame of the seamless transition</p>
                  </div>
                </div>
                {!isGenerating && (
                  <button
                    onClick={() => {
                      setImage2(null);
                      if (fileInput2Ref.current) fileInput2Ref.current.value = '';
                    }}
                    className="w-full py-2.5 px-5 text-xs font-medium uppercase tracking-wider text-zinc-400 hover:text-primary transition-all bg-zinc-900 hover:bg-primary/10 border border-zinc-800 hover:border-primary/40 rounded-xl flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                    Replace Reference
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={() => !isGenerating && fileInput2Ref.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isGenerating) setDragOver2(true);
                }}
                onDragLeave={() => setDragOver2(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver2(false);
                  if (isGenerating) return;
                  const f = e.dataTransfer.files?.[0];
                  if (f) {
                    const dt = new DataTransfer();
                    dt.items.add(f);
                    handleFileChange({ target: { files: dt.files } } as any, setImage2);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`group relative aspect-video rounded-xl border border-dashed p-5 text-center cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all duration-200 ${isGenerating ? 'opacity-40 pointer-events-none' : ''} ${dragOver2 ? 'border-primary bg-primary/10 scale-[1.01] shadow-lg shadow-primary/10' : 'border-zinc-700/80 bg-zinc-900/70 hover:border-primary/50 hover:bg-primary/5'}`}
              >
                {dragOver2 && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none" />}
                <div className="relative flex flex-col items-center justify-center gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 ${dragOver2 ? 'bg-primary text-on-primary border-primary scale-110' : 'bg-zinc-800 border-zinc-700 group-hover:border-primary/50 group-hover:bg-primary/15 group-hover:scale-105'}`}>
                    <Upload className={`w-4 h-4 transition-colors ${dragOver2 ? 'text-on-primary' : 'text-zinc-300 group-hover:text-primary'}`} />
                  </div>
                  <span className={`text-xs transition-colors ${dragOver2 ? 'text-primary' : 'text-zinc-300'}`}>
                    {dragOver2 ? 'Release to upload' : <><span>Drop image here or </span><span className="underline underline-offset-4 text-primary decoration-primary/50">browse</span></>}
                  </span>
                  <span className="text-[10px] text-zinc-500">JPEG, PNG, WebP up to 10MB · Last frame</span>
                </div>
              </div>
            )}
            <input type="file" ref={fileInput2Ref} onChange={(e) => handleFileChange(e, setImage2)} accept="image/*" className="hidden" />
          </div>

          {/* Style References — exact Studio Build card 03, square well */}
          <div className={`mb-6 p-5 rounded-2xl border transition-all duration-200 ${references.length > 0 ? 'bg-zinc-950 border-zinc-700 shadow-lg shadow-black/30' : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-semibold flex items-center justify-center shadow-sm">03</span>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Style References</h3>
              </div>
              {references.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {references.length}/3 · <span className="text-zinc-400">Optional</span>
                </span>
              ) : (
                <span className="text-[10px] font-medium tracking-wider uppercase text-zinc-500">Optional</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {references.map((r, idx) => {
                const isVideo = r.mimeType.startsWith('video/');
                return (
                  <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-sm">
                    {isVideo ? (
                      <video src={r.url} className="w-full h-full object-cover" muted loop playsInline />
                    ) : (
                      <img src={r.url} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-black/70 text-white border border-white/15 backdrop-blur">
                      {isVideo ? 'Video' : 'Image'} · {String(idx + 1).padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => setReferences((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1.5 right-1.5 w-7 h-7 grid place-items-center bg-zinc-950/85 hover:bg-white text-white hover:text-black rounded-full border border-white/15 backdrop-blur opacity-0 group-hover:opacity-100 transition-all shadow-md"
                      aria-label="Remove reference"
                    >
                      <X size={11} strokeWidth={2.5} />
                    </button>
                  </div>
                );
              })}
              {references.length < 3 && (
                <button
                  onClick={() => !isGenerating && fileInputRefRef.current?.click()}
                  disabled={isGenerating}
                  className="group aspect-square rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-primary transition-all duration-200 disabled:opacity-40 p-3"
                >
                  <span className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 group-hover:bg-primary/10 group-hover:border-primary/30 grid place-items-center transition-colors shadow-sm group-hover:scale-105">
                    <Upload size={16} className="group-hover:text-primary" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-widest">Add</span>
                  <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500">Reference</span>
                </button>
              )}
            </div>
            <input type="file" ref={fileInputRefRef} onChange={handleRefFileChange} accept="image/*,video/*" className="hidden" />
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500 flex items-start gap-1.5">
              <Sparkles size={11} className="text-zinc-600 mt-0.5 shrink-0" />
              <span>References guide style & palette — never copied verbatim. Use images or short clips (max 3).</span>
            </p>
          </div>

          {/* Hint that videos live in Media Library */}
          {history.length > 0 && props.onViewAllInLibrary && (
            <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 p-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
                <History size={14} className="text-primary" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white">{history.length} take{history.length > 1 ? 's' : ''} in Media Library</p>
                <p className="text-[11px] text-zinc-500">Renders → <span className="text-zinc-300">Transitions</span> · same place as Media Library</p>
              </div>
              <button onClick={props.onViewAllInLibrary} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-primary/40 hover:text-primary hover:bg-primary/10 transition-colors">
                View <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN STAGE ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col bg-zinc-950 relative min-w-0 md:h-full md:overflow-hidden min-h-[560px] md:min-h-0 w-full md:flex-1">
        {/* Top bar */}
        <header className="h-[56px] border-b border-zinc-800 flex items-center justify-between px-4 lg:px-6 bg-zinc-950 shrink-0 gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium tracking-wide uppercase text-[11px]">Pipeline · Gemini Omni 1.1 Flash</span>
            {segments.length > 0 && <span className="text-zinc-700">·</span>}
            {segments.length > 0 && <span className="text-zinc-300 font-medium">{segments.length * 10}s generated</span>}
            {history.length > 0 && <span className="hidden lg:inline-flex items-center gap-1.5 ml-2 pl-2 border-l border-zinc-800 text-[11px] text-zinc-400"><History size={11} /> {history.length} in Library</span>}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setTechniqueSheetOpen(true)}
              className="md:hidden inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-primary/40 hover:text-primary active:scale-[0.98] transition-colors"
            >
              <SlidersHorizontal size={12} /> Techniques
            </button>
            <button
              onClick={handleStartOver}
              disabled={isGenerating || (!image1 && !image2 && references.length === 0 && segments.length === 0 && !prompt && !technique)}
              className="hidden lg:inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-primary hover:bg-primary/10 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-zinc-900 disabled:hover:text-zinc-400 disabled:hover:border-zinc-800 disabled:hover:shadow-none"
              title="Reset frames, prompts, and active sequence"
            >
              <RotateCcw size={13} strokeWidth={2} />
              Start Over
            </button>
            <button
              id="transition-technique-toggle"
              onClick={() => setTechniquePanelOpen((o) => !o)}
              aria-pressed={techniquePanelOpen}
              aria-label={techniquePanelOpen ? 'Collapse technique panel' : 'Expand technique panel'}
              title={techniquePanelOpen ? 'Collapse technique panel' : 'Expand technique panel'}
              className={`hidden md:flex w-8 h-8 items-center justify-center rounded-lg border transition-colors ${techniquePanelOpen ? 'border-primary/60 bg-primary/10 text-primary hover:bg-primary/20' : 'border-zinc-700 bg-zinc-800 text-zinc-500 hover:border-primary/50 hover:text-primary'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              disabled={segments.length === 0 || isGenerating}
              className="hidden lg:inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-on-primary shadow-lg shadow-primary/20 hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:shadow-lg"
            >
              <Download size={13} strokeWidth={2.5} />
              {segments.length > 1 ? 'Export Takes' : 'Export Sequence'}
            </button>
          </div>
        </header>

        {/* Video Canvas */}
        <div className="flex-1 min-h-0 p-4 lg:p-6 flex flex-col items-center justify-center relative overflow-hidden bg-zinc-950">
          <div className="w-full h-full max-w-5xl flex flex-col items-center justify-center min-h-0 gap-3">
            <div className="relative flex-1 min-h-0 w-full flex items-center justify-center">
              <div className="h-full aspect-video max-w-full max-h-full bg-zinc-900 rounded-2xl overflow-hidden relative flex items-center justify-center group w-full">
                {segments.length > 0 && segments[selectedSegmentIndex] ? (
                  <video src={segments[selectedSegmentIndex].url} className="w-full h-full object-cover" autoPlay loop controls playsInline />
                ) : (
                  <div className="text-center p-8 flex flex-col items-center justify-center gap-4 max-w-md">
                    <span className="w-14 h-14 rounded-2xl bg-zinc-800 grid place-items-center text-zinc-400">
                      <Film size={22} strokeWidth={1.5} />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white tracking-tight">Load Departure and Arrival Frames</div>
                      <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mt-1.5">
                        Omni 1.1 bridges both frames into a single, uncut cinematic trajectory. Pick two images, choose a technique, and render a seamless transition.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ${image1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${image1 ? 'bg-emerald-400' : 'bg-zinc-600'}`} /> Head Frame
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ${image2 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${image2 ? 'bg-emerald-400' : 'bg-zinc-600'}`} /> Tail Frame
                      </span>
                    </div>
                  </div>
                )}

                {isGenerating && (
                  <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-zinc-800 border-t-primary animate-spin" />
                        <span className="absolute inset-0 grid place-items-center">
                          <Sparkles size={14} className="text-primary" />
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-bold tracking-wider text-white block uppercase">{generatingLabel}</span>
                        <span className="text-[11px] text-zinc-500">Synthesizing motion trajectory and optical physics</span>
                      </div>
                    </div>
                  </div>
                )}

                {segments.length > 0 && !isGenerating && (
                  <>
                    <span className="pointer-events-none absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/15 rounded-tl-lg" />
                    <span className="pointer-events-none absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/15 rounded-tr-lg" />
                    <span className="pointer-events-none absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white/15 rounded-bl-lg" />
                    <span className="pointer-events-none absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white/15 rounded-br-lg" />
                  </>
                )}
              </div>
            </div>

            {!isGenerating && segments.length > 0 && selectedSegmentIndex === segments.length - 1 && (
              <div className="flex items-center gap-2.5 w-full max-w-3xl shrink-0">
                <input
                  type="text"
                  value={extendPrompt}
                  onChange={(e) => setExtendPrompt(e.target.value)}
                  placeholder="Extension notes (lighting, velocity, continuation)…"
                  className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-primary outline-none rounded-xl text-xs text-white placeholder:text-zinc-500 px-3.5 py-2.5 transition-colors"
                />
                <button
                  onClick={handleExtend}
                  className="bg-primary hover:bg-primary-hover text-on-primary font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all shrink-0 uppercase tracking-wider active:scale-[0.98]"
                >
                  Extend +10s <ArrowRight size={12} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="absolute top-[64px] left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-lg bg-red-950/90 border border-red-800/50 text-red-200 px-4 py-3 rounded-xl text-xs backdrop-blur-md shadow-2xl z-30 flex items-start gap-3">
            <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
            <span className="flex-1 leading-relaxed">{error}</span>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-white p-1 -mr-1">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── CONTROL CONSOLE ──────────────────────────────────────────── */}
        <div className="p-4 lg:px-6 lg:py-4 border-t border-zinc-800 bg-zinc-900 shrink-0">
          {segments.length > 0 && (
            <div className="max-w-5xl mx-auto mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 grid place-items-center">
                    <Film size={11} className="text-zinc-500" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">Timeline</span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {segments.length} segment{segments.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-mono font-bold text-zinc-200">
                    <Clock size={11} className="text-zinc-500" />
                    {`00:${(segments.length * 10).toString().padStart(2, '0')}`}
                  </span>
                  <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Total duration</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[10px] font-mono font-bold text-zinc-500 tabular-nums">00:00</span>
                <div className="flex-1 flex h-9 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-1 gap-1.5 shadow-inner">
                  {segments.map((seg, idx) => {
                    const isActive = selectedSegmentIndex === idx;
                    const label = seg.kind === 'transition' ? `Take ${String(idx + 1).padStart(2, '0')}` : `Extend ${String(idx).padStart(2, '0')}`;
                    const sub = '10s';
                    return (
                      <button
                        key={idx}
                        onClick={() => !isGenerating && setSelectedSegmentIndex(idx)}
                        className={`group flex-1 h-full rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-0.5 px-2 border ${
                          isActive
                            ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:border-zinc-600 hover:text-white'
                        }`}
                      >
                        <span className="text-[11px] font-bold tracking-wider uppercase leading-none flex items-center gap-1">
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                          {label}
                        </span>
                        <span className={`text-[9px] font-mono leading-none ${isActive ? 'text-white/80' : 'text-zinc-500 group-hover:text-zinc-400'}`}>{sub}</span>
                      </button>
                    );
                  })}
                </div>
                <span className="hidden sm:inline text-[10px] font-mono font-bold text-zinc-400 tabular-nums">{`00:${(segments.length * 10).toString().padStart(2, '0')}`}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-600">
                <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 rounded-full bg-zinc-700" /> Start</span>
                <span className="flex items-center gap-1.5">End <span className="w-2 h-0.5 rounded-full bg-zinc-700" /></span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── RIGHT: Transition Technique — exact Studio Build panel, collapsible ────── */}
      <aside
        id="technique-panel"
        className={`hidden md:flex md:shrink-0 flex-col border-l border-zinc-800 bg-zinc-900 transition-[width] duration-300 ease-in-out overflow-hidden ${
          techniquePanelOpen ? 'md:w-[340px]' : 'md:w-0 border-l-0'
        }`}
      >
        <div className={techniquePanelOpen ? 'w-[340px] h-full min-h-0 flex flex-col' : 'w-0 h-full min-h-0 flex flex-col'}>
          <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 shrink-0 rounded-lg bg-zinc-800 border border-zinc-700 grid place-items-center">
                <SlidersHorizontal className="w-4 h-4 text-zinc-300" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white leading-tight">Transition Technique</h3>
                <p className="text-[11px] text-zinc-500 leading-tight">6 moves · single uncut shot</p>
              </div>
            </div>
            <button
              onClick={() => setTechnique(null)}
              disabled={!technique}
              title="Clear selection"
              className="w-8 h-8 shrink-0 grid place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-primary hover:bg-primary/10 hover:border-primary/40 disabled:opacity-30 transition-colors"
            >
              <RotateCcw size={13} />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar p-5 space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Technique</p>
              <div className="flex flex-wrap gap-1.5">
                {TRANSITIONS.map((t) => {
                  const isActive = technique === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTechnique(isActive ? null : t.id)}
                      disabled={isGenerating}
                      title={t.hint}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-all disabled:opacity-30 font-medium tracking-wide ${isActive ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-[1.02]' : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-primary/50 hover:text-primary hover:bg-primary/10'}`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
              {technique ? (
                <div className="mt-3 rounded-xl bg-zinc-950 border border-zinc-800 p-3">
                  <p className="text-[11px] leading-relaxed text-zinc-300">{TRANSITIONS.find((t) => t.id === technique)?.hint}</p>
                </div>
              ) : (
                <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">Pick one — or leave empty for <span className="text-zinc-300">Director’s Choice</span> (AI picks best move).</p>
              )}
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5"><Sparkles size={11} className="text-zinc-600" /> How it works</p>
              <ul className="space-y-2 text-[11px] leading-relaxed text-zinc-500 list-disc list-inside marker:text-zinc-600">
                <li>Single continuous camera move — no cuts.</li>
                <li>Starts exactly on Head Frame, ends on Tail Frame.</li>
                <li>Style References guide look, never copied.</li>
              </ul>
            </div>
            {/* Direction Note — moved to right panel */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center">
                    <Wand2 size={13} className="text-primary" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-200">Direction Note</p>
                    <p className="text-[11px] text-zinc-500">Camera pace, lighting, mood</p>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-1 rounded-full border ${prompt.trim().length > 0 ? 'bg-primary/10 border-primary/25 text-primary' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                  {prompt.trim().length}
                </span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                rows={4}
                placeholder="Describe the move — e.g. “slow push-in, warm golden hour, shallow depth of field, gentle drift. Keep motion continuous, no cuts.”"
                className="w-full min-h-[96px] max-h-[160px] bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-3 text-xs leading-relaxed text-white placeholder:text-zinc-500 outline-none resize-none focus:border-primary/40 focus:bg-zinc-950 transition-colors disabled:opacity-40"
              />
              <p className="text-[11px] text-zinc-500 leading-relaxed flex items-center gap-1.5">
                <Sparkles size={11} className="text-zinc-600" />
                {technique ? `${TRANSITIONS.find((t) => t.id === technique)?.name} will lead` : 'Director’s Choice if empty'}
              </p>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                title={!image1 || !image2 ? 'Select both frames first' : !prompt.trim() && !technique ? 'Pick a technique or add a direction note' : undefined}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold text-xs px-6 py-3 rounded-lg inline-flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider shadow-lg shadow-primary/20 active:scale-[0.98]"
              >
                <span>Render Transition</span>
                <ArrowRight size={13} strokeWidth={2.5} />
              </button>
              <p className="text-center text-[10px] text-zinc-600">Takes appear in <span className="text-zinc-400">Renders → Transitions</span></p>
            </div>
            {technique && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-medium text-primary">{TRANSITIONS.find((t) => t.id === technique)?.name} active</span>
              </div>
            )}
          </div>
          <div className="shrink-0 p-3 border-t border-zinc-800 bg-zinc-950">
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ready</span>
              <span className="font-mono text-zinc-400">{technique ? TRANSITIONS.find((t) => t.id === technique)?.name : 'Director’s Choice'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Technique Sheet */}
      {techniqueSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setTechniqueSheetOpen(false)} />
          <div className="relative flex h-[78vh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-zinc-700 bg-zinc-900 shadow-2xl shadow-black">
            <div className="relative shrink-0 px-5 pb-2 pt-3">
              <span className="mx-auto block h-1 w-10 rounded-full bg-zinc-700" />
              <button type="button" onClick={() => setTechniqueSheetOpen(false)} aria-label="Close techniques" className="absolute right-4 top-3 grid h-8 w-8 place-items-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400">
                <X className="h-4 w-4" />
              </button>
              <div className="mt-4 flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 grid place-items-center"><SlidersHorizontal className="w-4 h-4 text-zinc-300" /></span>
                <div>
                  <h3 className="text-sm font-semibold text-white">Transition Technique</h3>
                  <p className="text-[11px] text-zinc-500">6 moves · single uncut shot</p>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar p-5 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {TRANSITIONS.map((t) => {
                  const isActive = technique === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTechnique(isActive ? null : t.id)}
                      disabled={isGenerating}
                      className={`px-3 py-1.5 rounded-lg text-xs border font-medium ${isActive ? 'bg-primary border-primary text-white' : 'border-zinc-700 bg-zinc-950 text-zinc-400'}`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
              {technique && <p className="text-[11px] leading-relaxed text-zinc-300 p-3 rounded-xl bg-zinc-950 border border-zinc-800">{TRANSITIONS.find((t) => t.id === technique)?.hint}</p>}
              <button
                onClick={() => setTechniqueSheetOpen(false)}
                className="w-full rounded-xl bg-primary py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
