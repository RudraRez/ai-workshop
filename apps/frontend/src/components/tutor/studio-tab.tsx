"use client";

import {
  Headphones,
  Layers,
  Video,
  Map,
  FileText,
  WalletCards,
  CircleHelp,
  BarChart3,
  Table2,
  PencilLine,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AUDIO_LANGUAGES } from "@/lib/types";
import { studioGenerators } from "@/lib/mock-data";
import type { StudioGenerator } from "@/lib/types";
import { AudioOverviewView } from "./audio-overview-view";
import { FlashcardsView } from "./flashcards-view";

const iconMap: Record<string, LucideIcon> = {
  Headphones,
  Layers,
  Video,
  Map,
  FileText,
  WalletCards,
  CircleHelp,
  BarChart3,
  Table2,
  PencilLine,
};

const toneMap: Record<
  StudioGenerator["tone"],
  { bg: string; icon: string; border: string }
> = {
  emerald: {
    bg: "bg-emerald-500/10",
    icon: "bg-emerald-500 text-white",
    border: "border-emerald-500/25",
  },
  amber: {
    bg: "bg-amber-500/10",
    icon: "bg-amber-500 text-white",
    border: "border-amber-500/25",
  },
  blue: {
    bg: "bg-blue-500/10",
    icon: "bg-blue-500 text-white",
    border: "border-blue-500/25",
  },
  rose: {
    bg: "bg-rose-500/10",
    icon: "bg-rose-500 text-white",
    border: "border-rose-500/25",
  },
  orange: {
    bg: "bg-orange-500/10",
    icon: "bg-orange-500 text-white",
    border: "border-orange-500/25",
  },
  violet: {
    bg: "bg-violet-500/10",
    icon: "bg-violet-500 text-white",
    border: "border-violet-500/25",
  },
  sky: {
    bg: "bg-sky-500/10",
    icon: "bg-sky-500 text-white",
    border: "border-sky-500/25",
  },
  purple: {
    bg: "bg-purple-500/10",
    icon: "bg-purple-500 text-white",
    border: "border-purple-500/25",
  },
  slate: {
    bg: "bg-slate-500/10",
    icon: "bg-slate-500 text-white",
    border: "border-slate-500/25",
  },
  lime: {
    bg: "bg-lime-500/10",
    icon: "bg-lime-500 text-white",
    border: "border-lime-500/25",
  },
};

export type StudioView = "grid" | "audio-overview" | "flashcards";

interface StudioTabProps {
  view: StudioView;
  onChangeView: (view: StudioView) => void;
  lessonId: string;
}

export function StudioTab({ view, onChangeView, lessonId }: StudioTabProps) {
  if (view === "audio-overview") {
    return (
      <AudioOverviewView
        lessonId={lessonId}
        onBack={() => onChangeView("grid")}
      />
    );
  }
  if (view === "flashcards") {
    return (
      <FlashcardsView
        lessonId={lessonId}
        onBack={() => onChangeView("grid")}
      />
    );
  }
  return <StudioGrid onOpen={onChangeView} />;
}

function StudioGrid({ onOpen }: { onOpen: (view: StudioView) => void }) {
  const handleGenerator = (id: string) => {
    if (id === "audio-overview") onOpen("audio-overview");
    else if (id === "flashcards") onOpen("flashcards");
  };

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-y-auto overflow-x-hidden scrollbar-thin">
      <div className="px-3 pb-2 pt-3 sm:px-4">
        <h2 className="text-base font-semibold leading-tight text-foreground">
          Studio
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          AI-generated tools from your course content.
        </p>
      </div>

      <div className="px-3 sm:px-4">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Create an Audio Overview in:
          </p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-200/80">
            {AUDIO_LANGUAGES.map((l) => l.label).join(" · ")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-3 py-3 sm:px-4">
        {studioGenerators.map((gen) => (
          <GeneratorCard
            key={gen.id}
            generator={gen}
            onClick={() => handleGenerator(gen.id)}
          />
        ))}
      </div>

      <div className="mt-auto border-t border-border px-3 py-5 text-center sm:px-4">
        <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="size-4" aria-hidden />
        </div>
        <p className="text-xs font-medium text-foreground">
          Studio output will be saved here.
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Generate Audio Overviews, study guides, flashcards and more!
        </p>
      </div>
    </div>
  );
}

function GeneratorCard({
  generator,
  onClick,
}: {
  generator: StudioGenerator;
  onClick: () => void;
}) {
  const Icon = iconMap[generator.icon];
  const tone = toneMap[generator.tone];
  const card = (
    <button
      type="button"
      onClick={generator.available ? onClick : undefined}
      disabled={!generator.available}
      className={cn(
        "group relative flex min-h-[72px] min-w-0 w-full items-center gap-2.5 overflow-hidden rounded-xl border p-2.5 text-left transition-all",
        tone.bg,
        tone.border,
        generator.available
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
          : "cursor-not-allowed opacity-60",
      )}
      aria-label={generator.label}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          tone.icon,
        )}
        aria-hidden
      >
        {Icon ? <Icon className="size-[18px]" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[13px] font-semibold leading-tight text-foreground">
            {generator.label}
          </span>
          {generator.beta && (
            <Badge
              variant="beta"
              className="h-4 shrink-0 px-1.5 py-0 text-[9px] uppercase tracking-wide"
            >
              Beta
            </Badge>
          )}
        </div>
        {!generator.available && (
          <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground">
            Coming soon
          </span>
        )}
      </div>
    </button>
  );

  if (generator.available) return card;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block">{card}</span>
      </TooltipTrigger>
      <TooltipContent>Coming soon</TooltipContent>
    </Tooltip>
  );
}
