import * as vscode from "./vscode";
import { Thenable } from "./vscode";

import * as TypeConverters from "./extHostTypeConverters";
import { IReadOnlyModelToDocument } from "./textDocumentAdapter";

function toCompletionItem(item: vscode.CompletionItem): monaco.languages.CompletionItem {
    const { detail, documentation, insertText, label, sortText } = item;
    return {
        detail,
        documentation,
        insertText,
        kind: monaco.languages.CompletionItemKind.Snippet,
        label,
        sortText,
    };
}

export function VscodeCompletionItemProviderToMonacoCompletionItemProvider(provider: vscode.CompletionItemProvider, triggerCharacters: string[]): monaco.languages.CompletionItemProvider {
    return {
        triggerCharacters,
        provideCompletionItems(model: monaco.editor.IReadOnlyModel, position: monaco.Position, token: monaco.CancellationToken): monaco.languages.CompletionItem[] | Thenable<monaco.languages.CompletionItem[] | monaco.languages.CompletionList> | monaco.languages.CompletionList {
            const document = IReadOnlyModelToDocument(model);
            const list = provider.provideCompletionItems(document, TypeConverters.toPosition(position), token);
            if (list === undefined || list === null)
                return [];

            if (list instanceof Promise) {
                return list.then((value): monaco.languages.CompletionItem[] | monaco.languages.CompletionList => {
                    if (value === undefined || value === null)
                        return [];

                    if (value instanceof vscode.CompletionList) {
                        return {
                            isIncomplete: value.isIncomplete,
                            items: value.items.map(toCompletionItem),
                        };
                    }

                    return value.map(toCompletionItem);
                });
            }

            if (list instanceof vscode.CompletionList) {
                return {
                    isIncomplete: list.isIncomplete,
                    items: list.items.map(toCompletionItem),
                };
            }

            return list.map(toCompletionItem);
        },
    };
}
