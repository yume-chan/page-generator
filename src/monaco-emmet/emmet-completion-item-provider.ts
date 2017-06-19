/* tslint:disable:no-reference */
/// <reference path="emmet.d.ts" />
/* tslint:enable:no-reference */
/// <reference types="monaco-editor" />

import parseStylesheet from "@emmetio/css-parser";
import { createSnippetsRegistry, expand } from "@emmetio/expand-abbreviation";
import parse, { HtmlNode } from "@emmetio/html-matcher";
import Node from "@emmetio/node";

import { DocumentStreamReader } from "./document-stream-reader";
import { extractAbbreviation, getNode, getProfile, getSyntax, isStyleSheet } from "./util";

const field = (index: number, placeholder: string) => `\${${index}${placeholder ? ":" + placeholder : ""}}`;
const snippetCompletionsCache = new Map<string, monaco.languages.CompletionItem[]>();

export class EmmetCompletionItemProvider implements monaco.languages.CompletionItemProvider {
    public triggerCharacters: ["!", ".", "}"];

    public provideCompletionItems(model: monaco.editor.IReadOnlyModel, position: monaco.Position, token: monaco.CancellationToken): monaco.Thenable<monaco.languages.CompletionList> {
        let completionItems: monaco.languages.CompletionItem[] = [];
        let syntax = getSyntax(model);
        const currentWord = getCurrentWord(model, position);

        const parseContent = isStyleSheet(syntax) ? parseStylesheet : parse;
        const rootNode = parseContent<monaco.Position>(new DocumentStreamReader(model));
        const currentNode = getNode(rootNode, position);

        // Inside <style> tag, trigger css abbreviations
        if (!isStyleSheet(syntax) && currentNode && currentNode.name === "style")
            syntax = "css";

        const expandedAbbr = this.getExpandedAbbreviation(model, position, syntax, currentNode);

        if (!isStyleSheet(syntax)) {
            if (expandedAbbr) {
                // In non stylesheet like syntax, this extension returns expanded abbr plus posssible abbr completions
                // To differentiate between the 2, the former is given CompletionItemKind.Value so that it gets a different icon
                expandedAbbr.kind = monaco.languages.CompletionItemKind.Value;
            }
            const abbreviationSuggestions = this.getAbbreviationSuggestions(syntax, currentWord, (expandedAbbr !== undefined && currentWord === expandedAbbr.label));
            completionItems = expandedAbbr ? [expandedAbbr, ...abbreviationSuggestions] : abbreviationSuggestions;
        } else {
            completionItems = expandedAbbr ? [expandedAbbr] : [];
        }

        return Promise.resolve({ items: completionItems, isIncomplete: true });
    }

    private getExpandedAbbreviation(model: monaco.editor.IReadOnlyModel, position: monaco.Position, syntax: string, currentNode: Node<monaco.Position> | null): monaco.languages.CompletionItem | undefined {
        const [rangeToReplace, wordToExpand] = extractAbbreviation(model, position);
        if (!rangeToReplace || !wordToExpand)
            return;

        if (!isValidLocationForEmmetAbbreviation(currentNode, syntax, position))
            return;

        const expandedWord = expand(wordToExpand, {
            addons: syntax === "jsx" ? { jsx: true } : undefined,
            field,
            profile: getProfile(syntax),
            syntax,
        });

        const completionitem: monaco.languages.CompletionItem = {
            detail: "Expand Emmet Abbreviation",
            documentation: removeTabStops(expandedWord),
            insertText: { value: expandedWord },
            kind: monaco.languages.CompletionItemKind.Snippet,
            label: wordToExpand,
            range: rangeToReplace,
        };

        return completionitem;
    }

    private getAbbreviationSuggestions(syntax: string, prefix: string, skipExactMatch: boolean) {
        if (!snippetCompletionsCache.has(syntax)) {
            const registry = createSnippetsRegistry(syntax);
            const completions: monaco.languages.CompletionItem[] = registry.all({ type: "string" }).map((snippet) => {
                const expandedWord = expand(snippet.value as string, {
                    field,
                    syntax,
                });

                const item: monaco.languages.CompletionItem = {
                    detail: "Complete Emmet Abbreviation",
                    documentation: removeTabStops(expandedWord),
                    insertText: snippet.key,
                    kind: monaco.languages.CompletionItemKind.Text,
                    label: snippet.key,
                };
                return item;
            });
            snippetCompletionsCache.set(syntax, completions);
        }

        let snippetCompletions = snippetCompletionsCache.get(syntax);
        snippetCompletions = snippetCompletions!.filter((x) => x.label.startsWith(prefix) && (!skipExactMatch || x.label !== prefix));
        return snippetCompletions;
    }
}

function getCurrentWord(model: monaco.editor.IReadOnlyModel, position: monaco.Position): string {
    const wordAtPosition = model.getWordAtPosition(position);
    let currentWord = "";
    if (wordAtPosition && wordAtPosition.startColumn < position.column) {
        const word = model.getValueInRange(new monaco.Range(position.lineNumber, wordAtPosition.startColumn, position.lineNumber, wordAtPosition.endColumn));
        currentWord = word.substr(0, position.column - wordAtPosition.startColumn);
    }

    return currentWord;
}

function removeTabStops(expandedWord: string): string {
    return expandedWord.replace(/\$\{\d+\}/g, "").replace(/\$\{\d+:([^\}]+)\}/g, "$1");
}

function isValidLocationForEmmetAbbreviation(currentNode: Node<monaco.Position> | null, syntax: string, position: monaco.Position): boolean {
    if (!currentNode)
        return true;

    if (isStyleSheet(syntax))
        return (currentNode as any).type !== "rule";

    return !position.isBeforeOrEqual((currentNode as HtmlNode<monaco.Position>).open.end);
}
