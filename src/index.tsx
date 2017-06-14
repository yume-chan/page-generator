import * as React from "react";
import * as ReactDOM from "react-dom";

import { AppContainer } from "react-hot-loader";

import { App } from "./components/app";
import "./index.less";

function render(App: any) {
    ReactDOM.render(
        <div>
            <AppContainer>
                <App />
            </AppContainer>
        </div>,
        document.getElementById("app-container")
    );
}
render(App);

const hot = (module as any).hot;
if (hot) {
    // Hot Module Replacement needs *full path* and *extension*
    hot.accept('./src/components/app.tsx', () => { render(App) })
}
