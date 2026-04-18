"use client";

import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type LessonItem = {
  id: string;
  title: string;
  duration: string;
  status: "completed" | "in-progress" | "locked";
};

const MODULES: { id: string; title: string; lessons: LessonItem[] }[] = [
  {
    id: "m1",
    title: "Module 1 · Foundations",
    lessons: [
      { id: "l1", title: "Why agentic coding matters", duration: "8 min", status: "completed" },
      { id: "l2", title: "Setting up your environment", duration: "12 min", status: "completed" },
      { id: "l3", title: "First prompts, first patterns", duration: "15 min", status: "completed" },
    ],
  },
  {
    id: "m2",
    title: "Module 2 · Building with Claude Code",
    lessons: [
      { id: "l4", title: "Claude Code: Build Your First AI Agent", duration: "27 min", status: "in-progress" },
      { id: "l5", title: "Wiring up real tools", duration: "22 min", status: "locked" },
      { id: "l6", title: "Shipping an automation", duration: "18 min", status: "locked" },
    ],
  },
  {
    id: "m3",
    title: "Module 3 · Production patterns",
    lessons: [
      { id: "l7", title: "Observability & guardrails", duration: "24 min", status: "locked" },
      { id: "l8", title: "Cost, latency, and caching", duration: "19 min", status: "locked" },
    ],
  },
];

export function CourseTab() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto scrollbar-thin">
      <div className="px-3 pt-3 sm:px-4">
        <h2 className="text-base font-semibold leading-tight text-foreground">
          Course
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Lessons for this course. Jump to any completed lesson.
        </p>
      </div>

      <div className="space-y-4 px-3 py-3 sm:px-4">
        {MODULES.map((m) => (
          <section key={m.id}>
            <h3 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {m.title}
            </h3>
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {m.lessons.map((l) => (
                <LessonRow key={l.id} lesson={l} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function LessonRow({ lesson }: { lesson: LessonItem }) {
  const { status } = lesson;
  return (
    <li>
      <button
        type="button"
        disabled={status === "locked"}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
          status === "locked"
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-accent",
          status === "in-progress" && "bg-primary/5",
        )}
      >
        <StatusIcon status={status} />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium leading-tight",
              status === "in-progress" ? "text-primary" : "text-foreground",
            )}
          >
            {lesson.title}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {lesson.duration}
          </p>
        </div>
      </button>
    </li>
  );
}

function StatusIcon({ status }: { status: LessonItem["status"] }) {
  if (status === "completed")
    return (
      <CheckCircle2
        className="size-4 shrink-0 text-emerald-500"
        aria-label="Completed"
      />
    );
  if (status === "in-progress")
    return (
      <PlayCircle
        className="size-4 shrink-0 text-primary"
        aria-label="In progress"
      />
    );
  return <Circle className="size-4 shrink-0 text-muted-foreground" aria-label="Locked" />;
}
