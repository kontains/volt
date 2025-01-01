
// share.ts

"use server";

import client from "/components/lib/prisma";

export async function shareApp({ generatedCode, prompt, model, }: {
  generatedCode: string;
  prompt: string;
  model: string;
}) {
  let newApp = await client.generatedApp.create({
    data: {
      code: generatedCode,
      model: model,
      prompt: prompt,
    },
  });

  return newApp.id;
}
