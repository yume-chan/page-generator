import { observable, computed } from "mobx"

export interface Template {
    name: string;
    uriPrefix: string;
    uriSuffix: string;
    template: string;
    replace: { [key: string]: { replace: string; default: string } };
}

export class SourceFile {
    @observable dirty: boolean;
    path: string | undefined;

    templateReplace: { [key: string]: string };

    constructor(public name: string, public template: Template) { }
}
