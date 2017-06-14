import * as path from "path";

import * as electron from "electron";
import { remote } from "electron";
const { dialog, Menu, MenuItem } = remote;

import * as React from "react";

import bind from "bind-decorator";

import { observable, observer, autorun } from "../object-proxy";

import { Project } from "./project";
import { Code } from "./code";
import { DockPanel } from "./dock-panel";
import "./preview.less";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            webview: React.HTMLProps<Electron.WebviewTag>;
        }
    }
}

export interface PreviewProps {
    project: Project;
    isVirtual: boolean;
    style?: React.CSSProperties;
    onClose(): void;
}

@observer
export class Preview extends React.Component<PreviewProps, void> {
    @observable
    private project: Project;

    private webview: Electron.WebviewTag | undefined;

    constructor(props: PreviewProps) {
        super(props);

        this.project = props.project;
    }

    @observable
    private content: string;

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

        this.computeContent();
    }

    shouldComponentUpdate(nextProps: PreviewProps) {
        if (this.project !== nextProps.project) {
            this.project = nextProps.project;
            return false;
        }
        return true;
    }

    @autorun
    private computeContent() {
        const core = async (project: Project) => {
            this.content = await project.buildAsync(true);
        };

        core(this.project);
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
        const { project, isVirtual } = this.props;
        const template = project.template;

        const main = (
            <div className="preview" style={this.props.style}>
                <header>
                    <div className="url-bar">
                        <span>{template.uri.replace(template.uriReplace, project.name) + template.htmlName}</span>
                    </div>
                    {isVirtual || (
                        <div className="actions">
                            <div className="action icon-saveall" title="Save" onClick={this.save}></div>
                            <div className="action icon-close" title="Close" onClick={this.props.onClose}></div>
                        </div>
                    )}
                </header>
                {this.content !== undefined}
                <webview ref={this.onWebviewRef}
                    src={"data:text/html; charset=utf-8," + encodeURIComponent(this.content)} />
            </div>
        );

        if (isVirtual) {
            return main;
        } else {
            return (
                <DockPanel style={this.props.style} orientation="vertical" mainElement={main} endPanel={<Code project={project} />} endPanelSize={300} endPanelMaxSize={500} />
            );
        }
    }
}
