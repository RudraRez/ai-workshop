"use client";

import * as React from "react";
import { Pause, Play, Maximize2, Volume2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatTime, cn } from "@/lib/utils";

interface LessonPlayerProps {
  durationSec: number;
  videoUrl?: string;
}

function extractYoutubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (url.hostname.endsWith("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
    }
  } catch {
    return null;
  }
  return null;
}

export function LessonPlayer({ durationSec, videoUrl }: LessonPlayerProps) {
  const youtubeId = React.useMemo(
    () => (videoUrl ? extractYoutubeId(videoUrl) : null),
    [videoUrl],
  );

  if (youtubeId) return <YoutubePlayer videoId={youtubeId} />;
  return <MockPlayer durationSec={durationSec} />;
}

function YoutubePlayer({ videoId }: { videoId: string }) {
  return (
    <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden bg-black">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
        title="Lesson video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="aspect-video h-full max-h-full w-full max-w-full border-0"
      />
    </div>
  );
}

function MockPlayer({ durationSec }: { durationSec: number }) {
  const [playing, setPlaying] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(783);

  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setElapsed((t) => (t + 1 > durationSec ? durationSec : t + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [playing, durationSec]);

  const percent = (elapsed / durationSec) * 100;

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#0a0a0f]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at center, rgba(140,100,255,0.08) 0%, rgba(10,10,15,1) 55%)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><rect width=%2240%22 height=%2240%22 fill=%22none%22/><circle cx=%221%22 cy=%221%22 r=%220.6%22 fill=%22rgba(255,255,255,0.04)%22/></svg>')] opacity-70"
        />

        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => setPlaying((p) => !p)}
          className={cn(
            "group relative inline-flex size-16 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md ring-1 ring-white/25 transition-all",
            "hover:scale-105 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40",
            "sm:size-20",
          )}
        >
          {playing ? (
            <Pause className="size-7 sm:size-8" aria-hidden />
          ) : (
            <Play className="ml-1 size-7 sm:size-8" aria-hidden />
          )}
        </button>

        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="flex items-center gap-3 bg-[#0a0a0f] px-3 pb-2.5 pt-2 text-white/90 sm:px-4">
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => setPlaying((p) => !p)}
          className="inline-flex size-7 items-center justify-center rounded-full text-white/90 hover:text-white"
        >
          {playing ? (
            <Pause className="size-4" aria-hidden />
          ) : (
            <Play className="ml-0.5 size-4" aria-hidden />
          )}
        </button>
        <span className="text-[11px] tabular-nums text-white/80">
          {formatTime(elapsed)} / {formatTime(durationSec)}
        </span>
        <div className="mx-1 flex-1">
          <Progress
            value={percent}
            className="h-1 bg-white/15"
            aria-label="Playback progress"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Volume"
          className="size-7 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <Volume2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fullscreen"
          className="size-7 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <Maximize2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
