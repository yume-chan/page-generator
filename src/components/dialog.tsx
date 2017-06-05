import * as React from "react";
import * as classNames from "classnames";

import "./dialog.less";

export interface DialogButton {
    id: string;
    content: string;
    isDefault?: boolean;
}

export interface DialogProps {
    title: string;
    className?: string;
    width?: number;
    height?: number;
    buttons?: DialogButton[];
    onResult?: (id: string) => void;
}

export function Dialog(props: DialogProps & { children?: React.ReactNode }) {
    return (
        <div className="mask">
            <div className="blur" />
            <div className="dialog" style={{ width: (props.width || 300) + "px", height: (props.height || 200) + "px" }}>
                <h1>{props.title}</h1>

                <div className={classNames("content", props.className)}>
                    {props.children}
                </div>

                {props.buttons && props.buttons.length &&
                    <footer>
                        {props.buttons.map(item => (
                            <div key={item.id} className={`button ${item.isDefault ? "highlight" : ""}`} onClick={() => props.onResult && props.onResult(item.id)}>{item.content}</div>
                        ))}
                    </footer>
                }
            </div>
        </div>
    );
}
