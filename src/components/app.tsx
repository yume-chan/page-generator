import * as electron from "electron";
import { remote } from "electron";
const { dialog, Menu, MenuItem } = remote;

import * as React from "react";

import { observable, computed } from "mobx"
import { observer } from "mobx-react";

import { Project, Template } from "./source-file";
import { DockPanel } from "./dock-panel";
import { NewFile } from "./new-file";
import { Welcome } from "./welcome";
import { Editor } from "./editor";
import { TextArea } from "./text-area";
import { Expendable } from "./expendable";
import { Panel, PanelAction } from "./panel";

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

    onTemplateReplaceChange = (key: string, value: string) => {
        if (this.project !== undefined) {
            this.project.templateReplace.set(key, value);
            this.project.dirty = true;
        }
    };

    renderReplaces(project: Project) {
        const children: JSX.Element[] = [];
        for (const [key, value] of project.templateReplace)
            children.push(
                <div key={key}>
                    <h4>{key}</h4>
                    <TextArea data-key={key} onChange={(value) => this.onTemplateReplaceChange(key, value)} value={value} />
                </div>
            );
        return children;
    }

    renderBackgrounds(project: Project) {
        return project.background.map((item, index) => {
            return (
                <div key={index} className="list-item">
                    <div className="content" title={item}>{item}</div>
                    <div className="actions">
                        <div className="action icon-kill" onClick={e => project.background.splice(index, 1)}></div>
                    </div>
                </div>
            );
        });
    }

    render() {
        if (this.project === undefined) {
            return <Welcome onOpen={project => this.project = project} />;
        }

        const actions: PanelAction[] = [
            {
                className: "icon-new",
                onClick: () => {
                    dialog.showOpenDialog(remote.getCurrentWindow(), {
                        filters: [
                            {
                                name: "Image",
                                extensions: ["png", "jpg"]
                            }
                        ]
                    }, files => {
                        if (files === undefined)
                            return;

                        if (this.project === undefined)
                            return;

                        this.project.background.push(files[0]);
                    });
                }
            }
        ];

        const startPanel = (
            <Panel title="Properties">
                <Expendable title="Template" defaultExpended={true} padding="8px">
                    {this.renderReplaces(this.project)}
                </Expendable>

                <Expendable title="Background" defaultExpended={true} padding="8px" actions={actions}>
                    {this.renderBackgrounds(this.project)}
                </Expendable>
            </Panel>
        );

        const mainElement = <Editor project={this.project} />;

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
            </div >
        );
    }
}
