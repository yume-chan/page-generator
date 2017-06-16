import * as React from "react";

import bind from "bind-decorator";

import { observable, observer } from "../object-proxy";

export interface SeparatorProps {
    orientation: "vertical" | "horizontal";
    start: boolean;
    value: number;
    min?: number;
    max?: number;
    width: number;
    onValueUpdated: (value: number) => void;
}

@observer
export class Separator extends React.Component<SeparatorProps, void> {
    private start: number = 0;
    private origin: number = 0;

    @observable
    private dragging: boolean = false;

    public render() {
        const style = {} as any;
        style.position = "absolute";

        switch (this.props.orientation) {
            case "horizontal":
                style.cursor = "ew-resize";
                break;
            case "vertical":
                style.cursor = "ns-resize";
                break;
        }

        if (this.dragging) {
            return (
                <div className="drag-overlay"
                    style={style}
                    onMouseMove={this.onMouseMove}
                    onMouseUp={this.onMouseUp} />
            );
        } else {
            switch (this.props.orientation) {
                case "horizontal":
                    style.top = "0";
                    style.bottom = "0";

                    style.width = this.props.width + "px";
                    if (this.props.start)
                        style.left = this.props.value + "px";
                    else
                        style.right = this.props.value + "px";
                    break;
                case "vertical":
                    style.right = "0";
                    style.left = "0";

                    style.height = this.props.width + "px";
                    if (this.props.start)
                        style.top = this.props.value + "px";
                    else
                        style.bottom = this.props.value + "px";
                    break;
            }

            return <div className="separator" style={style} onMouseDown={this.onMouseDown} />;
        }
    }

    @bind
    private onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
        if (e.button === 0) {
            e.preventDefault();

            this.start = this.props.orientation === "horizontal" ? e.pageX : e.pageY;
            this.origin = this.props.value;
            this.dragging = true;
        }
    }

    @bind
    private onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        const now = this.props.orientation === "horizontal" ? e.pageX : e.pageY;
        const delta = this.props.start ? now - this.start : this.start - now;
        const current = this.origin + delta;
        if (this.props.min !== undefined && current < this.props.min)
            return;
        if (this.props.max !== undefined && current > this.props.max)
            return;
        this.props.onValueUpdated(current);
    }

    @bind
    private onMouseUp(e: React.MouseEvent<HTMLDivElement>) {
        if (e.button === 0)
            this.dragging = false;
    }
}
