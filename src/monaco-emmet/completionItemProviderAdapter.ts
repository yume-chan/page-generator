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

function toCompletionResult(value: vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList>): monaco.languages.CompletionItem[] | monaco.Thenable<monaco.languages.CompletionItem[]> | monaco.languages.CompletionList | monaco.Thenable<monaco.languages.CompletionList> {
    if (typeof value === "undefined" || value === null)
        return [];

    if (value instanceof Promise) {
        return value.then((result): monaco.languages.CompletionItem[] | monaco.languages.CompletionList => {
            if (typeof result === "undefined" || result === null)
                return [];

            if (result instanceof vscode.CompletionList) {
                return {
                    isIncomplete: result.isIncomplete,
                    items: result.items.map(toCompletionItem),
                };
            }

            return result.map(toCompletionItem);
        }) as Promise<monaco.languages.CompletionItem[]> | Promise<monaco.languages.CompletionList>;
    }

    if (value instanceof vscode.CompletionList) {
        return {
            isIncomplete: value.isIncomplete,
            items: value.items.map(toCompletionItem),
        };
    }

    return value.map(toCompletionItem);
}

export function VscodeCompletionItemProviderToMonacoCompletionItemProvider(provider: vscode.CompletionItemProvider, triggerCharacters: string[]): monaco.languages.CompletionItemProvider {
    return {
        triggerCharacters,
        provideCompletionItems(model: monaco.editor.IReadOnlyModel, position: monaco.Position, token: monaco.CancellationToken) {
            const document = IReadOnlyModelToDocument(model);
            const list = provider.provideCompletionItems(document, TypeConverters.toPosition(position), token);
            return toCompletionResult(list);
        },
    };
}
