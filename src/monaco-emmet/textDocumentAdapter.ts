/* tslint:disable */

import * as vscode from "./vscode";
import { toUint32 } from "./uint";
import { EndOfLine, Position, Range, ok } from "./vscode";

const _modeId2WordDefinition = new Map<string, RegExp>();
export function setWordDefinitionFor(modeId: string, wordDefinition: RegExp): void {
    _modeId2WordDefinition.set(modeId, wordDefinition);
}
export function getWordDefinitionFor(modeId: string): RegExp | undefined {
    return _modeId2WordDefinition.get(modeId);
}

export class PrefixSumIndexOfResult {
    _prefixSumIndexOfResultBrand: void;

    index: number;
    remainder: number;

    constructor(index: number, remainder: number) {
        this.index = index;
        this.remainder = remainder;
    }
}

export class PrefixSumComputer {

	/**
	 * values[i] is the value at index i
	 */
    private values: Uint32Array;

	/**
	 * prefixSum[i] = SUM(heights[j]), 0 <= j <= i
	 */
    private prefixSum: Uint32Array;

	/**
	 * prefixSum[i], 0 <= i <= prefixSumValidIndex can be trusted
	 */
    private prefixSumValidIndex: Int32Array;

    constructor(values: Uint32Array) {
        this.values = values;
        this.prefixSum = new Uint32Array(values.length);
        this.prefixSumValidIndex = new Int32Array(1);
        this.prefixSumValidIndex[0] = -1;
    }

    public getCount(): number {
        return this.values.length;
    }

    public insertValues(insertIndex: number, insertValues: Uint32Array): boolean {
        insertIndex = toUint32(insertIndex);
        const oldValues = this.values;
        const oldPrefixSum = this.prefixSum;
        const insertValuesLen = insertValues.length;

        if (insertValuesLen === 0) {
            return false;
        }

        this.values = new Uint32Array(oldValues.length + insertValuesLen);
        this.values.set(oldValues.subarray(0, insertIndex), 0);
        this.values.set(oldValues.subarray(insertIndex), insertIndex + insertValuesLen);
        this.values.set(insertValues, insertIndex);

        if (insertIndex - 1 < this.prefixSumValidIndex[0]) {
            this.prefixSumValidIndex[0] = insertIndex - 1;
        }

        this.prefixSum = new Uint32Array(this.values.length);
        if (this.prefixSumValidIndex[0] >= 0) {
            this.prefixSum.set(oldPrefixSum.subarray(0, this.prefixSumValidIndex[0] + 1));
        }
        return true;
    }

    public changeValue(index: number, value: number): boolean {
        index = toUint32(index);
        value = toUint32(value);

        if (this.values[index] === value) {
            return false;
        }
        this.values[index] = value;
        if (index - 1 < this.prefixSumValidIndex[0]) {
            this.prefixSumValidIndex[0] = index - 1;
        }
        return true;
    }

    public removeValues(startIndex: number, cnt: number): boolean {
        startIndex = toUint32(startIndex);
        cnt = toUint32(cnt);

        const oldValues = this.values;
        const oldPrefixSum = this.prefixSum;

        if (startIndex >= oldValues.length) {
            return false;
        }

        let maxCnt = oldValues.length - startIndex;
        if (cnt >= maxCnt) {
            cnt = maxCnt;
        }

        if (cnt === 0) {
            return false;
        }

        this.values = new Uint32Array(oldValues.length - cnt);
        this.values.set(oldValues.subarray(0, startIndex), 0);
        this.values.set(oldValues.subarray(startIndex + cnt), startIndex);

        this.prefixSum = new Uint32Array(this.values.length);
        if (startIndex - 1 < this.prefixSumValidIndex[0]) {
            this.prefixSumValidIndex[0] = startIndex - 1;
        }
        if (this.prefixSumValidIndex[0] >= 0) {
            this.prefixSum.set(oldPrefixSum.subarray(0, this.prefixSumValidIndex[0] + 1));
        }
        return true;
    }

    public getTotalValue(): number {
        if (this.values.length === 0) {
            return 0;
        }
        return this._getAccumulatedValue(this.values.length - 1);
    }

    public getAccumulatedValue(index: number): number {
        if (index < 0) {
            return 0;
        }

        index = toUint32(index);
        return this._getAccumulatedValue(index);
    }

