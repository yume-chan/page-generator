import fs from "fs-extra";

import React from "react";

import bind from "bind-decorator";
import classNames from "classnames";

import { autorun, observable, observer } from "../object-proxy";

import { quit, showOpenDialog } from "../dialog";

import { Expendable } from "./expendable";
import { Panel, PanelAction } from "./panel";
import { Project, ProjectFile, Template, TemplateCategory } from "./project";
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
export class Welcome extends React.Component<WelcomeProps> {
    @observable.array
    private templates: TemplateCategory[] = [];

    @observable
    private name: string = "";

    @observable
    private template?: Template;

    @observable
    private nameError: boolean = false;

    constructor(props: WelcomeProps) {
        super(props);

        this.loadTemplatesAsync();
    }

    public render() {
        const actions: PanelAction[] = [
            {
                className: "icon-check",
                onClick: this.onCreate,
                title: "OK",
            },
            {
                className: "icon-addfile",
                onClick: this.onOpen,
                title: "Open",
            },
        ];

        return (
            <Panel title="New" actions={actions} style={this.props.style}>
                <div style={{ padding: "0 8px 8px 16px" }}>
                    <h4>Project name</h4>
                    <TextArea onChange={this.onNameChange} value={this.name} invalid={this.nameError} />
                </div>

                {this.templates && this.templates.map((category) => (
                    <Expendable key={category.name} title={category.name} defaultExpended={true}>
                        {category.templates.map((template) => (
                            <div className={classNames("template", { highlight: this.template === template })} style={{ paddingLeft: "24px", fontSize: "13px", height: "24px", lineHeight: "24px", cursor: "pointer" }} key={template.name} onClick={(e) => this.onTemplateSelected(template)}>{template.name}</div>
                        ))}
                    </Expendable>
                ))}
            </Panel>
        );
    }

    private async loadTemplatesAsync() {
        let folder: string | null = localStorage.getItem("template.folder");
        if (folder === null) {
            if (process.platform === "darwin") {
                const files = await showOpenDialog({
                    properties: ["openDirectory"],
                    title: "Select Template Folder",
                });
                if (files === undefined)
                    return quit();
                folder = files[0];
            } else {
                folder = "templates";
            }
            localStorage.setItem("template.folder", folder);
        }
        this.templates.push(... await Template.loadAsync(folder));
    }

    @bind
    private async onOpen() {
        const files = await showOpenDialog({
            filters: [{
                extensions: ["json"],
                name: "Project File",
            }],
        });
        if (files !== undefined) {
            const content = await fs.readFile(files[0], "utf-8");
            const file = JSON.parse(content) as ProjectFile;

            const [categoryName, name] = file.template.split("/");
            const category = this.templates.find((x) => x.name === categoryName);
            if (category !== undefined) {
                const template = category.templates.find((x) => x.name === name);
                if (template !== undefined)
                    this.props.onOpen(new Project(file.name, template, files[0], file));
            }
        }
    }

    @bind
    private onNameChange(value: string) {
        this.name = value;
        this.nameError = this.name === "";
    }

    @bind
    private onCreate() {
        if (this.name === undefined || this.name === "")
            this.nameError = true;
        else if (this.template !== undefined)
            this.props.onOpen(new Project(this.name, this.template));
    }

    @bind
    private onTemplateSelected(template: Template) {
        this.template = template;
        this.props.onPreview(new Project("preview", template));
    }
}
