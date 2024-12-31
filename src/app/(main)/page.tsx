
// page.tsx

"use client";

import CodeViewer from "/components/code-viewer";
import * as Select from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useScrollTo } from "/components/hooks/use-scroll-to";
import { CheckIcon } from "@heroicons/react/16/solid";
import { ArrowLongRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { ArrowUpOnSquareIcon } from "@heroicons/react/24/outline";
import { FormEvent, useEffect, useState } from "react";
import { continueConversation, Message } from "./actions.tsx";
import { readStreamableValue } from "ai/rsc";

export default function Home() {

  // todo: model --> models

  const [models, setModels] = useState<{ value: string }[]>([]); // models/setModels
  const [model, setModel] = useState<string>(models[0]?.value || ""); // model/setModel
  const [conversation, setConversation] = useState([]);
  
  // todo: input --> prompt
  
  // see textarea: value={prompt}
  //               onChange={(event) => { setPrompt(event.target.value) }}
  
  const [prompt, setPrompt] = useState("");
  const [input, setInput] = useState("");
  
  const [shadcn, setShadcn] = useState<boolean>(false);
  const [modification, setModification] = useState<string>("");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [initialAppConfig, setInitialAppConfig] = useState({
    model: "",
    shadcn: false,
  });
  
  const [ref, scrollTo] = useScrollTo();
  const [isPublishing, setIsPublishing] = useState(false);
  const loading = status === "creating" || status === "updating";
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [],
  );
  
  // fetch Ollama model list
  const fetchModels = async () => {
    try {
      const response = await fetch('/api/fetchModels', { method: "GET" });
      if (!response.ok) {
      
        // throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
        throw new Error(response.statusText);
        
      }
      if (!response.body) {
        throw new Error("No response body");
      }
        
      const jsonRes = await response.json();
      const models = jsonRes.models.map(model => ({
        label: model.name,
        value: model.model
      }));
      
      setModels(models)
      
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  }

  // set default model
  useEffect(() => {
    if (models.length > 0) {
      setModel(models[0].value || "");
    }
  }, [models]);
  
  
  return (
    <main className="mt-12 flex w-full flex-1 flex-col items-center px-4 text-center sm:mt-1">
	
        <div className="absolute -inset-1 left-[1260px] bottom-[620px] flex items-center">
            <button
			  className="max-w-[400px]"
              onClick={async () => {
                const { messages, newMessage } = await continueConversation([
                  ...conversation,
                  { role: "user", content: input },
                ]);
                let textContent = "";
                for await (const delta of readStreamableValue(newMessage)) {
                  textContent = `${textContent}${delta}`;
                  setConversation([
                    ...messages,
                    { role: "assistant", content: textContent },
                  ]);
                }
              }}
            >
              <div className="mb-4 inline-flex min-h-[15px] shrink-0 items-center gap-[9px] rounded-[7px] border-[0.5px] border-solid border-[#E6E6E6] bg-[rgba(124,128,145,0.20)] bg-gray-100 px-4 py-3 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.25)]">
                <ArrowLongRightIcon className="-ml-0.5 size-7" />
              </div>
            </button>
		</div>
    
        <div className="absolute -inset-1 px-5 py-5 w-10 h-5">
            <div className="mb-4 inline-flex h-7 shrink-0 items-center gap-[9px] rounded-[7px] border-[0.5px] border-solid border-[#E6E6E6] bg-[rgba(124,128,145,0.25)] bg-gray-100 px-4 py-3 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.25)]">
             <a href="" target="_self">
              <span className="text-center font-small">⚡</span>
             </a>
            </div>
        </div>
        
        <div className="absolute -inset-1 px-40 py-30 max-w-200 h-[25px]">
          <div className="relative rounded-[9px] border-[1px] border-solid border-[#605050] bg-[rgba(104,108,125,0.30)] shadow-[0px_2px_3px_2px_rgba(0,0,0,0.25)]" />
            <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <textarea
                  name="prompt"
                  type="text"
                  rows={1}
                  required
                  value={input}
                  onChange={(event) => { setInput(event.target.value); }}
                  className="w-full resize-none rounded-l-3xl bg-transparent px-6 py-5 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-700"
                  placeholder="Build a maze using JS."
                />
            </div>

        </div>
        
		<div className="absolute -inset-1 right-[1260px] bottom-[540px] flex items-center justify-between gap-3 sm:justify-center">
          <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex items-center justify-between gap-3 sm:justify-center">
              <Select.Root
                name="model"
                disabled={loading}
                value={model}
                onValueChange={(value) => setModel(value)}
              >
                <Select.Trigger className="group flex w-50 max-w-xs items-center -inset-1 rounded-[5px] border-[1px] border-solid border-[#A0A09A] bg-[rgba(14,18,25,0.70)] px-4 py-3 shadow-[0px_2px_3px_2px_rgba(0,0,0,0.35)] px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-500">
                  <Select.Value />
                  <Select.Icon className="ml-auto">
                    <ChevronDownIcon className="size-5 text-gray-100 group-focus-visible:text-gray-500 group-enabled:group-hover:text-gray-500" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="overflow-hidden rounded-md bg-white shadow-lg">
                    <Select.Viewport className="p-2">
                      {models.map((model) => (
                        <Select.Item
                          key={model.value}
                          value={model.value}
                          className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100 data-[highlighted]:outline-none"
                        >
                          <Select.ItemText asChild>
                            <span className="inline-flex items-center gap-2 text-gray-500">
                              <div className="size-2 rounded-full bg-green-500" />
                              {model.label}
                            </span>
                          </Select.ItemText>
                          <Select.ItemIndicator className="ml-auto">
                            <CheckIcon className="size-5 text-gray-800" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                    <Select.Arrow />
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>
		</div>
        
        <div className="relative inline-flex shrink-0 items-center gap-[9px]">
            <div className="flex gap-[12px] rounded-[7px] bg-[rgba(124,128,145,0.15)] bg-gray-200 shadow-sm opacity-50">
              <div>
                <div>
                  {conversation.map((message, index) => (
                     <div key={index}>
                       {message.role}: {message.content}
                     </div>
                  ))}
                </div>
              </div>
            </div>
        </div>
      
        <hr className="border-1 mb-10 h-px bg-gray-700 dark:bg-gray-700" />
     
    </main>
  );
}

/*
            <div className="absolute -inset-1 px-600 py-100 max-w-20 h-10">
              <button
                type="submit"
                disabled={loading}
                className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-3xl px-3 py-2 text-sm font-semibold text-orange-500 hover:text-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 disabled:text-gray-900"
              >
                {status === "creating" ? (
                  <LoadingDots color="black" style="large" />
                ) : (
                  <ArrowLongRightIcon className="-ml-0.5 size-6" />
                )}
              </button>
			</div>
*/