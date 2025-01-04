
<h1 align="center">Volt</h1>

<p align="center">
  Code Agent – writing apps locally, mostly with Qwen.
</p>

### Local LLMs

- Ollama server (required)
- Qwen models by Alibaba (optional)

### Current build

- Next.js app router with React/Tailwind.
- Some components from Llamacoder.
- Code sandbox by Sandpack.

### Working

- Type a question then click on 'Chat' for assistance.

### Todo

- pending: fix dark mode (it turns chat text off)

- ui       menu, buttons, and much else besides.
- wiring:  toggle chat window on/off.
- wiring:  preview currently shows default react 'hello world', not the shown `App.tsx` code.
- wiring:  `qwen2.5-coder:7b` is currently hardcoded in `actions.tsx`.
- wiring:  agent responses not yet handled by coding sandbox.

### Cloning & running

1. Clone repo: `git clone https://github.com/kontains/volt`
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


