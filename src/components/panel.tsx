import * as React from "react";

import "./panel.less";

export interface PanelAction {
    className: string;
    title?: string;
    content?: string;
    onClick(): void;
}

export interface PanelProps {
    title: string;
    style?: React.CSSProperties;
    actions?: PanelAction[];
}

export class Panel extends React.Component<PanelProps, void> {
    render() {
        return (
            <aside style={this.props.style}>
                <h1>{this.props.title}</h1>

                {this.props.children}
            </aside>
        );
    }
}
