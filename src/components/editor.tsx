import * as path from "path";

import * as electron from "electron";
import * as React from "react";

import { observable, computed, autorun } from "mobx";
import { observer } from "mobx-react";

import bind from "bind-decorator";

import { Project } from "./project";
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
    private webview: Electron.WebviewTag | undefined;

    @observable
    private content: string = "";

    constructor(props: EditorProps) {
        super(props);

        autorun(() => this.computeContentAsync(props.project));
    }

    @bind
    private onWebviewRef(e: Electron.WebviewTag) {
        if (e === null) {
            this.webview = undefined;
            return;
        }

        this.webview = e;
        this.webview.httpreferrer = this.props.project.uri;
        this.webview.disablewebsecurity = "true";
        this.webview.addEventListener("dom-ready", () => {
            if (this.webview !== undefined)
                this.webview.openDevTools();
        });
    }

    private async computeContentAsync(project: Project) {
        this.content = await project.buildAsync(true);
    };

    render() {
        return (
            <webview ref={this.onWebviewRef}
                src={"data:text/html; charset=utf-8," + encodeURIComponent(this.content)}
                style={this.props.style} />
        );
    }
}
