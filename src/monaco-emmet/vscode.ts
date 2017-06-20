/// <reference types="monaco-editor" />

/* tslint:disable */
export function illegalArgument(name?: string): Error {
	if (name) {
		return new Error(`Illegal argument: ${name}`);
	} else {
		return new Error('Illegal argument');
	}
}

/**
 * A position in the editor. This interface is suitable for serialization.
 */
export interface IPosition {
	/**
	 * line number (starts at 1)
	 */
	readonly lineNumber: number;
	/**
	 * column (the first character in a line is between column 1 and column 2)
	 */
	readonly column: number;
}

export class Position {

	static Min(...positions: Position[]): Position {
		let result = positions.pop();
		for (let p of positions) {
			if (p.isBefore(result!)) {
				result = p;
			}
		}
		return result!;
	}

	static Max(...positions: Position[]): Position {
		let result = positions.pop();
		for (let p of positions) {
			if (p.isAfter(result!)) {
				result = p;
			}
		}
		return result!;
	}

	static isPosition(other: any): other is Position {
		if (!other) {
			return false;
		}
		if (other instanceof Position) {
			return true;
		}
		let { line, character } = <Position>other;
		if (typeof line === 'number' && typeof character === 'number') {
			return true;
		}
		return false;
	}

	private _line: number;
	private _character: number;

	get line(): number {
		return this._line;
	}

	get character(): number {
		return this._character;
	}

	constructor(line: number, character: number) {
		if (line < 0) {
			throw illegalArgument('line must be positive');
		}
		if (character < 0) {
			throw illegalArgument('character must be positive');
		}
		this._line = line;
		this._character = character;
	}

	isBefore(other: Position): boolean {
		if (this._line < other._line) {
			return true;
		}
		if (other._line < this._line) {
			return false;
		}
		return this._character < other._character;
	}

	isBeforeOrEqual(other: Position): boolean {
		if (this._line < other._line) {
			return true;
		}
		if (other._line < this._line) {
			return false;
		}
		return this._character <= other._character;
	}

	isAfter(other: Position): boolean {
		return !this.isBeforeOrEqual(other);
	}

	isAfterOrEqual(other: Position): boolean {
		return !this.isBefore(other);
	}

	isEqual(other: Position): boolean {
		return this._line === other._line && this._character === other._character;
	}

	compareTo(other: Position): number {
		if (this._line < other._line) {
			return -1;
		} else if (this._line > other.line) {
			return 1;
		} else {
			// equal line
			if (this._character < other._character) {
				return -1;
			} else if (this._character > other._character) {
				return 1;
			} else {
				// equal line and character
				return 0;
			}
		}
	}

	translate(change: { lineDelta?: number; characterDelta?: number; }): Position;
	translate(lineDelta?: number, characterDelta?: number): Position;
	translate(lineDeltaOrChange: number | { lineDelta?: number; characterDelta?: number; } | undefined, characterDelta: number = 0): Position {

		if (lineDeltaOrChange === null || characterDelta === null) {
			throw illegalArgument();
		}

		let lineDelta: number;
		if (typeof lineDeltaOrChange === 'undefined') {
			lineDelta = 0;
		} else if (typeof lineDeltaOrChange === 'number') {
			lineDelta = lineDeltaOrChange;
		} else {
			lineDelta = typeof lineDeltaOrChange.lineDelta === 'number' ? lineDeltaOrChange.lineDelta : 0;
			characterDelta = typeof lineDeltaOrChange.characterDelta === 'number' ? lineDeltaOrChange.characterDelta : 0;
		}

		if (lineDelta === 0 && characterDelta === 0) {
			return this;
		}
		return new Position(this.line + lineDelta, this.character + characterDelta);
	}

	with(change: { line?: number; character?: number; }): Position;
	with(line?: number, character?: number): Position;
	with(lineOrChange: number | { line?: number; character?: number; } | undefined, character: number = this.character): Position {

		if (lineOrChange === null || character === null) {
			throw illegalArgument();
		}

		let line: number;
		if (typeof lineOrChange === 'undefined') {
			line = this.line;

		} else if (typeof lineOrChange === 'number') {
			line = lineOrChange;

		} else {
			line = typeof lineOrChange.line === 'number' ? lineOrChange.line : this.line;
			character = typeof lineOrChange.character === 'number' ? lineOrChange.character : this.character;
		}

		if (line === this.line && character === this.character) {
			return this;
		}
		return new Position(line, character);
	}

