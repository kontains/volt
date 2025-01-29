
// page.tsx

"use client";

import { useScrollTo } from "@/src/hooks/use-scroll-to";
import { CheckIcon } from "@heroicons/react/16/solid";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

import { Sparkles, Wand2, ChevronRight, Settings2, Loader2, Cpu } from "lucide-react";

import * as Select from "@radix-ui/react-select";
import { motion } from "framer-motion";
import { FormEvent, useEffect, useState, useMemo, useCallback } from "react";
import LoadingDots from "@/src/components/loading-dots";

import {
  AI_PROVIDERS,
  ENABLED_PROVIDERS,
  initializeOllamaModels,
  getModelFullName,
  refreshOllamaModels,
} from "@/src/config/ai-providers";

import CodeViewer from "@/src/components/code-viewer";
import AnalyticsWindow from "@/src/components/AnalyticsWindow";
import ErrorFixer from "@/src/components/ErrorFixer";

// import SpinnerLoader from "@/src/components/SpinnerLoader";

import AISettingsPanel from "@/src/components/AISettingsPanel";
import ChatInterface from "@/src/components/ChatInterface";
import SavedGenerations from "@/src/components/SavedGenerations";

import { fetchOllamaModels, isOllamaAvailable } from "@/src/app/utils/ollama";

import { 
  Status,
  TokenAnalytics,
  CumulativeTokenAnalytics,
  Analytics,
  SavedGeneration,
  AISettings,
  OllamaModel
} from '@/types';

function removeCodeFormatting(code: string): string {
  return code.replace(/```(?:typescript|javascript|tsx)?\n([\s\S]*?)```/g, '$1').trim();
}

function dragStart(event) { event.dataTransfer.setData("text/plain", null); console.log("dragging!"); }

const getDefaultSettings = (provider: string): AISettings => ({
  temperature: provider === "deepseek" ? 0.0 : 0.7,
  maxTokens:
    provider === "anthropic"
      ? 200000
      : provider === "openai"
        ? 64000
        : provider === "google"
          ? 1000000
          : provider === "deepseek"
            ? 32768
            : provider === "grok"
              ? 32768
              : 200000,
  topP: 1,
  streamOutput: true,
  frequencyPenalty: 0,
  presencePenalty: 0,
});

