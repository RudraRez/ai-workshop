"use client";

import * as React from "react";
import {
  ArrowLeft,
  Check,
  Headphones,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { AUDIO_LANGUAGES } from "@/lib/types";
import { useAudioOverview } from "@/lib/hooks";

interface AudioOverviewViewProps {
  lessonId: string;
  onBack: () => void;
}

export function AudioOverviewView({ lessonId, onBack }: AudioOverviewViewProps) {
  const { data: overview } = useAudioOverview(lessonId);
  const [language, setLanguage] = React.useState("en-IN");
  const [playing, setPlaying] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(262);

  const duration = overview?.durationSec ?? 0;

  React.useEffect(() => {
    if (!playing || !duration) return;
    const id = setInterval(() => {
      setElapsed((t) => (t + 1 >= duration ? 0 : t + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [playing, duration]);

  if (!overview) return null;

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
        <Waveform heights={overview.waveform} playing={playing} />
        <div className="mt-3 text-center">
          <p className="text-sm font-semibold text-foreground">
            {overview.title}
          </p>
          <p className="mt-1 text-[11px] font-medium text-emerald-400">
            {overview.subtitle}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => setElapsed(0)}
            aria-label="Restart"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
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
            aria-label="Regenerate"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RefreshCw className="size-4" />
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
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className="px-3 pt-5 sm:px-4">
        <p className="px-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
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
                <Check
                  className="size-4 text-emerald-300"
                  aria-label="Selected"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Waveform({
  heights,
  playing,
}: {
  heights: number[];
  playing: boolean;
}) {
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
