import * as React from "react";

import { observable, computed } from "mobx"
import { observer } from "mobx-react";

export interface SeparatorProps {
    orientation: "vertical" | "horizontal";
    decrement?: boolean;
    value: number;
    min?: number;
    max?: number;
    style: { left?: string; top?: string; right?: string; bottom?: string };
    onValueUpdated: (value: number) => void;
}

@observer
export class Separator extends React.Component<SeparatorProps, void> {
    cursor: string = "";
    start: number = 0;
    origin: number = 0;

    @observable dragging: boolean = false;

    onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button == 0) {
            e.preventDefault();

            this.start = this.props.orientation == "horizontal" ? e.pageX : e.pageY;
            this.origin = this.props.value;
            this.dragging = true;
        }
    }

    onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const now = this.props.orientation == "horizontal" ? e.pageX : e.pageY;
        const delta = this.props.decrement ? this.start - now : now - this.start;
        const current = this.origin + delta;
        if (this.props.min !== undefined && current < this.props.min)
            return;
        if (this.props.max != undefined && current > this.props.max)
            return;
        this.props.onValueUpdated(current);
    }

    onMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button == 0)
            this.dragging = false;
    }

    render() {
        if (this.dragging)
            return <div className="drag-overlay"
                style={{ cursor: this.props.orientation == "horizontal" ? "ew-resize" : "ns-resize" }}
                onMouseMove={this.onMouseMove}
                onMouseUp={this.onMouseUp} />;
        else
            return <div className="separator" style={this.props.style} onMouseDown={this.onMouseDown} />;
    }
}
