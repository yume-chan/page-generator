/// <reference types="monaco-editor" />

import extract from "@emmetio/extract-abbreviation";

export function getSyntax(model: monaco.editor.IReadOnlyModel): string {
    if (model.getModeId() === "jade")
        return "pug";

    if (model.getModeId() === "javascriptreact" || model.getModeId() === "typescriptreact")
        return "jsx";

    return model.getModeId();
}

export function isStyleSheet(syntax: string): boolean {
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
