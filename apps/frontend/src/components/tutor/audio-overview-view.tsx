"use client";

import * as React from "react";
import {
  ArrowLeft,
  Check,
  Headphones,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { AUDIO_LANGUAGES } from "@/lib/types";
import type { LessonForAi } from "@/lib/types";
import { useAudioOverview, useGenerateAudioOverview } from "@/lib/hooks";
import { API_BASE_URL } from "@/lib/api-client";

interface AudioOverviewViewProps {
  lesson: LessonForAi;
  onBack: () => void;
}

export function AudioOverviewView({ lesson, onBack }: AudioOverviewViewProps) {
  const { latest } = useAudioOverview(lesson.id);
  const {
    mutate: generate,
    isPending,
    error,
  } = useGenerateAudioOverview(lesson);

  const [language, setLanguage] = React.useState("en-IN");
  const [playing, setPlaying] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const audioSrc = latest ? `${API_BASE_URL}${latest.audioUrl}` : null;

  React.useEffect(() => {
    setPlaying(false);
    setElapsed(0);
    setDuration(latest?.durationSec ?? 0);
  }, [latest?.id, latest?.durationSec]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  };

  const handleGenerate = () => {
    generate({ language, voiceStyle: "narrator" });
  };

  const pct = duration ? (elapsed / duration) * 100 : 0;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-y-auto overflow-x-hidden scrollbar-thin">
      <div className="flex items-center gap-2 px-3 pt-3 sm:px-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Studio"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span
          className="flex size-9 items-center justify-center rounded-lg bg-emerald-500 text-white"
          aria-hidden
        >
          <Headphones className="size-[18px]" />
        </span>
        <h2 className="text-base font-semibold text-foreground">
          Audio Overview
        </h2>
      </div>

      <div className="mx-3 mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:mx-4">
        {audioSrc ? (
          <>
            <audio
              ref={audioRef}
              src={audioSrc}
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              onTimeUpdate={(e) => setElapsed(Math.floor(e.currentTarget.currentTime))}
              onLoadedMetadata={(e) => {
                const dur = e.currentTarget.duration;
                if (Number.isFinite(dur) && dur > 0) setDuration(Math.floor(dur));
              }}
            />
            <Waveform playing={playing} />
            <div className="mt-3 text-center">
              <p className="text-sm font-semibold text-foreground">
                {latest!.title}
              </p>
              <p className="mt-1 text-[11px] font-medium text-emerald-400">
                {lesson.title}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => {
                  if (audioRef.current) audioRef.current.currentTime = 0;
                  setElapsed(0);
                }}
                aria-label="Restart"
                className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <RotateCcw className="size-4" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
                className="inline-flex size-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-[6px] ring-emerald-500/15 transition-transform hover:scale-[1.04] active:scale-95"
              >
                {playing ? (
                  <Pause className="size-5" />
                ) : (
                  <Play className="ml-0.5 size-5" />
                )}
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isPending}
                aria-label="Regenerate"
                className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
              </button>
            </div>
            <div className="mt-5">
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-[width]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] font-medium tabular-nums text-muted-foreground">
                <span>{formatTime(elapsed)}</span>
                <span>{formatTime(duration || latest!.durationSec)}</span>
              </div>
            </div>
          </>
        ) : (
          <EmptyPlayer
            isPending={isPending}
            language={language}
            onGenerate={handleGenerate}
          />
        )}
      </div>

      {error && (
        <p className="mx-3 mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive sm:mx-4">
          {error.message}
        </p>
      )}

      <div className="px-3 pt-5 sm:px-4">
        <p className="px-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Select Language
        </p>
      </div>
      <div className="space-y-1.5 px-3 pb-4 pt-2 sm:px-4">
        {AUDIO_LANGUAGES.map((lang) => {
          const selected = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              aria-pressed={selected}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
                selected
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                  : "border-border bg-card text-foreground hover:bg-accent",
              )}
            >
              <span>{lang.label}</span>
              {selected && (
                <Check className="size-4 text-emerald-300" aria-label="Selected" />
              )}
            </button>
          );
        })}
      </div>

      {audioSrc && (
        <div className="px-3 pb-4 sm:px-4">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Regenerate in{" "}
            {AUDIO_LANGUAGES.find((l) => l.code === language)?.label}
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyPlayer({
  isPending,
  language,
  onGenerate,
}: {
  isPending: boolean;
  language: string;
  onGenerate: () => void;
}) {
  const label = AUDIO_LANGUAGES.find((l) => l.code === language)?.label ?? "";
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
        <Headphones className="size-6" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          Generate your first AI-narrated podcast
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Gemini writes the script · Google TTS voices it in {label}.
        </p>
      </div>
      <button
        type="button"
        onClick={onGenerate}
        disabled={isPending}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Generate in {label}
          </>
        )}
      </button>
    </div>
  );
}

function Waveform({ playing }: { playing: boolean }) {
  const heights = React.useMemo(() => {
    return Array.from({ length: 21 }, (_, i) => {
      const x = (i / 20) * Math.PI * 2;
      const a = Math.abs(
        Math.sin(x) * 0.55 + Math.sin(x * 2.4) * 0.35 + Math.sin(x * 5) * 0.12,
      );
      return Math.round(25 + a * 75);
    });
  }, []);
  return (
    <div
      className="flex h-16 items-center justify-center gap-1"
      aria-hidden
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-full bg-emerald-400",
            playing && "animate-pulse",
          )}
          style={{
            height: `${h}%`,
            animationDelay: `${i * 40}ms`,
            animationDuration: "1.2s",
          }}
        />
      ))}
    </div>
  );
}
