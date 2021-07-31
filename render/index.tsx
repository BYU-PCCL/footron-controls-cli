// Based on https://github.com/zenclabs/viteshot/blob/af01f90dc169f027024c53aef59f68055cdcbde7/renderers/react.ts
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import React, { ReactNode, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  ControlsClient,
  ControlsClientProvider,
} from "@footron/controls-client";
import { jsx } from "@emotion/react";
import JSX = jsx.JSX;

const theme = createTheme({
  palette: {
    primary: {
      main: "#001E4C",
      light: "#092b87",
      dark: "#011221",
    },
  },
});

const PageWidth = ({ children }: { children?: ReactNode }): JSX.Element => {
  return (
    <main style={{ display: "flex", justifyContent: "center", height: "100%"}}>
      <div className="page-width-inner">{children}</div>
    </main>
  );
};

function Wrapper({ children }: { children: React.ReactNode }): JSX.Element {
  const controlsClient = new ControlsClient("ws://localhost:8089/in", "");

  useEffect(() => {
    controlsClient.setApp("dev-app");
  }, []);

  return (
    <PageWidth>
      <ThemeProvider theme={theme}>
        <ControlsClientProvider client={controlsClient}>
          {children}
        </ControlsClientProvider>
      </ThemeProvider>
    </PageWidth>
  );
}

export function render(Component: React.ComponentType): void {
  const root = document.getElementById("root");
  if (root == null || Component == null || typeof Component !== "function") {
    console.error("Couldn't load component!");
    return;
  }
  root.innerHTML = "";
  try {
    ReactDOM.render(
      <Wrapper>
        <Component />
      </Wrapper>,
      root
    );
  } catch (e) {
    root.innerHTML = `<pre class="ftcontrols-error">${e.stack || e}</pre>`;
  }
}
