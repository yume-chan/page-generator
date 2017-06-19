/// <reference types="monaco-editor" />

import extract from "@emmetio/extract-abbreviation";
import Node from "@emmetio/node";

export function getSyntax(model: monaco.editor.IReadOnlyModel): string {
    if (model.getModeId() === "jade")
        return "pug";

    if (model.getModeId() === "javascriptreact" || model.getModeId() === "typescriptreact")
        return "jsx";

    return model.getModeId();
}

export function isStyleSheet(syntax: string): syntax is "css" | "scss" | "sass" | "less" | "stylus" {
    const stylesheetSyntaxes = ["css", "scss", "sass", "less", "stylus"];
    return (stylesheetSyntaxes.indexOf(syntax) > -1);
}

export function getProfile(syntax: string): any {
    return {};
}

export function extractAbbreviation(model: monaco.editor.IReadOnlyModel, position: monaco.Position): [monaco.Range | null, string] {
    const currentLine = model.getLineContent(position.lineNumber);
    // Position.column counts from 1.
    const result = extract(currentLine, position.column - 1, true);
    if (!result)
        return [null, ""];

    // Range.startColumn counts from 1.
    const rangeToReplace = new monaco.Range(position.lineNumber, result.location + 1, position.lineNumber, result.location + result.abbreviation.length);
    return [rangeToReplace, result.abbreviation];
}

export function getNode(root: Node<monaco.Position>, position: monaco.Position, includeNodeBoundary: boolean = false) {
    let currentNode: Node<monaco.Position> | null | undefined = root.firstChild;
    let foundNode: Node<monaco.Position> | null = null;

    while (currentNode !== null && currentNode !== undefined) {
        const nodeStart: monaco.Position = currentNode.start;
        const nodeEnd: monaco.Position = currentNode.end;
        if ((nodeStart.isBefore(position) && !nodeEnd.isBeforeOrEqual(position))
            || (includeNodeBoundary && (nodeStart.isBeforeOrEqual(position) && !nodeEnd.isBefore(position)))) {

            foundNode = currentNode;
            // Dig deeper
            currentNode = currentNode.firstChild;
        } else {
            currentNode = currentNode.nextSibling;
        }
    }

    return foundNode;
}
