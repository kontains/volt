
<h1 align="center">Volt</h1>

<p align="center">
  Code Agent – writing apps locally, mostly with Qwen or Deepseek
</p>


### Local LLMs

- Ollama server (required)
- Qwen models by Alibaba (optional)
- Deepseek R1 (pending)

  📝: (`qwen2.5-coder:7b` is currently hardcoded in `actions.tsx`)


### Current build

  📝: (Select an Ollama model before prompting the agent!)

- Next.js app router with React/Tailwind
- Some components from Llamacoder
- Code sandbox by Sandpack
- Electron builder by OpenJS Foundation.
- Token stats & app settings by [nexaforge-dev](https://github.com/ageborn-dev/nexaforge-dev)


### Features

- Code + Preview frames
- Chat, Settings & Token frames
- Builds as an Electron app, or runs in a browser

  📝: (System prompt is currently preset for creating a React-based `App.tsx` codebase)
  

### Prep / Planning

  📝: (Works in progress)

 🔌  dark mode
 🔌  draggable frames
 🔌  remember chosen model
 🔌  add resize/close buttons for Electron app
 🔌  [thinking frame](https://github.com/kontains/volt/discussions/5) for Qwen Coder / Deepseek R1
 

### Cloning & Building

1.  Clone repo: `git clone https://github.com/kontains/volt`
2.  Start [Ollama](https://github.com/ollama/ollama/releases/) server on your machine.
3.  Run `npm install --legacy-peer-deps`

run in a browser:
  4.  `npm run dev` then open a browser at: `http://localhost:3000/?t=1`  
     📝: (Defaults to first available port after 3000 if busy)

or build and run the app:
  5.  `npm run build`
  6.  `npm run electron-dev` 


### Contributing

- Work in progress
- Issues and PRs are open
- [![Discord](https://img.shields.io/discord/416779691525931008?color=%237289da&label=Discord)](https://discord.gg/zGn7MS6) 

---

(sample)

[![ui-dark](https://github.com/kontains/volt/blob/main/src/assets/img/update.jpg)](https://github.com/kontains/volt)

---