	toJSON(): any {
		return { line: this.line, character: this.character };
	}
}

/**
 * A range in the editor. This interface is suitable for serialization.
 */
export interface IRange {
	/**
	 * Line number on which the range starts (starts at 1).
	 */
	readonly startLineNumber: number;
	/**
	 * Column on which the range starts in line `startLineNumber` (starts at 1).
	 */
	readonly startColumn: number;
	/**
	 * Line number on which the range ends.
	 */
	readonly endLineNumber: number;
	/**
	 * Column on which the range ends in line `endLineNumber`.
	 */
	readonly endColumn: number;
}

export class Range {

	static isRange(thing: any): thing is Range {
		if (thing instanceof Range) {
			return true;
		}
		if (!thing) {
			return false;
		}
		return Position.isPosition((<Range>thing).start)
			&& Position.isPosition((<Range>thing.end));
	}

	protected _start: Position;
	protected _end: Position;

	get start(): Position {
		return this._start;
	}

	get end(): Position {
		return this._end;
	}

	constructor(start: Position, end: Position);
	constructor(startLine: number, startColumn: number, endLine: number, endColumn: number);
	constructor(startLineOrStart: number | Position, startColumnOrEnd: number | Position, endLine?: number, endColumn?: number) {
		let start: Position | undefined;
		let end: Position | undefined;

		if (typeof startLineOrStart === 'number' && typeof startColumnOrEnd === 'number' && typeof endLine === 'number' && typeof endColumn === 'number') {
			start = new Position(startLineOrStart, startColumnOrEnd);
			end = new Position(endLine, endColumn);
		} else if (startLineOrStart instanceof Position && startColumnOrEnd instanceof Position) {
			start = startLineOrStart;
			end = startColumnOrEnd;
		}

		if (!start || !end) {
			throw new Error('Invalid arguments');
		}

		if (start.isBefore(end)) {
			this._start = start;
			this._end = end;
		} else {
			this._start = end;
			this._end = start;
		}
	}

	contains(positionOrRange: Position | Range): boolean {
		if (positionOrRange instanceof Range) {
			return this.contains(positionOrRange._start)
				&& this.contains(positionOrRange._end);

		} else if (positionOrRange instanceof Position) {
			if (positionOrRange.isBefore(this._start)) {
				return false;
			}
			if (this._end.isBefore(positionOrRange)) {
				return false;
			}
			return true;
		}
		return false;
	}

	isEqual(other: Range): boolean {
		return this._start.isEqual(other._start) && this._end.isEqual(other._end);
	}

	intersection(other: Range): Range | undefined {
		let start = Position.Max(other.start, this._start);
		let end = Position.Min(other.end, this._end);
		if (start.isAfter(end)) {
			// this happens when there is no overlap:
			// |-----|
			//          |----|
			return undefined;
		}
		return new Range(start, end);
	}

	union(other: Range): Range {
		if (this.contains(other)) {
			return this;
		} else if (other.contains(this)) {
			return other;
		}
		let start = Position.Min(other.start, this._start);
		let end = Position.Max(other.end, this.end);
		return new Range(start, end);
	}

	get isEmpty(): boolean {
		return this._start.isEqual(this._end);
	}

	get isSingleLine(): boolean {
		return this._start.line === this._end.line;
	}

	with(change: { start?: Position, end?: Position }): Range;
	with(start?: Position, end?: Position): Range;
	with(startOrChange: Position | { start?: Position, end?: Position } | undefined, end: Position = this.end): Range {

		if (startOrChange === null || end === null) {
			throw illegalArgument();
		}

		let start: Position;
		if (!startOrChange) {
			start = this.start;

		} else if (Position.isPosition(startOrChange)) {
			start = startOrChange;

		} else {
			start = startOrChange.start || this.start;
			end = startOrChange.end || this.end;
		}

		if (start.isEqual(this._start) && end.isEqual(this.end)) {
			return this;
		}
		return new Range(start, end);
	}

	toJSON(): any {
		return [this.start, this.end];
	}
}

/**
 * Represents an end of line character sequence in a [document](#TextDocument).
 */
export enum EndOfLine {
	/**
	 * The line feed `\n` character.
	 */
	LF = 1,
	/**
	 * The carriage return line feed `\r\n` sequence.
	 */
	CRLF = 2
}

