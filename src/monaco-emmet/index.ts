/// <reference types="monaco-editor" />

import * as vscode from "./vscode";

import { expandAbbreviation } from "./abbreviationActions";
import { VscodeCompletionItemProviderToMonacoCompletionItemProvider } from "./completionItemProviderAdapter";
import { EmmetCompletionItemProvider } from "./emmetCompletionProvider";
import { IStandaloneCodeEditorToTextEditor } from "./textEditorAdapter";

export function enableEmmet(editor: monaco.editor.IStandaloneCodeEditor): monaco.IDisposable {
    editor.addCommand(monaco.KeyCode.Tab, () => {
        vscode.window.activeTextEditor = IStandaloneCodeEditorToTextEditor(editor);
        expandAbbreviation();
    }, "");

    return monaco.languages.registerCompletionItemProvider("handlebars", VscodeCompletionItemProviderToMonacoCompletionItemProvider(new EmmetCompletionItemProvider(), ["!", ".", "}"]));
}