    private _getAccumulatedValue(index: number): number {
        if (index <= this.prefixSumValidIndex[0]) {
            return this.prefixSum[index];
        }

        let startIndex = this.prefixSumValidIndex[0] + 1;
        if (startIndex === 0) {
            this.prefixSum[0] = this.values[0];
            startIndex++;
        }

        if (index >= this.values.length) {
            index = this.values.length - 1;
        }

        for (let i = startIndex; i <= index; i++) {
            this.prefixSum[i] = this.prefixSum[i - 1] + this.values[i];
        }
        this.prefixSumValidIndex[0] = Math.max(this.prefixSumValidIndex[0], index);
        return this.prefixSum[index];
    }

    public getIndexOf(accumulatedValue: number): PrefixSumIndexOfResult {
        accumulatedValue = Math.floor(accumulatedValue); //@perf

        // Compute all sums (to get a fully valid prefixSum)
        this.getTotalValue();

        let low = 0;
        let high = this.values.length - 1;
        let mid: number;
        let midStop: number;
        let midStart: number;

        while (low <= high) {
            mid = low + ((high - low) / 2) | 0;

            midStop = this.prefixSum[mid];
            midStart = midStop - this.values[mid];

            if (accumulatedValue < midStart) {
                high = mid - 1;
            } else if (accumulatedValue >= midStop) {
                low = mid + 1;
            } else {
                break;
            }
        }

        return new PrefixSumIndexOfResult(mid!, accumulatedValue - midStart!);
    }
}

export interface IModelContentChange {
	/**
	 * The range that got replaced.
	 */
    readonly range: monaco.IRange;
	/**
	 * The length of the range that got replaced.
	 */
    readonly rangeLength: number;
	/**
	 * The new text for the range.
	 */
    readonly text: string;
}

export interface IModelChangedEvent {
	/**
	 * The actual changes.
	 */
    readonly changes: IModelContentChange[];
	/**
	 * The (new) end-of-line character.
	 */
    readonly eol: string;
	/**
	 * The new version id the model has transitioned to.
	 */
    readonly versionId: number;
}

export class MirrorModel {

    protected _uri: monaco.Uri;
    protected _lines: string[];
    protected _eol: string;
    protected _versionId: number;
    protected _lineStarts: PrefixSumComputer | null;

    constructor(uri: monaco.Uri, lines: string[], eol: string, versionId: number) {
        this._uri = uri;
        this._lines = lines;
        this._eol = eol;
        this._versionId = versionId;
    }

    dispose(): void {
        this._lines.length = 0;
    }

    get version(): number {
        return this._versionId;
    }

    getText(): string {
        return this._lines.join(this._eol);
    }

    onEvents(e: IModelChangedEvent): void {
        if (e.eol && e.eol !== this._eol) {
            this._eol = e.eol;
            this._lineStarts = null;
        }

        // Update my lines
        const changes = e.changes;
        for (let i = 0, len = changes.length; i < len; i++) {
            const change = changes[i];
            this._acceptDeleteRange(change.range);
            this._acceptInsertText({
                lineNumber: change.range.startLineNumber,
                column: change.range.startColumn
            }, change.text);
        }

        this._versionId = e.versionId;
    }

    protected _ensureLineStarts(): void {
        if (!this._lineStarts) {
            const eolLength = this._eol.length;
            const linesLength = this._lines.length;
            const lineStartValues = new Uint32Array(linesLength);
            for (let i = 0; i < linesLength; i++) {
                lineStartValues[i] = this._lines[i].length + eolLength;
            }
            this._lineStarts = new PrefixSumComputer(lineStartValues);
        }
    }

	/**
	 * All changes to a line's text go through this method
	 */
    private _setLineText(lineIndex: number, newValue: string): void {
        this._lines[lineIndex] = newValue;
        if (this._lineStarts) {
            // update prefix sum
            this._lineStarts.changeValue(lineIndex, this._lines[lineIndex].length + this._eol.length);
        }
    }

    private _acceptDeleteRange(range: monaco.IRange): void {

        if (range.startLineNumber === range.endLineNumber) {
            if (range.startColumn === range.endColumn) {
                // Nothing to delete
                return;
            }
            // Delete text on the affected line
            this._setLineText(range.startLineNumber - 1,
                this._lines[range.startLineNumber - 1].substring(0, range.startColumn - 1)
                + this._lines[range.startLineNumber - 1].substring(range.endColumn - 1)
            );
            return;
        }

        // Take remaining text on last line and append it to remaining text on first line
        this._setLineText(range.startLineNumber - 1,
            this._lines[range.startLineNumber - 1].substring(0, range.startColumn - 1)
            + this._lines[range.endLineNumber - 1].substring(range.endColumn - 1)
        );

        // Delete middle lines
        this._lines.splice(range.startLineNumber, range.endLineNumber - range.startLineNumber);
        if (this._lineStarts) {
            // update prefix sum
            this._lineStarts.removeValues(range.startLineNumber, range.endLineNumber - range.startLineNumber);
        }
    }

