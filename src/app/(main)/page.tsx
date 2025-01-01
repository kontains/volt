
// page.tsx

"use client";

import CodeViewer from "/components/code-viewer";
import { useScrollTo } from "/components/hooks/use-scroll-to";
import { domain } from "/components/utils/domain";
import { CheckIcon } from "@heroicons/react/16/solid";
import { ArrowLongRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { ArrowUpOnSquareIcon } from "@heroicons/react/24/outline";
import * as Select from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch";
import * as Tooltip from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import LoadingDots from "/components/loading-dots";
import { shareApp } from "./share.ts";

import { continueConversation, Message } from "./actions.tsx";
import { readStreamableValue } from "ai/rsc";

function removeCodeFormatting(code: string): string {
  return code.replace(/```(?:typescript|javascript|tsx)?\n([\s\S]*?)```/g, '$1').trim();
}

export default function Home() {
  let [status, setStatus] =
    useState<"initial" | "creating" | "created" | "updating" | "updated">("initial");
  let [prompt, setPrompt] = useState("");

  // const [models, setModels] = useState([]);
  const [models, setModels] = useState<{ value: string }[]>([]);
  const [conversation, setConversation] = useState([]);
  const [input, setInput] = useState("");
  
  useEffect(() => {
    (async () => fetchModels())();
  }, []);
  
  let [model, setModel] = useState<string>(models[0]?.value || "");
  let [shadcn, setShadcn] = useState<boolean>(false);
  let [modification, setModification] = useState<string>("");
  let [generatedCode, setGeneratedCode] = useState<string>("");
  let [initialAppConfig, setInitialAppConfig] = useState({
    model: "",
    shadcn: false,
  });

  let [ref, scrollTo] = useScrollTo();
  let [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [],
  );
  let [isPublishing, setIsPublishing] = useState(false);
  let loading = status === "creating" || status === "updating";

/*
  async function fetchModels() {
    const res = await fetch("/api/fetchModels", {
      method: "GET",
    });
    const jsonRes = await res.json();
    const models = jsonRes.models.map(model => ({
        label: model.name,
        value: model.model
      }));
    setModels(models)
  }
*/

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
	  
	  /*
	  const reader = response.body.getReader();
	  let receivedData = "";
      while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const receivedLines = new TextDecoder().decode(value);
          receivedLines.split("\n")
            .filter(receivedLine => receivedLine.length > 0)
            .forEach(receivedLine => {
              console.log('Received Line:', receivedLine); // Log each line
              try {
                receivedData += JSON.parse(receivedLine).response;
              } catch (error) {
                console.error('Invalid JSON:', receivedLine, error);
              }
		  }
	  }
	  */
	  
      const jsonRes = await response.json();
	  const models = jsonRes.models.map(model => ({
        label: model.name,
        value: model.model
      }));
      setModels(models)
	  
	  // disabled...
	  // const cleanedData = removeCodeFormatting(receivedData);
      // setGeneratedCode(cleanedData);
	  
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  }

  useEffect(() => {
    if (models.length > 0) {
      setModel(models[0].value || "");
    }
  }, [models]);
  
  // create app
  async function createApp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (status !== "initial") {
      scrollTo({ delay: 0.5 });
    }

    setStatus("creating");
    setGeneratedCode("");

    let res = await fetch("/api/generateCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        shadcn,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    await processGeneratedCode(res);

    setMessages([{ role: "user", content: prompt }]);
    setInitialAppConfig({ model, shadcn });
    setStatus("created");
  }

  // update app
  async function updateApp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setStatus("updating");

    let codeMessage = { role: "assistant", content: generatedCode };
    let modificationMessage = { role: "user", content: modification };

    setGeneratedCode("");

    let res = await fetch("/api/generateCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        shadcn,
        messages: [...messages, codeMessage, modificationMessage],
      }),
    });
	
    await processGeneratedCode(res);

    setMessages(messages => [...messages, codeMessage, modificationMessage]);
    setStatus("updated");
	
	// testing prompt resizing..
	var prompt = document.querySelector('prompt'); // get the prompt element
    prompt.addEventListener('prompt', resizeInput); // bind the "resizeInput" callback on "prompt" event
    resizeInput.call(prompt); // immediately call the function

  }

