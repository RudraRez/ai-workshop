"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  courseTitle: string;
}

export function TopBar({ courseTitle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
      <button
        type="button"
        aria-label="Back"
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <h1 className="flex-1 truncate text-sm font-semibold text-foreground sm:text-[15px]">
        {courseTitle}
      </h1>

      <Badge
        variant="success"
        className="gap-1.5 rounded-full border border-emerald-500/25 px-2.5 py-1 text-[11px] font-medium"
      >
        <span
          className="size-1.5 rounded-full bg-emerald-500"
          aria-hidden="true"
        />
        <Sparkles className="hidden size-3 sm:inline" aria-hidden="true" />
        AI Tutor Active
      </Badge>

      <Avatar className="size-8 ring-2 ring-border">
        <AvatarFallback className="bg-gradient-to-br from-amber-200 to-rose-300 text-xs font-semibold text-rose-900">
          SK
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
