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
	import SnippetsRegistry from "@emmetio/snippets-registry";

	export interface ParseOptions {
		syntax?: string;
		field?(index: number, placeholder: string): string;
		text?: string | string[];
		profile?: object;
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
