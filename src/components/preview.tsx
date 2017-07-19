import path from "path";

import React from "react";
import webview from "webview";

import bind from "bind-decorator";

import { autorun, observable, observer } from "../object-proxy";

import { showSaveDialog } from "../dialog";
import { Code } from "./code";
import { DockPanel } from "./dock-panel";
import { fileUrl, Project } from "./project";

import "./preview.less";

export interface PreviewProps {
    project: Project;
    isVirtual: boolean;
    style?: React.CSSProperties;
    onClose(): void;
}

@observer
export class Preview extends React.Component<PreviewProps> {
    private webview: Electron.WebviewTag | undefined;
    private webviewLoaded: boolean = false;
    private devToolsOpen: boolean = false;

    public render() {
        const { project, isVirtual } = this.props;
        const template = project.template;

        if (this.webviewLoaded)
            this.computeContent();

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
                <webview ref={this.onWebviewRef}
                    style={template.viewport && { width: template.viewport.width + "px", height: template.viewport.height + "px" }}
                    onMouseOver={this.onWebviewMouseOver}
                    onMouseOut={this.onWebviewMouseOut}
                    src="about:blank" />
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
        this.webview.addEventListener("dom-ready", this.onWebviewReady);
    }

    @bind
    private onWebviewReady() {
        this.webview!.removeEventListener("dom-ready", this.onWebviewReady);

        if (this.devToolsOpen) {
            this.webview!.openDevTools();
            this.devToolsOpen = false;
        }
        this.webviewLoaded = true;

        this.computeContent();
    }

    @autorun
    private computeContent() {
        const core = async (project: Project) => {
            const content = await project.buildAsync(true);
            const dataUri = "data:text/html; charset=utf-8," + encodeURIComponent(content);
            this.webview!.loadURL(dataUri, { baseURLForDataURL: fileUrl(project.assetsPath || project.template.path) + "/" });
        };

        core(this.props.project);
    }

    @bind
    private onWebviewMouseOver() {
        setTimeout(() => {
            const viewport = this.props.project.template.viewport;
            if (viewport !== undefined) {
                const webContents = this.webview!.getWebContents();
                const deviceMetrics = { mobile: true, fitWindow: true, ...viewport, deviceScaleFactor: 2 };
                if (webContents !== undefined) {
                    if (webContents.isDevToolsOpened()) {
                        webContents.devToolsWebContents.executeJavaScript("Emulation.MultitargetTouchModel.instance().setTouchEnabled(true, true)");
                        webContents.devToolsWebContents.executeJavaScript(`SDK.targetManager.mainTarget().emulationAgent().invoke_setDeviceMetricsOverride(${JSON.stringify(deviceMetrics)})`);
                    } else {
                        const debugger2 = webContents.debugger;
                        if (!debugger2.isAttached())
                            debugger2.attach("1.2");
                        debugger2.sendCommand("Emulation.setTouchEmulationEnabled", { enabled: true, configuration: "mobile" });
                        debugger2.sendCommand("Emulation.setDeviceMetricsOverride", deviceMetrics);
                    }
                }
            }
        }, 0);
    }

    @bind
    private onWebviewMouseOut() {
        const viewport = this.props.project.template.viewport;
        if (viewport !== undefined) {
            const webContents = this.webview!.getWebContents();
            if (webContents !== undefined) {
                if (webContents.isDevToolsOpened()) {
                    webContents.devToolsWebContents.executeJavaScript("Emulation.MultitargetTouchModel.instance().setTouchEnabled(false, false)");
                } else {
                    const debugger2 = webContents.debugger;
                    if (!debugger2.isAttached())
                        debugger2.attach("1.2");
                    debugger2.sendCommand("Emulation.setTouchEmulationEnabled", { enabled: false });
                }
            }
        }
    }

    @bind
    private openDevTools() {
        if (this.webviewLoaded) {
            this.webview!.openDevTools();
            this.onWebviewMouseOver();
        } else {
            this.devToolsOpen = true;
        }
    }

    @bind
    private async save() {
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
