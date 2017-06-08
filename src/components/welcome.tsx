import * as fs from "fs-extra";

import * as electron from "electron";
import { remote } from "electron";
const { dialog, Menu, MenuItem } = remote;

import * as React from "react";

import { observable, computed } from "mobx"
import { ObservableArray } from "mobx/lib/types/observablearray";
import { observer } from "mobx-react";

import bind from "bind-decorator";

import { Dialog } from "./dialog";
import { NewFile } from "./new-file";
import { Project, Template, ProjectFile } from "./project";

enum WelcomeState {
    Initial,
    Welcome,
    NewFile,
}

export interface WelcomeProps {
    onOpen(project: Project): void;
}

@observer
export class Welcome extends React.Component<WelcomeProps, void>{
    @observable
    private _state: WelcomeState = WelcomeState.Initial;

    @observable.shallow
    private templates: Template[];

    constructor() {
        super();

        this.loadTemplatesAsync();
    }

    private async loadTemplatesAsync() {
        this.templates = await Template.loadAsync("./templates/");
        this._state = WelcomeState.Welcome;
    }

    @bind
    private onOpen() {
        dialog.showOpenDialog(remote.getCurrentWindow(), {
            filters: [{
                name: "Project File",
                extensions: ["json"]
            }]
        }, async files => {
            if (files !== undefined) {
                const content = await fs.readFile(files[0], "utf-8");
                const file = JSON.parse(content) as ProjectFile;

                const template = this.templates.find(x => x.name == file.template);
                if (template !== undefined) {
                    this.props.onOpen(new Project(file.name, template, files[0], file));
                }
            }
        });
    }

    @bind
    private onCreate(name: string, template: Template) {
        this.props.onOpen(new Project(name, template));
    }

    render() {
        switch (this._state) {
            case WelcomeState.Initial:
                return <div />;
            case WelcomeState.Welcome:
                return (
                    <Dialog title="Welcome" className="welcome">
                        <div className="button" onClick={() => this._state = WelcomeState.NewFile}>New</div>
                        <div className="button" onClick={this.onOpen}>Open</div>
                    </Dialog>
                );
            case WelcomeState.NewFile:
                return <NewFile onCreate={this.onCreate} onCancel={() => this._state = WelcomeState.Welcome} templates={this.templates} />;
        }
    }
}
