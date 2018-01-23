import React from "react";

import bind from "bind-decorator";

import { observable, observer } from "../object-proxy";

import { DockPanel } from "./dock-panel";
import { Editor } from "./editor";
import { Preview } from "./preview";
import { Project } from "./project";
import { Welcome } from "./welcome";

import "./app.less";

@observer
export class App extends React.Component {
    public static modified = true;

    @observable
    private preview: Project | undefined;
    @observable
    private project: Project | undefined;

    public render() {
        const startPanel = this.project !== undefined ? <Editor project={this.project} onReplaceChange={this.onReplaceChange} /> : <Welcome onOpen={this.onOpen} onPreview={(preview) => this.preview = preview} />;

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
