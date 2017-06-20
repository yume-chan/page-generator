/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* tslint:disable:eslint-curly */

import { createSnippetsRegistry, expand } from "@emmetio/expand-abbreviation";
import { expandAbbreviationHelper, ExpandAbbreviationHelperOutput } from "./abbreviationActions";
import { getSyntax, isStyleSheet } from "./util";
import * as vscode from "./vscode";

const field = (index: any, placeholder: any) => `\${${index}${placeholder ? ":" + placeholder : ""}}`;
const snippetCompletionsCache = new Map<string, vscode.CompletionItem[]>();

export class EmmetCompletionItemProvider implements vscode.CompletionItemProvider {

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Thenable<vscode.CompletionList | null> {

        if (!vscode.workspace.getConfiguration("emmet").useNewEmmet) {
            return Promise.resolve(null);
        }

        let syntax = getSyntax(document);
        let expandedAbbr: vscode.CompletionItem | undefined;
        if (vscode.workspace.getConfiguration("emmet").showExpandedAbbreviation) {
            const output = expandAbbreviationHelper(syntax, document, new vscode.Range(position, position));
            if (output) {
                expandedAbbr = new vscode.CompletionItem(output.abbreviation);
                expandedAbbr.insertText = new vscode.SnippetString(output.expandedText);
                expandedAbbr.documentation = removeTabStops(output.expandedText);
                expandedAbbr.range = output.rangeToReplace!;
                expandedAbbr.detail = "Expand Emmet Abbreviation";
                syntax = output.syntax;
            }
        }

        let completionItems: vscode.CompletionItem[] = expandedAbbr ? [expandedAbbr] : [];
        if (!isStyleSheet(syntax)) {
            if (expandedAbbr) {
                // In non stylesheet like syntax, this extension returns expanded abbr plus posssible abbr completions
                // To differentiate between the 2, the former is given CompletionItemKind.Value so that it gets a different icon
                expandedAbbr.kind = vscode.CompletionItemKind.Value;
            }
            const currentWord = getCurrentWord(document, position);

            const abbreviationSuggestions = this.getAbbreviationSuggestions(syntax, currentWord, (expandedAbbr !== undefined && currentWord === expandedAbbr.label));
            completionItems = completionItems.concat(abbreviationSuggestions);
        }

        return Promise.resolve(new vscode.CompletionList(completionItems, true));
    }

    public getAbbreviationSuggestions(syntax: string, prefix: string, skipExactMatch: boolean) {
        if (!vscode.workspace.getConfiguration("emmet").showAbbreviationSuggestions || !prefix) {
            return [];
        }

        if (!snippetCompletionsCache.has(syntax)) {
            const registry = createSnippetsRegistry(syntax);
            const completions: vscode.CompletionItem[] = registry.all({ type: "string" }).map((snippet) => {
                const expandedWord = expand(snippet.value as string, {
                    field,
                    syntax,
                });

                const item = new vscode.CompletionItem(snippet.key);
                item.documentation = removeTabStops(expandedWord);
                item.detail = "Complete Emmet Abbreviation";
                item.insertText = snippet.key;
                return item;
            });
            snippetCompletionsCache.set(syntax, completions);
        }

        let snippetCompletions = snippetCompletionsCache.get(syntax)!;

        snippetCompletions = snippetCompletions.filter((x) => x.label.startsWith(prefix) && (!skipExactMatch || x.label !== prefix));

        return snippetCompletions;

    }

}

function getCurrentWord(document: vscode.TextDocument, position: vscode.Position): string {
    const wordAtPosition = document.getWordRangeAtPosition(position);
    let currentWord = "";
    if (wordAtPosition && wordAtPosition.start.character < position.character) {
        const word = document.getText(wordAtPosition);
        currentWord = word.substr(0, position.character - wordAtPosition.start.character);
    }

    return currentWord;
}

function removeTabStops(expandedWord: string): string {
    return expandedWord.replace(/\$\{\d+\}/g, "").replace(/\$\{\d+:([^\}]+)\}/g, "$1");
}
