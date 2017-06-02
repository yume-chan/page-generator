import * as electron from 'electron';
import { remote } from 'electron';
const { dialog, Menu, MenuItem } = remote;

import * as React from "react";

import { observable, computed } from "mobx"
import { observer } from "mobx-react";

import { SourceFile, Template } from "./source-file";
import { DockPanel } from "./dock-panel";
import { NewFile } from "./new-file";

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
    @observable file: SourceFile | undefined;

    templates: Template[];

    @observable selectedTemplate: Template;

    constructor() {
        super();

        this.templates = [
            {
                name: "webpc",
                uriPrefix: "https://pc.cnaidai.com/webpc/activity/",
                uriSuffix: "index.htm",
                template: "",
                replace: {
                    "Title": {
                        replace: "{TITLE}",
                        default: "爱贷网"
                    },
                    "Keywords": {
                        replace: "{KEYWORDS}",
                        default: ""
                    },
                    "Description": {
                        replace: "{DESCRIPTION}",
                        default: ""
                    },
                }
            },
            {
                name: "webchat",
                uriPrefix: "https://wechat.cnaidai.com/webchat/activity/",
                uriSuffix: "index.html",
                template: "",
                replace: {
                    "Title": {
                        replace: "{TITLE}",
                        default: "爱贷网"
                    },
                }
            }
        ];
        this.selectedTemplate = this.templates[0];

        getSubmenu(Menu.getApplicationMenu().items[0]).items[2].enabled = false;

        window.menu = {
            file: {
                new: () => {
                    if (this.file != undefined && this.file.dirty) {
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
this.file=new SourceFile()
    }

    onTemplateReplaceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (this.file !== undefined) {
            const target = e.target;
            this.file.templateReplace[target.dataset["key"] as string] = target.value;
            this.file.dirty = true;
        }
    };

    render() {
        const startPanel = (
            <aside className="panel-left" >
                <h1>Properties</h1>
                {iterate(this.selectedTemplate.replace, (key, value) => (
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
                {/*<main >
                    <header>
                        <select onChange={this.onTemplateChange}>
                            {this.templates.map(value => (
                                <option key={value.name} checked={value == this.selectedTemplate}>{value.name}</option>
                            ))}
                        </select>
                        <div className="url-bar">
                            <span>{this.selectedTemplate.uriPrefix}</span>
                            <input id="input-filename" type="text" />
                            <span>{this.selectedTemplate.uriSuffix}</span>
                        </div>
                    </header>
                    <DockPanel id="content" orientation="horizontal" mainElement={mainElement as any} startPanel={startPanel} startPanelSize={200} startPanelMinSize={200} />
                </main>*/}
                <NewFile templates={this.templates} onCreate={this.onCreate} />
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
