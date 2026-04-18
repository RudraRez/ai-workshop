"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  mockAudioOverview,
  mockFlashcards,
  mockGreeting,
  mockLesson,
  mockUsage,
  fakeDelay,
} from "./mock-data";
import type { Flashcard, TutorMessage } from "./types";

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

export function useAudioOverview(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.studio.audio(lessonId),
    queryFn: () => fakeDelay(mockAudioOverview, 200),
    initialData: mockAudioOverview,
    staleTime: 60_000,
  });
}

export function useFlashcards(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.studio.flashcards(lessonId),
    queryFn: () => fakeDelay<Flashcard[]>(mockFlashcards, 200),
    initialData: mockFlashcards,
    staleTime: 60_000,
  });
}

export function useSendTutorMessage(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prompt: string) => {
      await fakeDelay(null, 500);
      const user: TutorMessage = {
        id: crypto.randomUUID(),
        role: "user",
        body: prompt,
        createdAt: new Date().toISOString(),
      };
      const assistant: TutorMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        body:
          "Great question — here's a focused answer tailored to this lesson. (This is a UI preview; the real AI response streams over WebSocket once the backend is wired up.)",
        createdAt: new Date().toISOString(),
      };
      return [user, assistant];
    },
    onSuccess: (pair) => {
      qc.setQueryData<TutorMessage[]>(
        queryKeys.tutor.messages(sessionId),
        (prev) => [...(prev ?? []), ...pair],
      );
      qc.invalidateQueries({ queryKey: queryKeys.usage() });
    },
  });
}
