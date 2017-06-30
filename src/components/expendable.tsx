import React from "react";

import bind from "bind-decorator";
import classNames from "classnames";

import { observable, observer } from "../object-proxy";

import { PanelAction } from "./panel";

import "./expendable.less";

export interface ExpendableProps {
    actions?: PanelAction[];
    title: string;
    defaultExpended: boolean;
    padding?: string;
    onExpendedChanged?(expended: boolean): void;
}

@observer
export class Expendable extends React.Component<ExpendableProps> {
    @observable
    private expended: boolean;

    constructor(props: ExpendableProps) {
        super(props);

        this.expended = props.defaultExpended;
    }

    public render() {
        function renderActions(props: ExpendableProps) {
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

        return (
            <div className="expendable">
                <header className={classNames({ collapsed: !this.expended })}
                    onClick={this.onHeaderClick}>
                    <div className="title">{this.props.title}</div>
                    {renderActions(this.props)}
                </header>

                {this.expended && (
                    <div className="body" style={{ padding: this.props.padding }}>
                        {this.props.children}
                    </div>
                )}

            </div>
        );
    }

    @bind
    private onHeaderClick(e: React.MouseEvent<HTMLDivElement>) {
        this.expended = !this.expended;

        if (this.props.onExpendedChanged !== undefined)
            this.props.onExpendedChanged(this.expended);
    }
}
