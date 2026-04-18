"use client";

import * as React from "react";
import {
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  Download,
  FileText,
  Files,
  FileUp,
  FolderOpen,
  Heart,
  MessageCircle,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  mockBookmarks,
  mockDiscussions,
  mockInstructor,
  mockResources,
} from "@/lib/mock-data";
import type {
  BookmarkTone,
  LessonBookmark,
  LessonNote,
  LessonResource,
  ResourceTone,
} from "@/lib/types";

type DetailTab =
  | "discussion"
  | "resource"
  | "instructor"
  | "notes"
  | "bookmark";

const TAB_DEFS: { id: DetailTab; label: string; icon: React.ElementType }[] = [
  { id: "discussion", label: "Discussion", icon: MessageSquare },
  { id: "resource", label: "Resource", icon: FolderOpen },
  { id: "instructor", label: "Instructor", icon: UserRound },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "bookmark", label: "Bookmark", icon: Bookmark },
];

export function LessonDetailsTabs() {
  const [active, setActive] = React.useState<DetailTab>("resource");
  const [notes, setNotes] = React.useState<LessonNote[]>([]);
  const [bookmarks, setBookmarks] =
    React.useState<LessonBookmark[]>(mockBookmarks);

  return (
    <section className="border-t border-border bg-background">
      <div
        role="tablist"
        aria-label="Lesson details"
        className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 scrollbar-thin sm:px-4"
      >
        {TAB_DEFS.map((t) => {
          const Icon = t.icon;
          const selected = active === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setActive(t.id)}
              className={cn(
                "relative inline-flex h-11 shrink-0 items-center gap-1.5 px-3 text-sm font-medium transition-colors",
                selected
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {t.label}
              {selected && (
                <span
                  aria-hidden
                  className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="px-3 py-4 sm:px-4">
        {active === "discussion" && <DiscussionPanel />}
        {active === "resource" && <ResourcePanel />}
        {active === "instructor" && <InstructorPanel />}
        {active === "notes" && (
          <NotesPanel
            notes={notes}
            onAdd={(body) =>
              setNotes((n) => [
                {
                  id: crypto.randomUUID(),
                  body,
                  createdAt: new Date().toISOString(),
                },
                ...n,
              ])
            }
            onDelete={(id) =>
              setNotes((n) => n.filter((note) => note.id !== id))
            }
          />
        )}
        {active === "bookmark" && (
          <BookmarkPanel
            bookmarks={bookmarks}
            onAdd={(bm) => setBookmarks((prev) => [bm, ...prev])}
            onDelete={(id) =>
              setBookmarks((prev) => prev.filter((b) => b.id !== id))
            }
          />
        )}
      </div>
    </section>
  );
}

// ── Discussion (dummy) ────────────────────────────────────────────────────────

function DiscussionPanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Discussion{" "}
            <span className="text-muted-foreground">
              ({mockDiscussions.length})
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Ask questions, share wins, and help each other out.
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          New Thread
        </Button>
      </div>

      <div className="space-y-2">
        {mockDiscussions.map((d) => (
          <article
            key={d.id}
            className="rounded-xl border border-border bg-card p-3 sm:p-4"
          >
            <div className="flex items-start gap-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
                aria-hidden
              >
                {d.avatarInitials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {d.authorName}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {d.createdAt}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                  {d.body}
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="size-3.5" aria-hidden />
                    {d.replies} replies
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className="size-3.5" aria-hidden />
                    {d.likes}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ── Resources (dummy) ─────────────────────────────────────────────────────────

const RESOURCE_TONE: Record<
  ResourceTone,
  { bg: string; icon: string; border: string; text: string; btn: string }
> = {
  red: {
    bg: "bg-rose-500/10",
    icon: "text-rose-500",
    border: "border-rose-500/30",
    text: "text-rose-500",
    btn: "border-rose-500/40 text-rose-500 hover:bg-rose-500/10",
  },
  blue: {
    bg: "bg-blue-500/10",
    icon: "text-blue-500",
    border: "border-blue-500/30",
    text: "text-blue-500",
    btn: "border-blue-500/40 text-blue-500 hover:bg-blue-500/10",
  },
  purple: {
    bg: "bg-violet-500/10",
    icon: "text-violet-500",
    border: "border-violet-500/30",
    text: "text-violet-500",
    btn: "border-violet-500/40 text-violet-500 hover:bg-violet-500/10",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-500",
    border: "border-emerald-500/30",
    text: "text-emerald-500",
    btn: "border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10",
  },
  orange: {
    bg: "bg-orange-500/10",
    icon: "text-orange-500",
    border: "border-orange-500/30",
    text: "text-orange-500",
    btn: "border-orange-500/40 text-orange-500 hover:bg-orange-500/10",
  },
};

function ResourcePanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4">
        <Files className="mt-0.5 size-5 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">
            Module 3 Resources
          </p>
          <p className="text-xs text-primary/80">
            {mockResources.length} files · PDFs, links, and code repos for this
            module
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {mockResources.map((r) => (
          <ResourceRow key={r.id} resource={r} />
        ))}
      </ul>
    </div>
  );
}

function ResourceRow({ resource }: { resource: LessonResource }) {
  const tone = RESOURCE_TONE[resource.tone];
  const isDownload = resource.kind === "download";
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3 sm:p-4",
        tone.border,
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-lg",
          tone.bg,
          tone.icon,
        )}
        aria-hidden
      >
        {isDownload ? (
          <FileUp className="size-5" />
        ) : (
          <ArrowUpRight className="size-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {resource.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {resource.subtitle}
        </p>
        {resource.sizeKb != null && (
          <p className="mt-0.5 text-[11px] text-muted-foreground/80">
            {resource.sizeKb} KB
          </p>
        )}
      </div>
      <button
        type="button"
        className={cn(
          "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3.5 text-xs font-semibold transition-colors",
          tone.btn,
        )}
      >
        {isDownload ? (
          <>
            <Download className="size-3.5" />
            Download
          </>
        ) : (
          "Open"
        )}
      </button>
    </li>
  );
}

// ── Instructor (dummy) ────────────────────────────────────────────────────────

function InstructorPanel() {
  const i = mockInstructor;
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <span
            className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 text-lg font-bold text-white"
            aria-hidden
          >
            {i.avatarInitials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-foreground">{i.name}</p>
            <p className="text-xs text-muted-foreground">{i.role}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                <Star className="size-3.5 fill-current" aria-hidden />
                {i.rating}
              </span>
              <span>{i.students.toLocaleString()} students</span>
              <span>{i.courses} courses</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90">
          {i.bio}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <p className="text-sm font-semibold text-foreground">
          Areas of Expertise
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {i.expertise.map((tag) => (
            <span
              key={tag}
              className="inline-flex h-7 items-center rounded-full border border-primary/30 bg-primary/5 px-3 text-xs font-medium text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <MessageSquare
            className="size-4 text-violet-500"
            aria-hidden
          />
          <p className="text-sm font-semibold text-violet-500">
            Message from the Instructor
          </p>
        </div>
        <p className="mt-2 text-sm italic leading-relaxed text-foreground/85">
          {i.message}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span
            className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-[10px] font-bold text-white"
            aria-hidden
          >
            {i.avatarInitials}
          </span>
          <span className="text-xs text-muted-foreground">— {i.name}</span>
        </div>
      </div>

      <button
        type="button"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        <MessageCircle className="size-4" aria-hidden />
        Ask the Instructor
      </button>
    </div>
  );
}

// ── Notes (local state) ───────────────────────────────────────────────────────

function NotesPanel({
  notes,
  onAdd,
  onDelete,
}: {
  notes: LessonNote[];
  onAdd: (body: string) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const [composing, setComposing] = React.useState(false);

  const submit = () => {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft("");
    setComposing(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            My Notes{" "}
            <span className="text-muted-foreground">({notes.length})</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Capture insights while you watch.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setComposing((c) => !c)}
        >
          <Plus className="size-3.5" />
          Add Note
        </Button>
      </div>

      {composing && (
        <div className="rounded-xl border border-border bg-card p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your note…"
            rows={3}
            autoFocus
            className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft("");
                setComposing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submit}
              disabled={!draft.trim()}
              className="gap-1.5"
            >
              <Send className="size-3.5" />
              Save
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <FileText
            className="size-8 text-muted-foreground/50"
            aria-hidden
          />
          <p className="text-sm font-semibold text-foreground">No notes yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Click &ldquo;Add Note&rdquo; above to capture insights while
            watching.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="group rounded-xl border border-border bg-card p-3 sm:p-4"
            >
              <div className="flex items-start gap-2">
                <Sparkles
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {n.body}
                  </p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(n.id)}
                  aria-label="Delete note"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Bookmarks (local state) ───────────────────────────────────────────────────

const BOOKMARK_TONE: Record<
  BookmarkTone,
  { chipBg: string; chipText: string; border: string }
> = {
  blue: {
    chipBg: "bg-blue-500/15",
    chipText: "text-blue-500",
    border: "border-blue-500/30",
  },
  violet: {
    chipBg: "bg-violet-500/15",
    chipText: "text-violet-500",
    border: "border-violet-500/30",
  },
  amber: {
    chipBg: "bg-amber-500/15",
    chipText: "text-amber-500",
    border: "border-amber-500/30",
  },
  emerald: {
    chipBg: "bg-emerald-500/15",
    chipText: "text-emerald-500",
    border: "border-emerald-500/30",
  },
};

const TONE_CYCLE: BookmarkTone[] = ["blue", "violet", "amber", "emerald"];

function BookmarkPanel({
  bookmarks,
  onAdd,
  onDelete,
}: {
  bookmarks: LessonBookmark[];
  onAdd: (bookmark: LessonBookmark) => void;
  onDelete: (id: string) => void;
}) {
  const [composing, setComposing] = React.useState(false);
  const [ts, setTs] = React.useState("");
  const [title, setTitle] = React.useState("");

  const submit = () => {
    const cleanTs = formatTimestamp(ts);
    const cleanTitle = title.trim();
    if (!cleanTs || !cleanTitle) return;
    onAdd({
      id: crypto.randomUUID(),
      timestamp: cleanTs,
      title: cleanTitle,
      moduleLabel: "M3 · L1",
      tone: TONE_CYCLE[bookmarks.length % TONE_CYCLE.length],
    });
    setTs("");
    setTitle("");
    setComposing(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Bookmarks{" "}
            <span className="text-muted-foreground">({bookmarks.length})</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Jump to any saved timestamp.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setComposing((c) => !c)}
        >
          <Plus className="size-3.5" />
          Add Bookmark
        </Button>
      </div>

      {composing && (
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="grid gap-2 sm:grid-cols-[110px_1fr]">
            <input
              value={ts}
              onChange={(e) => setTs(e.target.value)}
              placeholder="mm:ss"
              inputMode="numeric"
              className="h-10 rounded-md border border-border bg-background px-3 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's worth coming back to?"
              autoFocus
              className="h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setTs("");
                setTitle("");
                setComposing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submit}
              disabled={!title.trim() || !ts.trim()}
              className="gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              Save
            </Button>
          </div>
        </div>
      )}

      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <Bookmark
            className="size-8 text-muted-foreground/50"
            aria-hidden
          />
          <p className="text-sm font-semibold text-foreground">
            No bookmarks yet
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Add timestamps you want to jump back to later.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {bookmarks.map((bm) => {
            const tone = BOOKMARK_TONE[bm.tone];
            return (
              <li
                key={bm.id}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border bg-card p-3 sm:p-4",
                  tone.border,
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center rounded-md px-2.5 text-xs font-bold tabular-nums",
                    tone.chipBg,
                    tone.chipText,
                  )}
                >
                  {bm.timestamp}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {bm.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {bm.moduleLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(bm.id)}
                  aria-label="Delete bookmark"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatTimestamp(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [m, s] = trimmed.split(":");
    return `${m.padStart(2, "0")}:${s}`;
  }
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  const secs = Number(trimmed);
  if (!Number.isNaN(secs) && secs >= 0) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return null;
}

