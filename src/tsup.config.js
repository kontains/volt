
// tsup.config.js

import { defineConfig } from "tsup";
 
export default defineConfig([
  {
    entry: ["./src/App.tsx"], // your library path
    treeshake: true,
    minify: true,
    verbose: true,
    dts: true,
    external: ["react", "react-dom"],
    clean: true,
    outDir: "./bundle/build-sandpack", // build output
  },
]);

