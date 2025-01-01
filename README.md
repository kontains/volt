<h1 align="center">Volt</h1>

<p align="center">
  Code Agent – writing apps locally, mostly with Qwen.
</p>

### Local LLMs

- Ollama server (required)
- Qwen models by Alibaba (optional)

### Current build

- Next.js app router with React/Tailwind
- some components from Llamacoder
- code sandbox by Sandpack

### Todo

- layout: menu and buttons and much else besides.
- wiring: `qwen2.5-coder:7b` is currently hardcoded in `actions.tsx`.
- wiring: responses not yet handled by coding sandbox.

### Cloning & running

1. Clone the repo: `git clone https://github.com/kontains/volt`
2. Start [Ollama](https://github.com/ollama/ollama/releases/) server on your machine.
   NOTE: (`qwen2.5-coder:7b` is currently hardcoded in `actions.tsx`)

3. Run `npm install --legacy-peer-deps` then `npm run dev` to start locally.
4. Go to `http://localhost:3000/?t=1` in your browser.

### Contributing

- currently a WIP.
- Issues and PRs are open.
- [![Discord](https://img.shields.io/discord/416779691525931008?color=%237289da&label=Discord)](https://discord.gg/zGn7MS6) 

---

(sample)

[![ui-dark](https://github.com/kontains/volt/blob/main/assets/img/update.jpg)](https://github.com/kontains/volt)

---


