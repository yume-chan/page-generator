/* tslint:disable:no-reference */
/// <reference path="emmet.d.ts" />
/* tslint:enable:no-reference */
/// <reference types="monaco-editor" />

import { expand } from "@emmetio/expand-abbreviation";
import { extractAbbreviation, getProfile, getSyntax } from "./util";

const field = (index: number, placeholder: string) => `\${${index}${placeholder ? ":" + placeholder : ""}}`;

export function expandAbbreviation(editor: monaco.editor.IStandaloneCodeEditor) {
    const selection: monaco.Range = editor.getSelection();
    let abbr = editor.getModel().getValueInRange(selection);
    let rangeToReplace: monaco.Range | null = null;
    if (selection.isEmpty)
        [rangeToReplace, abbr] = extractAbbreviation(editor.getModel(), selection.getStartPosition());

    if (rangeToReplace === null)
        return;

    const syntax = getSyntax(editor.getModel());
    const options = {
        addons: syntax === "jsx" ? { jsx: true } : undefined,
        field,
        profile: getProfile(getSyntax(editor.getModel())),
        syntax,
    };

    const snippetController = editor.getContribution("editor.contrib.snippetController") as any;
    const expandedText = expand(abbr, options);
    snippetController.insertSnippet(expandedText, selection.startColumn - rangeToReplace.startColumn, rangeToReplace.endColumn - selection.endColumn);
}
