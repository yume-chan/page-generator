import * as vscode from "./vscode";

import extract from "@emmetio/extract-abbreviation";
import { HtmlNode } from "@emmetio/html-matcher";
import Node from "@emmetio/node";

export function getSyntax(document: vscode.TextDocument): string {
    if (document.languageId === "jade")
        return "pug";

    if (document.languageId === "javascriptreact" || document.languageId === "typescriptreact")
        return "jsx";

    return document.languageId;
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

export function getNode(root: Node<vscode.Position>, position: vscode.Position, includeNodeBoundary: boolean = false) {
    let currentNode: Node<vscode.Position> | undefined | null = root.firstChild;
    let foundNode: Node<vscode.Position> | undefined;

    while (currentNode) {
        const nodeStart: vscode.Position = currentNode.start;
        const nodeEnd: vscode.Position = currentNode.end;
        if ((nodeStart.isBefore(position) && nodeEnd.isAfter(position))
            || (includeNodeBoundary && (nodeStart.isBeforeOrEqual(position) && nodeEnd.isAfterOrEqual(position)))) {

            foundNode = currentNode;
            // Dig deeper
            currentNode = currentNode.firstChild;
        } else {
            currentNode = currentNode.nextSibling;
        }
    }

    return foundNode;
}

export function getInnerRange(currentNode: HtmlNode<vscode.Position>): vscode.Range | undefined {
    if (!currentNode.close)
        return undefined;

    return new vscode.Range(currentNode.open.end, currentNode.close.start);
}
