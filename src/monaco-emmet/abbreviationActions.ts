/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import parseStylesheet from "@emmetio/css-parser";
import { expand } from "@emmetio/expand-abbreviation";
import extract from "@emmetio/extract-abbreviation";
import parse, { HtmlNode } from "@emmetio/html-matcher";
import Node from "@emmetio/node";
import * as vscode from "./vscode";

import { DocumentStreamReader } from "./bufferStream";
import { getInnerRange, getNode, getProfile, getSyntax, isStyleSheet } from "./util";

const field = (index: any, placeholder: any) => `\${${index}${placeholder ? ":" + placeholder : ""}}`;

export function expandAbbreviation() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage("No editor is active");
        return;
    }
    const syntax = getSyntax(editor.document);
    const output = expandAbbreviationHelper(syntax, editor.document, editor.selection);
    if (output)
        editor.insertSnippet(new vscode.SnippetString(output.expandedText), output.rangeToReplace!);
}

export interface ExpandAbbreviationHelperOutput {
    expandedText: string;
    rangeToReplace: vscode.Range | null;
    abbreviation: string;
    syntax: string;
}

/**
 * Expands abbreviation at given range in the given document
 * @param syntax
 * @param document
 * @param rangeToReplace
 */
export function expandAbbreviationHelper(syntax: string, document: vscode.TextDocument, rangeToReplace: vscode.Range | null): ExpandAbbreviationHelperOutput | undefined {
    if (rangeToReplace === null)
        return undefined;

    const parseContent = isStyleSheet(syntax) ? parseStylesheet : parse;
    const rootNode: Node<vscode.Position> = parseContent(new DocumentStreamReader(document));
    const currentNode = getNode(rootNode, rangeToReplace.end) as HtmlNode<vscode.Position>;

    if (forceCssSyntax(syntax, currentNode, rangeToReplace.end))
        syntax = "css";
    else if (!isValidLocationForEmmetAbbreviation(currentNode, syntax, rangeToReplace.end))
        return undefined;

    let abbreviation = document.getText(rangeToReplace);
    if (rangeToReplace.isEmpty)
        [rangeToReplace, abbreviation] = extractAbbreviation(document, rangeToReplace.start);

    const options = {
        addons: syntax === "jsx" ? { jsx: true } : undefined,
        field,
        profile: getProfile(syntax),
        syntax,
    };

    const expandedText = expand(abbreviation, options);
    return { expandedText, rangeToReplace, abbreviation, syntax };
}

/**
 * Extracts abbreviation from the given position in the given document
 */
function extractAbbreviation(document: vscode.TextDocument, position: vscode.Position): [vscode.Range | null, string] {
    const currentLine = document.lineAt(position.line).text;
    const result = extract(currentLine, position.character, true);
    if (!result)
        return [null, ""];

    const rangeToReplace = new vscode.Range(position.line, result.location, position.line, result.location + result.abbreviation.length);
    return [rangeToReplace, result.abbreviation];
}

/**
 * Inside <style> tag, force use of css abbreviations
 */
function forceCssSyntax(syntax: string, currentNode: HtmlNode<vscode.Position> | undefined, position: vscode.Position): boolean {
    return !isStyleSheet(syntax)
        && currentNode !== undefined
        && currentNode.close
        && currentNode.name === "style"
        && getInnerRange(currentNode)!.contains(position);
}

/**
 * Checks if given position is a valid location to expand emmet abbreviation
 * @param currentNode parsed node at given position
 * @param syntax syntax of the abbreviation
 * @param position position to validate
 */
function isValidLocationForEmmetAbbreviation(currentNode: HtmlNode<vscode.Position> | undefined, syntax: string, position: vscode.Position): boolean {
    if (!currentNode)
        return true;

    if (isStyleSheet(syntax)) {
        return currentNode.type !== "rule"
            || (currentNode.selectorToken && position.isAfter(currentNode.selectorToken.end));
    }

    if (currentNode.close)
        return getInnerRange(currentNode)!.contains(position);

    return false;
}