    private _acceptInsertText(position: monaco.IPosition, insertText: string): void {
        if (insertText.length === 0) {
            // Nothing to insert
            return;
        }
        let insertLines = insertText.split(/\r\n|\r|\n/);
        if (insertLines.length === 1) {
            // Inserting text on one line
            this._setLineText(position.lineNumber - 1,
                this._lines[position.lineNumber - 1].substring(0, position.column - 1)
                + insertLines[0]
                + this._lines[position.lineNumber - 1].substring(position.column - 1)
            );
            return;
        }

        // Append overflowing text from first line to the end of text to insert
        insertLines[insertLines.length - 1] += this._lines[position.lineNumber - 1].substring(position.column - 1);

        // Delete overflowing text from first line and insert text on first line
        this._setLineText(position.lineNumber - 1,
            this._lines[position.lineNumber - 1].substring(0, position.column - 1)
            + insertLines[0]
        );

        // Insert new lines & store lengths
        let newLengths = new Uint32Array(insertLines.length - 1);
        for (let i = 1; i < insertLines.length; i++) {
            this._lines.splice(position.lineNumber + i - 1, 0, insertLines[i]);
            newLengths[i - 1] = insertLines[i].length + this._eol.length;
        }

        if (this._lineStarts) {
            // update prefix sum
            this._lineStarts.insertValues(position.lineNumber, newLengths);
        }
    }
}

export class ExtHostDocumentData extends MirrorModel {

    private _languageId: string;
    private _isDirty: boolean;
    private _document: vscode.TextDocument;
    private _textLines: vscode.TextLine[] = [];
    private _isDisposed: boolean = false;

    constructor(uri: monaco.Uri, lines: string[], eol: string,
        languageId: string, versionId: number, isDirty: boolean
    ) {
        super(uri, lines, eol, versionId);
        this._languageId = languageId;
        this._isDirty = isDirty;
    }

    dispose(): void {
        // we don't really dispose documents but let
        // extensions still read from them. some
        // operations, live saving, will now error tho
        ok(!this._isDisposed);
        this._isDisposed = true;
        this._isDirty = false;
    }

    get document(): vscode.TextDocument {
        if (!this._document) {
            const data = this;
            this._document = {
                get uri() { return data._uri; },
                get fileName() { return data._uri.fsPath; },
                get isUntitled() { return data._uri.scheme !== 'file'; },
                get languageId() { return data._languageId; },
                get version() { return data._versionId; },
                get isClosed() { return data._isDisposed; },
                get isDirty() { return data._isDirty; },
                save(): any { throw new Error(); },
                getText(range?) { return range ? data._getTextInRange(range) : data.getText(); },
                get eol() { return data._eol === '\n' ? EndOfLine.LF : EndOfLine.CRLF; },
                get lineCount() { return data._lines.length; },
                lineAt(lineOrPos: number | vscode.Position) { return data._lineAt(lineOrPos); },
                offsetAt(pos) { return data._offsetAt(pos); },
                positionAt(offset) { return data._positionAt(offset); },
                validateRange(ran) { return data._validateRange(ran); },
                validatePosition(pos) { return data._validatePosition(pos); },
                getWordRangeAtPosition(pos, regexp?) { return data._getWordRangeAtPosition(pos, regexp); }
            };
        }
        return Object.freeze(this._document);
    }

    _acceptLanguageId(newLanguageId: string): void {
        ok(!this._isDisposed);
        this._languageId = newLanguageId;
    }

    _acceptIsDirty(isDirty: boolean): void {
        ok(!this._isDisposed);
        this._isDirty = isDirty;
    }

    private _getTextInRange(_range: vscode.Range): string {
        let range = this._validateRange(_range);

        if (range.isEmpty) {
            return '';
        }

        if (range.isSingleLine) {
            return this._lines[range.start.line].substring(range.start.character, range.end.character);
        }

        let lineEnding = this._eol,
            startLineIndex = range.start.line,
            endLineIndex = range.end.line,
            resultLines: string[] = [];

        resultLines.push(this._lines[startLineIndex].substring(range.start.character));
        for (let i = startLineIndex + 1; i < endLineIndex; i++) {
            resultLines.push(this._lines[i]);
        }
        resultLines.push(this._lines[endLineIndex].substring(0, range.end.character));

        return resultLines.join(lineEnding);
    }

