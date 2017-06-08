import * as path from "path";

import * as electron from "electron";
import { remote } from "electron";
const { dialog, Menu, MenuItem } = remote;

import * as React from "react";

import { observable, computed } from "mobx"
import { observer } from "mobx-react";

import bind from "bind-decorator";

import { Project, Template } from "./project";
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
    @observable.ref
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
    }

    @bind
    private onCancel() {

    }

    @bind
    private onTemplateReplaceChange(key: string, value: string) {
        if (this.project !== undefined) {
            this.project.templateReplace.set(key, value);
            this.project.dirty = true;
        }
    };

    private renderReplaces(project: Project) {
    }

    private renderBackgrounds(project: Project) {
        return project.background.map((item, index) => {
            const parsed = path.parse(item.relativePath || item.path);

            return (
                <div key={index} className="list-item">
                    <div className="path" title={item.path}>{parsed.dir}</div>
                    <div className="content" title={item.path}>{path.sep + parsed.base}</div>
                    <div className="actions">
                        <div className="action icon-kill" onClick={e => project.background.splice(index, 1)}></div>
                    </div>
                </div>
            );
        });
    }

    @bind
    private async save() {
        // Make a local copy to make TypeScript happy.
        // Or `project` will be `Project | undefined` again in
        // async callback.
        const project = this.project;

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

    @bind
    private close() {
        this.project = undefined;
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
                        properties: ["openFile", "multiSelections"],
                        filters: [
                            {
                                name: "Image",
                                extensions: ["png", "jpg"]
                            }
                        ]
                    }, async files => {
                        if (files === undefined)
                            return;

                        if (this.project === undefined)
                            return;

                        await this.project.addBackgroundAsync(...files);
                    });
                }
            }
        ];

        const Replaces = observer(({ replaces }: { replaces: Map<string, string> }) => {
            const ReplaceInput = observer(({ name, replaces }: { name: string, replaces: Map<string, string> }) => (
                <div>
                    <h4>{name}</h4>
                    <TextArea onChange={(value) => this.onTemplateReplaceChange(name, value)} value={replaces.get(name)} />
                </div>
            ))

            const children: JSX.Element[] = [];
            // for (const [key, value] of replaces)
            for (const key of replaces.keys())
                children.push(<ReplaceInput key={key} name={key} replaces={replaces} />);

            return (
                <Expendable title="Template" defaultExpended={true} padding="8px">
                    {children}
                </Expendable>
            );
        });

        const StartPanel = observer(({ project, style }: { project: Project, style?: React.CSSProperties }) => (
            <Panel title="Properties" style={style}>
                <Replaces replaces={project.templateReplace} />

                <Expendable title="Background" defaultExpended={true} padding="8px" actions={actions}>
                    {this.renderBackgrounds(project)}
                </Expendable>
            </Panel>
        ));
        StartPanel.displayName = "StartPanel";

        const template = this.project.template;

        return (
            <div id="app">
                <main >
                    <header>
                        <div className="url-bar">
                            <span>{template.uri.replace(template.uriReplace, this.project.name) + template.htmlName}</span>
                        </div>
                        <div className="actions">
                            <div className="action icon-saveall" title="Save" onClick={this.save}></div>
                            <div className="action icon-close" title="Close" onClick={this.close}></div>
                        </div>
                    </header>
                    <DockPanel id="content" orientation="horizontal" mainElement={<Editor project={this.project} />} startPanel={<StartPanel project={this.project} />} startPanelSize={200} startPanelMinSize={200} />
                </main>
            </div >
        );
    }
}
