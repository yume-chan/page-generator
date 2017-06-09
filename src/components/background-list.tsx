import * as path from "path";

import * as React from "react";
import { SortableContainer, SortableElement } from 'react-sortable-hoc';

import { Project, ProjectBackground } from "./project";

export interface BackgruondListProps {
    project: Project;
}

export function BackgruondList({ project }: { project: Project }) {
    const Item: React.StatelessComponent<{ item: ProjectBackground, index: number }> = ({ item, index }: { item: ProjectBackground, index: number }) => {
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
    };

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

    const Container = SortableContainer(({ project }: { project: Project }) => (
        <div>
            {project.background.map((item, index) => (
                <Item item={item} index={index} />
            ))}
        </div>
    ));

    return (
        <Container project={project} />
    );
}
