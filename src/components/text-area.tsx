import * as React from "react";

import bind from "bind-decorator";

import { autorun, observable, observer } from "../object-proxy";

import "./text-area.less";

export interface TextAreaProps {
    placeholder?: string;
    value?: string;
    onChange(value: string): void;
}

@observer
export class TextArea extends React.Component<TextAreaProps, void> {
    private mirror: HTMLDivElement | undefined | null;

    @observable
    private height: number;

    constructor(props: TextAreaProps) {
        super(props);
    }

    public componentDidUpdate() {
        this.updateLayout();
    }

    public render() {
        let mirrorValue = this.props.value;
        if (mirrorValue !== undefined && mirrorValue.endsWith("\n"))
            mirrorValue += " ";

        return (
            <div className="wrapper">
                <textarea onInput={(e) => this.props.onChange(e.currentTarget.value)}
                    style={{ height: this.height + "px" }}
                    placeholder={this.props.placeholder}
                    defaultValue={this.props.value}
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}>
                </textarea>
                <div className="mirror" ref={this.onMirrorRef}>{mirrorValue}</div>
            </div>
        );
    }

    private updateLayout() {
        if (this.mirror === null || this.mirror === undefined)
            return;

        const height = this.mirror.getBoundingClientRect().height;
        if (height !== this.height)
            this.height = height;
    }

    @bind
    private onMirrorRef(e: HTMLDivElement) {
        this.mirror = e;
        this.updateLayout();
    }

    @bind
    private onInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
        this.props.onChange(e.target.value);
    }
}
