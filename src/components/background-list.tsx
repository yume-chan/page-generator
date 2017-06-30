import path from "path";

import React from "react";
import { SortableContainer, SortableElement } from "react-sortable-hoc";

import { observer } from "../object-proxy";
import { Project, ProjectBackground, ProjectProps } from "./project";

import "./background-list.less";

interface ItemProps {
    item: ProjectBackground;
    index: number;
    onDelete(index: number): void;
}

const Content = SortableElement(({ item }: { item: ProjectBackground }) => {
    let filepath = item.relativePath;
    let sep = "/";
    if (filepath === undefined) {
        filepath = item.path;
        sep = path.sep;
    }

    const parsed = path.parse(filepath);

    return (
        <div className="sortable-item">
            <div className="path" title={item.path}>{parsed.dir}</div>
            <div className="content" title={item.path}>{sep + parsed.base}</div>
        </div>
    );
});

const Item = ({ item, index, onDelete }: ItemProps) => {
    return (
        <div className="list-item">
            <Content item={item} index={index} />
            <div className="actions">
                <div className="action icon-kill" onClick={onDelete.bind(undefined, index)}></div>
            </div>
        </div>
    );
};

const Container = SortableContainer(observer(({ project }: ProjectProps) => {
    function onDelete(index: number) {
        project.background.splice(index, 1);
    }

    return (
        <div>
            {project.background.map((item, index) => (
                <Item key={item.path} item={item} index={index} onDelete={onDelete} />
            ))}
        </div>
    );
}));

export function BackgroundList({ project }: ProjectProps) {
    const onSortEnd = ({ oldIndex, newIndex }: { oldIndex: number, newIndex: number }) => {
        project.reorderBackground(oldIndex, newIndex);
    };

    return (
        <Container project={project} onSortEnd={onSortEnd} />
    );
}