/**
 * Represents a line of text, such as a line of source code.
 *
 * TextLine objects are __immutable__. When a [document](#TextDocument) changes,
 * previously retrieved lines will not represent the latest state.
 */
export interface TextLine {

	/**
	 * The zero-based line number.
	 */
	readonly lineNumber: number;

	/**
	 * The text of this line without the line separator characters.
	 */
	readonly text: string;

	/**
	 * The range this line covers without the line separator characters.
	 */
	readonly range: Range;

	/**
	 * The range this line covers with the line separator characters.
	 */
	readonly rangeIncludingLineBreak: Range;

	/**
	 * The offset of the first character which is not a whitespace character as defined
	 * by `/\s/`. **Note** that if a line is all whitespaces the length of the line is returned.
	 */
	readonly firstNonWhitespaceCharacterIndex: number;

	/**
	 * Whether this line is whitespace only, shorthand
	 * for [TextLine.firstNonWhitespaceCharacterIndex](#TextLine.firstNonWhitespaceCharacterIndex) === [TextLine.text.length](#TextLine.text).
	 */
	readonly isEmptyOrWhitespace: boolean;
}

/**
 * Represents a text document, such as a source file. Text documents have
 * [lines](#TextLine) and knowledge about an underlying resource like a file.
 */
export interface TextDocument {

	/**
	 * The associated URI for this document. Most documents have the __file__-scheme, indicating that they
	 * represent files on disk. However, some documents may have other schemes indicating that they are not
	 * available on disk.
	 */
	readonly uri: monaco.Uri;

	/**
	 * The file system path of the associated resource. Shorthand
	 * notation for [TextDocument.uri.fsPath](#TextDocument.uri). Independent of the uri scheme.
	 */
	readonly fileName: string;

	/**
	 * Is this document representing an untitled file.
	 */
	readonly isUntitled: boolean;

	/**
	 * The identifier of the language associated with this document.
	 */
	readonly languageId: string;

	/**
	 * The version number of this document (it will strictly increase after each
	 * change, including undo/redo).
	 */
	readonly version: number;

	/**
	 * `true` if there are unpersisted changes.
	 */
	readonly isDirty: boolean;

	/**
	 * `true` if the document have been closed. A closed document isn't synchronized anymore
	 * and won't be re-used when the same resource is opened again.
	 */
	readonly isClosed: boolean;

	/**
	 * Save the underlying file.
	 *
	 * @return A promise that will resolve to true when the file
	 * has been saved. If the file was not dirty or the save failed,
	 * will return false.
	 */
	save(): Thenable<boolean>;

	/**
	 * The [end of line](#EndOfLine) sequence that is predominately
	 * used in this document.
	 */
	readonly eol: EndOfLine;

	/**
	 * The number of lines in this document.
	 */
	readonly lineCount: number;

	/**
	 * Returns a text line denoted by the line number. Note
	 * that the returned object is *not* live and changes to the
	 * document are not reflected.
	 *
	 * @param line A line number in [0, lineCount).
	 * @return A [line](#TextLine).
	 */
	lineAt(line: number): TextLine;

	/**
	 * Returns a text line denoted by the position. Note
	 * that the returned object is *not* live and changes to the
	 * document are not reflected.
	 *
	 * The position will be [adjusted](#TextDocument.validatePosition).
	 *
	 * @see [TextDocument.lineAt](#TextDocument.lineAt)
	 * @param position A position.
	 * @return A [line](#TextLine).
	 */
	lineAt(position: Position): TextLine;

	/**
	 * Converts the position to a zero-based offset.
	 *
	 * The position will be [adjusted](#TextDocument.validatePosition).
	 *
	 * @param position A position.
	 * @return A valid zero-based offset.
	 */
	offsetAt(position: Position): number;

	/**
	 * Converts a zero-based offset to a position.
	 *
	 * @param offset A zero-based offset.
	 * @return A valid [position](#Position).
	 */
	positionAt(offset: number): Position;

	/**
	 * Get the text of this document. A substring can be retrieved by providing
	 * a range. The range will be [adjusted](#TextDocument.validateRange).
	 *
	 * @param range Include only the text included by the range.
	 * @return The text inside the provided range or the entire text.
	 */
	getText(range?: Range): string;

