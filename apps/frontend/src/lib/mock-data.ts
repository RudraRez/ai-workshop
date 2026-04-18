import type {
  Flashcard,
  Lesson,
  QuickAction,
  StudioGenerator,
  TutorMessage,
  UsageCounter,
} from "./types";

export const mockLesson: Lesson = {
  id: "lesson-0421",
  courseId: "course-ai-prod",
  courseTitle: "Build with AI: Modern AI Architectures and Real-World Production",
  title: "Claude Code: Build Your First AI Agent",
  module: "Module 2",
  lessonNumber: 1,
  durationSec: 1650,
  videoUrl: "",
  thumbnailUrl: "/lesson-thumb.svg",
  summary:
    "Get hands-on with Claude Code by scaffolding your first agent, wiring up tools, and shipping a working automation in under 30 minutes.",
};

export const mockUsage: UsageCounter = {
  windowStartsAt: "2026-04-18T00:00:00.000Z",
  windowEndsAt: "2026-04-19T00:00:00.000Z",
  tutorMessages: { used: 8, limit: 20 },
  studioAudio: { used: 1, limit: 5 },
  studioFlashcards: { used: 2, limit: 10 },
};

export const mockGreeting: TutorMessage = {
  id: "msg-greet",
  role: "assistant",
  body: "Hi! I'm your SKEP AI Tutor. I see you're watching **Claude Code: Build Your First AI Agent**. I've already analyzed the lesson content and I'm ready to help you master it. What would you like to do?",
  createdAt: "2026-04-18T10:00:00.000Z",
};

export const topQuickActions: QuickAction[] = [
  { id: "summarize", label: "Summarize this lesson", icon: "ScrollText", kind: "prompt" },
  { id: "flashcards", label: "Generate Flashcards", icon: "WalletCards", kind: "deeplink", target: "/studio/flashcards" },
  { id: "quiz-now", label: "Quiz me now", icon: "CircleHelp", kind: "coming-soon" },
  { id: "mind-map", label: "Show Mind Map", icon: "Map", kind: "coming-soon" },
];

export const bottomQuickActions: QuickAction[] = [
  { id: "explain", label: "Explain concept", icon: "Lightbulb", kind: "prompt" },
  { id: "quiz", label: "Quiz me", icon: "CircleHelp", kind: "coming-soon" },
  { id: "flashcards-chip", label: "Flashcards", icon: "WalletCards", kind: "deeplink", target: "/studio/flashcards" },
  { id: "progress", label: "My progress", icon: "TrendingUp", kind: "coming-soon" },
];

export const studioGenerators: StudioGenerator[] = [
  { id: "audio-overview", label: "Audio Overview", available: true, icon: "Headphones", tone: "emerald" },
  { id: "slide-deck", label: "Slide Deck", beta: true, available: false, icon: "Layers", tone: "orange" },
  { id: "video-overview", label: "Video Overview", available: false, icon: "Video", tone: "blue" },
  { id: "mind-map", label: "Mind Map", available: false, icon: "Map", tone: "rose" },
  { id: "reports", label: "Reports", available: false, icon: "FileText", tone: "orange" },
  { id: "flashcards", label: "Flashcards", available: true, icon: "WalletCards", tone: "violet" },
  { id: "quiz", label: "Quiz", available: false, icon: "CircleHelp", tone: "sky" },
  { id: "infographic", label: "Infographic", beta: true, available: false, icon: "BarChart3", tone: "purple" },
  { id: "data-table", label: "Data Table", available: false, icon: "Table2", tone: "slate" },
  { id: "add-note", label: "Add Note", available: false, icon: "PencilLine", tone: "lime" },
];

export const mockFlashcards: Flashcard[] = [
  {
    id: "fc-1",
    front: "What is an AI Agent?",
    back: "An AI agent is a software system that uses a language model to perceive its environment, plan actions, and execute tasks autonomously toward a goal — deciding the next step based on tool outputs, not a fixed script.",
  },
  {
    id: "fc-2",
    front: "What tools can Claude Code use?",
    back: "Bash, file read/edit, code search, web fetch, and custom MCP tools. Each call returns observable output the agent reads before deciding what to do next.",
  },
  {
    id: "fc-3",
    front: "Agent vs workflow — what's the difference?",
    back: "A workflow runs a fixed sequence of steps. An agent dynamically picks the next action based on context and prior tool results, so its path through a task is emergent, not predefined.",
  },
  {
    id: "fc-4",
    front: "How does Claude Code maintain context?",
    back: "It keeps a live context window of file contents, recent tool outputs, and the conversation. A persistent MEMORY.md file carries learnings across sessions.",
  },
  {
    id: "fc-5",
    front: "What is the Socratic method the SKEP AI Tutor uses?",
    back: "Instead of handing you answers, the tutor asks guiding questions so you arrive at the concept yourself. It teaches reasoning, not recall.",
  },
];

export type AudioOverviewMock = {
  id: string;
  title: string;
  subtitle: string;
  durationSec: number;
  waveform: number[];
};

export const mockAudioOverview: AudioOverviewMock = {
  id: "audio-0001",
  title: "AI-Generated Podcast",
  subtitle: "Module 2 · Claude Code: Build Your First AI Agent",
  durationSec: 878,
  waveform: Array.from({ length: 21 }, (_, i) => {
    const x = (i / 20) * Math.PI * 2;
    const a = Math.abs(Math.sin(x) * 0.55 + Math.sin(x * 2.4) * 0.35 + Math.sin(x * 5) * 0.12);
    return Math.round(25 + a * 75);
  }),
};

export async function fakeDelay<T>(value: T, ms = 400): Promise<T> {
  await new Promise((r) => setTimeout(r, ms));
  return value;
}
