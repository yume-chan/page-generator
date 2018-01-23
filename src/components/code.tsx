/// <reference types="monaco-editor" />

declare const amdRequire: any;

import React from "react";

import { bind } from "bind-decorator";

import { enableEmmet } from "../monaco-emmet";
import { observable } from "../object-proxy";

import { DockPanel } from "./dock-panel";
import { ProjectProps } from "./project";

interface CodeProps {
    style?: React.CSSProperties;
}

export class Code extends React.Component<CodeProps & ProjectProps> {
    @observable
    private value: string;
    private editor: monaco.editor.IStandaloneCodeEditor | undefined;
    private disposable: monaco.IDisposable | undefined;

    constructor(props: CodeProps & ProjectProps) {
        super(props);

        this.value = props.project.content;
    }

    public componentDidMount() {
        window.addEventListener("resize", this.onResize);
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

            if (this.disposable !== undefined) {
                this.disposable.dispose();
                this.disposable = undefined;
            }
            return;
        }

        amdRequire(["vs/editor/editor.main"], () => {
            this.editor = monaco.editor.create(ref, {
                language: "handlebars",
                theme: "vs-dark",
                value: this.props.project.content,
            });
            this.editor.onDidChangeModelContent((e: monaco.editor.IModelContentChangedEvent) => {
                this.value = this.editor!.getValue();
                this.props.project.content = this.value;
            });
            this.disposable = enableEmmet(this.editor);
        });
    }
}