	/**
	 * Get a word-range at the given position. By default words are defined by
	 * common separators, like space, -, _, etc. In addition, per languge custom
	 * [word definitions](#LanguageConfiguration.wordPattern) can be defined. It
	 * is also possible to provide a custom regular expression. *Note* that a
	 * custom regular expression must not match the empty string and that it will
	 * be ignored if it does.
	 *
	 * The position will be [adjusted](#TextDocument.validatePosition).
	 *
	 * @param position A position.
	 * @param regex Optional regular expression that describes what a word is.
	 * @return A range spanning a word, or `undefined`.
	 */
	getWordRangeAtPosition(position: Position, regex?: RegExp): Range | undefined;

	/**
	 * Ensure a range is completely contained in this document.
	 *
	 * @param range A range.
	 * @return The given range or a new, adjusted range.
	 */
	validateRange(range: Range): Range;

	/**
	 * Ensure a position is contained in the range of this document.
	 *
	 * @param position A position.
	 * @return The given position or a new, adjusted position.
	 */
	validatePosition(position: Position): Position;
}

export type Thenable<T> = Promise<T>;
export type ProviderResult<T> = T | undefined | null | Thenable<T | undefined | null>;

export class SnippetString implements monaco.languages.SnippetString {
	public constructor(public readonly value: string) { }
}

/**
 * Completion item kinds.
 */
export enum CompletionItemKind {
	Text = 0,
	Method = 1,
	Function = 2,
	Constructor = 3,
	Field = 4,
	Variable = 5,
	Class = 6,
	Interface = 7,
	Module = 8,
	Property = 9,
	Unit = 10,
	Value = 11,
	Enum = 12,
	Keyword = 13,
	Snippet = 14,
	Color = 15,
	Reference = 17,
	File = 16,
	Folder = 18,
	EnumMember = 19,
	Constant = 20,
	Struct = 21,
	Event = 22,
	Operator = 23,
	TypeParameter = 24
}

/**
 * A completion item represents a text snippet that is proposed to complete text that is being typed.
 *
 * It is suffient to create a completion item from just a [label](#CompletionItem.label). In that
 * case the completion item will replace the [word](#TextDocument.getWordRangeAtPosition)
 * until the cursor with the given label or [insertText](#CompletionItem.insertText). Otherwise the
 * the given [edit](#CompletionItem.textEdit) is used.
 *
 * When selecting a completion item in the editor its defined or synthesized text edit will be applied
 * to *all* cursors/selections whereas [additionalTextEdits](CompletionItem.additionalTextEdits) will be
 * applied as provided.
 *
 * @see [CompletionItemProvider.provideCompletionItems](#CompletionItemProvider.provideCompletionItems)
 * @see [CompletionItemProvider.resolveCompletionItem](#CompletionItemProvider.resolveCompletionItem)
 */
export class CompletionItem {

	/**
	 * The label of this completion item. By default
	 * this is also the text that is inserted when selecting
	 * this completion.
	 */
	label: string;

	/**
	 * The kind of this completion item. Based on the kind
	 * an icon is chosen by the editor.
	 */
	kind?: CompletionItemKind;

	/**
	 * A human-readable string with additional information
	 * about this item, like type or symbol information.
	 */
	detail?: string;

	/**
	 * A human-readable string that represents a doc-comment.
	 */
	documentation?: string;

	/**
	 * A string that should be used when comparing this item
	 * with other items. When `falsy` the [label](#CompletionItem.label)
	 * is used.
	 */
	sortText?: string;

	/**
	 * A string that should be used when filtering a set of
	 * completion items. When `falsy` the [label](#CompletionItem.label)
	 * is used.
	 */
	filterText?: string;

	/**
	 * A string or snippet that should be inserted in a document when selecting
	 * this completion. When `falsy` the [label](#CompletionItem.label)
	 * is used.
	 */
	insertText?: string | SnippetString;

	/**
	 * A range of text that should be replaced by this completion item.
	 *
	 * Defaults to a range from the start of the [current word](#TextDocument.getWordRangeAtPosition) to the
	 * current position.
	 *
	 * *Note:* The range must be a [single line](#Range.isSingleLine) and it must
	 * [contain](#Range.contains) the position at which completion has been [requested](#CompletionItemProvider.provideCompletionItems).
	 */
	range?: Range;

	/**
	 * An optional set of characters that when pressed while this completion is active will accept it first and
	 * then type that character. *Note* that all commit characters should have `length=1` and that superfluous
	 * characters will be ignored.
	 */
	commitCharacters?: string[];

