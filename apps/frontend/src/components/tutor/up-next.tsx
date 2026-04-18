"use client";

import { Play } from "lucide-react";
import { mockUpNext } from "@/lib/mock-data";
import type { UpNextVideo } from "@/lib/types";

export function UpNext() {
  return (
    <section className="border-t border-border bg-muted/30 px-3 py-4 sm:px-4">
      <h3 className="text-sm font-semibold text-foreground">Up Next</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {mockUpNext.map((v) => (
          <UpNextCard key={v.id} video={v} />
        ))}
      </div>
    </section>
  );
}

function UpNextCard({ video }: { video: UpNextVideo }) {
  return (
    <button
      type="button"
      className="group flex flex-col text-left"
      aria-label={`Play ${video.title}`}
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-violet-500/20 via-indigo-500/15 to-sky-500/20 ring-1 ring-border transition-transform group-hover:-translate-y-0.5 group-hover:ring-primary/50">
        <span className="flex size-11 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg transition-transform group-hover:scale-105">
          <Play className="ml-0.5 size-5 fill-current" aria-hidden />
        </span>
        <span className="absolute inset-x-3 top-1/2 mt-8 line-clamp-2 text-center text-[11px] font-medium text-violet-900/80 dark:text-violet-200/80">
          {video.title}
        </span>
        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
          {video.durationLabel}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">
        {video.title}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{video.module}</p>
    </button>
  );
}
