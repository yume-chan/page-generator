import * as React from "react";

import { observable, computed } from "mobx";
import { observer } from "mobx-react";

import bind from "bind-decorator";

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

    updateLayout() {
        if (this.mirror === null || this.mirror === undefined)
            return;

        const height = this.mirror.getBoundingClientRect().height;
        if (height != this.height)
            this.height = height;
    }

    @bind
    onMirrorRef(e: HTMLDivElement) {
        this.mirror = e;
        this.updateLayout();
    }

    @bind
    onInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
        this.props.onChange(e.target.value);
    }

    componentDidUpdate() {
        this.updateLayout();
    }

    render() {
        let mirrorValue = this.props.value;
        if (mirrorValue !== undefined && mirrorValue.endsWith("\n"))
            mirrorValue += " ";

        return (
            <div className="wrapper">
                <textarea onInput={e=>this.props.onChange(e.currentTarget.value)}
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
}