	/**
	 * Creates a new completion item.
	 *
	 * Completion items must have at least a [label](#CompletionItem.label) which then
	 * will be used as insert text as well as for sorting and filtering.
	 *
	 * @param label The label of the completion.
	 * @param kind The [kind](#CompletionItemKind) of the completion.
	 */
	constructor(label: string, kind?: CompletionItemKind) {
		this.label = label;
		this.kind = kind;
	}
}

export type CancellationToken = monaco.CancellationToken;

export class CompletionList {

	isIncomplete?: boolean;

	items: CompletionItem[];

	constructor(items: CompletionItem[] = [], isIncomplete: boolean = false) {
		this.items = items;
		this.isIncomplete = isIncomplete;
	}
}

/**
 * The completion item provider interface defines the contract between extensions and
 * [IntelliSense](https://code.visualstudio.com/docs/editor/intellisense).
 *
 * When computing *complete* completion items is expensive, providers can optionally implement
 * the `resolveCompletionItem`-function. In that case it is enough to return completion
 * items with a [label](#CompletionItem.label) from the
 * [provideCompletionItems](#CompletionItemProvider.provideCompletionItems)-function. Subsequently,
 * when a completion item is shown in the UI and gains focus this provider is asked to resolve
 * the item, like adding [doc-comment](#CompletionItem.documentation) or [details](#CompletionItem.detail).
 *
 * Providers are asked for completions either explicitly by a user gesture or -depending on the configuration-
 * implicitly when typing words or trigger characters.
 */
export interface CompletionItemProvider {

	/**
	 * Provide completion items for the given position and document.
	 *
	 * @param document The document in which the command was invoked.
	 * @param position The position at which the command was invoked.
	 * @param token A cancellation token.
	 * @return An array of completions, a [completion list](#CompletionList), or a thenable that resolves to either.
	 * The lack of a result can be signaled by returning `undefined`, `null`, or an empty array.
	 */
	provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<CompletionItem[] | CompletionList>;

	/**
	 * Given a completion item fill in more data, like [doc-comment](#CompletionItem.documentation)
	 * or [details](#CompletionItem.detail).
	 *
	 * The editor will only resolve a completion item once.
	 *
	 * @param item A completion item currently active in the UI.
	 * @param token A cancellation token.
	 * @return The resolved completion item or a thenable that resolves to of such. It is OK to return the given
	 * `item`. When no result is returned, the given `item` will be used.
	 */
	resolveCompletionItem?(item: CompletionItem, token: CancellationToken): ProviderResult<CompletionItem>;
}

export const workspace = {
	getConfiguration(section?: string): any {
		return new Proxy({}, {
			get(target: {}, p: PropertyKey, receiver: any): any {
				return true;
			}
		})
	}
};

/**
 * Rendering style of the cursor.
 */
export enum TextEditorCursorStyle {
	/**
	 * Render the cursor as a vertical thick line.
	 */
	Line = 1,
	/**
	 * Render the cursor as a block filled.
	 */
	Block = 2,
	/**
	 * Render the cursor as a thick horizontal line.
	 */
	Underline = 3,
	/**
	 * Render the cursor as a vertical thin line.
	 */
	LineThin = 4,
	/**
	 * Render the cursor as a block outlined.
	 */
	BlockOutline = 5,
	/**
	 * Render the cursor as a thin horizontal line.
	 */
	UnderlineThin = 6
}

/**
 * Rendering style of the line numbers.
 */
export enum TextEditorLineNumbersStyle {
	/**
	 * Do not render the line numbers.
	 */
	Off = 0,
	/**
	 * Render the line numbers.
	 */
	On = 1,
	/**
	 * Render the line numbers with values relative to the primary cursor location.
	 */
	Relative = 2
}

/**
 * Represents a [text editor](#TextEditor)'s [options](#TextEditor.options).
 */
export interface TextEditorOptions {

	/**
	 * The size in spaces a tab takes. This is used for two purposes:
	 *  - the rendering width of a tab character;
	 *  - the number of spaces to insert when [insertSpaces](#TextEditorOptions.insertSpaces) is true.
	 *
	 * When getting a text editor's options, this property will always be a number (resolved).
	 * When setting a text editor's options, this property is optional and it can be a number or `"auto"`.
	 */
	tabSize?: number | string;

