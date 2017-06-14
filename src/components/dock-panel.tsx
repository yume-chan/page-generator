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

    @bind
    private onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
        if (e.button == 0) {
            e.preventDefault();

            this.start = this.props.orientation == "horizontal" ? e.pageX : e.pageY;
            this.origin = this.props.value;
            this.dragging = true;
        }
    }

    @bind
    private onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        const now = this.props.orientation == "horizontal" ? e.pageX : e.pageY;
        const delta = this.props.start ? now - this.start : this.start - now;
        const current = this.origin + delta;
        if (this.props.min !== undefined && current < this.props.min)
            return;
        if (this.props.max != undefined && current > this.props.max)
            return;
        this.props.onValueUpdated(current);
    }

    @bind
    private onMouseUp(e: React.MouseEvent<HTMLDivElement>) {
        if (e.button == 0)
            this.dragging = false;
    }

    render() {
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
        }
        else {
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
}

export interface DockPanelProps {
    id?: string;

    orientation: "vertical" | "horizontal";
    mainElement: JSX.Element;

    startPanel?: JSX.Element;
    startPanelSize?: number;
    startPanelMinSize?: number;
    startPanelMaxSize?: number;

    endPanel?: JSX.Element;
    endPanelSize?: number;
    endPanelMinSize?: number;
    endPanelMaxSize?: number;

    separatorWidth?: number;

    style?: React.CSSProperties;
}

@observer
export class DockPanel extends React.Component<DockPanelProps, void>{
    @observable startPanelSize: number;
    @observable endPanelSize: number;
    separatorWidth: number;

    constructor(props: DockPanelProps) {
        super(props);

        if (props.startPanel !== undefined && props.startPanelSize !== undefined)
            this.startPanelSize = props.startPanelSize;
        else
            this.startPanelSize = 0;

        if (props.endPanel !== undefined && props.endPanelSize !== undefined)
            this.endPanelSize = props.endPanelSize;
        else
            this.endPanelSize = 0;

        this.separatorWidth = props.separatorWidth || 6;
    }

    @bind
    onStartPanelSizeChanged(value: number) {
        this.startPanelSize = value;
    }

    @bind
    onEndPanelSizeChanged(value: number) {
        this.endPanelSize = value;
    }

    render() {
        const list = [];

        let { orientation, startPanel, mainElement, endPanel } = this.props;

        const mainElementStyle: React.CSSProperties = {};
        mainElement = React.cloneElement(mainElement, { style: mainElementStyle, key: "2" });

        mainElementStyle.position = "absolute";

        switch (orientation) {
            case "horizontal":
                mainElementStyle.top = "0";
                mainElementStyle.bottom = "0";

                if (startPanel !== undefined) {
                    const startPanelStyle: React.CSSProperties = {};
                    startPanel = React.cloneElement(startPanel, { style: startPanelStyle, key: "0" });

                    startPanelStyle.position = "absolute";
                    startPanelStyle.top = "0";
                    startPanelStyle.bottom = "0";
                    startPanelStyle.left = "0";
                    startPanelStyle.width = this.startPanelSize + "px";

                    mainElementStyle.left = this.startPanelSize + this.separatorWidth + "px";

                    list.push(startPanel);

                    list.push(
                        <Separator key="1"
                            orientation={orientation}
                            start={true}
                            value={this.startPanelSize}
                            min={this.props.startPanelMinSize}
                            max={this.props.startPanelMaxSize}
                            width={this.separatorWidth}
                            onValueUpdated={this.onStartPanelSizeChanged} />);
                } else {
                    mainElementStyle.left = "0";
                }

                list.push(mainElement);

                if (endPanel !== undefined && this.endPanelSize !== undefined) {
                    list.push(
                        <Separator key="3"
                            orientation={orientation}
                            start={false}
                            value={this.endPanelSize}
                            min={this.props.endPanelMinSize}
                            max={this.props.endPanelMaxSize}
                            width={this.separatorWidth}
                            onValueUpdated={this.onEndPanelSizeChanged} />);

                    const endPanelStyle: React.CSSProperties = {};
                    endPanel = React.cloneElement(endPanel, { style: endPanelStyle, key: "4" });

                    endPanelStyle.position = "absolute";
                    endPanelStyle.top = "0";
                    endPanelStyle.right = "0";
                    endPanelStyle.bottom = "0";
                    endPanelStyle.width = this.endPanelSize + "px";

                    mainElementStyle.right = this.endPanelSize + this.separatorWidth + "px";

                    list.push(endPanel);
                } else {
                    mainElementStyle.right = "0";
                }
                break;
            case "vertical":
                mainElementStyle.right = "0";
                mainElementStyle.left = "0";

                if (startPanel !== undefined && this.startPanelSize !== undefined) {
                    const startPanelStyle: React.CSSProperties = {};
                    startPanel = React.cloneElement(startPanel, { style: startPanelStyle, key: "0" });

                    startPanelStyle.position = "absolute";
                    startPanelStyle.top = "0";
                    startPanelStyle.right = "0";
                    startPanelStyle.left = "0";
                    startPanelStyle.height = this.startPanelSize + "px";

                    mainElementStyle.top = this.startPanelSize + this.separatorWidth + "px";

                    list.push(startPanel);

                    list.push(
                        <Separator key="1"
                            orientation={orientation}
                            start={true}
                            value={this.startPanelSize}
                            min={this.props.startPanelMinSize}
                            max={this.props.startPanelMaxSize}
                            width={this.separatorWidth}
                            onValueUpdated={this.onStartPanelSizeChanged} />);
                } else {
                    mainElementStyle.top = "0";
                }

                list.push(mainElement);

                if (endPanel !== undefined && this.endPanelSize !== undefined) {
                    list.push(
                        <Separator key="3"
                            orientation={orientation}
                            start={false}
                            value={this.endPanelSize}
                            min={this.props.endPanelMinSize}
                            max={this.props.endPanelMaxSize}
                            width={this.separatorWidth}
                            onValueUpdated={this.onEndPanelSizeChanged} />);

                    const endPanelStyle: React.CSSProperties = {};
                    endPanel = React.cloneElement(endPanel, { style: endPanelStyle, key: "4" });

                    endPanelStyle.position = "absolute";
                    endPanelStyle.right = "0";
                    endPanelStyle.bottom = "0";
                    endPanelStyle.left = "0";
                    endPanelStyle.height = this.endPanelSize + "px";

                    mainElementStyle.bottom = this.endPanelSize + this.separatorWidth + "px";

                    list.push(endPanel);
                } else {
                    mainElementStyle.bottom = "0";
                }
                break;
        }

        return <div id={this.props.id} style={this.props.style}>{list}</div>
    }
}
