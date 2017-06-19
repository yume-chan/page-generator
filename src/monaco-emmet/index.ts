/// <reference types="monaco-editor" />

import { expandAbbreviation } from "./abbreviation-actions";
import { EmmetCompletionItemProvider } from "./emmet-completion-item-provider";

export function enableEmmet(editor: monaco.editor.IStandaloneCodeEditor): monaco.IDisposable {
    editor.addCommand(monaco.KeyCode.Tab, () => {
        expandAbbreviation(editor);
    }, "");

    return monaco.languages.registerCompletionItemProvider("handlebars", new EmmetCompletionItemProvider());
}
