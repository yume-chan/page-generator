import * as electron from "electron";
import * as React from "react";

import { observable, computed } from "mobx";
import { observer } from "mobx-react";

import { Project } from "./source-file";
import "./editor.less";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            webview: React.HTMLProps<Electron.WebviewTag>;
        }
    }
}

export interface EditorProps {
    project: Project;
    style?: React.CSSProperties;
}

@observer
export class Editor extends React.Component<EditorProps, void> {
    private webview: Electron.WebviewTag;

    private onWebviewRef = (e: Electron.WebviewTag) => {
        this.webview = e;
        this.webview.disablewebsecurity = "true";
        this.webview.addEventListener("dom-ready", () => {
            this.webview.openDevTools();
        });
    }

    @computed private get content() {
        let result = this.props.project.template.html;
        for (const key of Object.keys(this.props.project.template.htmlReplace))
            result = result.replace(this.props.project.template.htmlReplace[key].replace, this.props.project.templateReplace.get(key) as string);

        const background: string[] = [];
        for (const item of this.props.project.background)
            background.push(`<img src="${item}">`);
        result = result.replace("{{CONTENT}}", background.join("\r\n"));

        return result;
    };

    render() {
        return (
            <webview ref={this.onWebviewRef}
                src={"data:text/html; charset=utf-8," + encodeURIComponent(this.content)}
                style={this.props.style} />
        );
    }
}
