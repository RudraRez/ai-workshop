export type UsageBucket = { used: number; limit: number };

export type UsageCounter = {
  windowStartsAt: string;
  windowEndsAt: string;
  tutorMessages: UsageBucket;
  studioAudio: UsageBucket;
  studioFlashcards: UsageBucket;
};

export type Lesson = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  module: string;
  lessonNumber: number;
  durationSec: number;
  videoUrl: string;
  thumbnailUrl: string;
  summary: string;
};

export type TutorMessage = {
  id: string;
  role: "user" | "assistant";
  body: string;
  createdAt: string;
};

export type QuickAction = {
  id: string;
  label: string;
  icon: string;
  kind: "prompt" | "deeplink" | "coming-soon";
  target?: string;
};

export type StudioGenerator = {
  id: string;
  label: string;
  beta?: boolean;
  available: boolean;
  icon: string;
  tone: "emerald" | "amber" | "blue" | "rose" | "orange" | "violet" | "sky" | "purple" | "slate" | "lime";
};

export type AudioLanguage = {
  code: string;
  label: string;
};

export type FlashcardDeck = {
  id: string;
  lessonId: string;
  title: string;
  cardCount: number;
  createdAt: string;
};

export const AUDIO_LANGUAGES: AudioLanguage[] = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "Hindi" },
  { code: "ta-IN", label: "Tamil" },
  { code: "te-IN", label: "Telugu" },
  { code: "bn-IN", label: "Bengali" },
  { code: "gu-IN", label: "Gujarati" },
  { code: "kn-IN", label: "Kannada" },
  { code: "ml-IN", label: "Malayalam" },
  { code: "mr-IN", label: "Marathi" },
  { code: "pa-IN", label: "Punjabi" },
];

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  hint?: string;
  tags?: string[];
};