	/**
	 * When pressing Tab insert [n](#TextEditorOptions.tabSize) spaces.
	 * When getting a text editor's options, this property will always be a boolean (resolved).
	 * When setting a text editor's options, this property is optional and it can be a boolean or `"auto"`.
	 */
	insertSpaces?: boolean | string;

	/**
	 * The rendering style of the cursor in this editor.
	 * When getting a text editor's options, this property will always be present.
	 * When setting a text editor's options, this property is optional.
	 */
	cursorStyle?: TextEditorCursorStyle;

	/**
	 * Render relative line numbers w.r.t. the current line number.
	 * When getting a text editor's options, this property will always be present.
	 * When setting a text editor's options, this property is optional.
	 */
	lineNumbers?: TextEditorLineNumbersStyle;
}

/**
 * Denotes a column in the editor window. Columns are
 * used to show editors side by side.
 */
export enum ViewColumn {
	One = 1,
	Two = 2,
	Three = 3
}

/**
 * A complex edit that will be applied in one transaction on a TextEditor.
 * This holds a description of the edits and if the edits are valid (i.e. no overlapping regions, document was not changed in the meantime, etc.)
 * they can be applied on a [document](#TextDocument) associated with a [text editor](#TextEditor).
 *
 */
export interface TextEditorEdit {
	/**
	 * Replace a certain text region with a new value.
	 * You can use \r\n or \n in `value` and they will be normalized to the current [document](#TextDocument).
	 *
	 * @param location The range this operation should remove.
	 * @param value The new text this operation should insert after removing `location`.
	 */
	replace(location: Position | Range | Selection, value: string): void;

	/**
	 * Insert text at a location.
	 * You can use \r\n or \n in `value` and they will be normalized to the current [document](#TextDocument).
	 * Although the equivalent text edit can be made with [replace](#TextEditorEdit.replace), `insert` will produce a different resulting selection (it will get moved).
	 *
	 * @param location The position where the new text should be inserted.
	 * @param value The new text this operation should insert.
	 */
	insert(location: Position, value: string): void;

	/**
	 * Delete a certain text region.
	 *
	 * @param location The range this operation should remove.
	 */
	delete(location: Range | Selection): void;

	/**
	 * Set the end of line sequence.
	 *
	 * @param endOfLine The new end of line for the [document](#TextDocument).
	 */
	setEndOfLine(endOfLine: EndOfLine): void;
}

/**
 * Represents a handle to a set of decorations
 * sharing the same [styling options](#DecorationRenderOptions) in a [text editor](#TextEditor).
 *
 * To get an instance of a `TextEditorDecorationType` use
 * [createTextEditorDecorationType](#window.createTextEditorDecorationType).
 */
export interface TextEditorDecorationType {

	/**
	 * Internal representation of the handle.
	 */
	readonly key: string;

	/**
	 * Remove this decoration type and all decorations on all text editors using it.
	 */
	dispose(): void;
}

/**
 * MarkedString can be used to render human readable text. It is either a markdown string
 * or a code-block that provides a language and a code snippet. Note that
 * markdown strings will be sanitized - that means html will be escaped.
 */
export type MarkedString = string | { language: string; value: string };

/**
 * Represents options for a specific decoration in a [decoration set](#TextEditorDecorationType).
 */
export interface DecorationOptions {

	/**
	 * Range to which this decoration is applied. The range must not be empty.
	 */
	range: Range;

	/**
	 * A message that should be rendered when hovering over the decoration.
	 */
	hoverMessage?: MarkedString | MarkedString[];

	/**
	 * Render options applied to the current decoration. For performance reasons, keep the
	 * number of decoration specific options small, and use decoration types whereever possible.
	 */
	renderOptions?: DecorationInstanceRenderOptions;
}

export class ThemeColor {
	id: string;
	constructor(id: string) {
		this.id = id;
	}
}

export interface ThemableDecorationAttachmentRenderOptions {
	/**
	 * Defines a text content that is shown in the attachment. Either an icon or a text can be shown, but not both.
	 */
	contentText?: string;
	/**
	 * An **absolute path** or an URI to an image to be rendered in the attachment. Either an icon
	 * or a text can be shown, but not both.
	 */
	contentIconPath?: string | monaco.Uri;
	/**
	 * CSS styling property that will be applied to the decoration attachment.
	 */
	border?: string;
	/**
	 * CSS styling property that will be applied to text enclosed by a decoration.
	 */
	borderColor?: string | ThemeColor;
	/**
	 * CSS styling property that will be applied to the decoration attachment.
	 */
	textDecoration?: string;
	/**
	 * CSS styling property that will be applied to the decoration attachment.
	 */
	color?: string | ThemeColor;
	/**
	 * CSS styling property that will be applied to the decoration attachment.
	 */
	backgroundColor?: string | ThemeColor;
	/**
	 * CSS styling property that will be applied to the decoration attachment.
	 */
	margin?: string;
	/**
	 * CSS styling property that will be applied to the decoration attachment.
	 */
	width?: string;
	/**
	 * CSS styling property that will be applied to the decoration attachment.
	 */
	height?: string;
}

