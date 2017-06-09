import * as fs from "fs-extra";

import * as electron from "electron";
import { remote } from "electron";
const { dialog, Menu, MenuItem } = remote;

import * as React from "react";
import * as classNames from "classnames";

import { observable, computed } from "mobx"
import { ObservableArray } from "mobx/lib/types/observablearray";
import { observer } from "mobx-react";

import bind from "bind-decorator";

import { Project, Template, ProjectFile, TemplateCategory } from "./project";
import { Panel, PanelAction } from "./panel";
import { Expendable } from "./expendable";
import { TextArea } from "./text-area";

import "./welcome.less";

enum WelcomeState {
    Initial,
    Welcome,
    NewFile,
}

export interface WelcomeProps {
    style?: React.CSSProperties;
    onPreview(project: Project): void;
    onOpen(project: Project): void;
}

@observer
export class Welcome extends React.Component<WelcomeProps, void> {
    @observable.shallow
    private templates: TemplateCategory[] = [];

    @observable
    private name: string;

    @observable.ref
    private template: Template;

    constructor() {
        super();

        this.loadTemplatesAsync();
    }

    private async loadTemplatesAsync() {
        this.templates.push(... await Template.loadAsync("./templates/"));
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

                const [categoryName, name] = file.template.split("/");
                const category = this.templates.find(x => x.name == categoryName);
                if (category !== undefined) {
                    const template = category.templates.find(x => x.name == name);
                    if (template !== undefined)
                        this.props.onOpen(new Project(file.name, template, files[0], file));
                }
            }
        });
    }

    @bind
    private onCreate() {
        this.props.onOpen(new Project(this.name, this.template));
    }

    @bind
    private onTemplateSelected(template: Template) {
        this.template = template;
        this.props.onPreview(new Project("preview", template));
    }

    render() {
        const actions: PanelAction[] = [
            {
                className: "icon-check",
                title: "OK",
                onClick: this.onCreate
            },
            {
                className: "icon-addfile",
                title: "Open",
                onClick: this.onOpen
            }
        ];

        return (
            <Panel title="New" actions={actions} style={this.props.style}>
                <div style={{ padding: "0 8px 8px 16px" }}>
                    <h4>Project name</h4>
                    <TextArea onChange={value => this.name = value} value={this.name} />
                </div>

                {this.templates && this.templates.map(category => (
                    <Expendable key={category.name} title={category.name} defaultExpended={true}>
                        {category.templates.map(template => (
                            <div className={classNames("template", { "highlight": this.template == template })} style={{ paddingLeft: "24px", fontSize: "13px", height: "24px", lineHeight: "24px", cursor: "pointer" }} key={template.name} onClick={e => this.onTemplateSelected(template)}>{template.name}</div>
                        ))}
                    </Expendable>
                ))}
            </Panel>
        );
    }
}
