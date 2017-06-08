import * as React from "react";

import { observable, computed } from "mobx";
import { observer } from "mobx-react";

import bind from "bind-decorator";

import { Dialog } from "./dialog";

import { Template } from "./project";
import "./new-file.less";

interface NewFileProps {
    templates: Template[];
    onCreate(name: string, template: Template): void;
    onCancel(): void;
}

@observer
export class NewFile extends React.Component<NewFileProps, void>{
    private name: string;
    
    @observable.ref
    private template: Template;

    constructor(props: NewFileProps) {
        super(props);

        this.template = props.templates[0];
    }

    @bind
    private onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.name = e.target.value;
    }

    @bind
    private onTemplateChange(e: React.ChangeEvent<HTMLSelectElement>) {
        this.template = this.props.templates[e.target.selectedIndex];
    }

    @bind
    private onResult(id: string) {
        switch (id) {
            case "ok":
                if (this.name != undefined)
                    this.props.onCreate(this.name, this.template);
                break;
            case "cancel":
                this.props.onCancel();
                break;
        }
    }

    render() {
        const buttons = [
            { id: "ok", content: "OK", isDefault: true },
            { id: "cancel", content: "Cancel" },
        ];

        return (
            <Dialog title="New File" className="new-file" buttons={buttons} onResult={this.onResult}>
                <h4>Project Name</h4>
                <input type="text" onChange={this.onNameChange} />

                <h4>Template</h4>
                <select onChange={this.onTemplateChange}>
                    {this.props.templates.map(item => (
                        <option key={item.name} checked={item == this.template}>{item.name}</option>
                    ))}
                </select>
            </Dialog>
        );
    }
}
