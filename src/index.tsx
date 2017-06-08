import * as React from "react";
import * as ReactDOM from "react-dom";

import { AppContainer } from "react-hot-loader";
import DevTools from 'mobx-react-devtools';

import { App } from "./components/app";
import "./index.less";


function render(App: any) {
    let devTools: JSX.Element | undefined;
    if (process.env.NODE_ENV != "production")
        devTools = <DevTools position={{ right: 0, bottom: 0 }} />;

    ReactDOM.render(
        <div>
            <AppContainer>
                <App />
            </AppContainer>
            {devTools}
        </div>,
        document.getElementById("app-container")
    );
}
render(App);

const hot = (module as any).hot;
if (hot)
    hot.accept('./components/app', () => { render(App) })
