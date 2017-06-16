import * as React from "react";

import * as classNames from "classnames";

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

function renderActions(props: PanelProps) {
    if (props.actions === undefined || props.actions.length === 0)
        return undefined;

    return (
        <div className="actions">
            {props.actions.map((value) => (
                <div key={value.className}
                    className={classNames("action", value.className)}
                    title={value.title}
                    onClick={(e) => { e.stopPropagation(); value.onClick(); }}>{value.content}</div>
            ))}
        </div>
    );
}

export function Panel(props: PanelProps & { children?: React.ReactNode }) {
    return (
        <aside style={props.style}>
            <header>
                <div className="title">{props.title}</div>
                {renderActions(props)}
            </header>

            {props.children}
        </aside>
    );
}
