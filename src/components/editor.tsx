import * as path from "path";

import * as electron from "electron";
import { remote } from "electron";
const { dialog, Menu, MenuItem } = remote;

import * as React from "react";

import bind from "bind-decorator";

import { observable, observer, ReactProps } from "../object-proxy";

import { PanelAction, Panel } from "./panel";
import { TextArea } from "./text-area";
import { Project } from "./project";
import { Expendable } from "./expendable";
import { BackgroundList } from "./background-list";

export interface EditorProps {
    project: Project;
    style?: React.CSSProperties;
    onReplaceChange(key: string, value: string): void;
}

@observer
export class Editor extends React.Component<EditorProps, void> {
    render() {
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

                        await this.props.project.addBackgroundAsync(...files);
                    });
                }
            }
        ];

        const Replaces = observer(({ replaces }: ReactProps<{ replaces: { [key: string]: string } }>) => {
            const ReplaceInput = observer(({ name, replaces }: ReactProps<{ name: string, replaces: { [key: string]: string } }>) => (
                <div>
                    <h4>{name}</h4>
                    <TextArea onChange={(value) => this.props.onReplaceChange(name, value)} value={replaces[name]} />
                </div>
            ));

            const children: JSX.Element[] = [];
            // for (const [key, value] of replaces)
            for (const key of Object.keys(replaces))
                children.push(<ReplaceInput key={key} name={key} replaces={replaces} />);

            return (
                <Expendable title="Template" defaultExpended={true} padding="8px">
                    {children}
                </Expendable>
            );
        });

        return (
            <Panel title="Properties" style={this.props.style}>
                <Replaces replaces={this.props.project.templateReplace} />

                <Expendable title="Background" defaultExpended={true} padding="8px" actions={actions}>
                    <BackgroundList project={this.props.project} />
                </Expendable>
            </Panel>
        );
    }
}
