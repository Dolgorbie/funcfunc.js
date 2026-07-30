import terser from "@rollup/plugin-terser";
import { globSync } from "node:fs";
import { defineConfig } from "rollup";

const libbasedir = `${import.meta.dirname}/src/lib`;
const libfiles = globSync(`${libbasedir}/**/*.js`);
const libentries = Object.fromEntries(
  libfiles.map((path) => [
    path.substring(libbasedir.length + 1, path.length - 3),
    path]));

export default defineConfig([
  {
    input: "src/main.js",
    output: [
      {
        dir: "dist",
        format: "es",
      },
      {
        dir: "dist",
        format: "es",
        entryFileNames: "[name].min.js",
        sourcemap: true,
        plugins: [terser({ mangle: { properties: { regex: /^_.*/ } } })],
      },
    ],
  },
  {
    input: libentries,
    output: [
      {
        dir: "dist/lib",
        format: "es",
      },
      {
        dir: "dist/lib",
        format: "es",
        entryFileNames: "[name].min.js",
        sourcemap: true,
        plugins: [terser({ mangle: { properties: { regex: /^_.*/ } } })],
      },
    ],
  },
]);
