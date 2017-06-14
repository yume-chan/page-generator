import * as React from "react";
import * as ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import { App } from "./components/app";
import "./index.less";
function render(App) {
    ReactDOM.render(React.createElement("div", null,
        React.createElement(AppContainer, null,
            React.createElement(App, null))), document.getElementById("app-container"));
}
render(App);
const hot = module.hot;
if (hot) {
    // Hot Module Replacement needs *full path* and *extension*
    hot.accept('./src/components/app.tsx', () => { render(App); });
}
//# sourceMappingURL=index.js.map