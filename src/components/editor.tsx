import path from "path";

import React from "react";

import bind from "bind-decorator";

import { observable, observer } from "../object-proxy";

import { showOpenDialog } from "../dialog";
import { BackgroundList } from "./background-list";
import { Expendable } from "./expendable";
import { Panel, PanelAction } from "./panel";
import { Project, Template, TemplateReplace } from "./project";
import { TextArea } from "./text-area";

export interface EditorProps {
    project: Project;
    style?: React.CSSProperties;
    onReplaceChange(key: string, value: string): void;
}

@observer
export class Editor extends React.Component<EditorProps> {
    public render() {
        const actions: PanelAction[] = [
            {
                className: "icon-new",
                onClick: async () => {
                    const files = await showOpenDialog({
                        filters: [
                            {
                                extensions: ["png", "jpg"],
                                name: "Image",
                            },
                        ],
                        properties: ["openFile", "multiSelections"],
                    });

                    if (files !== undefined)
                        await this.props.project.addBackgroundAsync(...files);
                },
            },
        ];

        const ReplaceInput = observer(({ name, replaces }: { name: string, replaces: { [key: string]: string } }) => (
            <div>
                <h4>{name}</h4>
                <TextArea onChange={(value) => this.props.onReplaceChange(name, value)} value={replaces[name]} />
            </div>
        ));

        const Replaces = observer(({ replaces, template }: { replaces: { [key: string]: string }, template: { readonly [key: string]: TemplateReplace } }) => {

            const children: JSX.Element[] = [];
            for (const key of Object.keys(replaces))
                if (template[key].hidden !== true)
                    children.push(<ReplaceInput key={key} name={key} replaces={replaces} />);

            return (
                <Expendable title="Template" defaultExpended={true} padding="8px">
                    {children}
                </Expendable>
            );
        });

        const project = this.props.project;

        return (
            <Panel title="Properties" style={this.props.style}>
                <Replaces replaces={project.templateReplace} template={project.template.htmlReplace} />

                <Expendable title="Background" defaultExpended={true} padding="8px" actions={actions}>
                    <BackgroundList project={project} />
                </Expendable>
            </Panel>
        );
    }
}
