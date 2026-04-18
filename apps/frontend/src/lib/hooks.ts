"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  mockFlashcards,
  mockGreeting,
  mockLesson,
  mockUsage,
  fakeDelay,
} from "./mock-data";
import type {
  AudioOverviewResponse,
  ChatAnswerResponse,
  FlashcardDeckResponse,
  TutorMessage,
} from "./types";
import {
  generateAudioOverview,
  generateFlashcards,
  listAudioOverviews,
  listFlashcardDecks,
  sendChat,
} from "./api";

export function useUsage() {
  return useQuery({
    queryKey: queryKeys.usage(),
    queryFn: () => fakeDelay(mockUsage, 150),
    initialData: mockUsage,
    staleTime: 30_000,
  });
}

export function useLesson(id: string) {
  return useQuery({
    queryKey: queryKeys.lesson(id),
    queryFn: () => fakeDelay(mockLesson, 150),
    initialData: mockLesson,
    staleTime: 60_000,
  });
}

export function useTutorMessages(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.tutor.messages(sessionId),
    queryFn: () => fakeDelay<TutorMessage[]>([mockGreeting], 120),
    initialData: [mockGreeting] as TutorMessage[],
    staleTime: Infinity,
  });
}

interface LessonHint {
  id: string;
  title: string;
  context?: string;
  videoUrl?: string;
}

export function useSendTutorMessage(sessionId: string, lesson?: LessonHint) {
  const qc = useQueryClient();
  return useMutation<
    { user: TutorMessage; assistant: TutorMessage },
    Error,
    string
  >({
    mutationFn: async (prompt) => {
      const history = (
        qc.getQueryData<TutorMessage[]>(queryKeys.tutor.messages(sessionId)) ??
        []
      )
        .filter((m) => m.id !== "msg-greet")
        .map((m) => ({ role: m.role, body: m.body }));

      const userMsg: TutorMessage = {
        id: crypto.randomUUID(),
        role: "user",
        body: prompt,
        createdAt: new Date().toISOString(),
      };
      // Optimistic user bubble.
      qc.setQueryData<TutorMessage[]>(
        queryKeys.tutor.messages(sessionId),
        (prev) => [...(prev ?? []), userMsg],
      );

      const answer: ChatAnswerResponse = await sendChat({
        prompt,
        lessonId: lesson?.id,
        lessonTitle: lesson?.title,
        lessonContext: lesson?.context,
        videoUrl: lesson?.videoUrl,
        history,
      });

      const assistantMsg: TutorMessage = {
        id: answer.messageId,
        role: "assistant",
        body: answer.body,
        createdAt: answer.createdAt,
      };
      return { user: userMsg, assistant: assistantMsg };
    },
    onSuccess: ({ assistant }) => {
      qc.setQueryData<TutorMessage[]>(
        queryKeys.tutor.messages(sessionId),
        (prev) => [...(prev ?? []), assistant],
      );
      qc.invalidateQueries({ queryKey: queryKeys.usage() });
    },
    onError: (_err, _prompt, _ctx) => {
      // Drop the optimistic user bubble so the user can retry.
      qc.setQueryData<TutorMessage[]>(
        queryKeys.tutor.messages(sessionId),
        (prev) => prev?.slice(0, -1) ?? [],
      );
    },
  });
}

// ── Flashcards ────────────────────────────────────────────────────────────────

export function useFlashcardDecks(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.studio.flashcards(lessonId),
    queryFn: () => listFlashcardDecks(lessonId),
    staleTime: 30_000,
  });
}

export function useGenerateFlashcards(lesson: LessonHint) {
  const qc = useQueryClient();
  return useMutation<
    FlashcardDeckResponse,
    Error,
    { count?: number; difficulty?: "easy" | "medium" | "hard" | "mixed" }
  >({
    mutationFn: (opts) =>
      generateFlashcards({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonContext: lesson.context,
        videoUrl: lesson.videoUrl,
        count: opts.count,
        difficulty: opts.difficulty,
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.studio.flashcards(lesson.id),
      });
    },
  });
}

export function useFlashcards(lessonId: string) {
  const decks = useFlashcardDecks(lessonId);
  const cards = decks.data?.items?.[0]?.cards ?? mockFlashcards;
  return { ...decks, cards, deck: decks.data?.items?.[0] };
}

// ── Audio Overview ────────────────────────────────────────────────────────────

export function useAudioOverviews(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.studio.audio(lessonId),
    queryFn: () => listAudioOverviews(lessonId),
    staleTime: 30_000,
  });
}

export function useGenerateAudioOverview(lesson: LessonHint) {
  const qc = useQueryClient();
  return useMutation<
    AudioOverviewResponse,
    Error,
    {
      language: string;
      voiceStyle?: "narrator" | "conversational" | "friendly";
    }
  >({
    mutationFn: (opts) =>
      generateAudioOverview({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonContext: lesson.context,
        videoUrl: lesson.videoUrl,
        language: opts.language,
        voiceStyle: opts.voiceStyle,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.studio.audio(lesson.id) });
    },
  });
}

export function useAudioOverview(lessonId: string) {
  const list = useAudioOverviews(lessonId);
  const latest = list.data?.items?.[0];
  return { ...list, latest };
}