export default function Home() {
  const [isModelInitialized, setIsModelInitialized] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [currentModelValid, setCurrentModelValid] = useState(true);
  const [status, setStatus] = useState<Status>("initial");
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [tokenAnalytics, setTokenAnalytics] = useState<CumulativeTokenAnalytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [model, setModel] = useState("");
  const [ref, scrollTo] = useScrollTo();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [currentGeneratedAppId, setCurrentGeneratedAppId] = useState<string | null>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [refinementMessages, setRefinementMessages] = useState<{ role: string; content: string }[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  const [screenConstraints, setScreenConstraints] = useState({ top: 0, left: 0, right: 0, bottom: 0 });
  
  // constrain draggables
  
  // bug: frame jumps when first clicked
  
  // todo: hide/drag conflict with frame header
  
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
  
  const groupedModels = useMemo(() => {
    if (!isModelInitialized) return [];

    return Object.entries(AI_PROVIDERS)
      .filter(([provider]) => ENABLED_PROVIDERS[provider as keyof typeof ENABLED_PROVIDERS])
      .map(([provider, models]) => ({
        provider,
        models: models.map((model) => ({
          label: provider === "ollama" ? model.name : model.name,
          value: model.id,
        })),
      }));
  }, [isModelInitialized, ollamaModels]);

  const initialProvider = groupedModels[0]?.provider || "anthropic";
  const [aiSettings, setAISettings] = useState<AISettings>(() =>
    getDefaultSettings(initialProvider)
  );

  // validation function for current model
  const validateCurrentModel = useCallback((currentModel: string, providers: typeof AI_PROVIDERS) => {
    return Object.values(providers).some(providerModels => 
      providerModels.some(model => model.id === currentModel)
    );
  }, []);

  // get current provider
  const currentProvider = useMemo(
    () =>
      groupedModels.find((g) => g.models.some((m) => m.value === model))
        ?.provider || initialProvider,
    [model, groupedModels, initialProvider]
  );

  // initialize Ollama models
  useEffect(() => {
    async function initializeModels() {
      try {
        const isOllamaRunning = await isOllamaAvailable();
        if (isOllamaRunning) {
          await initializeOllamaModels();
          const models = await fetchOllamaModels();
          setOllamaModels(models);
        }
        
        // set initial model if not set
        if (!model && groupedModels.length > 0 && groupedModels[0].models.length > 0) {
          setModel(groupedModels[0].models[0].value);
        }
      } catch {

        ENABLED_PROVIDERS.ollama = false;
      } finally {
        setIsModelInitialized(true);
      }
    }

    initializeModels();
  }, []);

  // model refresh
  useEffect(() => {
    let isSubscribed = true;

    const updateModels = async () => {
      if (!isModelInitialized) return;

      try {
        const isOllamaRunning = await isOllamaAvailable();
        if (isOllamaRunning) {
          await refreshOllamaModels();
          const updatedModels = await fetchOllamaModels();
          
          if (isSubscribed) {
            setOllamaModels(updatedModels);
            
            // validate current model after refresh
            const isValid = validateCurrentModel(model, AI_PROVIDERS);
            setCurrentModelValid(isValid);
            
            // if current model is invalid, switch to first available model
            if (!isValid && groupedModels.length > 0) {
              const firstAvailableModel = groupedModels[0].models[0]?.value;
              if (firstAvailableModel) {
                setModel(firstAvailableModel);
              }
            }
          }
        } else {
		  
          ENABLED_PROVIDERS.ollama = false;
		  
		  // if current model is an Ollama model, switch to first available non-Ollama model
          if (isSubscribed && model && AI_PROVIDERS.ollama.some(m => m.id === model)) {
            for (const [provider, models] of Object.entries(AI_PROVIDERS)) {
              if (provider !== 'ollama' && ENABLED_PROVIDERS[provider as keyof typeof ENABLED_PROVIDERS] && models.length > 0) {
                setModel(models[0].id);
                break;
              }
            }
          }
        }
      } catch {
        
        ENABLED_PROVIDERS.ollama = false;
      }
    };

    const interval = setInterval(updateModels, 100000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [model, validateCurrentModel, isModelInitialized, groupedModels]);

  // update settings when provider changes
  useEffect(() => {
    if (currentProvider) {
      setAISettings((prev) => ({
        ...prev,
        temperature: currentProvider === "deepseek" ? 0.0 : prev.temperature,
        maxTokens:
          currentProvider === "anthropic"
            ? 200000
            : currentProvider === "openai"
              ? 64000
              : currentProvider === "google"
                ? 1000000
                : currentProvider === "deepseek"
                  ? 32768
                  : currentProvider === "grok"
                    ? 32768
                    : prev.maxTokens,
      }));
    }
  }, [currentProvider]);

  const loading = status !== "initial" && status !== "created";

  // code scrolling
  useEffect(() => {
    let el = document.querySelector(".cm-scroller");
    if (el && loading) {
      let end = el.scrollHeight - el.clientHeight;
      el.scrollTo({ top: end });
    }
  }, [loading, generatedCode]);

  const updateTokenAnalytics = (newAnalytics: TokenAnalytics) => {
    setTokenAnalytics((prevAnalytics) => {
      if (!prevAnalytics) {
        return {
          ...newAnalytics,
          cumulativePromptTokens: newAnalytics.promptTokens,
          cumulativeResponseTokens: newAnalytics.responseTokens,
          cumulativeTotalTokens: newAnalytics.totalTokens,
          utilizationPercentage: (
            (newAnalytics.totalTokens / newAnalytics.maxTokens) * 100).toFixed(2),
        };
      }

      const cumulativePromptTokens =
        prevAnalytics.cumulativePromptTokens + newAnalytics.promptTokens;
      const cumulativeResponseTokens =
        prevAnalytics.cumulativeResponseTokens + newAnalytics.responseTokens;
      const cumulativeTotalTokens =
        cumulativePromptTokens + cumulativeResponseTokens;

      return {
        ...newAnalytics,
        cumulativePromptTokens,
        cumulativeResponseTokens,
        cumulativeTotalTokens,
        utilizationPercentage: (
          (cumulativeTotalTokens / newAnalytics.maxTokens) * 100).toFixed(2),
      };
    });
    setShowAnalytics(true);
  };
  
  
  // providers
  
  
  // deepseek r1 testing..
  
  /*
  useEffect(() => {
    if (currentProvider) {
      setAISettings((prev) => ({
        ...prev,
        temperature: currentProvider === "deepseek" ? 0.0 : prev.temperature,
        maxTokens:
          currentProvider === "deepseek"
                  ? 32768
                  : prev.maxTokens,
      }));
    }
  }, [currentProvider]);
  
  
  // qwen vl testing..
  
  
  */
  
  const getApiModelName = (selectedModel: string) => {
    return currentProvider === "ollama"
      ? getModelFullName(selectedModel)
      : selectedModel;
  };

  async function handleChatMessage(message: string) {
    if (!generatedCode || status !== "created") return;

    setStatus("updating");
    try {
      const updatedMessages = [
        ...refinementMessages,
        { role: "user", content: message },
      ];

      const currentModelName = getApiModelName(model);
      const res = await fetch("/api/generateCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: currentModelName,
          messages: [
            { role: "system", content: "Previous code: " + generatedCode },
            ...updatedMessages,
          ],
          settings: aiSettings,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(res.statusText || "Failed to update code");
      }

      const reader = res.body.getReader();
      let receivedData = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        receivedData += new TextDecoder().decode(value);
        const cleanedData = removeCodeFormatting(receivedData);
        setGeneratedCode(cleanedData);
      }

      setRefinementMessages(updatedMessages);
      setStatus("created");

      if (currentGeneratedAppId) {
        const analyticsRes = await fetch("/api/tokenAnalytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: currentModelName,
            prompt: message,
            generatedCode: receivedData,
            generatedAppId: currentGeneratedAppId,
          }),
        });

        if (analyticsRes.ok) {
          const analytics = await analyticsRes.json();
          updateTokenAnalytics(analytics);
        }
      }
    } catch (error) {
      console.error("Error updating code:", error);
      setStatus("created");
    }
  }

  async function generateAppIdea() {
    if (status !== "initial") return;

    setStatus("brainstorming");
    try {
      const res = await fetch("/api/generateIdea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: getApiModelName(model),
          settings: aiSettings,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(res.statusText || "Failed to generate idea");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let newIdea = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        newIdea += decoder.decode(value);
      }

      setPrompt(newIdea.trim());
    } catch (error) {
      console.error("Error generating app idea:", error);
    } finally {
      setStatus("initial");
    }
  }

  async function refinePrompt() {
    if (!prompt || status !== "initial") return;

    setStatus("refining");
    try {
      const res = await fetch("/api/refinePrompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: getApiModelName(model),
          prompt,
          settings: aiSettings,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(res.statusText || "Failed to refine prompt");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let refinedPrompt = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        refinedPrompt += decoder.decode(value);
      }

      setPrompt(refinedPrompt.trim());
    } catch (error) {
      console.error("Error refining prompt:", error);
    } finally {
      setStatus("initial");
    }
  }

  async function createApp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!prompt || status !== "initial") return;

    setStatus("creating");
    setGeneratedCode("");
    setShowAnalytics(false);
    setTokenAnalytics(null);
    setChatVisible(false);
    setRefinementMessages([]);
    setMessages([{ role: "user", content: prompt }]);

    try {
      const currentModelName = getApiModelName(model);
      const res = await fetch("/api/generateCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: currentModelName,
          messages: [{ role: "user", content: prompt }],
          settings: aiSettings,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(res.statusText || "Failed to generate code");
      }

      const reader = res.body.getReader();
      let receivedData = "";
      let ollamaResponseData = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) { break }
        const chunk = new TextDecoder().decode(value);
        receivedData += chunk;
        if (currentProvider === "ollama") { ollamaResponseData += chunk; }
        const cleanedData = removeCodeFormatting(receivedData);
        setGeneratedCode(cleanedData);
      }

      const generatedAppResponse = await fetch("/api/generated-apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: currentModelName,
          prompt,
          code: receivedData,
        }),
      });

      if (!generatedAppResponse.ok) { throw new Error("Failed to save generated app"); }
      const generatedApp = await generatedAppResponse.json();
      setCurrentGeneratedAppId(generatedApp.id);

      const analyticsRes = await fetch("/api/tokenAnalytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: currentModelName,
          prompt,
          generatedCode: receivedData,
          generatedAppId: generatedApp.id,
          ...(currentProvider === "ollama" && { ollamaResponse: ollamaResponseData }),
        }),
      });

      if (analyticsRes.ok) {
        const analytics = await analyticsRes.json();
        updateTokenAnalytics(analytics);
      }

      setStatus("created");
      setChatVisible(true);
      scrollTo({ delay: 0.5 });
    } catch (error) {
      console.error("Error generating code:", error);
      setStatus("initial");
    }
  }

  const handleLoadGeneration = (generation: SavedGeneration) => {
    setGeneratedCode(generation.generatedApp.code);
    setPrompt(generation.generatedApp.prompt);
    setModel(generation.generatedApp.model);
    setAISettings(aiSettings);
    setCurrentGeneratedAppId(generation.generatedApp.id);
    setStatus("created");
    setChatVisible(true);
    scrollTo({ delay: 0.5 });
  };

  return (
    
	<main className="mt-12 flex w-full flex-1 flex-col items-center px-4 text-center sm:mt-1">
	  
      <SavedGenerations
        currentCode={generatedCode}
        currentPrompt={prompt}
        currentModel={model}
        currentSettings={aiSettings}
        onLoad={handleLoadGeneration}
        currentGeneratedAppId={currentGeneratedAppId}
      />

      <form className="w-full max-w-xl opacity-65" onSubmit={createApp}>
        <fieldset disabled={loading} className="disabled:opacity-65">
          <div className="fixed top-12 left-[290px] w-[1000px]">
            <div className="absolute -inset-1 rounded-[9px] border-[1px] border-solid border-[#605050] bg-[rgba(104,108,125,0.30)] px-4 py-3 shadow-[0px_2px_3px_2px_rgba(0,0,0,0.25)]" />
            <div className="relative flex flex-grow items-stretch focus-within:z-10">
              <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <textarea
                  rows={ 4 }
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  name="prompt"
				  className="min-h-[100px] w-full resize-none rounded-[7px] whitespace-normal break-words bg-transparent px-6 py-5 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-700 font-semibold text-gray-300 hover:text-orange-400 placeholder:text-gray-600 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-300"
                  placeholder={
                    status === "brainstorming"
                      ? "Generating idea..."
                      : status === "refining"
                        ? "Refining prompt..."
                        : "Build a maze in JS."
                  }
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col justify-center gap-2 border-l border-white/30 px-2 py-2">
                <button
                  type="button"
                  onClick={generateAppIdea}
                  disabled={loading}
                  className="group rounded-lg p-2 transition-all duration-200 hover:bg-white/30 disabled:opacity-50"
                  title="App suggestion"
                >
                  <Sparkles className="h-5 w-5 text-yellow-300 group-hover:text-yellow-200" />
                </button>
                <button
                  type="button"
                  onClick={refinePrompt}
                  disabled={loading || !prompt}
                  className="group rounded-lg p-2 transition-all duration-200 hover:bg-white/30 disabled:opacity-50"
                  title="Refine prompt"
                >
                  <Wand2 className="h-5 w-5 text-emerald-300 group-hover:text-emerald-200" />
                </button>
                <button
                  type="submit"
                  disabled={loading || !prompt}
				  strokeWidth={2.5}
                  className="group rounded-lg p-2 transition-all duration-200 hover:bg-white/30 disabled:opacity-50"
                  title="Generate code"
                >
                  {status === "creating" ? (
                    <LoadingDots color="green" style="large" strokeWidth={2.5} />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-orange-500 group-hover:text-orange-200" strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>
          </div>
		  

          <div className="fixed top-[5px] left-[5px] w-50 h-6 flex sm:items-center rounded-[9px] border-[1px] border-solid border-[#605050] bg-[rgba(104,108,125,0.10)] shadow-[0px_2px_3px_2px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between gap-2 sm:justify-center">
                <Select.Root
                  name="model"
                  disabled={loading || !currentModelValid}
                  value={model}
                  onValueChange={setModel}
                >
                  <Select.Trigger 
                    className={`group flex w-100 max-w-xs items-center -inset-1 gap-3 rounded-[7px] border-[1px] border-solid border-[#A0A09A] bg-[rgba(14,18,25,0.30)] 
					${ currentModelValid ? 'bg-white/40' : 'bg-red-100/40' } 
					shadow-[0px_2px_3px_2px_rgba(0,0,0,0.35)] text-sm text-white-800 backdrop-blur-[2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-800`}
                  >
                    <Select.Value className="text-black-800">
                      {!currentModelValid ? 'Refreshing models...' : undefined}
                    </Select.Value>
                    <Select.Icon className="ml-auto">
                      <ChevronDownIcon className="size-5 text-white-500 group-focus-visible:text-white-500 group-enabled:group-hover:text-white-700" />
                    </Select.Icon>
                  </Select.Trigger>

                  <Select.Portal>
                    <Select.Content className="overflow-hidden rounded-md border border-white/50 bg-white/90 shadow-lg backdrop-blur-[2px]">
                      <Select.Viewport className="p-2">
                        {groupedModels.map(({ provider, models }) => (
                          <div key={provider}>
                            <div className="px-3 py-2 text-sm font-medium text-black-700 padding-[5px]">
                              {provider.charAt(0).toUpperCase() + provider.slice(1)}
                            </div>
                            {models.map((model) => (
                              <Select.Item
                                key={model.value}
                                value={model.value}
                                className="flex cursor-pointer items-center rounded-md overflow-hidden px-3 py-2 text-sm data-[highlighted]:bg-black-100 data-[highlighted]:outline-none"
                              >
                                <Select.ItemText asChild>
                                  <span className="inline-flex items-center gap-2 text-white-500">
                                    &nbsp;<div className="size-2 rounded-full bg-green-500" />
                                    {model.label}
                                  </span>
                                </Select.ItemText>
                                <Select.ItemIndicator className="ml-auto">
                                  <CheckIcon className="size-5 text-black-700" />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </div>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSettings(!showSettings);
                  }}
                  className="group rounded-lg p-2 transition-all duration-200 hover:bg-white/30 disabled:opacity-50"
                  title="AI Settings"
                >
                  <Settings2 className="h-5 w-5 text-white" />
                </button>

            </div>
          </div>
        </fieldset>
      </form>

      {status === "creating" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
        </motion.div>
      )}

      {status === "created" && (
        <>
          <hr className="border-1 mb-20 mt-8 h-px bg-gray-700 dark:bg-gray-700/30" />
          <motion.div
            initial={{ height: 0 }}
            animate={{
              height: "auto",
              overflow: "hidden",
              transitionEnd: { overflow: "visible" },
            }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            className="w-full pb-[25vh] pt-1"
            ref={ref}
          >
            <div className="relative mt-8 w-full overflow-hidden">
              <div className="isolate flex flex-col gap-4">
                <div className="mx-auto w-full">
                  {runtimeError && (
                    <ErrorFixer
                      error={runtimeError}
                      model={model}
                      code={generatedCode}
                      onFixComplete={(fixedCode) => {
                        setGeneratedCode(fixedCode);
                        setRuntimeError(null);
                      }}
                    />
                  )}
                  <CodeViewer
                    code={generatedCode}
                    showEditor
                    model={model}
                    prompt={prompt}
                    settings={aiSettings}
                    onError={(error) => {
                      console.log("Runtime error detected:", error);
                      setRuntimeError(error);
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      <ChatInterface
        visible={chatVisible}
        loading={status === "updating"}
        currentCode={generatedCode}
        model={model}
        settings={aiSettings}
        prompt={prompt}
        generatedAppId={currentGeneratedAppId}
        onUpdateCode={(newCode) => setGeneratedCode(newCode)}
        onAnalyticsUpdate={(analytics) => updateTokenAnalytics(analytics)}
      />

      <AnalyticsWindow 
        analytics={tokenAnalytics} 
        visible={showAnalytics} 
      />

      <AISettingsPanel
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        model={model}
        provider={currentProvider}
        settings={aiSettings}
        onSettingsChange={setAISettings}
      />
    </main>
  );
}

/*

 <SpinnerLoader />
 
*/