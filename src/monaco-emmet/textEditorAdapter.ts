/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from "./vscode";
import { EndOfLine, illegalArgument, IPosition, IRange, ISelection, ok, Position, Range, readonly, Selection, SnippetString, TextEditor, Thenable } from "./vscode";

import * as TypeConverters from "./extHostTypeConverters";
import { ExtHostDocumentData, IReadOnlyModelToDocumentData } from "./textDocumentAdapter";

/* tslint:disable */

export interface ITextEditOperation {
    range: vscode.Range;
    text: string | null;
    forceMoveMarkers: boolean;
}

export interface IEditData {
    documentVersionId: number;
    edits: ITextEditOperation[];
    setEndOfLine: EndOfLine;
    undoStopBefore: boolean;
    undoStopAfter: boolean;
}

export class TextEditorEdit {

    private readonly _document: vscode.TextDocument;
    private readonly _documentVersionId: number;
    private _collectedEdits: ITextEditOperation[];
    private _setEndOfLine: EndOfLine;
    private readonly _undoStopBefore: boolean;
    private readonly _undoStopAfter: boolean;

    constructor(document: vscode.TextDocument, options: { undoStopBefore: boolean; undoStopAfter: boolean; }) {
        this._document = document;
        this._documentVersionId = document.version;
        this._collectedEdits = [];
        this._setEndOfLine = 0;
        this._undoStopBefore = options.undoStopBefore;
        this._undoStopAfter = options.undoStopAfter;
    }

    finalize(): IEditData {
        return {
            documentVersionId: this._documentVersionId,
            edits: this._collectedEdits,
            setEndOfLine: this._setEndOfLine,
            undoStopBefore: this._undoStopBefore,
            undoStopAfter: this._undoStopAfter
        };
    }

    replace(location: Position | Range | Selection, value: string): void {
        let range: Range | null = null;

        if (location instanceof Position) {
            range = new Range(location, location);
        } else if (location instanceof Range) {
            range = location;
        } else {
            throw new Error('Unrecognized location');
        }

        this._pushEdit(range!, value, false);
    }

    insert(location: Position, value: string): void {
        this._pushEdit(new Range(location, location), value, true);
    }

    delete(location: Range | Selection): void {
        let range: Range | null = null;

        if (location instanceof Range) {
            range = location;
        } else {
            throw new Error('Unrecognized location');
        }

        this._pushEdit(range, null, true);
    }

    private _pushEdit(range: Range, text: string | null, forceMoveMarkers: boolean): void {
        let validRange = this._document.validateRange(range);
        this._collectedEdits.push({
            range: validRange,
            text: text,
            forceMoveMarkers: forceMoveMarkers
        });
    }

    setEndOfLine(endOfLine: EndOfLine): void {
        if (endOfLine !== EndOfLine.LF && endOfLine !== EndOfLine.CRLF) {
            throw illegalArgument('endOfLine');
        }

        this._setEndOfLine = endOfLine;
    }
}


