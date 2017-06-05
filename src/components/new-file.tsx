import * as React from "react";

import { Dialog } from "./dialog";

import { Template } from "./source-file";
import "./new-file.less";

interface NewFileProps {
    templates: Template[];
    onCreate(name: string, template: Template): void;
    onCancel(): void;
}

export class NewFile extends React.Component<NewFileProps, void>{
    name: string;
    template: Template;

    constructor(props: NewFileProps) {
        super(props);

        this.template = props.templates[0];
    }

    private onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.name = e.target.value;
    }

    private onTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        this.template = this.props.templates[e.target.selectedIndex];
    }

    private onResult = (id: string) => {
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