    private _lineAt(lineOrPosition: number | vscode.Position): vscode.TextLine {

        let line: number;
        if (lineOrPosition instanceof Position) {
            line = lineOrPosition.line;
        } else {
            line = lineOrPosition;
        }

        if (line < 0 || line >= this._lines.length) {
            throw new Error('Illegal value for `line`');
        }

        let result = this._textLines[line];
        if (!result || result.lineNumber !== line || result.text !== this._lines[line]) {

            const text = this._lines[line];
            const firstNonWhitespaceCharacterIndex = /^(\s*)/.exec(text)![1].length;
            const range = new Range(line, 0, line, text.length);
            const rangeIncludingLineBreak = line < this._lines.length - 1
                ? new Range(line, 0, line + 1, 0)
                : range;

            result = Object.freeze({
                lineNumber: line,
                range,
                rangeIncludingLineBreak,
                text,
                firstNonWhitespaceCharacterIndex, //TODO@api, rename to 'leadingWhitespaceLength'
                isEmptyOrWhitespace: firstNonWhitespaceCharacterIndex === text.length
            });

            this._textLines[line] = result;
        }

        return result;
    }

    private _offsetAt(position: vscode.Position): number {
        position = this._validatePosition(position);
        this._ensureLineStarts();
        return this._lineStarts!.getAccumulatedValue(position.line - 1) + position.character;
    }

    private _positionAt(offset: number): vscode.Position {
        offset = Math.floor(offset);
        offset = Math.max(0, offset);

        this._ensureLineStarts();
        let out = this._lineStarts!.getIndexOf(offset);

        let lineLength = this._lines[out.index].length;

        // Ensure we return a valid position
        return new Position(out.index, Math.min(out.remainder, lineLength));
    }

    // ---- range math

    private _validateRange(range: vscode.Range): vscode.Range {
        if (!(range instanceof Range)) {
            throw new Error('Invalid argument');
        }

        let start = this._validatePosition(range.start);
        let end = this._validatePosition(range.end);

        if (start === range.start && end === range.end) {
            return range;
        }
        return new Range(start.line, start.character, end.line, end.character);
    }

    private _validatePosition(position: vscode.Position): vscode.Position {
        if (!(position instanceof Position)) {
            throw new Error('Invalid argument');
        }

        let { line, character } = position;
        let hasChanged = false;

        if (line < 0) {
            line = 0;
            character = 0;
            hasChanged = true;
        }
        else if (line >= this._lines.length) {
            line = this._lines.length - 1;
            character = this._lines[line].length;
            hasChanged = true;
        }
        else {
            let maxCharacter = this._lines[line].length;
            if (character < 0) {
                character = 0;
                hasChanged = true;
            }
            else if (character > maxCharacter) {
                character = maxCharacter;
                hasChanged = true;
            }
        }

        if (!hasChanged) {
            return position;
        }
        return new Position(line, character);
    }

    private _getWordRangeAtPosition(_position: vscode.Position, regexp?: RegExp): vscode.Range | undefined {
        let position = this._validatePosition(_position);

        if (!regexp) {
            // use default when custom-regexp isn't provided
            regexp = getWordDefinitionFor(this._languageId);

        } else if (regExpLeadsToEndlessLoop(regexp)) {
            // use default when custom-regexp is bad
            console.warn(`[getWordRangeAtPosition]: ignoring custom regexp '${regexp.source}' because it matches the empty string.`);
            regexp = getWordDefinitionFor(this._languageId);
        }

        let wordAtText = getWordAtText(
            position.character + 1,
            ensureValidWordDefinition(regexp),
            this._lines[position.line],
            0
        );

        if (wordAtText) {
            return new Range(position.line, wordAtText.startColumn - 1, position.line, wordAtText.endColumn - 1);
        }
        return undefined;
    }
}

export function regExpLeadsToEndlessLoop(regexp: RegExp): boolean {
    // Exit early if it's one of these special cases which are meant to match
    // against an empty string
    if (regexp.source === '^' || regexp.source === '^$' || regexp.source === '$') {
        return false;
    }

    // We check against an empty string. If the regular expression doesn't advance
    // (e.g. ends in an endless loop) it will match an empty string.
    let match = regexp.exec('');
    return (match !== null && <any>regexp.lastIndex === 0);
}