function deprecated(name: string, message: string = 'Refer to the documentation for further details.') {
    return (target: Object, key: string, descriptor: TypedPropertyDescriptor<any>) => {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            console.warn(`[Deprecation Warning] method '${name}' is deprecated and should no longer be used. ${message}`);
            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}

/**
 * The style in which the editor's cursor should be rendered.
 */
export enum TextEditorCursorStyle {
	/**
	 * As a vertical line (sitting between two characters).
	 */
    Line = 1,
	/**
	 * As a block (sitting on top of a character).
	 */
    Block = 2,
	/**
	 * As a horizontal line (sitting under a character).
	 */
    Underline = 3,
	/**
	 * As a thin vertical line (sitting between two characters).
	 */
    LineThin = 4,
	/**
	 * As an outlined block (sitting on top of a character).
	 */
    BlockOutline = 5,
	/**
	 * As a thin horizontal line (sitting under a character).
	 */
    UnderlineThin = 6
}

export enum TextEditorLineNumbersStyle {
    Off = 0,
    On = 1,
    Relative = 2
}

export interface IResolvedTextEditorConfiguration {
    tabSize: number;
    insertSpaces: boolean;
    cursorStyle: TextEditorCursorStyle;
    lineNumbers: TextEditorLineNumbersStyle;
}

export interface ITextEditorConfigurationUpdate {
    tabSize?: number | 'auto';
    insertSpaces?: boolean | 'auto';
    cursorStyle?: TextEditorCursorStyle;
    lineNumbers?: TextEditorLineNumbersStyle;
}

export class ExtHostTextEditorOptions implements vscode.TextEditorOptions {

    private _id: string;

    private _proxy: monaco.editor.IStandaloneCodeEditor;
    private _tabSize: number;
    private _insertSpaces: boolean;
    private _cursorStyle: TextEditorCursorStyle;
    private _lineNumbers: TextEditorLineNumbersStyle;

    constructor(proxy: monaco.editor.IStandaloneCodeEditor, id: string, source: IResolvedTextEditorConfiguration) {
        this._proxy = proxy;
        this._id = id;
        this._accept(source);
    }

    public _accept(source: IResolvedTextEditorConfiguration): void {
        this._tabSize = source.tabSize;
        this._insertSpaces = source.insertSpaces;
        this._cursorStyle = source.cursorStyle;
        this._lineNumbers = source.lineNumbers;
    }

    public get tabSize(): number {
        return this._tabSize;
    }

    private _validateTabSize(value: number | string): number | 'auto' | null {
        if (value === 'auto') {
            return 'auto';
        }
        if (typeof value === 'number') {
            let r = Math.floor(value);
            return (r > 0 ? r : null);
        }
        if (typeof value === 'string') {
            let r = parseInt(value, 10);
            if (isNaN(r)) {
                return null;
            }
            return (r > 0 ? r : null);
        }
        return null;
    }

    public set tabSize(value: number) {
        let tabSize = this._validateTabSize(value);
        if (tabSize === null) {
            // ignore invalid call
            return;
        }
        if (typeof tabSize === 'number') {
            if (this._tabSize === tabSize) {
                // nothing to do
                return;
            }
            // reflect the new tabSize value immediately
            this._tabSize = tabSize;

            this._proxy.getModel().updateOptions({
                tabSize
            });
        }
    }

    public get insertSpaces(): boolean | string {
        return this._insertSpaces;
    }

    private _validateInsertSpaces(value: boolean | string): boolean | 'auto' {
        if (value === 'auto') {
            return 'auto';
        }
        return (value === 'false' ? false : Boolean(value));
    }

    public set insertSpaces(value: boolean | string) {
        let insertSpaces = this._validateInsertSpaces(value);
        if (typeof insertSpaces === 'boolean') {
            if (this._insertSpaces === insertSpaces) {
                // nothing to do
                return;
            }
            // reflect the new insertSpaces value immediately
            this._insertSpaces = insertSpaces;

            this._proxy.getModel().updateOptions({
                insertSpaces
            });
        }
    }

    public get cursorStyle(): TextEditorCursorStyle {
        return this._cursorStyle;
    }

    public set cursorStyle(value: TextEditorCursorStyle) {
        if (this._cursorStyle === value) {
            // nothing to do
            return;
        }
        this._cursorStyle = value;

        if (value == TextEditorCursorStyle.Block) {
            this._proxy.updateOptions({
                cursorStyle: "block"
            });
        } else if (value == TextEditorCursorStyle.Line) {
            this._proxy.updateOptions({
                cursorStyle: "line",
            });
        } else {
            throw new Error();
        }
    }

    public get lineNumbers(): TextEditorLineNumbersStyle {
        return this._lineNumbers;
    }

    public set lineNumbers(value: TextEditorLineNumbersStyle) {
        if (this._lineNumbers === value) {
            // nothing to do
            return;
        }
        this._lineNumbers = value;
        switch (value) {
            case TextEditorLineNumbersStyle.Off:
                this._proxy.updateOptions({
                    lineNumbers: "off"
                });
                break;
            case TextEditorLineNumbersStyle.On:
                this._proxy.updateOptions({
                    lineNumbers: "on"
                });
                break;
            case TextEditorLineNumbersStyle.Relative:
                this._proxy.updateOptions({
                    lineNumbers: "relative"
                });
                break;
            default:
                throw new Error();
        }
    }

    public assign(newOptions: vscode.TextEditorOptions) {
        if (typeof newOptions.tabSize !== 'undefined') {
            let tabSize = this._validateTabSize(newOptions.tabSize);
            if (tabSize === 'auto') {
                throw new Error();
            } else if (typeof tabSize === 'number' && this._tabSize !== tabSize) {
                // reflect the new tabSize value immediately
                this.tabSize = tabSize;
            }
        }

        if (typeof newOptions.insertSpaces !== 'undefined') {
            let insertSpaces = this._validateInsertSpaces(newOptions.insertSpaces);
            if (insertSpaces === 'auto') {
                throw new Error();
            } else if (this._insertSpaces !== insertSpaces) {
                // reflect the new insertSpaces value immediately
                this.insertSpaces = insertSpaces;
            }
        }

        if (typeof newOptions.cursorStyle !== 'undefined') {
            if (this._cursorStyle !== newOptions.cursorStyle) {
                this.cursorStyle = newOptions.cursorStyle;
            }
        }

        if (typeof newOptions.lineNumbers !== 'undefined') {
            if (this._lineNumbers !== newOptions.lineNumbers) {
                this.lineNumbers = newOptions.lineNumbers;
            }
        }
    }
}

export class ExtHostTextEditor implements vscode.TextEditor {
    setDecorations(decorationType: vscode.TextEditorDecorationType, rangesOrOptions: vscode.Range[] | vscode.DecorationOptions[]): void {
        throw new Error("Method not implemented.");
    }
    show(column?: vscode.ViewColumn | undefined): void {
        throw new Error("Method not implemented.");
    }
    hide(): void {
        throw new Error("Method not implemented.");
    }

    private readonly _id: string;
    private readonly _documentData: ExtHostDocumentData;

    private _proxy: monaco.editor.IStandaloneCodeEditor;
    private _selections: Selection[];
    private _options: ExtHostTextEditorOptions;
    private _viewColumn: vscode.ViewColumn | undefined;
    private _disposed: boolean = false;

    get id(): string { return this._id; }

    constructor(proxy: monaco.editor.IStandaloneCodeEditor, id: string, document: ExtHostDocumentData, selections: Selection[], options: IResolvedTextEditorConfiguration, viewColumn: vscode.ViewColumn | undefined) {
        this._proxy = proxy;
        this._id = id;
        this._documentData = document;
        this._selections = selections;
        this._options = new ExtHostTextEditorOptions(this._proxy, this._id, options);
        this._viewColumn = viewColumn;
    }

    dispose() {
        ok(!this._disposed);
        this._disposed = true;
    }

    // ---- the document

    get document(): vscode.TextDocument {
        return this._documentData.document;
    }

    set document(value) {
        throw readonly('document');
    }

    // ---- options

    get options(): vscode.TextEditorOptions {
        return this._options;
    }

    set options(value: vscode.TextEditorOptions) {
        if (!this._disposed) {
            this._options.assign(value);
        }
    }

    _acceptOptions(options: IResolvedTextEditorConfiguration): void {
        ok(!this._disposed);
        this._options._accept(options);
    }

    // ---- view column

    get viewColumn(): vscode.ViewColumn | undefined {
        return this._viewColumn;
    }

    set viewColumn(value) {
        throw readonly('viewColumn');
    }

    _acceptViewColumn(value: vscode.ViewColumn) {
        ok(!this._disposed);
        this._viewColumn = value;
    }

    // ---- selections

    get selection(): Selection {
        return this._selections && this._selections[0];
    }

    set selection(value: Selection) {
        if (!(value instanceof Selection)) {
            throw illegalArgument('selection');
        }
        this._selections = [value];
        this._trySetSelection(true);
    }

    get selections(): Selection[] {
        return this._selections;
    }

    set selections(value: Selection[]) {
        if (!Array.isArray(value) || value.some(a => !(a instanceof Selection))) {
            throw illegalArgument('selections');
        }
        this._selections = value;
        this._trySetSelection(true);
    }

    revealRange(range: Range, revealType: vscode.TextEditorRevealType): void {
        const monacoRange = {
            startLineNumber: range.start.line,
            startColumn: range.start.character,
            endLineNumber: range.end.line,
            endColumn: range.end.character,
        };

        switch (revealType) {
            case vscode.TextEditorRevealType.Default:
                this._proxy.revealRange(monacoRange);
                break;
            case vscode.TextEditorRevealType.AtTop:
                this._proxy.revealRangeAtTop(monacoRange);
                break;
            case vscode.TextEditorRevealType.InCenter:
                this._proxy.revealRangeInCenter(monacoRange);
                break;
            case vscode.TextEditorRevealType.InCenterIfOutsideViewport:
                this._proxy.revealRangeInCenterIfOutsideViewport(monacoRange);
                break;
        }
    }

    private _trySetSelection(silent: boolean) {
        this._proxy.setSelections(this._selections.map(TypeConverters.fromSelection));
    }

    _acceptSelections(selections: Selection[]): void {
        ok(!this._disposed);
        this._selections = selections;
    }

    // ---- editing

    edit(callback: (edit: TextEditorEdit) => void, options: { undoStopBefore: boolean; undoStopAfter: boolean; } = { undoStopBefore: true, undoStopAfter: true }): Thenable<boolean> {
        if (this._disposed) {
            return Promise.reject<boolean>('TextEditor#edit not possible on closed editors');
        }
        let edit = new TextEditorEdit(this._documentData.document, options);
        callback(edit);
        return Promise.resolve<boolean>(this._applyEdit(edit));
    }

    private _applyEdit(editBuilder: TextEditorEdit) {
        let editData = editBuilder.finalize();

        // check that the edits are not overlapping (i.e. illegal)
        let editRanges = editData.edits.map(edit => edit.range);

        // sort ascending (by end and then by start)
        editRanges.sort((a, b) => {
            if (a.end.line === b.end.line) {
                if (a.end.character === b.end.character) {
                    if (a.start.line === b.start.line) {
                        return a.start.character - b.start.character;
                    }
                    return a.start.line - b.start.line;
                }
                return a.end.character - b.end.character;
            }
            return a.end.line - b.end.line;
        });

        // check that no edits are overlapping
        for (let i = 0, count = editRanges.length - 1; i < count; i++) {
            const rangeEnd = editRanges[i].end;
            const nextRangeStart = editRanges[i + 1].start;

            if (nextRangeStart.isBefore(rangeEnd)) {
                // overlapping ranges
                return Promise.reject<boolean>(
                    new Error('Overlapping ranges are not allowed!')
                );
            }
        }

        // prepare data for serialization
        let edits: monaco.editor.IIdentifiedSingleEditOperation[] = editData.edits.map((edit, index) => {
            const range = TypeConverters.fromRange(edit.range);
            return {
                identifier: {
                    major: index,
                    minor: 0,
                },
                range: new monaco.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn),
                text: edit.text!,
                forceMoveMarkers: edit.forceMoveMarkers
            };
        });

        return this._proxy.executeEdits(this._proxy.getValue(), edits);
    }

    insertSnippet(snippet: SnippetString, where?: Position | Position[] | Range | Range[], options: { undoStopBefore: boolean; undoStopAfter: boolean; } = { undoStopBefore: true, undoStopAfter: true }): Thenable<boolean> {
        if (this._disposed) {
            return Promise.reject<boolean>('TextEditor#insertSnippet not possible on closed editors');
        }
        let ranges: IRange[];

        if (!where || (Array.isArray(where) && where.length === 0)) {
            ranges = this._selections.map(TypeConverters.fromRange);

        } else if (where instanceof Position) {
            const { lineNumber, column } = TypeConverters.fromPosition(where);
            ranges = [{ startLineNumber: lineNumber, startColumn: column, endLineNumber: lineNumber, endColumn: column }];

        } else if (where instanceof Range) {
            ranges = [TypeConverters.fromRange(where)];
        } else {
            ranges = [];
            for (const posOrRange of where) {
                if (posOrRange instanceof Range) {
                    ranges.push(TypeConverters.fromRange(posOrRange));
                } else {
                    const { lineNumber, column } = TypeConverters.fromPosition(posOrRange);
                    ranges.push({ startLineNumber: lineNumber, startColumn: column, endLineNumber: lineNumber, endColumn: column });
                }
            }
        }

        const snippetController = this._proxy.getContribution("snippetController2") as any;
        // insertSnippet(template: string, overwriteBefore: number, overwriteAfter: number): void
        const selection = this._proxy.getSelection();
        snippetController.insert(snippet.value, selection.startColumn - ranges[0].startColumn, ranges[0].endColumn - selection.endColumn);
        return Promise.resolve(true);
    }
}

export function IStandaloneCodeEditorToTextEditor(editor: monaco.editor.IStandaloneCodeEditor): TextEditor {
    const options: IResolvedTextEditorConfiguration = {
        cursorStyle: TextEditorCursorStyle.Line,
        insertSpaces: true,
        lineNumbers: TextEditorLineNumbersStyle.On,
        tabSize: 4,
    }
    return new ExtHostTextEditor(editor, editor.getId(), IReadOnlyModelToDocumentData(editor.getModel()), editor.getSelections().map(TypeConverters.toSelection), options, undefined);
}
