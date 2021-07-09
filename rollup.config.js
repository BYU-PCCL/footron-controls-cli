// Based on https://github.com/zenclabs/viteshot/blob/af01f90dc169f027024c53aef59f68055cdcbde7/rollup.config.js
import fs from "fs";
import path from "path";
import { preserveShebangs } from "rollup-plugin-preserve-shebangs";
import typescript from "rollup-plugin-typescript2";

// noinspection JSValidateTypes
const typescriptPlugin = typescript({
  useTsconfigDeclarationDir: true,
  // include: ["./lib/*", "./render/*", "./src/*"],
  tsconfigOverride: {
    compilerOptions: {
      module: "esnext",
      declarationDir: "dist",
    },
  },
});

// noinspection JSUnusedGlobalSymbols
export default [
  {
    preserveModules: true,
    input: ["src/cli.ts"],
    output: [{ dir: "dist/lib", format: "cjs" }],
    plugins: [typescriptPlugin, preserveShebangs()],
  },
  {
    preserveModules: true,
    input: allFiles("render"),
    output: [{ dir: "dist/render", format: "esm" }],
    plugins: [typescriptPlugin],
  },
];

function allFiles(dirPath) {
  return fs.readdirSync(dirPath).flatMap((f) => {
    const filePath = path.join(dirPath, f);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      return [filePath];
    } else if (stat.isDirectory()) {
      return [...allFiles(filePath)];
    } else {
      return [];
    }
  });
}