/**
 * Word inside a model.
 */
export interface IWordAtPosition {
	/**
	 * The word.
	 */
    readonly word: string;
	/**
	 * The column where the word starts.
	 */
    readonly startColumn: number;
	/**
	 * The column where the word ends.
	 */
    readonly endColumn: number;
}

function getWordAtPosSlow(column: number, wordDefinition: RegExp, text: string, textOffset: number): IWordAtPosition | null {
    // matches all words starting at the beginning
    // of the input until it finds a match that encloses
    // the desired column. slow but correct

    let pos = column - 1 - textOffset;
    wordDefinition.lastIndex = 0;

    let match: RegExpMatchArray | null;
    while (match = wordDefinition.exec(text)) {
        if (match!.index! > pos) {
            // |nW -> matched only after the pos
            return null;

        } else if (wordDefinition.lastIndex >= pos) {
            // W|W -> match encloses pos
            return {
                word: match[0],
                startColumn: textOffset + 1 + match!.index!,
                endColumn: textOffset + 1 + wordDefinition.lastIndex
            };
        }
    }

    return null;
}

function getWordAtPosFast(column: number, wordDefinition: RegExp, text: string, textOffset: number): IWordAtPosition | null {
    // find whitespace enclosed text around column and match from there

    if (wordDefinition.test(' ')) {
        return getWordAtPosSlow(column, wordDefinition, text, textOffset);
    }

    let pos = column - 1 - textOffset;
    let start = text.lastIndexOf(' ', pos - 1) + 1;
    let end = text.indexOf(' ', pos);
    if (end === -1) {
        end = text.length;
    }

    wordDefinition.lastIndex = start;
    let match: RegExpMatchArray | null;
    while (match = wordDefinition.exec(text)) {
        if (match!.index! <= pos && wordDefinition.lastIndex >= pos) {
            return {
                word: match[0],
                startColumn: textOffset + 1 + match!.index!,
                endColumn: textOffset + 1 + wordDefinition.lastIndex
            };
        }
    }

    return null;
}

export function getWordAtText(column: number, wordDefinition: RegExp, text: string, textOffset: number): IWordAtPosition | null {
    const result = getWordAtPosFast(column, wordDefinition, text, textOffset);
    // both (getWordAtPosFast and getWordAtPosSlow) leave the wordDefinition-RegExp
    // in an undefined state and to not confuse other users of the wordDefinition
    // we reset the lastIndex
    wordDefinition.lastIndex = 0;
    return result;
}

export const USUAL_WORD_SEPARATORS = '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?';

/**
 * Create a word definition regular expression based on default word separators.
 * Optionally provide allowed separators that should be included in words.
 *
 * The default would look like this:
 * /(-?\d*\.\d\w*)|([^\`\~\!\@\#\$\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g
 */
function createWordRegExp(allowInWords: string = ''): RegExp {
    var usualSeparators = USUAL_WORD_SEPARATORS;
    var source = '(-?\\d*\\.\\d\\w*)|([^';
    for (var i = 0; i < usualSeparators.length; i++) {
        if (allowInWords.indexOf(usualSeparators[i]) >= 0) {
            continue;
        }
        source += '\\' + usualSeparators[i];
    }
    source += '\\s]+)';
    return new RegExp(source, 'g');
}

// catches numbers (including floating numbers) in the first group, and alphanum in the second
export const DEFAULT_WORD_REGEXP = createWordRegExp();

export function ensureValidWordDefinition(wordDefinition?: RegExp): RegExp {
    var result: RegExp = DEFAULT_WORD_REGEXP;

    if (wordDefinition && (wordDefinition instanceof RegExp)) {
        if (!wordDefinition.global) {
            var flags = 'g';
            if (wordDefinition.ignoreCase) {
                flags += 'i';
            }
            if (wordDefinition.multiline) {
                flags += 'm';
            }
            result = new RegExp(wordDefinition.source, flags);
        } else {
            result = wordDefinition;
        }
    }

    result.lastIndex = 0;

    return result;
}

export function IReadOnlyModelToDocumentData(model: monaco.editor.IReadOnlyModel): ExtHostDocumentData {
    return new ExtHostDocumentData(model.uri, model.getLinesContent(), model.getEOL(), model.getModeId(), 0, false);
}

export function IReadOnlyModelToDocument(model: monaco.editor.IReadOnlyModel): vscode.TextDocument {
    return IReadOnlyModelToDocumentData(model).document;
}
