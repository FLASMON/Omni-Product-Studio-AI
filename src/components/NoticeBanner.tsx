import React from 'react';
import { AlertTriangle, KeyRound, X, ExternalLink } from 'lucide-react';

interface NoticeBannerProps {
  onDismiss?: () => void;
  className?: string;
}

export const OMNI_QUOTA_NOTICE_TEXT =
  'Gemini Omni Flash video generation requires a Gemini API key with billing enabled (paid tier), as the free tier has a quota limit of 0 for video models. Please select or configure a paid API key in AI Studio.';

/**
 * Top Notice banner displayed across the application header or workspace.
 */
export function NoticeBanner({ onDismiss, className = '' }: NoticeBannerProps) {
  return (
    <div
      id="omni-paid-tier-notice-banner"
      role="region"
      aria-label="Billing notice"
      className={`shrink-0 border-b border-amber-500/25 bg-amber-500/[0.08] dark:bg-amber-500/[0.07] px-4 md:px-6 py-2.5 transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
          <span className="shrink-0 mt-0.5 sm:mt-0 flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/35 text-amber-500 dark:text-amber-400">
            <KeyRound className="w-3 h-3" />
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
              Notice
            </span>
            <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
              {OMNI_QUOTA_NOTICE_TEXT}
            </span>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            id="dismiss-notice-banner-btn"
            onClick={onDismiss}
            aria-label="Dismiss notice"
            title="Dismiss notice"
            className="shrink-0 p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-amber-500/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

interface NoticeCardProps {
  className?: string;
  compact?: boolean;
}

/**
 * Embedded Notice card for the builder sidebar or empty viewport state.
 */
export function NoticeCard({ className = '', compact = false }: NoticeCardProps) {
  return (
    <div
      id="omni-paid-tier-notice-card"
      className={`rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3.5 text-left transition-all ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <span className="shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-500 dark:text-amber-400">
          <AlertTriangle className="w-3 h-3" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
              Notice
            </span>
            {!compact && (
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300/80">
                Paid Tier Requirement
              </span>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300 font-normal">
            {OMNI_QUOTA_NOTICE_TEXT}
          </p>
        </div>
      </div>
    </div>
  );
}
