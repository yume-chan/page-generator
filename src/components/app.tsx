import * as path from "path";

import * as electron from "electron";
import { remote } from "electron";
const { dialog, Menu, MenuItem } = remote;

import * as React from "react";

import bind from "bind-decorator";

import { observable, observer } from "../object-proxy";

import { Project, Template } from "./project";
import { DockPanel } from "./dock-panel";
import { Welcome } from "./welcome";
import { Preview } from "./preview";
import { TextArea } from "./text-area";
import { Expendable } from "./expendable";
import { Panel, PanelAction } from "./panel";
import { Editor } from "./editor";

import "./app.less";

interface MenuHandler {
    file: {
        ["new"](): void;
        open(): void;
        save(): void;
    }
}

declare global {
    interface Window {
        menu: MenuHandler;
    }
}

function getSubmenu(item: Electron.MenuItem) {
    return ((item as any).submenu as Electron.Menu);
}

function iterate<T, TResult>(obj: { [key: string]: T }, iteratee: (key: string, value: T) => TResult): TResult[] {
    return Object.keys(obj).map(key => iteratee(key, obj[key]));
}

@observer
export class App extends React.Component<{}, void> {
    @observable
    private preview: Project | undefined;
    @observable
    private project: Project | undefined;

    constructor() {
        super();

        getSubmenu(Menu.getApplicationMenu().items[0]).items[2].enabled = false;

        window.menu = {
            file: {
                new: () => {
                    if (this.project != undefined && this.project.dirty) {
                        dialog.showMessageBox(remote.getCurrentWindow(), {
                            message: "Save?",
                            buttons: ["Yes", "No", "Cancel"],
                            defaultId: 2,
                            cancelId: 1
                        })
                    }

                },
                open() {
                    const filePaths = dialog.showOpenDialog(remote.getCurrentWindow(), {
                        properties: ["openFile"]
                    });

                    if (filePaths == undefined)
                        return;

                    alert(filePaths[0]);
                },
                save: () => {

                }
            }
        };
    }

    @bind
    private onCreate(name: string, template: Template) {
        this.project = new Project(name, template);
        this.preview = undefined;
    }

    @bind
    private onReplaceChange(key: string, value: string) {
        if (this.project !== undefined) {
            this.project.templateReplace.set(key, value);
            this.project.dirty = true;
        }
    };

    @bind
    private onClose() {
        this.project = undefined;
    }

    render() {
        const startPanel = this.project !== undefined ? <Editor project={this.project} onReplaceChange={this.onReplaceChange} /> : <Welcome onOpen={project => this.project = project} onPreview={project => this.preview = project} />;

        const project = this.project || this.preview;
        const mainElement = project !== undefined ? <Preview project={project} onClose={this.onClose} isVirtual={this.project === undefined} /> : <div />;

        return (
            <DockPanel id="content" orientation="horizontal" mainElement={mainElement} startPanel={startPanel} startPanelSize={200} startPanelMinSize={200} />
        );
    }
}
