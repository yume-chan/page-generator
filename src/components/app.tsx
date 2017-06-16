import * as React from "react";

import bind from "bind-decorator";

import { observable, observer } from "../object-proxy";

import { DockPanel } from "./dock-panel";
import { Editor } from "./editor";
import { Preview } from "./preview";
import { Project } from "./project";
import { Welcome } from "./welcome";

import "./app.less";

@observer
export class App extends React.Component<{}, void> {
    @observable
    private preview: Project | undefined;
    @observable
    private project: Project | undefined;

    constructor() {
        super();
    }

    public render() {
        const startPanel = this.project !== undefined ? <Editor project={this.project} onReplaceChange={this.onReplaceChange} /> : <Welcome onOpen={this.onOpen} onPreview={(project) => this.preview = project} />;

        const project = this.project || this.preview;
        const mainElement = project !== undefined ? <Preview project={project} onClose={this.onClose} isVirtual={this.project === undefined} /> : <div />;

        return (
            <DockPanel id="content" orientation="horizontal" mainElement={mainElement} startPanel={startPanel} startPanelSize={200} startPanelMinSize={200} />
        );
    }

    @bind
    private onOpen(project: Project) {
        this.project = project;
        this.preview = undefined;
    }

    @bind
    private onReplaceChange(key: string, value: string) {
        if (this.project !== undefined) {
            this.project.templateReplace[key] = value;
            this.project.dirty = true;
        }
    }

    @bind
    private onClose() {
        this.project = undefined;
    }
}
