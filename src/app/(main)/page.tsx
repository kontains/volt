
// page.tsx

"use client";

import CodeViewer from "/components/code-viewer";
import LoadingDots from "/components/loading-dots";
import { domain } from "/components/utils/domain";
import { CheckIcon } from "@heroicons/react/16/solid";
import { ArrowLongRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { ArrowUpOnSquareIcon } from "@heroicons/react/24/outline";
import { SandpackEditor } from '@codesandbox/sandpack-react';
import { useScrollTo } from "/components/hooks/use-scroll-to";
import * as Select from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch";
import * as Tooltip from "@radix-ui/react-tooltip";
// import Switch from '@headlessui/react';
import { AnimatePresence, motion } from "framer-motion";
import React, { FormEvent, useEffect, useState, useRef } from "react";
import { toast, Toaster } from "sonner";
import { shareApp } from "./share.tsx";
import { continueConversation, Message } from "./actions.tsx";
import { readStreamableValue } from "ai/rsc";

function removeCodeFormatting(code: string): string {
  return code.replace(/```(?:typescript|javascript|tsx)?\n([\s\S]*?)```/g, '$1').trim();
}

// document level..
function dragStart(event) { event.dataTransfer.setData("text/plain", null); console.log("dragging!"); }

// app main homepage
export default function Home() {

  const [screenConstraints, setScreenConstraints] = useState({ top: 0, left: 0, right: 0, bottom: 0 });

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
  
   useEffect(() => {
    (async () => toggleSwitch())();
  }, []);
  
  useEffect(() => {
    const updateScreenConstraints = () => {
      const { innerWidth, innerHeight } = window;
      setScreenConstraints({
        top: -20,
        left: 0 - innerWidth / 2 + 50,
        right: innerWidth - (innerWidth / 2) - 50,
        bottom: innerHeight - 120,
      });
    };

    window.addEventListener('resize', updateScreenConstraints);
    updateScreenConstraints();

    return () => {
      window.removeEventListener('resize', updateScreenConstraints);
    };
  }, []);
  
  // set first model as default
  useEffect(() => {
    if (models.length > 0) { setModel(models[0].value || ""); }
  }, [models]);
  
  let [model, setModel] = useState<string>(models[0]?.value || "");
  
  // await sandpack ...
  // useEffect(() => {
  //  (async () => preloadSandpackApp())();
  // }, []);

  
  let [shadcn, setShadcn] = useState<boolean>(false);
  let [toggle, setToggle] = useState<boolean>(false);
  
  let [modification, setModification] = useState<string>("");
  let [generatedCode, setGeneratedCode] = useState<string>("");
  let [initialAppConfig, setInitialAppConfig] = useState({
    model: "",
    shadcn: true,
  });
  
  let [ref, scrollTo] = useScrollTo();
  let [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [],
  );

  let [isPublishing, setIsPublishing] = useState(false);
  let loading = status === "creating" || status === "updating";

  async function createApp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status !== "initial") {
      scrollTo({ delay: 1.5 });
    }

    setStatus("creating");
    setGeneratedCode("");

    let response = await fetch("/api/generateCode", {
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

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    let receivedData = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      receivedData += new TextDecoder().decode(value);
      const cleanedData = removeCodeFormatting(receivedData);
      setGeneratedCode(cleanedData);
    }

    setMessages([{ role: "user", content: prompt }]);
    setInitialAppConfig({ model, shadcn });
    setStatus("created");
  }

    // update app
  async function updateApp(event: FormEvent<HTMLFormElement>) {
  
    event.preventDefault();
    setStatus("updating");
	
    let codeMessage = { role: "assistant", content: generatedCode };
    let modificationMessage = { role: "user", content: modification };
	
    setGeneratedCode("");
	
    let response = await fetch("/api/generateCode", {
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
	
    if (response) {
	  setStatus("Ollama response found! Processing...");
	  await processGeneratedCode(response);
	} else {
	  setStatus("no response from Ollama");
	}
	
    setMessages(messages => [...messages, codeMessage, modificationMessage]);
    setStatus("updated");
	
  }
  
  // scroll to
  useEffect(() => {
    let element = document.querySelector(".cm-scroller");
    if (element && loading) {
      let end = element.scrollHeight - element.clientHeight;
      element.scrollTo({ top: end });
    }
  }, [loading, generatedCode]);
  
  
  // create chat
  async function createChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("chat-mode");
    setGeneratedCode("");
    let response = await fetch("/api/generateCode", {
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
    if (!response.ok) { throw new Error(response.statusText); }
    if (!response.body) { throw new Error("No response body"); }
    const reader = response.body.getReader();
    let receivedData = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) { break; }
      receivedData += new TextDecoder().decode(value);
      const cleanedData = removeCodeFormatting(receivedData);
      setGeneratedCode(cleanedData);
    }
    setMessages([{ role: "user", content: prompt }]);
    // setInitialAppConfig({ model, shadcn });
    // setStatus("created");
  }
  
  // fetch models
  const fetchModels = async () => {
    try {
      const response = await fetch('/api/fetchModels', { method: "GET" });
      if (!response.ok) {
        // throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
		throw new Error(response.statusText);
      }
      if (!response.body) { throw new Error("No response body"); }
	  
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
  
  // function dragStart(event) { event.dataTransfer.setData("text/plain", null); console.log("dragging!"); }
  
  // toggle switch..
  const toggleSwitch = async () => {
    try {
      console.log("toggle!" + event);

      return (
        <div className="flex h-full items-center justify-between gap-3 sm:justify-center">
          <Switch.Root
            className="group flex w-20 max-w-xs items-center rounded-2xl border-[6px] border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E293B] p-1.5 text-sm shadow-inner transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-500"
            id="toggle"
            name="toggle"
            checked={toggle}
            onCheckedChange={(value) => setToggle(value)}
          >
            <Switch.Thumb className="size-7 rounded-lg bg-gray-200 dark:bg-gray-700 shadow-[0px_1px_2px] shadow-gray-400 dark:shadow-black transition data-[state=checked]:translate-x-7 data-[state=checked]:bg-white dark:data-[state=checked]:bg-white data-[state=checked]:shadow-gray-600" />
          </Switch.Root>
        </div>
      );
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  }
  
  // preload app.tsx ... (await sandpack)
  const preloadSandpackApp = async () => {
    const loadFiles = {
      '/src/App.tsx': {
        code: `
        // sandpack react
        import React from 'react';
        
        // Edit me!
        export default function App () {
          const [count, setCount] = useState(0)
          return (
            <button onClick={() => setCount(count + 1)}>
              Clicked {count} times
            </button>
          )
        }

        export default App;
        `,
        hidden: false,
      },
    }
    return (
      <Sandpack
        files={loadFiles}
        options={{
		  readOnly: false,
          editorHeight: "80vh",
          showConsole: true,
          showLineNumbers: true,
          showTabs: true,
          showNavigator: true,
          ...sharedOptions,
        }}
        {...sharedProps}
      />
    )
  }

//------------- main template --------------

  
  return (

    <main className="mt-12 flex w-full flex-1 flex-col items-center px-4 text-center sm:mt-1">
	
      <div className="fixed right-9 top-1 w-20 h-5 opacity-60 focus-within:z-10">
	    <a href="" target="_self">
          <div className="mb-4 inline-flex h-7 shrink-0 items-center gap-[9px] rounded-[7px] border-[0.5px] border-solid border-[#E6E6E6] bg-[rgba(124,128,145,0.65)] bg-gray-100 px-4 py-3 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.25)]">
            <span className="text-center font-small">Reset</span>
          </div>
        </a>
		<div className="flex h-full items-center justify-between gap-3 sm:justify-center">
          <Switch.Root
              className="group flex w-20 max-w-xs items-center rounded-2xl border-[6px] border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E293B] p-1.5 text-sm shadow-inner transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-500"
              id="toggle"
              name="toggle"
              checked={toggle}
              onCheckedChange={(value) => setToggle(value)}
            >
              <Switch.Thumb className="size-7 rounded-lg bg-gray-200 dark:bg-gray-700 shadow-[0px_1px_2px] shadow-gray-400 dark:shadow-black transition data-[state=checked]:translate-x-7 data-[state=checked]:bg-white dark:data-[state=checked]:bg-white data-[state=checked]:shadow-gray-600" />
          </Switch.Root>
        </div>
      </div>
      
      <form className="w-full max-w-xl opacity-65" onSubmit={createApp}>
        <fieldset disabled={loading} className="disabled:opacity-65">
          <div className="fixed top-3 left-[310px] w-[750px]">
            <div className="absolute -inset-1 rounded-[9px] border-[1px] border-solid border-[#605050] bg-[rgba(104,108,125,0.30)] px-4 py-3 shadow-[0px_2px_3px_2px_rgba(0,0,0,0.25)]" />
            <div className="relative flex flex-grow items-stretch focus-within:z-10">
              <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <textarea
                  rows={1}
                  required
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
				  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  name="prompt"
                  className="w-full resize-none rounded-[7px] bg-transparent px-6 py-5 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-700 font-semibold text-gray-200 hover:text-orange-400"
                  placeholder="..."
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
          </div>
		  
          <div className="fixed top-[2px] left-[2px] flex flex-col justify-center gap-4 sm:flex-row sm:items-center sm:gap-8">
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
      
      {status !== "initial" && (
        <motion.div
          initial={{ height: 0 }}
          animate={{
            height: "auto",
            overflow: "hidden",
            transitionEnd: { overflow: "visible" },
          }}
          transition={{ type: "spring", bounce: 0, duration: 0.9 }}
          className="w-full pb-[25vh] pt-1"
          onAnimationComplete={() => scrollTo()}
          ref={ref}
        >
		<div className="fixed top-[52px] left-[3px] flex w-[270px] max-h-[20px] opacity-20">
            <form onSubmit={updateApp}>
              <fieldset disabled={loading} className="group">
                <div className="relative">
				  <div className="w-200 rounded-[9px] border-[1px] border-solid border-[#605050] bg-[rgba(104,108,125,0.30)] shadow-[0px_2px_3px_2px_rgba(0,0,0,0.25)]">
                   <div className="flex flex-col justify-center gap-4 sm:flex-row sm:items-center sm:gap-8">
                    <div className="relative py-65 flex items-center justify-between gap-3 sm:justify-center">
                      <input
                        required
                        name="modification"
                        value={modification}
                        onChange={(e) => setModification(e.target.value)}
                        className="w-full rounded-l-3xl bg-transparent text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed"
                        placeholder="..."
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
                </div>
              </fieldset>
            </form>
          </div>
		  
          <div className="fixed top-[100px] left-[5px] w-full-minus-10 overflow-hidden">
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
                    delay: 0.9,
                  }}
                  className="absolute inset-x-0 bottom-0 top-1/2 flex items-center justify-center rounded-r border border-gray-400 dark:border-gray-700 bg-gradient-to-br from-gray-100 to-gray-300 dark:from-[#1E293B] dark:to-gray-800 md:inset-y-0 md:left-1/2 md:right-0"
                >
                  <p className="animate-pulse text-3xl font-bold dark:text-gray-100">
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
	  
	  <motion.div 
         drag
         dragElastic={0}
		 dragConstraints={screenConstraints}
		 dragMomentum={false}
         dragDirectionLock={false}
         className="draggable-box"
         style={{
          width: '0px',
          height: '0px',
          cursor: 'grab',
		  visible: 'false',
         }}
      >
	    <div className="z-[999] rounded-[9px] opacity-77 border-[1px] border-solid border-[#605050] bg-[rgba(104,108,125,0.30)] px-4 py-3 shadow-[0px_2px_3px_2px_rgba(0,0,0,0.25)]">
	     <div>
          <form onSubmit={createChat}>
            <fieldset disabled={loading} className="disabled:opacity-25">
              <button className="dark:shadow-black font-bold text-orange-200 hover:text-orange-400"
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
                <span className="font-small">Chat</span>
              </button>
            </fieldset>
          </form>
        </div>

        <div className="relative inline-flex w-full h-full shrink-0 items-center gap-[9px] rounded-[9px] border-[0.5px] border-solid border-[#E6E6E6] bg-[rgba(124,128,145,0.65)] bg-gray-100 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.25)]">
          {conversation.map((message, index) => (
            <div key={index}>
              <textarea className="relative inline-flex h-full"
                name="input"
                rows={12}
                required
                value={message.content}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder=""
              />
            </div>
          ))}
        </div>
       </div>
      </motion.div>

	  
    </main>
  );
}

async function minDelay<T>(promise: Promise<T>, ms: number) {
  let delay = new Promise((resolve) => setTimeout(resolve, ms));
  let [p] = await Promise.all([promise, delay]);
  return p;
}

