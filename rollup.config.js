import deckyPlugin from "@decky/rollup";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";

export default deckyPlugin({
  input: "src/index.tsx", // Entry file for the plugin
  output: {
    dir: "dist",          // Output directory for the built files
    format: "cjs",        // CommonJS format, required for Decky Loader plugins
  },
  plugins: [
    resolve(),            // Resolves `node_modules` imports
    commonjs(),           // Converts CommonJS modules to ES modules
    typescript(),         // Compiles TypeScript to JavaScript
  ],
});