// Based on https://github.com/zenclabs/viteshot/blob/af01f90dc169f027024c53aef59f68055cdcbde7/renderers/react.ts
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import React, { useEffect } from "react";
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

function Wrapper({ children }: { children: React.ReactNode }): JSX.Element {
  const controlsClient = new ControlsClient("ws://localhost:8089/in", "");

  useEffect(() => {
    controlsClient.setApp("dev-app");
  }, []);

  return (
    <ControlsClientProvider client={controlsClient}>
      {children}
    </ControlsClientProvider>
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
      // TODO: Add in provider wrapper here
      <ThemeProvider theme={theme}>
        <Wrapper>
          <Component />
        </Wrapper>
      </ThemeProvider>,
      root
    );
  } catch (e) {
    root.innerHTML = `<pre class="ftcontrols-error">${e.stack || e}</pre>`;
  }
}
