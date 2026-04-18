"use client";

import * as React from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCw,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlashcards, useGenerateFlashcards } from "@/lib/hooks";
import type { Flashcard, LessonForAi } from "@/lib/types";

interface FlashcardsViewProps {
  lesson: LessonForAi;
  onBack: () => void;
}

export function FlashcardsView({ lesson, onBack }: FlashcardsViewProps) {
  const { deck, cards, isLoading } = useFlashcards(lesson.id);
  const {
    mutate: generate,
    isPending,
    error,
  } = useGenerateFlashcards(lesson);

  const activeCards = (deck?.cards ?? cards) as Flashcard[];

  const [idx, setIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [mastered, setMastered] = React.useState<Set<string>>(new Set());
  const [review, setReview] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    setIdx(0);
    setFlipped(false);
    setMastered(new Set());
    setReview(new Set());
  }, [deck?.id]);

  if (isLoading && activeCards.length === 0) {
    return <Spinner label="Loading flashcards…" />;
  }

  if (!activeCards.length) {
    return (
      <EmptyState
        lesson={lesson}
        onGenerate={(opts) => generate(opts)}
        isPending={isPending}
        error={error?.message}
        onBack={onBack}
      />
    );
  }

  const total = activeCards.length;
  const current = Math.min(idx + 1, total);
  const pct = (current / total) * 100;
  const card = activeCards[Math.min(idx, total - 1)];

  const goTo = (next: number) => {
    setFlipped(false);
    setIdx(Math.max(0, Math.min(total - 1, next)));
  };

  const markGotIt = () => {
    setMastered((m) => new Set(m).add(card.id));
    setReview((r) => {
      if (!r.has(card.id)) return r;
      const n = new Set(r);
      n.delete(card.id);
      return n;
    });
    if (idx < total - 1) goTo(idx + 1);
  };

  const markReview = () => {
    setReview((r) => new Set(r).add(card.id));
    setMastered((m) => {
      if (!m.has(card.id)) return m;
      const n = new Set(m);
      n.delete(card.id);
      return n;
    });
    if (idx < total - 1) goTo(idx + 1);
  };

  const remaining = total - mastered.size;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
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
          className="flex size-9 items-center justify-center rounded-lg bg-violet-500 text-white"
          aria-hidden
        >
          <WalletCards className="size-[18px]" />
        </span>
        <h2 className="flex-1 text-base font-semibold text-foreground">
          Flashcards
        </h2>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {current} / {total}
        </span>
      </div>

      <div className="px-3 pt-2 sm:px-4">
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={1}
          aria-valuemax={total}
        >
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 min-h-0 items-center justify-center px-3 py-3 sm:px-4">
        <FlipCard
          key={card.id}
          front={card.front}
          back={card.back}
          flipped={flipped}
          onToggle={() => setFlipped((f) => !f)}
        />
      </div>

      <div className="space-y-2 border-t border-border px-3 py-3 sm:px-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={markGotIt}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
          >
            <Check className="size-4" />
            Got it
          </button>
          <button
            type="button"
            onClick={markReview}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20"
          >
            <RotateCw className="size-4" />
            Review again
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => goTo(idx - 1)}
            disabled={idx === 0}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-card disabled:hover:text-muted-foreground"
          >
            <ChevronLeft className="size-4" />
            Prev
          </button>
          <button
            type="button"
            onClick={() => goTo(idx + 1)}
            disabled={idx === total - 1}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-card disabled:hover:text-muted-foreground"
          >
            Next
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="flex items-center justify-between pt-1 text-xs">
          <p>
            <span className="font-semibold text-emerald-400">
              {mastered.size}
            </span>{" "}
            <span className="text-muted-foreground">mastered · </span>
            <span className="font-semibold text-emerald-400">{remaining}</span>{" "}
            <span className="text-muted-foreground">remaining</span>
            {review.size > 0 && (
              <>
                <span className="text-muted-foreground"> · </span>
                <span className="font-semibold text-rose-400">
                  {review.size}
                </span>{" "}
                <span className="text-muted-foreground">to review</span>
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => generate({ count: 10, difficulty: "mixed" })}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-medium text-violet-200 transition-colors hover:bg-violet-500/20 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Sparkles className="size-3" />
            )}
            New deck
          </button>
        </div>
        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error.message}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  lesson,
  onGenerate,
  isPending,
  error,
  onBack,
}: {
  lesson: LessonForAi;
  onGenerate: (opts: {
    count: number;
    difficulty: "easy" | "medium" | "hard" | "mixed";
  }) => void;
  isPending: boolean;
  error?: string;
  onBack: () => void;
}) {
  const [count, setCount] = React.useState(10);
  const [difficulty, setDifficulty] =
    React.useState<"easy" | "medium" | "hard" | "mixed">("mixed");

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scrollbar-thin">
      <div className="flex items-center gap-2 px-3 pt-3 sm:px-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Studio"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className="flex size-9 items-center justify-center rounded-lg bg-violet-500 text-white">
          <WalletCards className="size-[18px]" />
        </span>
        <h2 className="text-base font-semibold text-foreground">Flashcards</h2>
      </div>

      <div className="mx-3 mt-4 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-600/20 to-violet-900/20 p-5 text-center sm:mx-4">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <p className="mt-4 text-sm font-semibold text-foreground">
          Generate flashcards for this lesson
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Gemini will produce a structured deck based on{" "}
          <span className="font-medium text-foreground">{lesson.title}</span>.
        </p>
      </div>

      <div className="mx-3 mt-4 grid grid-cols-2 gap-2 sm:mx-4">
        <div>
          <label
            htmlFor="fc-count"
            className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Count
          </label>
          <select
            id="fc-count"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            {[5, 8, 10, 15, 20, 25].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="fc-difficulty"
            className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Difficulty
          </label>
          <select
            id="fc-difficulty"
            value={difficulty}
            onChange={(e) =>
              setDifficulty(
                e.target.value as "easy" | "medium" | "hard" | "mixed",
              )
            }
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>

      <div className="mx-3 mt-4 sm:mx-4">
        <button
          type="button"
          onClick={() => onGenerate({ count, difficulty })}
          disabled={isPending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-violet-500 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating {count} cards…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Generate {count} flashcards
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="mx-3 mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive sm:mx-4">
          {error}
        </p>
      )}
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

function FlipCard({
  front,
  back,
  flipped,
  onToggle,
}: {
  front: string;
  back: string;
  flipped: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={flipped ? "Show question" : "Reveal answer"}
      className="group relative size-full min-h-[280px] max-h-[560px] rounded-2xl [perspective:1400px] focus-visible:outline-none"
    >
      <div
        className={cn(
          "relative size-full transition-transform duration-500 [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        <Face kind="question" text={front} />
        <Face kind="answer" text={back} flipped />
      </div>
    </button>
  );
}

function Face({
  kind,
  text,
  flipped,
}: {
  kind: "question" | "answer";
  text: string;
  flipped?: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center overflow-auto rounded-2xl border border-violet-500/30 p-6 text-center [backface-visibility:hidden] scrollbar-thin",
        kind === "question"
          ? "bg-gradient-to-br from-violet-600/35 via-violet-700/25 to-violet-900/30"
          : "bg-gradient-to-br from-violet-500/30 via-fuchsia-700/20 to-indigo-800/30",
        flipped && "[transform:rotateY(180deg)]",
      )}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">
        {kind === "question" ? "Question" : "Answer"}
      </span>
      <p
        className={cn(
          "mt-4 leading-snug text-white",
          kind === "question"
            ? "text-xl font-bold sm:text-[22px]"
            : "text-base font-medium sm:text-[17px]",
        )}
      >
        {text}
      </p>
      {kind === "question" && (
        <p className="mt-5 text-sm text-violet-300/90">
          Tap to reveal answer
        </p>
      )}
    </div>
  );
}
