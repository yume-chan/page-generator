import * as electron from 'electron';
import { remote } from 'electron';
const { dialog, Menu, MenuItem } = remote;

import * as React from "react";

import { observable, computed } from "mobx"
import { observer } from "mobx-react";

import { Project, Template } from "./source-file";
import { DockPanel } from "./dock-panel";
import { NewFile } from "./new-file";
import { Welcome } from "./welcome";

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
    @observable project: Project | undefined;

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

    onCreate = (name: string, template: Template) => {
        this.project = new Project(name, template);
    }

    onCancel = () => {

    }

    onTemplateReplaceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (this.project !== undefined) {
            const target = e.target;
            this.project.templateReplace[target.dataset["key"] as string] = target.value;
            this.project.dirty = true;
        }
    };

    render() {
        if (this.project === undefined) {
            return <Welcome onOpen={project => this.project = project} />;
        }

        const startPanel = (
            <aside className="panel-left" >
                <h1>Properties</h1>
                {iterate(this.project.template.htmlReplace, (key, value) => (
                    <div key={key}>
                        <h4>{key}</h4>
                        <textarea data-key={key} onChange={this.onTemplateReplaceChange} value={value.default}></textarea>
                    </div>
                ))}
            </aside>
        );

        const mainElement = (
            <div className="editor" >

            </div>
        );

        return (
            <div id="app">
                <main >
                    <header>
                        <div className="url-bar">
                            <span>{this.project.template.uri.replace(this.project.template.uriReplace, this.project.name)}</span>
                        </div>
                    </header>
                    <DockPanel id="content" orientation="horizontal" mainElement={mainElement} startPanel={startPanel} startPanelSize={200} startPanelMinSize={200} />
                </main>
                {/*<Separator orientation="horizontal"
                    decrement={true}
                    value={this.rightPanelWidth}
                    min={200}
                    style={this.mainStyle}
                    onValueUpdated={this.onRightPanelWidthChanged} />
                <aside className="panel-right" style={this.rightPanelStyle}>
                    <h1>Assets</h1>
                </aside>*/}
            </div >
        );
    }
}
