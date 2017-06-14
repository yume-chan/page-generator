import * as path from "path";
import * as React from "react";
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { observer } from "../object-proxy";
export function BackgroundList({ project }) {
    const SortableItem = SortableElement(({ item, index }) => {
        let filepath = item.relativePath;
        let sep = "/";
        if (filepath === undefined) {
            filepath = item.path;
            sep = path.sep;
        }
        const parsed = path.parse(filepath);
        return (React.createElement("div", { key: index, className: "list-item" },
            React.createElement("div", { className: "path", title: item.path }, parsed.dir),
            React.createElement("div", { className: "content", title: item.path }, sep + parsed.base),
            React.createElement("div", { className: "actions" },
                React.createElement("div", { className: "action icon-kill", onClick: e => project.background.splice(index, 1) }))));
    });
    const Container = SortableContainer(observer(({ project }) => (React.createElement("div", null, project.background.map((item, index) => (React.createElement(SortableItem, { key: item.path, item: item, index: index })))))));
    const onSortEnd = ({ oldIndex, newIndex }) => {
        project.reorderBackground(oldIndex, newIndex);
    };
    return (React.createElement(Container, { project: project, onSortEnd: onSortEnd }));
}
//# sourceMappingURL=background-list.js.map