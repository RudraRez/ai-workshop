"use client";

import * as React from "react";
import { Sparkles, Zap, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiTutorTab } from "./ai-tutor-tab";
import { StudioTab, type StudioView } from "./studio-tab";
import { CourseTab } from "./course-tab";
import type { LessonForAi } from "@/lib/types";

type Tab = "tutor" | "studio" | "course";

interface AiPanelProps {
  lesson: LessonForAi;
  remainingMessages: number;
  totalMessages: number;
}

export function AiPanel({
  lesson,
  remainingMessages,
  totalMessages,
}: AiPanelProps) {
  const [tab, setTab] = React.useState<Tab>("tutor");
  const [studioView, setStudioView] = React.useState<StudioView>("grid");

  const handleDeeplink = (target: string) => {
    if (target === "/studio/flashcards") {
      setStudioView("flashcards");
      setTab("studio");
    } else if (target === "/studio/audio-overview") {
      setStudioView("audio-overview");
      setTab("studio");
    } else {
      setTab("studio");
    }
  };

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as Tab)}
      className="flex h-full min-h-0 w-full flex-col"
    >
      <TabsList className="h-auto w-full justify-between gap-0 border-b border-border bg-card px-2 py-0">
        <TabsTrigger
          value="tutor"
          className="flex-1 gap-1.5 rounded-none py-3 text-[13px]"
        >
          <Sparkles className="size-3.5" aria-hidden />
          AI Tutor
        </TabsTrigger>
        <TabsTrigger
          value="studio"
          className="flex-1 gap-1.5 rounded-none py-3 text-[13px]"
        >
          <Zap className="size-3.5" aria-hidden />
          Studio
        </TabsTrigger>
        <TabsTrigger
          value="course"
          className="flex-1 gap-1.5 rounded-none py-3 text-[13px]"
        >
          <BookOpen className="size-3.5" aria-hidden />
          Course
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tutor" className="mt-0 flex min-h-0 flex-1 flex-col">
        <AiTutorTab
          lesson={lesson}
          remainingMessages={remainingMessages}
          totalMessages={totalMessages}
          onDeeplink={handleDeeplink}
        />
      </TabsContent>
      <TabsContent value="studio" className="mt-0 flex min-h-0 flex-1 flex-col">
        <StudioTab
          view={studioView}
          onChangeView={setStudioView}
          lesson={lesson}
        />
      </TabsContent>
      <TabsContent value="course" className="mt-0 flex min-h-0 flex-1 flex-col">
        <CourseTab />
      </TabsContent>
    </Tabs>
  );
}
