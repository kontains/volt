
// actions.tsx

"use server";

import { ollama } from "ollama-ai-provider";
import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
import { Message } from "./types.tsx";

import prisma from "@/lib/prisma";
import shadcnDocs from "@/lib/shadcn-docs";
import dedent from "dedent";
import { notFound } from "next/navigation";
import { z } from "zod";

export async function continueConversation(history: Message[]): Promise<{ messages: Message[]; newMessage: string }> {

  "use server";

  const stream = createStreamableValue();
  const model = ollama("qwen2.5-coder:7b");

  (async () => {
    const { textStream } = await streamText({
      model: model,
      messages: history,
    });

    for await (const text of textStream) {
      stream.update(text);
    }

    stream.done();
  })().then(() => {});

  return {
    messages: history,
    newMessage: stream.value,
  };
}
