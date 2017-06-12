import * as path from "path";

import * as electron from "electron";
import { remote } from "electron";
const { dialog, Menu, MenuItem } = remote;

import * as React from "react";

import bind from "bind-decorator";

import { observable, observer, autorun } from "../object-proxy";

import { Project } from "./project";
import "./preview.less";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            webview: React.HTMLProps<Electron.WebviewTag>;
        }
    }
}

export interface EditorProps {
    project: Project;
    isVirtual: boolean;
    style?: React.CSSProperties;
    onClose(): void;
}

@observer
export class Preview extends React.Component<EditorProps, void> {
    private webview: Electron.WebviewTag | undefined;

    @observable
    private content: string = "";

    @bind
    private onWebviewRef(e: Electron.WebviewTag) {
        if (e === null) {
            this.webview = undefined;
            return;
        }

        this.computeContentAsync();

        this.webview = e;
        this.webview.httpreferrer = this.props.project.uri;
        this.webview.disablewebsecurity = "true";
        this.webview.addEventListener("dom-ready", () => {
            if (this.webview !== undefined)
                this.webview.openDevTools();
        });
    }

    @autorun
    @bind
    private async computeContentAsync() {
        this.content = await this.props.project.buildAsync(true);
    }

    @bind
    private async save() {
        // Make a local copy to make TypeScript happy.
        // Or `project` will be `Project | undefined` again in
        // async callback.
        const project = this.props.project;

        if (project === undefined)
            return;

        if (project.filename === undefined) {
            dialog.showSaveDialog(remote.getCurrentWindow(), {
                defaultPath: project.name + ".json",
            }, async filename => {
                if (filename === undefined)
                    return;

                await project.saveAsync(filename);
            });
        } else {
            await project.saveAsync(project.filename);
        }
    }

    render() {
        const project = this.props.project;
        const template = project.template;

        return (
            <div className="preview" style={this.props.style}>
                <header>
                    <div className="url-bar">
                        <span>{template.uri.replace(template.uriReplace, project.name) + template.htmlName}</span>
                    </div>
                    {this.props.isVirtual || (
                        <div className="actions">
                            <div className="action icon-saveall" title="Save" onClick={this.save}></div>
                            <div className="action icon-close" title="Close" onClick={this.props.onClose}></div>
                        </div>
                    )}
                </header>
                <webview ref={this.onWebviewRef}
                    src={"data:text/html; charset=utf-8," + encodeURIComponent(this.content)} />
            </div>
        );
    }
}
