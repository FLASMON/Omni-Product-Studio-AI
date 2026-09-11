import React, { useRef, useState } from 'react';
import { Plus, X, Loader2, Upload, Sparkles, CheckCircle2, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { SuggestionChip, MediaSelection } from '../data.js';
import { fileToDownscaledDataUrl } from '../images.js';

interface ImageUploaderProps {
  title: string;
  type: 'product' | 'atmosphere';
  stepNumber?: string;
  suggestions: SuggestionChip[];
  selection: MediaSelection | null;
  onSelect: React.Dispatch<React.SetStateAction<MediaSelection | null>>;
  disabled?: boolean;
}

export function ImageUploader({
  title,
  type,
  stepNumber,
  suggestions,
  selection,
  onSelect,
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChipClick = (suggestion: SuggestionChip) => {
    setPromptText(suggestion.prompt);
    setError(null);
  };

  const handleGenerate = async () => {
    const prompt = promptText.trim();
    if (!prompt) {
      setError('Please write or select a prompt first.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.imageUrl) {
        onSelect({
          id: `generated-${Date.now()}`,
          source: 'upload',
          images: [data.imageUrl],
          description: prompt,
        });
      } else {
        throw new Error('Image URL not returned from backend');
      }
    } catch (err: any) {
      console.error('Error in image generation:', err);
      setError(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleFiles = async (fileList: FileList | null) => {
    const picked = Array.from(fileList ?? []).filter((f) =>
      f.type.startsWith('image/')
    );
    if (picked.length === 0) return;

    try {
      const dataUrl = await fileToDownscaledDataUrl(picked[0]);
      onSelect({
        id: `upload-${Date.now()}`,
        source: 'upload',
        images: [dataUrl],
        description: `Uploaded reference photo`,
      });
      setError(null);
    } catch (err: any) {
      setError('Failed to process uploaded file.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleClear = () => {
    onSelect(null);
    setError(null);
  };

  const hasSelection = !!selection && selection.images.length > 0;

  return (
    <div
      id={`${type}-uploader-card`}
      className={`mb-6 p-5 rounded-2xl border transition-all duration-200 ${
        hasSelection
          ? 'bg-zinc-950 border-zinc-700 shadow-lg shadow-black/30'
          : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* CARD HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {stepNumber && (
            <span className="w-5 h-5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-semibold flex items-center justify-center shadow-sm">
              {stepNumber}
            </span>
          )}
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
            <span>{title}</span>
          </h2>
        </div>

        {hasSelection ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Configured
          </span>
        ) : generating ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30">
            <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            Generating...
          </span>
        ) : (
          <span className="text-[10px] font-medium tracking-wider uppercase text-zinc-500">
            Required
          </span>
        )}
      </div>

      {hasSelection ? (
        /* CONFIGURED SELECTION VIEW */
        <div className="space-y-3">
          <div className="relative group w-full aspect-[4/3] rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/90 shadow-inner">
            <img
              src={selection.images[0]}
              alt={selection.description}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
              referrerPolicy="no-referrer"
            />

            {!disabled && (
              <button
                id={`remove-${type}-image-btn`}
                onClick={handleClear}
                className="absolute top-2.5 right-2.5 p-1.5 bg-black/80 hover:bg-red-950/80 text-zinc-400 hover:text-red-300 rounded-full transition-colors border border-zinc-700 hover:border-red-800/80 backdrop-blur-sm shadow-sm"
                aria-label="Remove image"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-3 pt-8">
              <div className="flex items-center gap-1.5 mb-1">
                <ImageIcon className="w-3 h-3 text-zinc-400" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                  {selection.source === 'upload' ? 'Custom Upload' : 'Selected Preset'}
                </span>
              </div>
              <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed">
                {selection.description}
              </p>
            </div>
          </div>

          {!disabled && (
            <button
              id={`reset-${type}-btn`}
              onClick={handleClear}
              className="w-full py-2.5 px-5 text-xs font-medium uppercase tracking-wider text-zinc-400 hover:text-zinc-100 transition-all bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
              Replace Reference
            </button>
          )}
        </div>
      ) : (
        /* UNCONFIGURED INPUT VIEW */
        <div className="space-y-4">
          {/* PROMPT TEXTAREA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <label htmlFor={`${type}-prompt-input`} className="uppercase tracking-wider text-zinc-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-zinc-400" />
                <span>Prompt Directive</span>
              </label>
              <span className="text-[10px] text-zinc-500 font-normal">AI Synthesis</span>
            </div>
            <div className="relative">
              <textarea
                id={`${type}-prompt-input`}
                value={promptText}
                onChange={(e) => {
                  setPromptText(e.target.value);
                  setError(null);
                }}
                disabled={disabled || generating}
                placeholder={`Describe desired ${type} (e.g., "${type === 'product' ? 'ceramic tumbler with matte textured glaze' : 'sunlit travertine plinth with warm palms'}"...)`}
                rows={3}
                className="w-full bg-zinc-950 hover:bg-zinc-950 focus:bg-zinc-950 border border-zinc-800 hover:border-zinc-600 focus:border-zinc-500 text-zinc-100 p-4 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-white/15 rounded-xl resize-none placeholder:text-zinc-600 transition-all shadow-inner disabled:opacity-60"
              />
            </div>
          </div>

          {/* SUGGESTION CHIPS */}
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Curated Presets
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((item) => {
                const isSelected = promptText === item.prompt;
                return (
                  <button
                    id={`chip-${item.id}`}
                    key={item.id}
                    onClick={() => handleChipClick(item)}
                    disabled={disabled || generating}
                    className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all duration-150 ${
                      isSelected
                        ? 'bg-white text-zinc-950 border-white font-semibold shadow-md shadow-white/10 scale-[1.02]'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GENERATE BUTTON */}
          <button
            id={`generate-${type}-btn`}
            onClick={handleGenerate}
            disabled={disabled || generating || !promptText.trim()}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-150 shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-white/10 active:scale-[0.98] border border-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:shadow-none"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Generating {type}...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-zinc-950" />
                <span>Generate {type} reference</span>
              </>
            )}
          </button>

          {/* DIVIDER */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-3 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
              or upload file
            </span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          {/* DRAG AND DROP UPLOAD ZONE */}
          <div
            id={`dropzone-${type}`}
            onClick={() => !generating && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (!generating) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (!generating) handleFiles(e.dataTransfer.files);
            }}
            role="button"
            tabIndex={0}
            className={`group relative border border-dashed rounded-xl p-5 text-center transition-all duration-200 cursor-pointer overflow-hidden ${
              dragging
                ? 'border-zinc-300 bg-zinc-800/80 scale-[1.01] shadow-lg shadow-white/5'
                : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950/70 hover:bg-zinc-900'
            }`}
          >
            {/* Glow halo behind the icon while dragging */}
            {dragging && (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none" />
            )}
            <div className="relative flex flex-col items-center justify-center gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 ${
                dragging
                  ? 'bg-white text-zinc-950 border-white scale-110'
                  : 'bg-zinc-900 border-zinc-800 group-hover:border-zinc-600 group-hover:bg-zinc-800 group-hover:scale-105'
              }`}>
                <Upload className={`w-4 h-4 transition-colors ${
                  dragging ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-200'
                }`} />
              </div>
              <span className={`text-xs transition-colors ${
                dragging ? 'text-white' : 'text-zinc-300 group-hover:text-white'
              }`}>
                {dragging
                  ? 'Release to upload'
                  : <>Drop image here or <span className="underline underline-offset-4 text-zinc-400 group-hover:text-zinc-200">browse</span></>}
              </span>
              <span className="text-[10px] text-zinc-600">
                JPEG, PNG, WebP up to 10MB
              </span>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-300 bg-red-950/40 border border-red-900/60 p-3 rounded-xl flex items-start gap-2">
              <span className="text-red-400 shrink-0">✕</span>
              <p className="leading-relaxed">{error}</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
