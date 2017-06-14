/// <reference types="monaco-editor" />

declare const amdRequire: any;

import * as path from "path";

import * as React from "react";

import { bind } from "bind-decorator";

import { Project, ProjectProps } from "./project";
import { observable } from "../object-proxy";

function enableEmmet(editor: monaco.editor.IStandaloneCodeEditor) {
    editor.addCommand(monaco.KeyCode.Tab, function() {

    }, "");
}

interface CodeProps {
    style?: React.CSSProperties;
}

export class Code extends React.Component<CodeProps & ProjectProps, void> {
    @observable
    private value: string;
    private editor: monaco.editor.IStandaloneCodeEditor;

    constructor(props: CodeProps & ProjectProps) {
        super(props);

        this.value = props.project.content;
    }

    @bind
    private onDivRef(ref: HTMLDivElement) {
        if (ref === null) {
            if (this.editor !== undefined)
                this.editor.dispose();
            return;
        }

        amdRequire(["vs/editor/editor.main"], () => {
            this.editor = monaco.editor.create(ref, {
                language: "html",
                value: this.props.project.content,
                theme: "vs-dark"
            });
            this.editor.onDidChangeModelContent((e: monaco.editor.IModelContentChangedEvent2) => {
                this.context = this.editor.getValue();
                this.props.project.content = this.context;
            });
        });
    }

    shouldComponentUpdate(nextProps: CodeProps & ProjectProps): boolean {
        if (this.context != nextProps.project.content) {
            if (this.editor !== undefined)
                this.editor.setValue(nextProps.project.content);
            this.context = nextProps.project.content;
            return false;
        }

        return true;
    }

    componentDidUpdate() {
        if (this.editor !== undefined)
            this.editor.layout();
    }

    render() {
        return (
            <div style={this.props.style} ref={this.onDivRef} />
        )
    }
}
