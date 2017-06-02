import * as React from "react";

import { Template } from "./source-file";

interface NewFileProps {
    templates: Template[];
    onCreate: (name: string, selectedTemplate: Template) => void;
    onCancel: () => void;
}

export class NewFile extends React.Component<NewFileProps, void>{
    name: string;
    selectedTemplate: Template;

    onNameChange = (e: React.ChangeEvent<HTMLInputElement)=> {
        this.name = e.target.value;
    }

    onTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        this.selectedTemplate = this.props.templates[e.target.selectedIndex];
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
                            <option key={item.name}>{item.name}</option>
                        ))}
                    </select>

                    <footer>
                        <div className="button highlight">OK</div>
                        <div className="button">Cancel</div>
                    </footer>
                </div>
            </div>
        )
    }
}
