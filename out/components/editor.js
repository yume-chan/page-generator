import * as tslib_1 from "tslib";
import { remote } from "electron";
const { dialog, Menu, MenuItem } = remote;
import * as React from "react";
import { observer } from "../object-proxy";
import { Panel } from "./panel";
import { TextArea } from "./text-area";
import { Expendable } from "./expendable";
import { BackgroundList } from "./background-list";
let Editor = class Editor extends React.Component {
    render() {
        const actions = [
            {
                className: "icon-new",
                onClick: () => {
                    dialog.showOpenDialog(remote.getCurrentWindow(), {
                        properties: ["openFile", "multiSelections"],
                        filters: [
                            {
                                name: "Image",
                                extensions: ["png", "jpg"]
                            }
                        ]
                    }, async (files) => {
                        if (files === undefined)
                            return;
                        await this.props.project.addBackgroundAsync(...files);
                    });
                }
            }
        ];
        const Replaces = observer(({ replaces }) => {
            const ReplaceInput = observer(({ name, replaces }) => (React.createElement("div", null,
                React.createElement("h4", null, name),
                React.createElement(TextArea, { onChange: (value) => this.props.onReplaceChange(name, value), value: replaces[name] }))));
            const children = [];
            // for (const [key, value] of replaces)
            for (const key of Object.keys(replaces))
                children.push(React.createElement(ReplaceInput, { key: key, name: key, replaces: replaces }));
            return (React.createElement(Expendable, { title: "Template", defaultExpended: true, padding: "8px" }, children));
        });
        return (React.createElement(Panel, { title: "Properties", style: this.props.style },
            React.createElement(Replaces, { replaces: this.props.project.templateReplace }),
            React.createElement(Expendable, { title: "Background", defaultExpended: true, padding: "8px", actions: actions },
                React.createElement(BackgroundList, { project: this.props.project }))));
    }
};
Editor = tslib_1.__decorate([
    observer
], Editor);
export { Editor };
//# sourceMappingURL=editor.js.map