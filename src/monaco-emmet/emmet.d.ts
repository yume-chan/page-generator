declare module "@emmetio/output-profile" {
    type Case = "lower" | "upper" | "";

    export interface ProfileOptions {
        indent: string;
        tagCase: Case;
        attributeCase: Case;
        attributeQuotes: "double" | "single";
        format: boolean;
        formatSkip: string[];
        formatForce: string[];
        inlineBreak: number;
        compactBooleanAttributes: boolean;
        booleanAttributes: string[];
        selfClosingStyle: "html" | "xml" | "xhtml";
        inlineElements: string[];
    }

    export default class Profile {
        constructor(options?: Partial<ProfileOptions>);

        options: ProfileOptions;
        quoteChar: string;

        get<K extends keyof ProfileOptions>(name: K): ProfileOptions[K];
        quote(str: string): string;
        name(name: string): string;
        attribute(attr: string): string;
        isBooleanAttribute(attr: string): boolean;
        selfClose(): string;
        indent(level?: number): string;
        isInline(node: string | Node): boolean;
    }
}

declare module "@emmetio/snippets-registry" {
    interface StringSnippet {
        key: string;
        value: string | Function;
    }

    interface RegExpSnippet {
        key: RegExp;
        value: string | Function;
    }

    type Snippet = StringSnippet | RegExpSnippet;

    interface AllOptions {
        type?: "string" | "regexp";
    }

    export default class SnippetsRegistry {
        public all(options: { type: "string" }): StringSnippet[];
        public all(options?: AllOptions): Snippet[];
    }
}

declare module "@emmetio/expand-abbreviation" {
    import Profile, { ProfileOptions } from "@emmetio/output-profile";
    import SnippetsRegistry from "@emmetio/snippets-registry";

    export interface ParseOptions {
        syntax?: string;
        field?(index: number, placeholder: string): string;
        text?: string | string[];
        profile?: ProfileOptions | Profile;
        variables?: { [key: string]: string };
        snippets?: object | object[] | SnippetsRegistry;
        addons?: { [key: string]: any };
        format?: any;
    }

    export function expand(abbr: string, options?: ParseOptions): string;

    export function createSnippetsRegistry(syntax: string, snippets?: object | object[] | SnippetsRegistry): SnippetsRegistry;
}

declare module "@emmetio/extract-abbreviation" {
    interface ExtractResult {
        abbreviation: string;
        location: number;
    }

    function extractAbbreviation(line: string, pos: number, lookAhead: boolean): ExtractResult | null;
    export default extractAbbreviation;
}

declare module "@emmetio/stream-reader" {
    export interface StreamReader<TPosition> {
        start: TPosition;
        pos: TPosition;

        limit(start: TPosition, end: TPosition): StreamReader<TPosition>;
        eof(): boolean;
        peek(): number;
        next(): number;
        eat(match: number | ((ch: number) => boolean)): boolean;
        eatWhile(match: number | ((ch: number) => boolean)): boolean;
        backUp(n: number): void;
        current(): string;
        substring(start: TPosition, end: TPosition): string;
        error(message: string): Error;
    }

    export default class StringReader implements StreamReader<number> {
        constructor(str: string, start?: number, end?: number);

        start: number;
        pos: number;

        eof(): boolean;
        limit(start: number, end: number): StringReader;
        peek(): number;
        next(): number;
        eat(match: number | ((ch: number) => boolean)): boolean;
        eatWhile(match: number | ((ch: number) => boolean)): boolean;
        backUp(n: number): void;
        current(): string;
        substring(start: number, end: number): string;
        error(message: string): Error;
    }
}

declare module "@emmetio/node" {
    export interface AttributeOptions {
        boolean: boolean;
        implied: boolean;
    }

    export class Attribute {
        constructor(name: string, value?: string, options?: AttributeOptions)

        name: string;
        value: string | null;
        opionts: AttributeOptions;

        clone(): Attribute;
        valueOf(): string;
    }

    export default class Node<TPosition> {
        constructor(name: string, attribute?: Attribute[]);

        name: string;
        value: any;
        repeat: any;
        selfClosing: boolean;

        children: Node<TPosition>[];

        parent: Node<TPosition> | null;

        start: TPosition;
        end: TPosition;

        readonly attribute: Attribute[];
        readonly attributesMap: { [key: string]: string | undefined };
        readonly isGroup: boolean;
        readonly isTextOnly: boolean;
        readonly firstChild: Node<TPosition> | undefined;
        readonly lastChild: Node<TPosition> | undefined;
        readonly childIndex: number;
        readonly nextSibling: Node<TPosition> | null;
        readonly previousSibling: Node<TPosition> | null;
        readonly classList: string[];
    }
}

declare module "@emmetio/css-parser" {
    import { StreamReader } from "@emmetio/stream-reader";
    import Node from "@emmetio/node";

    export default function parse<TPosition>(reader: StreamReader<TPosition>): Node<TPosition>;
}

declare module "@emmetio/html-matcher" {
    import { StreamReader } from "@emmetio/stream-reader";
    import Node, { Attribute } from "@emmetio/node";

    export class HtmlNode<TPosition> extends Node<TPosition> {
        type: string;
        open: {
            name: {
                value: string;
            };
            attributes: Attribute[];
            start: TPosition;
            end: TPosition;
        };
        close: {
            name: {
                value: string;
            };
            start: TPosition;
            end: TPosition;
        };
        selectorToken: {
            end: TPosition;
        }
    }

    export default function parse<TPosition>(reader: StreamReader<TPosition>): HtmlNode<TPosition>;
}
