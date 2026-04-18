"use client";

import * as React from "react";
import { Sparkles, X } from "lucide-react";
import { TopBar } from "./top-bar";
import { LessonPlayer } from "./lesson-player";
import { LessonFooter } from "./lesson-footer";
import { AiPanel } from "./ai-panel";
import type { LessonForAi } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useLesson, useUsage } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export function LessonView() {
  const { data: lesson } = useLesson("lesson-0421");
  const { data: usage } = useUsage();
  const [mobilePanelOpen, setMobilePanelOpen] = React.useState(false);

  if (!lesson || !usage) return <LessonSkeleton />;

  const totalMessages = usage.tutorMessages.limit;
  const remaining = totalMessages - usage.tutorMessages.used;
  const lessonHint = {
    id: lesson.id,
    title: lesson.title,
    context: `${lesson.summary} (Module: ${lesson.module}, Lesson ${lesson.lessonNumber}, duration ${Math.round(lesson.durationSec / 60)} min.)`,
    videoUrl: lesson.videoUrl || undefined,
  };

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <TopBar courseTitle={lesson.courseTitle} />

      <div className="flex min-h-0 flex-1">
        <main className="flex min-h-0 flex-1 flex-col">
          <LessonPlayer
            durationSec={lesson.durationSec}
            videoUrl={lesson.videoUrl}
          />
          <LessonFooter
            title={lesson.title}
            module={lesson.module}
            lessonNumber={lesson.lessonNumber}
            durationMin={Math.round(lesson.durationSec / 60)}
          />
        </main>

        <aside
          className="hidden min-h-0 w-[380px] shrink-0 flex-col overflow-hidden border-l border-border bg-card lg:flex xl:w-[420px]"
          aria-label="AI Tutor panel"
        >
          <AiPanel
            lesson={lessonHint}
            remainingMessages={remaining}
            totalMessages={totalMessages}
          />
        </aside>
      </div>

      <MobilePanelLauncher
        remaining={remaining}
        total={totalMessages}
        onOpen={() => setMobilePanelOpen(true)}
      />

      <MobilePanelDrawer
        open={mobilePanelOpen}
        onClose={() => setMobilePanelOpen(false)}
        lesson={lessonHint}
        remainingMessages={remaining}
        totalMessages={totalMessages}
      />
    </div>
  );
}

function MobilePanelLauncher({
  remaining,
  total,
  onOpen,
}: {
  remaining: number;
  total: number;
  onOpen: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onOpen}
      className="fixed bottom-4 right-4 z-40 h-12 gap-2 rounded-full shadow-lg lg:hidden"
      aria-label="Open AI Tutor panel"
    >
      <Sparkles className="size-4" />
      AI Tutor
      <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-medium">
        {remaining}/{total}
      </span>
    </Button>
  );
}

function MobilePanelDrawer({
  open,
  onClose,
  lesson,
  remainingMessages,
  totalMessages,
}: {
  open: boolean;
  onClose: () => void;
  lesson: LessonForAi;
  remainingMessages: number;
  totalMessages: number;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-card shadow-xl transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-label="AI Tutor panel"
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">AI Tutor</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <AiPanel
            lesson={lesson}
            remainingMessages={remainingMessages}
            totalMessages={totalMessages}
          />
        </div>
      </div>
    </div>
  );
}

function LessonSkeleton() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
        </span>
        Loading lesson…
      </div>
    </div>
  );
}
