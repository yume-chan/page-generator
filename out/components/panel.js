import * as React from "react";
import * as classNames from "classnames";
import "./panel.less";
export function Panel(props) {
    function renderActions(props) {
        if (props.actions === undefined || props.actions.length == 0)
            return undefined;
        return (React.createElement("div", { className: "actions" }, props.actions.map(value => (React.createElement("div", { key: value.className, className: classNames("action", value.className), title: value.title, onClick: e => { e.stopPropagation(); value.onClick(); } }, value.content)))));
    }
    return (React.createElement("aside", { style: props.style },
        React.createElement("header", null,
            React.createElement("div", { className: "title" }, props.title),
            renderActions(props)),
        props.children));
}
//# sourceMappingURL=panel.js.map