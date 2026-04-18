export const queryKeys = {
  me: () => ["me"] as const,
  usage: () => ["me", "usage"] as const,
  lesson: (id: string) => ["lesson", id] as const,
  course: {
    lessons: () => ["course", "lessons"] as const,
  },
  tutor: {
    messages: (sessionId: string) =>
      ["tutor", "messages", sessionId] as const,
  },
  studio: {
    flashcards: (lessonId: string) =>
      ["studio", "flashcards", lessonId] as const,
    audio: (lessonId: string) => ["studio", "audio", lessonId] as const,
  },
};
