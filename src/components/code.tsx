/// <reference types="monaco-editor" />

declare const amdRequire: any;

import * as React from "react";

import { bind } from "bind-decorator";

import { enableEmmet } from "../monaco-emmet";
import { observable } from "../object-proxy";
import { ProjectProps } from "./project";

interface CodeProps {
    style?: React.CSSProperties;
}

export class Code extends React.Component<CodeProps & ProjectProps, void> {
    @observable
    private value: string;
    private editor: monaco.editor.IStandaloneCodeEditor | undefined;

    constructor(props: CodeProps & ProjectProps) {
        super(props);

        this.value = props.project.content;
    }

    public componentDidMount() {
        addEventListener("resize", this.onResize);
    }

    public shouldComponentUpdate(nextProps: CodeProps & ProjectProps): boolean {
        if (this.value !== nextProps.project.content) {
            if (this.editor !== undefined)
                this.editor.setValue(nextProps.project.content);
            this.value = nextProps.project.content;
            return false;
        }

        return true;
    }

    public componentDidUpdate() {
        if (this.editor !== undefined)
            this.editor.layout();
    }

    public componentWillUnmount() {
        removeEventListener("resize", this.onResize);
    }

    public render() {
        return (
            <div style={this.props.style} ref={this.onDivRef} />
        );
    }

    @bind
    private onResize() {
        if (this.editor !== undefined)
            this.editor.layout();
    }

    @bind
    private onDivRef(ref: HTMLDivElement) {
        if (ref === null) {
            if (this.editor !== undefined) {
                this.editor.dispose();
                this.editor = undefined;
            }
            return;
        }

        amdRequire(["vs/editor/editor.main"], () => {
            this.editor = monaco.editor.create(ref, {
                language: "html",
                theme: "vs-dark",
                value: this.props.project.content,
            });
            this.editor.onDidChangeModelContent((e: monaco.editor.IModelContentChangedEvent2) => {
                this.value = this.editor!.getValue();
                this.props.project.content = this.value;
            });
            enableEmmet(this.editor);
        });
    }
}
