/* tslint:disable:no-reference */
/// <reference path="emmet.d.ts" />
/* tslint:enable:no-reference */
/// <reference types="monaco-editor" />

/* tslint:disable:variable-name */

import { StreamReader } from "@emmetio/stream-reader";

/**
 * A stream reader for VSCode's `TextDocument`
 * Based on @emmetio/stream-reader and @emmetio/atom-plugin
 */
export class DocumentStreamReader implements StreamReader<monaco.Position> {
    public start: monaco.Position;
    public pos: monaco.Position;

    private document: monaco.editor.IReadOnlyModel;
    private _eof: monaco.Position;
    private _eol: string;

    /**
     * @param  {TextDocument} buffer
     * @param  {Position}      pos
     * @param  {Range}        limit
     */
    constructor(document: monaco.editor.IReadOnlyModel, pos?: monaco.Position, limit?: monaco.Range) {
        this.document = document;
        this.start = this.pos = pos ? pos : new monaco.Position(1, 0);
        this._eof = limit !== undefined ? new monaco.Position(limit.endLineNumber, limit.endColumn) : new monaco.Position(this.document.getLineCount(), this._lineLength(this.document.getLineCount()));
        this._eol = this.document.getEOL();
    }

    /**
     * Returns true only if the stream is at the end of the file.
     * @returns {Boolean}
     */
    public eof() {
        return !this.pos.isBefore(this._eof);
    }

    /**
     * Creates a new stream instance which is limited to given range for given document
     * @param  {Position} start
     * @param  {Position} end
     * @return {DocumentStreamReader}
     */
    public limit(start: monaco.Position, end: monaco.Position) {
        return new DocumentStreamReader(this.document, start, new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column));
    }

    /**
     * Returns the next character code in the stream without advancing it.
     * Will return NaN at the end of the file.
     * @returns {Number}
     */
    public peek() {
        if (this.eof())
            return NaN;

        const line = this.document.getLineContent(this.pos.lineNumber);
        return this.pos.column < line.length ? line.charCodeAt(this.pos.column) : this._eol.charCodeAt(this.pos.column - line.length);
    }

    /**
     * Returns the next character in the stream and advances it.
     * Also returns NaN when no more characters are available.
     * @returns {Number}
     */
    public next() {
        if (this.eof())
            return NaN;

        const line = this.document.getLineContent(this.pos.lineNumber);
        let code: number;
        if (this.pos.column < line.length) {
            code = line.charCodeAt(this.pos.column);
            this.pos = new monaco.Position(this.pos.lineNumber, this.pos.column + 1);
        } else {
            code = this._eol.charCodeAt(this.pos.column - line.length);
            this.pos = new monaco.Position(this.pos.lineNumber + 1, 0);
        }

        if (this.eof()) {
            // Restrict pos to eof, if in case it got moved beyond eof
            this.pos = this._eof.clone();
        }

        return code;
    }

    /**
     * Backs up the stream n characters. Backing it up further than the
     * start of the current token will cause things to break, so be careful.
     * @param {Number} n
     */
    public backUp(n: number) {
        let row = this.pos.lineNumber;
        let column = this.pos.column;
        column -= (n || 1);

        while (row >= 1 && column < 1) {
            row--;
            column += this._lineLength(row);
        }

        this.pos = row < 1 || column < 1
            ? new monaco.Position(1, 0)
            : new monaco.Position(row, column);

        return this.peek();
    }

    /**
     * Get the string between the start of the current token and the
     * current stream position.
     * @returns {String}
     */
    public current() {
        return this.substring(this.start, this.pos);
    }

    /**
     * Returns contents for given range
     * @param  {Position} from
     * @param  {Position} to
     * @return {String}
     */
    public substring(from: monaco.Position, to: monaco.Position) {
        return this.document.getValueInRange(new monaco.Range(from.lineNumber, from.column + 1, to.lineNumber, to.column + 1));
    }

    /**
     * Creates error object with current stream state
     * @param {String} message
     * @return {Error}
     */
    public error(message: string) {
        const err = new Error(`${message} at row ${this.pos.lineNumber}, column ${this.pos.column}`);

        return err;
    }

    /**
     * `match` can be a character code or a function that takes a character code
     * and returns a boolean. If the next character in the stream 'matches'
     * the given argument, it is consumed and returned.
     * Otherwise, `false` is returned.
     * @param {Number|Function} match
     * @returns {Boolean}
     */
    public eat(match: number | ((ch: number) => boolean)) {
        const ch = this.peek();
        const ok = typeof match === "function" ? match(ch) : ch === match;

        if (ok)
            this.next();

        return ok;
    }

    /**
     * Repeatedly calls <code>eat</code> with the given argument, until it
     * fails. Returns <code>true</code> if any characters were eaten.
     * @param {Object} match
     * @returns {Boolean}
     */
    public eatWhile(match: number | ((ch: number) => boolean)) {
        const start = this.pos;
        while (!this.eof() && this.eat(match));
        return !this.pos.equals(start);
    }

    /**
     * Returns line length of given row, including line ending
     * @param  {Number} row
     * @return {Number}
     */
    private _lineLength(row: number) {
        if (row === this.document.getLineCount())
            return this.document.getLineContent(row).length;

        return this.document.getLineContent(row).length + this._eol.length;
    }
}
