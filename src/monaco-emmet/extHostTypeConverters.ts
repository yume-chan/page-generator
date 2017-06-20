
import * as vscode from "./vscode";
import { EndOfLine, illegalArgument, IPosition, IRange, ISelection, ok, Position, Range, readonly, Selection, SnippetString, TextEditor, Thenable } from "./vscode";

export interface PositionLike {
    line: number;
    character: number;
}

export interface RangeLike {
    start: PositionLike;
    end: PositionLike;
}

export interface SelectionLike extends RangeLike {
    anchor: PositionLike;
    active: PositionLike;
}

export function toSelection(selection: ISelection): Selection {
    const { selectionStartLineNumber, selectionStartColumn, positionLineNumber, positionColumn } = selection;
    const start = new Position(selectionStartLineNumber - 1, selectionStartColumn - 1);
    const end = new Position(positionLineNumber - 1, positionColumn - 1);
    return new Selection(start, end);
}

export function fromSelection(selection: SelectionLike): ISelection {
    const { anchor, active } = selection;
    return {
        positionColumn: active.character + 1,
        positionLineNumber: active.line + 1,
        selectionStartColumn: anchor.character + 1,
        selectionStartLineNumber: anchor.line + 1,
    };
}

export function fromRange(range: undefined): undefined;
export function fromRange(range: RangeLike): IRange;
export function fromRange(range?: RangeLike): IRange | undefined {
    if (!range)
        return undefined;

    const { start, end } = range;
    return {
        endColumn: end.character + 1,
        endLineNumber: end.line + 1,
        startColumn: start.character + 1,
        startLineNumber: start.line + 1,
    };
}

export function toPosition(position: IPosition): Position {
    return new Position(position.lineNumber - 1, position.column - 1);
}

export function fromPosition(position: Position): IPosition {
    return { lineNumber: position.line + 1, column: position.character + 1 };
}
