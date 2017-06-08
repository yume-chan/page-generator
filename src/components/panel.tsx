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

export function Panel(props: PanelProps & { children?: React.ReactNode }) {
    return (
        <aside style={props.style}>
            <h1>{props.title}</h1>

            {props.children}
        </aside>
    );
}
