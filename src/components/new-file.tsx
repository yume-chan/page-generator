import * as React from "react";

import { Template } from "./source-file";
import "./new-file.less";

interface NewFileProps {
    templates: Template[];
    onCreate: (name: string, template: Template) => void;
    onCancel: () => void;
}

export class NewFile extends React.Component<NewFileProps, void>{
    name: string;
    template: Template;

    constructor(props: NewFileProps) {
        super(props);

        this.template = props.templates[0];
    }

    onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.name = e.target.value;
    }

    onTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        this.template = this.props.templates[e.target.selectedIndex];
    }

    onOk = (e: any) => {
        if (this.name !== undefined)
            this.props.onCreate(this.name, this.template);
    }

    onCancel = (e: any) => {
        this.props.onCancel();
    }

    render() {
        return (
            <div className="mask">
                <div className="blur" />
                <div className="dialog">
                    <h1>New File</h1>

                    <h4>Project Name</h4>
                    <input type="text" onChange={this.onNameChange} />

                    <h4>Template</h4>
                    <select onChange={this.onTemplateChange}>
                        {this.props.templates.map(item => (
                            <option key={item.name} checked={item == this.template}>{item.name}</option>
                        ))}
                    </select>

                    <footer>
                        <div className="button highlight" onClick={this.onOk}>OK</div>
                        <div className="button" onClick={this.onCancel}>Cancel</div>
                    </footer>
                </div>
            </div>
        )
    }
}
