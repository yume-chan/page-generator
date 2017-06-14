import * as path from "path";

import * as React from "react";
import { SortableContainer, SortableElement } from 'react-sortable-hoc';

import { Project, ProjectBackground, ProjectProps } from "./project";
import { observer } from "../object-proxy";

export function BackgroundList({ project }: { project: Project }) {
    const SortableItem = SortableElement(({ item, index }: { item: ProjectBackground, index: number }) => {
        let filepath = item.relativePath;
        let sep = "/";
        if (filepath === undefined) {
            filepath = item.path;
            sep = path.sep;
        }

        const parsed = path.parse(filepath);

        return (
            <div key={index} className="list-item">
                <div className="path" title={item.path}>{parsed.dir}</div>
                <div className="content" title={item.path}>{sep + parsed.base}</div>
                <div className="actions">
                    <div className="action icon-kill" onClick={e => project.background.splice(index, 1)}></div>
                </div>
            </div>
        );
    });

    const Container = SortableContainer(observer(({ project }: ProjectProps) => (
        <div>
            {project.background.map((item, index) => (
                <SortableItem key={item.path} item={item} index={index} />
            ))}
        </div>
    )));

    const onSortEnd = ({ oldIndex, newIndex }: { oldIndex: number, newIndex: number }) => {
        project.reorderBackground(oldIndex, newIndex);
    }

    return (
        <Container project={project} onSortEnd={onSortEnd} />
    );
}
