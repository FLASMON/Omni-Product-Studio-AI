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
          ? 'bg-zinc-900/40 border-zinc-700/60 shadow-lg shadow-black/20'
          : 'bg-zinc-900/25 border-zinc-800/80 hover:border-zinc-750'
      }`}
    >
      {/* CARD HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {stepNumber && (
            <span className="w-5 h-5 rounded-md bg-zinc-800/90 border border-zinc-700/60 text-zinc-300 font-mono text-[11px] font-bold flex items-center justify-center">
              {stepNumber}
            </span>
          )}
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono flex items-center gap-2">
            <span>{title}</span>
          </h2>
        </div>

        {hasSelection ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Configured
          </span>
        ) : generating ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-amber-300 bg-amber-950/40 border border-amber-800/50">
            <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            Generating...
          </span>
        ) : (
          <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500">
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
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              referrerPolicy="no-referrer"
            />

            {!disabled && (
              <button
                id={`remove-${type}-image-btn`}
                onClick={handleClear}
                className="absolute top-2.5 right-2.5 p-1.5 bg-black/80 hover:bg-red-950/80 text-zinc-400 hover:text-red-300 rounded-full transition-colors border border-zinc-800 hover:border-red-800/80 backdrop-blur-sm"
                aria-label="Remove image"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-3 pt-6">
              <div className="flex items-center gap-1.5 mb-1">
                <ImageIcon className="w-3 h-3 text-zinc-400" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  {selection.source === 'upload' ? 'Custom Upload' : 'Selected Preset'}
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-200 line-clamp-2 leading-relaxed">
                {selection.description}
              </p>
            </div>
          </div>

          {!disabled && (
            <button
              id={`reset-${type}-btn`}
              onClick={handleClear}
              className="w-full py-2.5 px-5 font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-zinc-100 transition-all bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 rounded-xl flex items-center justify-center gap-2"
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
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Prompt Directive</span>
              <span className="text-zinc-600 font-normal">AI Generation</span>
            </label>
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
              className="w-full bg-zinc-950/80 border border-zinc-800/90 text-zinc-100 p-3.5 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-zinc-500/50 focus:border-zinc-600 rounded-xl resize-none placeholder:text-zinc-600 transition-all shadow-inner"
            />
          </div>

          {/* SUGGESTION CHIPS */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
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
                    className={`px-3 py-1.5 text-[11px] font-mono rounded-lg border transition-all duration-150 ${
                      isSelected
                        ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold shadow-sm'
                        : 'bg-zinc-950/60 text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-900/50'
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
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-150 shadow-sm active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-100"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Generating {type}...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-zinc-950" />
                <span>Render {type} reference</span>
              </>
            )}
          </button>

          {/* DIVIDER */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-800/80"></div>
            <span className="flex-shrink mx-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              or upload file
            </span>
            <div className="flex-grow border-t border-zinc-800/80"></div>
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
            className={`group border border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
              dragging
                ? 'border-zinc-400 bg-zinc-800/50 scale-[1.01]'
                : 'border-zinc-800/90 hover:border-zinc-700 bg-zinc-950/30 hover:bg-zinc-900/30'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700 group-hover:scale-105 transition-all">
                <Upload className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
              </div>
              <span className="font-mono text-xs text-zinc-300 group-hover:text-white transition-colors">
                Drop image here or <span className="underline underline-offset-4 text-zinc-400 group-hover:text-zinc-200">browse</span>
              </span>
              <span className="font-mono text-[10px] text-zinc-600">
                JPEG, PNG, WebP up to 10MB
              </span>
            </div>
          </div>

          {error && (
            <div className="text-xs font-mono text-red-300 bg-red-950/30 border border-red-900/50 p-3 rounded-xl flex items-start gap-2">
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
