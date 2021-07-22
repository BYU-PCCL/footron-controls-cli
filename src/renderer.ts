// TODO: See if we can't just make this a default export
import path from "path";
import fs from "fs-extra";
import { Server } from "http";
import tsconfigPaths from "vite-tsconfig-paths";
import * as vite from "vite";
import connect from "connect";

export async function startRenderer({
  port,
  network,
}: {
  port: number;
  network: boolean;
}): Promise<() => Promise<void>> {
  const rendererDirPath = path.join(__dirname, "..", "render");
  const rendererFilename = (await fs.pathExists(
    path.join(rendererDirPath, "index.js")
  ))
    ? "index.js"
    : "index.tsx";
  const rendererPath = path.join(rendererDirPath, rendererFilename);
  const projectPath = process.cwd();
  const rootComponentPath = path.join("lib", "index.tsx");
  const rendererContent = `${await fs.readFile(rendererPath, "utf8")}
  import DevControlsComponent from "/${rootComponentPath}";
  
  render(DevControlsComponent);
  `;

  const viteServer = await vite.createServer({
    root: projectPath,
    server: {
      middlewareMode: true,
      hmr: {
        overlay: false,
      },
    },
    optimizeDeps: {
      entries: [rootComponentPath],
      include: ["react", "react-dom"],
    },
    esbuild: {
      jsxFactory: `jsx`,
      jsxInject: `import { jsx } from '@emotion/react'`,
    },
    plugins: [
      {
        name: "react",
        transform(code: string, id: string) {
          if (id.endsWith("sx") && !code.includes(`import React`)) {
            // TODO: Figure out the best way to allow broad support for
            //  CSS-in-JS plugins
            return `import React from 'react';\n${code}`;
          }
          return null;
        },
      },
      tsconfigPaths(),
      {
        name: "virtual",
        load: async (id) => {
          // if (id === "/__main__.tsx") {
          //   return mainContent;
          // }
          if (id === "/__renderer__.tsx") {
            return rendererContent;
          }
          return null;
        },
      },
    ],
  });
  const app = connect();
  app.use(async (req, res, next) => {
    if (req.originalUrl !== "/") {
      return next();
    }
    // __renderer__.tsx is created at runtime, so we ignore WebStorm's warning
    // that it can't be found
    // noinspection HtmlUnknownTarget
    const html = await viteServer.transformIndexHtml(
      req.originalUrl,
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css" integrity="sha512-NhSC1YmyruXifcj/KFRWoC561YpHpc5Jtzgvbuzx5VozKpWvQ+4nXhPdFgmx8xqexRcpAglTj9sIBWINXa8x5w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
          <style>
          .ftcontrols-error {
            color: #e00;
          }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/__renderer__.tsx"></script>
        </body>
      </html>    
      `
    );
    res.setHeader("Content-Type", "text/html");
    res.end(html);
  });
  app.use(viteServer.middlewares);
  let server!: Server;
  const hostname = network ? "0.0.0.0" : undefined;
  // noinspection HttpUrlsUsage
  const titleMessage = "ftcontrols dev server";
  const listeningMessage = `listening on http://${
    hostname || "localhost"
  }:${port}`;
  const boxWidth = listeningMessage.length + 2;
  console.log(`╭${"─".repeat(boxWidth)}╮`);
  console.log(`│${" ".repeat(boxWidth)}│`);
  console.log(
    `│ ${titleMessage}${" ".repeat(boxWidth - titleMessage.length - 1)}│`
  );
  console.log(`│ ${listeningMessage} │`);
  console.log(`│${" ".repeat(boxWidth)}│`);
  console.log(`╰${"─".repeat(boxWidth)}╯`);
  await new Promise(
    (resolve) => (server = app.listen(port, hostname, resolve))
  );
  return async () => {
    await viteServer.close();
    await server.close();
  };
}
