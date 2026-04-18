import type {
  DiscussionThread,
  Flashcard,
  Lesson,
  LessonBookmark,
  LessonInstructor,
  LessonResource,
  QuickAction,
  StudioGenerator,
  TutorMessage,
  UpNextVideo,
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
  videoUrl: "https://youtu.be/s-Mc26Ytz10",
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

export const mockResources: LessonResource[] = [
  {
    id: "res-1",
    title: "Claude Code: Complete Cheat Sheet",
    subtitle: "All CLI commands, flags, and config options in one page",
    kind: "download",
    tone: "red",
    sizeKb: 142,
  },
  {
    id: "res-2",
    title: "Anthropic Claude Code Docs",
    subtitle: "Official documentation for Claude Code CLI",
    kind: "link",
    tone: "blue",
  },
  {
    id: "res-3",
    title: "Spec-Driven Development Template",
    subtitle: "Starter spec template used in this module",
    kind: "download",
    tone: "purple",
    sizeKb: 89,
  },
  {
    id: "res-4",
    title: "Agent Loop Research Paper (Yao et al.)",
    subtitle: "The original ReAct paper that inspired modern agent design",
    kind: "link",
    tone: "emerald",
  },
  {
    id: "res-5",
    title: "Module 3 Reading: The Rise of AI Agents",
    subtitle: "Supplementary reading for this module",
    kind: "download",
    tone: "orange",
    sizeKb: 230,
  },
];

export const mockInstructor: LessonInstructor = {
  id: "instr-1",
  name: "Karan Mehta",
  role: "Senior AI Engineer & SKEP Lead Instructor",
  avatarInitials: "KM",
  rating: 4.9,
  students: 28430,
  courses: 6,
  bio: 'Karan is a former staff engineer at a Series B AI startup and has been building production AI systems since 2021. He specialises in agentic architectures, tool-use patterns, and helping developers cross the gap from "prompting" to real system design.',
  expertise: [
    "LLM Fine-tuning",
    "Agent Architectures",
    "Claude Code",
    "System Design",
    "RAG Pipelines",
  ],
  message:
    '"Welcome to Module 3! This is where things get really exciting — we stop talking about AI theoretically and start building. The Claude Code demo in this lesson is something I\'ve used in real production projects, so everything you see here is battle-tested. If you have questions, drop them in the discussion. I personally read every comment. See you in the next lesson!"',
};

export const mockUpNext: UpNextVideo[] = [
  {
    id: "up-1",
    title: "Claude Skills: Build Your First AI Assistant",
    module: "Module 3",
    durationLabel: "13:58",
  },
  {
    id: "up-2",
    title: "Claude Code: Data Analysis Without Spreadsheets",
    module: "Module 3",
    durationLabel: "18:44",
  },
  {
    id: "up-3",
    title: "Claude MCP Tutorial: Give Claude Superpowers",
    module: "Module 3",
    durationLabel: "12:55",
  },
  {
    id: "up-4",
    title: "Claude Cowork: Complete Step-by-Step Guide",
    module: "Module 3",
    durationLabel: "29:16",
  },
];

export const mockBookmarks: LessonBookmark[] = [
  {
    id: "bm-1",
    timestamp: "03:20",
    title: "CLI setup — remember to set ANTHROPIC_API_KEY in .env",
    moduleLabel: "M3 · L1",
    tone: "blue",
  },
  {
    id: "bm-2",
    timestamp: "08:45",
    title: "First agent reads the codebase — amazing demo moment",
    moduleLabel: "M3 · L1",
    tone: "violet",
  },
  {
    id: "bm-3",
    timestamp: "14:10",
    title: "Tool call loop explanation — review this before the quiz",
    moduleLabel: "M3 · L1",
    tone: "amber",
  },
  {
    id: "bm-4",
    timestamp: "00:00",
    title: "Overview of Spec-Driven Dev — great intro",
    moduleLabel: "M1 · L1",
    tone: "emerald",
  },
];

export const mockDiscussions: DiscussionThread[] = [
  {
    id: "disc-1",
    authorName: "Priya Shah",
    avatarInitials: "PS",
    createdAt: "2 hours ago",
    body: "Anyone else getting a 'command not found' when running claude init? Had to add ~/.local/bin to PATH before it worked on Ubuntu 22.04.",
    replies: 4,
    likes: 12,
  },
  {
    id: "disc-2",
    authorName: "Daniel Okafor",
    avatarInitials: "DO",
    createdAt: "Yesterday",
    body: "The Socratic style took some getting used to — it doesn't just hand you the answer. Honestly I retained way more this way. Took about 20 minutes to finish the demo.",
    replies: 8,
    likes: 27,
  },
  {
    id: "disc-3",
    authorName: "Mei Lin",
    avatarInitials: "ML",
    createdAt: "3 days ago",
    body: "Is there a way to pipe Claude Code's output to a file? Trying to capture the agent's reasoning for a code review deck.",
    replies: 2,
    likes: 5,
  },
];
