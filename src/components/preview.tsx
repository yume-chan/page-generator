import path from "path";

import React from "react";
import webview from "webview";

import bind from "bind-decorator";

import { autorun, observable, observer } from "../object-proxy";

import { showSaveDialog } from "../dialog";
import { Code } from "./code";
import { DockPanel } from "./dock-panel";
import { Project } from "./project";

import "./preview.less";

export interface PreviewProps {
    project: Project;
    isVirtual: boolean;
    style?: React.CSSProperties;
    onClose(): void;
}

@observer
export class Preview extends React.Component<PreviewProps> {
    @observable
    private project: Project;

    @observable
    private content: string;

    private webview: Electron.WebviewTag | undefined;
    private webviewLoaded: boolean = false;
    private devToolsOpen: boolean = false;

    constructor(props: PreviewProps) {
        super(props);

        this.project = props.project;
    }

    public shouldComponentUpdate(nextProps: PreviewProps) {
        if (this.project !== nextProps.project) {
            this.project = nextProps.project;
            return false;
        }
        return true;
    }

    public render() {
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
                            <div className="action icon-open-change" title="Open DevTools" onClick={this.openDevTools}></div>
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
            if (this.devToolsOpen) {
                this.webview!.openDevTools();
                this.devToolsOpen = false;
            }
            this.webviewLoaded = true;
        });

        this.computeContent();
    }

    @autorun
    private computeContent() {
        const core = async (project: Project) => {
            this.content = await project.buildAsync(true);
        };

        core(this.project);
    }

    @bind
    private openDevTools() {
        if (this.webviewLoaded)
            this.webview!.openDevTools();
        else
            this.devToolsOpen = true;
    }

    @bind
    private async save() {
        // Make a local copy to make TypeScript happy.
        // Or `project` will be `Project | undefined` again in async callback.
        const project = this.props.project;

        if (project === undefined)
            return;

        if (project.filename === undefined) {
            const file = await showSaveDialog({
                defaultPath: project.name + ".json",
            });

            if (file !== undefined)
                await project.saveAsync(file);
        } else {
            await project.saveAsync(project.filename);
        }
    }
}
