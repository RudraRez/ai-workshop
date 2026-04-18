"use client";

import { BookMarked, MessagesSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonFooterProps {
  title: string;
  module: string;
  lessonNumber: number;
  durationMin: number;
}

export function LessonFooter({
  title,
  module,
  lessonNumber,
  durationMin,
}: LessonFooterProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-border bg-background px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground sm:text-base">
            {title}
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
            {module} · Lesson {lessonNumber} · {durationMin} min
          </p>
        </div>
        <Button
          size="sm"
          className="w-full rounded-md sm:w-auto sm:px-5"
        >
          Mark Complete
        </Button>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <FooterLink icon={<BookMarked className="size-3.5" />} label="Save Note" />
        <FooterLink icon={<MessagesSquare className="size-3.5" />} label="Discussion" />
        <FooterLink icon={<Users className="size-3.5" />} label="Community" />
      </div>
    </div>
  );
}

function FooterLink({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-muted-foreground transition-colors hover:text-foreground"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
