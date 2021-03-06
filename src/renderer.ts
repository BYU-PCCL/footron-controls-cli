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
      include: ["react", "react-dom", "@footron/controls-client"],
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
          <style>
            /* Default styles from footron-web */
            body {
              margin: 0;
              color: #001e4ccc;
              background: #f7faff;
              font-family: "Lato", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell",
                "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
            }
            a {
              color: #0065ffcc;
            }
            a:visited {
              color: rgba(55, 0, 255, 0.8);
            }
            .page-width-inner {
              width: 100%;
              height: 100%;
            }
            @media (min-width: 600px) {
              .page-width-inner {
                width: 600px;
              }
            }
            .ftcontrols-error {
              color: #e00;
            }
          </style>
          <!-- Normalize -->
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css" integrity="sha512-NhSC1YmyruXifcj/KFRWoC561YpHpc5Jtzgvbuzx5VozKpWvQ+4nXhPdFgmx8xqexRcpAglTj9sIBWINXa8x5w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
          <!-- Default fonts -->
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400;1,700&family=Montserrat:wght@600;700&family=Source+Code+Pro:wght@600;700&display=swap" rel="stylesheet">
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
  const titleMessage = "ftcontrols dev server";
  // noinspection HttpUrlsUsage
  const listeningMessage = `listening on http://${
    hostname || "localhost"
  }:${port}`;
  const boxWidth = listeningMessage.length + 2;
  console.log(`???${"???".repeat(boxWidth)}???`);
  console.log(`???${" ".repeat(boxWidth)}???`);
  console.log(
    `??? ${titleMessage}${" ".repeat(boxWidth - titleMessage.length - 1)}???`
  );
  console.log(`??? ${listeningMessage} ???`);
  console.log(`???${" ".repeat(boxWidth)}???`);
  console.log(`???${"???".repeat(boxWidth)}???`);
  await new Promise(
    (resolve) => (server = app.listen(port, hostname, resolve))
  );
  return async () => {
    await viteServer.close();
    await server.close();
  };
}
