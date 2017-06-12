import * as path from "path";

import * as electron from "electron";
import { remote } from "electron";
const { dialog, Menu, MenuItem } = remote;

import * as React from "react";

import bind from "bind-decorator";

import { observable, observer } from "../object-proxy";

import { PanelAction, Panel } from "./panel";
import { TextArea } from "./text-area";
import { Project } from "./project";
import { Expendable } from "./expendable";

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

        function renderBackgrounds(project: Project) {
            return project.background.map((item, index) => {
                let filepath = item.relativePath;
                let sep = "/";
                if (filepath === undefined) {
                    filepath = item.path;
                    sep = path.sep;
                }

                const parsed = path.parse(filepath);

                return (
                    <div key={index} className="list-item">
                        <div className="path" title={item.path}>{parsed.dir}</div>
                        <div className="content" title={item.path}>{sep + parsed.base}</div>
                        <div className="actions">
                            <div className="action icon-kill" onClick={e => project.background.splice(index, 1)}></div>
                        </div>
                    </div>
                );
            });
        }

        const Replaces = observer(({ replaces }: { replaces: Map<string, string> }) => {
            const ReplaceInput = observer(({ name, replaces }: { name: string, replaces: Map<string, string> }) => (
                <div>
                    <h4>{name}</h4>
                    <TextArea onChange={(value) => this.props.onReplaceChange(name, value)} value={replaces.get(name)} />
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

        return (
            <Panel title="Properties" style={this.props.style}>
                <Replaces replaces={this.props.project.templateReplace} />

                <Expendable title="Background" defaultExpended={true} padding="8px" actions={actions}>
                    {renderBackgrounds(this.props.project)}
                </Expendable>
            </Panel>
        );
    }
}
