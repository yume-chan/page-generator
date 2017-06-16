import * as React from "react";

import bind from "bind-decorator";

import { observable, observer } from "../object-proxy";
import { Separator } from "./separator";

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
export class DockPanel extends React.Component<DockPanelProps, void> {
    @observable
    private startPanelSize: number;
    @observable
    private endPanelSize: number;

    private separatorWidth: number;

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

    public render() {
        const list = [];

        const { orientation } = this.props;
        let { startPanel, mainElement, endPanel } = this.props;

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

        return <div id={this.props.id} style={this.props.style}>{list}</div>;
    }

    @bind
    private onStartPanelSizeChanged(value: number) {
        this.startPanelSize = value;
    }

    @bind
    private onEndPanelSizeChanged(value: number) {
        this.endPanelSize = value;
    }
}