/*
  async function processGeneratedCode(res: Response) {
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    if (!res.body) {
      throw new Error("No response body");
    }
    const reader = res.body.getReader();
    let receivedData = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) { break; }
      const receivedLines = new TextDecoder().decode(value);
      receivedLines.split("\n")
        .filter(receivedLines => receivedLines.length > 0)
        .forEach(receivedLine => {
          receivedData += JSON.parse(receivedLine).response;
        })
      const cleanedData = removeCodeFormatting(receivedData);
      setGeneratedCode(cleanedData);
    }
  }
*/

  // logging
  async function processGeneratedCode(res: Response) {
   if (!res.ok) { throw new Error(res.statusText);  }
   if (!res.body) { throw new Error("No response body"); }
   const reader = res.body.getReader();
   let receivedData = "";
   
   while (true) {
    const { done, value } = await reader.read();
    if (done) { break; }
    const receivedLines = new TextDecoder().decode(value);
    receivedLines.split("\n")
      .filter(receivedLine => receivedLine.length > 0)
      .forEach(receivedLine => {
        console.log('Received Line:', receivedLine); // Log each line
        try {
          receivedData += JSON.parse(receivedLine).response;
        } catch (error) {
          console.error('Invalid JSON:', receivedLine, error);
        }
      });
   }

   const cleanedData = removeCodeFormatting(receivedData);
   setGeneratedCode(cleanedData);
   
  }

  useEffect(() => {
    let scroll = document.querySelector(".cm-scroller");
    if (scroll && loading) {
      let end = scroll.scrollHeight - scroll.clientHeight;
      scroll.scrollTo({ top: end });
    }
  }, [loading, generatedCode]);

  // todo: /component/Menu.tsx

  return (
    <main className="mt-12 flex w-full flex-1 flex-col items-center px-4 text-center sm:mt-1">
    
	    <div className="absolute -inset-1 px-0 py-0 w-20 h-5 opacity-10">
          <div className="mb-4 inline-flex h-7 shrink-0 items-center gap-[9px] rounded-[7px] border-[0.5px] border-solid border-[#E6E6E6] bg-[rgba(124,128,145,0.65)] bg-gray-100 px-4 py-3 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.25)]">
           <a href="" target="_self">
            <span className="text-center font-small">Menu</span>
           </a>
		  </div>
		</div>
		
        <form className="w-full max-w-xl opacity-70" onSubmit={createApp}>
         <fieldset disabled={loading} className="disabled:opacity-65">
          <div className="relative mt-4">
           <div className="absolute -inset-1 rounded-[9px] border-[1px] border-solid border-[#605050] bg-[rgba(104,108,125,0.30)] px-4 py-3 shadow-[0px_2px_3px_2px_rgba(0,0,0,0.25)]" />
             <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <textarea
                  rows={1}
                  required
				  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  name="prompt"
                  className="w-full resize-none rounded-l-3xl bg-transparent px-6 py-5 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-700 font-semibold text-gray-200 hover:text-orange-400"
                  placeholder="Build a maze using JS."
                />
             </div>
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
         </fieldset>
        </form>
	  
        <div className="relative mt-1 max-w-xl">
         <form onSubmit={createApp}>
          <fieldset disabled={loading} className="disabled:opacity-65">
             <div className="relative flex bg-gray-100 shadow-sm opacity-65">
			  <span className="relative flex rounded-[7px] bg-gray-100 shadow-sm opacity-65">
               <button
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
			    <ArrowLongRightIcon className="-ml-0.5 size-6" />
               </button>
			  </span>
             </div>
          </fieldset>
         </form>
		 
		 
         <div className="relative inline-flex w-full h-full shrink-0 items-center gap-[9px] rounded-[9px] border-[0.5px] border-solid border-[#E6E6E6] bg-[rgba(124,128,145,0.65)] bg-gray-100 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.25)]">
            {conversation.map((message, index) => (
            <div key={index}>
		      <textarea className="relative inline-flex h-full"
                name="input"
                rows={14}
                required
                value={message.content}
                // onChange={(event) => setPrompt(event.target.value)}
                placeholder=""
              />
            </div>
          ))}
         </div>
        </div>
		
        <hr className="border-1 mb-10 h-px bg-gray-700 dark:bg-gray-700" />

        {status !== "initial" && (
         <motion.div
          initial={{ height: 0 }}
          animate={{
            height: "auto",
            overflow: "hidden",
            transitionEnd: { overflow: "visible" },
          }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          className="w-full pb-[25vh] pt-1"
          onAnimationComplete={() => scrollTo()}
          ref={ref}
         >
         <div className="mt-5 flex gap-2">
            <form className="w-full" onSubmit={updateApp}>
              <fieldset disabled={loading} className="group">
                <div className="relative">
                  <div className="relative flex rounded-3xl bg-white shadow-sm group-disabled:bg-gray-50">
                    <div className="relative flex flex-grow items-stretch focus-within:z-10">
                      <input
                        required
                        name="modification"
                        value={modification}
                        onChange={(e) => setModification(e.target.value)}
                        className="w-full rounded-l-3xl bg-transparent text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed"
                        placeholder="Change app here"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-3xl px-3 py-2 text-sm font-semibold text-orange-500 hover:text-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgba(124,128,145,0.65)] disabled:text-gray-900"
                    >
                      {loading ? (
                        <LoadingDots color="black" style="large" />
                      ) : (
                        <ArrowLongRightIcon className="-ml-0.5 size-6" />
                      )}
                    </button>
                  </div>
                </div>
              </fieldset>
            </form>
            <div>
              <Toaster invert={true} />
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button
                      disabled={loading || isPublishing}
                      onClick={async () => {
                        setIsPublishing(true);
                        let userMessages = messages.filter(
                          (message) => message.role === "user",
                        );
                        let prompt =
                          userMessages[userMessages.length - 1].content;

                        const appId = await minDelay(
                          shareApp({
                            generatedCode,
                            prompt,
                            model: initialAppConfig.model,
                          }),
                          2000,
                        );
                        setIsPublishing(false);
                        toast.success(
                          `Copied to clipboard: http://localhost:port/share/${appId}`,
                        );
                        navigator.clipboard.writeText(
                          `${domain}/share/${appId}`,
                        );
                      }}
                      className="inline-flex h-[34px] w-36 items-center justify-center gap-2 rounded-[5px] bg-[rgba(14,18,25,0.70)] transition enabled:hover:bg-[rgba(14,18,25,0.70)] disabled:grayscale"
                    >
                      <span className="relative">
                        {isPublishing && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <LoadingDots color="white" style="large" />
                          </span>
                        )}

                        <ArrowUpOnSquareIcon
                          className={`${isPublishing ? "invisible" : ""} size-5 text-xl text-white`}
                        />
                      </span>

                      <span className="text-sm font-semibold text-orange-600">share</span>
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="select-none rounded bg-white px-4 py-2.5 text-sm leading-none shadow-md shadow-black/20"
                      sideOffset={5}
                    >
                      Publish your app to the internet.
                      <Tooltip.Arrow className="fill-white" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
         </div>


         <div className="relative mt-8 w-full overflow-hidden">
            <div className="isolate">
              <CodeViewer code={generatedCode} showEditor />
            </div>

            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={status === "updating" ? { x: "100%" } : undefined}
                  animate={status === "updating" ? { x: "0%" } : undefined}
                  exit={{ x: "100%" }}
                  transition={{
                    type: "spring",
                    bounce: 0,
                    duration: 0.85,
                    delay: 0.5,
                  }}
                  className="absolute inset-x-0 bottom-0 top-1/2 flex items-center justify-center rounded-r border border-gray-400 bg-gradient-to-br from-gray-100 to-gray-300 md:inset-y-0 md:left-1/2 md:right-0"
                >
                  <p className="animate-pulse text-3xl font-small">
                    {status === "creating"
                      ? "Building app..."
                      : "Updating app..."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
         </div>
        </motion.div>
       )}
    </main>
  );
}


// testing input resizing..
function resizeInput() { this.style.width = this.value.length + "ch"; }


// minimum delay
async function minDelay<T>(promise: Promise<T>, ms: number) {
  let delay = new Promise((resolve) => setTimeout(resolve, ms));
  let [p] = await Promise.all([promise, delay]);

  return p;
}

/*

	 		  <input className="relative flex flex-grow pw-150px ph-20px max-w-xl"
				size="90"
				maxLength="900"
		        name="prompt"
                type="text"
                value={input}
				value={prompt}
                onChange={(event) => { setInput(event.target.value); }}
              />
*/
