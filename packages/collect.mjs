"use strict";
import { open, readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const outPathPrefix = join(import.meta.dirname, "codes");

async function main() {
  const allItems = await readdir(join(import.meta.dirname, "funcfunc-core"), { recursive: true, withFileTypes: true });
  const targetFiles = allItems
    .filter((x) => x.isFile())
    .map(({ parentPath, name }) => join(parentPath, name))
    .map((s) => s.replace(/\\/g, "/"))
    .filter((x) => !/^(?:.*\/funcfunc-core\/package-lock.json|.*\/funcfunc-core\/dist\/.*|.*\/funcfunc-core\/node_modules\/.*|.*\/.DS_Store)$/.test(x))
    .toSorted();
  const groupedFiles = targetFiles.reduce((acc, path, i) => i % 3 === 0 ? [...acc, [path]] : [...acc.slice(0, -1), [...acc.at(-1), path]], []);

  await Promise.all(groupedFiles.map(async (files, i) => {
    const opath = `${outPathPrefix}${`${i}`.padStart(2, "0")}.txt`;
    let ofile;
    try {
      ofile = await open(opath, "w");
      for (const f of files) {
        console.log("begin writing", f);
        const idata = readFile(f, "utf-8");
        await ofile.writeFile(`\f## BEGIN-FILE: ${relative(import.meta.dirname, f).replace(/\\/g, "/")}\n\n`);
        await ofile.writeFile(await idata);
        await ofile.writeFile(`\n## END-FILE: ${relative(import.meta.dirname, f).replace(/\\/g, "/")}\n`);
        console.log("complete writing", f);
      }
    } finally {
      if (ofile) {
        ofile.close();
      }
    }
  }));
}

await main();
