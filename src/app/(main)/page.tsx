
// page.jsx

"use client";

import * as Select from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch";
import * as Tooltip from "@radix-ui/react-tooltip";

import { CheckIcon } from "@heroicons/react/16/solid";
import { ArrowLongRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { ArrowUpOnSquareIcon } from "@heroicons/react/24/outline";

import { FormEvent, useEffect, useState } from "react";
import { continueConversation, Message } from "./actions.tsx";
import { readStreamableValue } from "ai/rsc";

export default function Home() {
  
  const [conversation, setConversation] = useState([]);
  const [input, setInput] = useState("");
  
  let [prompt, setPrompt] = useState("");
  
  let [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [],
  );
  
  return (
    <main className="mt-12 flex w-full flex-1 flex-col items-center px-4 text-center sm:mt-1">
	
	  <div className="absolute -inset-1 px-5 py-5 w-10 h-5">
        <div className="mb-4 inline-flex h-7 shrink-0 items-center gap-[9px] rounded-[7px] border-[0.5px] border-solid border-[#E6E6E6] bg-[rgba(124,128,145,0.65)] bg-gray-100 px-4 py-3 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.25)]">
           <a href="" target="_self">
            <span className="text-center font-small">⚡</span>
           </a>
		</div>
      </div>	
	 
      <div className="absolute w-full px-10 py-90 inline-flex shrink-0 items-center gap-[9px]">
        <input
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
          }}
        />
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
		  <div className="relative py-10 gap-[9px] opacity-25">
            <div className="mb-4 inline-flex h-5 shrink-0 items-center gap-[9px] rounded-[7px] border-[0.5px] border-solid border-[#E6E6E6] bg-[rgba(124,128,145,0.65)] bg-gray-100 px-4 py-3 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.25)]">
              <ArrowLongRightIcon className="-ml-0.5 size-6" />
		    </div>
		  </div>
        </button>
        <span className="relative flex gap-[12px] rounded-[7px] bg-[rgba(124,128,145,0.15)] bg-gray-100 shadow-sm opacity-50">
            <div>
              <div>
                {conversation.map((message, index) => (
                   <div key={index}>
                     {message.role}: {message.content}
                   </div>
                ))}
              </div>
			</div>
		</span>
      </div>
	  
      <hr className="border-1 mb-10 h-px bg-gray-700 dark:bg-gray-700" />
	 
    </main>
  );
}
