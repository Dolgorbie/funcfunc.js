import terser from "@rollup/plugin-terser";
import { globSync } from "node:fs";
import { extname, join, relative, } from "node:path";
import { defineConfig } from "rollup";

const libbasedir = join(import.meta.dirname, "/src/lib");
const libfiles = globSync(join(libbasedir, "/**/*.js"));
const libentries = Object.fromEntries(
  libfiles.map((path) => [
    relative(libbasedir, path.substring(0, path.length - extname(path).length)),
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
