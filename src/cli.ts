#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { startRenderer } from "./renderer";

yargs(hideBin(process.argv))
  .command(
    ["*", "dev"],
    "run dev server",
    (yargs) =>
      yargs
        .option("port", {
          alias: "p",
          describe: "port to listen on",
          default: 8009,
        })
        .option("network", {
          describe: "bind on 0.0.0.0",
          type: "boolean",
          default: false,
        }),
    async (args) => startRenderer(args)
  )
  .demandCommand().argv;
