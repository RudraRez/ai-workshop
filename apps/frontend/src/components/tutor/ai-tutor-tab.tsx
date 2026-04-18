"use client";

import * as React from "react";
import {
  ScrollText,
  WalletCards,
  CircleHelp,
  Map,
  Lightbulb,
  TrendingUp,
  Send,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  bottomQuickActions,
  topQuickActions,
} from "@/lib/mock-data";
import { useTutorMessages, useSendTutorMessage } from "@/lib/hooks";
import type { QuickAction, TutorMessage } from "@/lib/types";

const iconMap: Record<string, LucideIcon> = {
  ScrollText,
  WalletCards,
  CircleHelp,
  Map,
  Lightbulb,
  TrendingUp,
};

interface AiTutorTabProps {
  lessonTitle: string;
  remainingMessages: number;
  totalMessages: number;
  onDeeplink?: (target: string) => void;
}

export function AiTutorTab({
  lessonTitle,
  remainingMessages,
  totalMessages,
  onDeeplink,
}: AiTutorTabProps) {
  const { data: messages } = useTutorMessages("session-preview");
  const { mutate: send, isPending } = useSendTutorMessage("session-preview");
  const [draft, setDraft] = React.useState("");
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages?.length]);

  const submit = React.useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value || isPending) return;
      send(value);
      setDraft("");
    },
    [isPending, send],
  );

  const handleChipClick = (action: QuickAction) => {
    if (action.kind === "prompt") submit(`${action.label} for "${lessonTitle}"`);
    else if (action.kind === "deeplink" && action.target) onDeeplink?.(action.target);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <LessonContextCard
        lessonTitle={lessonTitle}
        used={totalMessages - remainingMessages}
        total={totalMessages}
      />

      <div
        ref={scrollerRef}
        className="flex-1 space-y-3 overflow-y-auto px-3 py-3 scrollbar-thin sm:px-4"
      >
        {messages?.map((m, idx) => (
          <MessageBubble
            key={m.id}
            message={m}
            showChips={idx === 0 && m.role === "assistant"}
            onChipClick={handleChipClick}
          />
        ))}
        {isPending && (
          <div className="flex items-center gap-2 pl-11 text-xs text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Thinking…
          </div>
        )}
      </div>

      <div className="border-t border-border px-3 py-3 sm:px-4">
        <div className="scrollbar-thin mb-2.5 flex gap-1.5 overflow-x-auto pb-1">
          {bottomQuickActions.map((action) => (
            <QuickChip
              key={action.id}
              action={action}
              onClick={handleChipClick}
              compact
            />
          ))}
        </div>

        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask anything about this lesson..."
            className="h-11 w-full rounded-full border border-border bg-secondary/40 pl-4 pr-12 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Ask the AI Tutor about this lesson"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!draft.trim() || isPending}
            className="absolute right-1.5 top-1/2 size-8 -translate-y-1/2 rounded-full"
            aria-label="Send"
          >
            <Send className="size-4" />
          </Button>
        </form>
        <p className="mt-2 text-center text-[10px] leading-tight text-muted-foreground">
          AI Tutor may make mistakes · Uses Socratic method
        </p>
      </div>
    </div>
  );
}

function LessonContextCard({
  lessonTitle,
  used,
  total,
}: {
  lessonTitle: string;
  used: number;
  total: number;
}) {
  const remaining = total - used;
  return (
    <div className="mx-3 mt-3 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:mx-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Sparkles className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight text-foreground">
          SKEP AI Tutor
        </p>
        <p className="mt-0.5 line-clamp-1 text-[11px] leading-tight text-muted-foreground">
          Watching:{" "}
          <span className="font-medium text-foreground">{lessonTitle}</span>
        </p>
      </div>
      <div className="shrink-0 rounded-full border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground">
        {remaining}/{total} left
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  showChips,
  onChipClick,
}: {
  message: TutorMessage;
  showChips?: boolean;
  onChipClick?: (action: QuickAction) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex items-start gap-2",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="size-4" aria-hidden />
        </div>
      )}
      <div className="flex max-w-[85%] flex-col gap-2">
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md bg-secondary text-foreground",
          )}
        >
          <FormattedBody body={message.body} />
        </div>
        {showChips && onChipClick && (
          <div className="flex flex-wrap gap-1.5">
            {topQuickActions.map((action) => (
              <QuickChip
                key={action.id}
                action={action}
                onClick={onChipClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FormattedBody({ body }: { body: string }) {
  const nodes: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(body.slice(lastIndex, match.index));
    }
    nodes.push(
      <strong key={key++} className="font-semibold text-foreground">
        {match[1]}
      </strong>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < body.length) nodes.push(body.slice(lastIndex));
  return <>{nodes}</>;
}

function QuickChip({
  action,
  onClick,
  compact,
}: {
  action: QuickAction;
  onClick: (a: QuickAction) => void;
  compact?: boolean;
}) {
  const Icon = iconMap[action.icon];
  const disabled = action.kind === "coming-soon";
  const chip = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(action)}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors",
        compact ? "h-8" : "h-8",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
      )}
    >
      {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
      <span>{action.label}</span>
    </button>
  );
  if (!disabled) return chip;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>{chip}</span>
      </TooltipTrigger>
      <TooltipContent>Coming soon</TooltipContent>
    </Tooltip>
  );
}