export interface ThemableDecorationInstanceRenderOptions {
	/**
	 * Defines the rendering options of the attachment that is inserted before the decorated text
	 */
	before?: ThemableDecorationAttachmentRenderOptions;

	/**
	 * Defines the rendering options of the attachment that is inserted after the decorated text
	 */
	after?: ThemableDecorationAttachmentRenderOptions;
}

export interface DecorationInstanceRenderOptions extends ThemableDecorationInstanceRenderOptions {
	/**
	 * Overwrite options for light themes.
	 */
	light?: ThemableDecorationInstanceRenderOptions;

	/**
	 * Overwrite options for dark themes.
	 */
	dark?: ThemableDecorationInstanceRenderOptions;
}

/**
 * Represents different [reveal](#TextEditor.revealRange) strategies in a text editor.
 */
export enum TextEditorRevealType {
	/**
	 * The range will be revealed with as little scrolling as possible.
	 */
	Default = 0,
	/**
	 * The range will always be revealed in the center of the viewport.
	 */
	InCenter = 1,
	/**
	 * If the range is outside the viewport, it will be revealed in the center of the viewport.
	 * Otherwise, it will be revealed with as little scrolling as possible.
	 */
	InCenterIfOutsideViewport = 2,
	/**
	 * The range will always be revealed at the top of the viewport.
	 */
	AtTop = 3
}

/**
 * A selection in the editor.
 * The selection is a range that has an orientation.
 */
export interface ISelection {
	/**
	 * The line number on which the selection has started.
	 */
	readonly selectionStartLineNumber: number;
	/**
	 * The column on `selectionStartLineNumber` where the selection has started.
	 */
	readonly selectionStartColumn: number;
	/**
	 * The line number on which the selection has ended.
	 */
	readonly positionLineNumber: number;
	/**
	 * The column on `positionLineNumber` where the selection has ended.
	 */
	readonly positionColumn: number;
}

export class Selection extends Range {

	static isSelection(thing: any): thing is Selection {
		if (thing instanceof Selection) {
			return true;
		}
		if (!thing) {
			return false;
		}
		return Range.isRange(thing)
			&& Position.isPosition((<Selection>thing).anchor)
			&& Position.isPosition((<Selection>thing).active)
			&& typeof (<Selection>thing).isReversed === 'boolean';
	}

	private _anchor: Position;

	public get anchor(): Position {
		return this._anchor;
	}

	private _active: Position;

	public get active(): Position {
		return this._active;
	}

	constructor(anchor: Position, active: Position);
	constructor(anchorLine: number, anchorColumn: number, activeLine: number, activeColumn: number);
	constructor(anchorLineOrAnchor: number | Position, anchorColumnOrActive: number | Position, activeLine?: number, activeColumn?: number) {
		let anchor: Position | undefined;
		let active: Position | undefined;

		if (typeof anchorLineOrAnchor === 'number' && typeof anchorColumnOrActive === 'number' && typeof activeLine === 'number' && typeof activeColumn === 'number') {
			anchor = new Position(anchorLineOrAnchor, anchorColumnOrActive);
			active = new Position(activeLine, activeColumn);
		} else if (anchorLineOrAnchor instanceof Position && anchorColumnOrActive instanceof Position) {
			anchor = anchorLineOrAnchor;
			active = anchorColumnOrActive;
		}

		if (!anchor || !active) {
			throw new Error('Invalid arguments');
		}

		super(anchor, active);

		this._anchor = anchor;
		this._active = active;
	}

	get isReversed(): boolean {
		return this._anchor === this._end;
	}

	toJSON() {
		return {
			start: this.start,
			end: this.end,
			active: this.active,
			anchor: this.anchor
		};
	}
}

/**
 * Represents an editor that is attached to a [document](#TextDocument).
 */
