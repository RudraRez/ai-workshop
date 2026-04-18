import { apiClient, unwrap } from "./api-client";
import type {
  AudioOverviewResponse,
  ChatAnswerResponse,
  Flashcard,
  FlashcardDeckResponse,
} from "./types";

export interface ChatRequest {
  prompt: string;
  lessonId?: string;
  lessonTitle?: string;
  lessonContext?: string;
  videoUrl?: string;
  history?: { role: "user" | "assistant"; body: string }[];
}

export async function sendChat(body: ChatRequest) {
  const res = await apiClient.post("/api/v1/tutor/chat", body);
  return unwrap<ChatAnswerResponse>(res);
}

export interface GenerateFlashcardsRequest {
  lessonId: string;
  lessonTitle: string;
  lessonContext?: string;
  videoUrl?: string;
  count?: number;
  difficulty?: "easy" | "medium" | "hard" | "mixed";
}

export async function generateFlashcards(body: GenerateFlashcardsRequest) {
  const res = await apiClient.post("/api/v1/tutor/flashcards", body);
  return unwrap<FlashcardDeckResponse>(res);
}

export async function listFlashcardDecks(lessonId?: string) {
  const res = await apiClient.get("/api/v1/tutor/flashcards", {
    params: lessonId ? { lessonId } : undefined,
  });
  return unwrap<{ items: FlashcardDeckResponse[] }>(res);
}

export async function getFlashcardDeck(id: string) {
  const res = await apiClient.get(`/api/v1/tutor/flashcards/${id}`);
  return unwrap<FlashcardDeckResponse>(res);
}

export interface GenerateAudioOverviewRequest {
  lessonId: string;
  lessonTitle: string;
  lessonContext?: string;
  videoUrl?: string;
  language: string;
  voiceStyle?: "narrator" | "conversational" | "friendly";
}

export async function generateAudioOverview(
  body: GenerateAudioOverviewRequest,
) {
  const res = await apiClient.post("/api/v1/tutor/audio-overviews", body);
  return unwrap<AudioOverviewResponse>(res);
}

export async function listAudioOverviews(lessonId?: string) {
  const res = await apiClient.get("/api/v1/tutor/audio-overviews", {
    params: lessonId ? { lessonId } : undefined,
  });
  return unwrap<{ items: AudioOverviewResponse[] }>(res);
}

export type { Flashcard };