export interface TextEditor {

	/**
	 * The document associated with this text editor. The document will be the same for the entire lifetime of this text editor.
	 */
	document: TextDocument;

	/**
	 * The primary selection on this text editor. Shorthand for `TextEditor.selections[0]`.
	 */
	selection: Selection;

	/**
	 * The selections in this text editor. The primary selection is always at index 0.
	 */
	selections: Selection[];

	/**
	 * Text editor options.
	 */
	options: TextEditorOptions;

	/**
	 * The column in which this editor shows. Will be `undefined` in case this
	 * isn't one of the three main editors, e.g an embedded editor.
	 */
	viewColumn?: ViewColumn | undefined;

	/**
	 * Perform an edit on the document associated with this text editor.
	 *
	 * The given callback-function is invoked with an [edit-builder](#TextEditorEdit) which must
	 * be used to make edits. Note that the edit-builder is only valid while the
	 * callback executes.
	 *
	 * @param callback A function which can create edits using an [edit-builder](#TextEditorEdit).
	 * @param options The undo/redo behavior around this edit. By default, undo stops will be created before and after this edit.
	 * @return A promise that resolves with a value indicating if the edits could be applied.
	 */
	edit(callback: (editBuilder: TextEditorEdit) => void, options?: { undoStopBefore: boolean; undoStopAfter: boolean; }): Thenable<boolean>;

	/**
	 * Insert a [snippet](#SnippetString) and put the editor into snippet mode. "Snippet mode"
	 * means the editor adds placeholders and additionals cursors so that the user can complete
	 * or accept the snippet.
	 *
	 * @param snippet The snippet to insert in this edit.
	 * @param location Position or range at which to insert the snippet, defaults to the current editor selection or selections.
	 * @param options The undo/redo behavior around this edit. By default, undo stops will be created before and after this edit.
	 * @return A promise that resolves with a value indicating if the snippet could be inserted. Note that the promise does not signal
	 * that the snippet is completely filled-in or accepted.
	 */
	insertSnippet(snippet: SnippetString, location?: Position | Range | Position[] | Range[], options?: { undoStopBefore: boolean; undoStopAfter: boolean; }): Thenable<boolean>;

	/**
	 * Adds a set of decorations to the text editor. If a set of decorations already exists with
	 * the given [decoration type](#TextEditorDecorationType), they will be replaced.
	 *
	 * @see [createTextEditorDecorationType](#window.createTextEditorDecorationType).
	 *
	 * @param decorationType A decoration type.
	 * @param rangesOrOptions Either [ranges](#Range) or more detailed [options](#DecorationOptions).
	 */
	setDecorations(decorationType: TextEditorDecorationType, rangesOrOptions: Range[] | DecorationOptions[]): void;

	/**
	 * Scroll as indicated by `revealType` in order to reveal the given range.
	 *
	 * @param range A range.
	 * @param revealType The scrolling strategy for revealing `range`.
	 */
	revealRange(range: Range, revealType?: TextEditorRevealType): void;

	/**
	 * Show the text editor.
	 *
	 * @deprecated **This method is deprecated.** Use [window.showTextDocument](#window.showTextDocument)
	 * instead. This method shows unexpected behavior and will be removed in the next major update.
	 *
	 * @param column The [column](#ViewColumn) in which to show this editor.
	 */
	show(column?: ViewColumn): void;

	/**
	 * Hide the text editor.
	 *
	 * @deprecated **This method is deprecated.** Use the command 'workbench.action.closeActiveEditor' instead.
	 * This method shows unexpected behavior and will be removed in the next major update.
	 */
	hide(): void;
}

interface Window {
	activeTextEditor: TextEditor | undefined;
	showInformationMessage(message: string, ...items: string[]): Thenable<string | undefined>;
}

export const window: Window = {
	activeTextEditor: undefined,
	showInformationMessage(message: string, ...items: string[]): Thenable<string | undefined> {
		return Promise.resolve(undefined);
	}
}

/**
 * Throws an error with the provided message if the provided value does not evaluate to a true Javascript value.
 */
export function ok(value?: any, message?: string) {
    if (!value || value === null) {
        throw new Error(message ? 'Assertion failed (' + message + ')' : 'Assertion Failed');
    }
}

export function readonly(name?: string): Error {
	return name
		? new Error(`readonly property '${name} cannot be changed'`)
		: new Error('readonly property cannot be changed');
}
