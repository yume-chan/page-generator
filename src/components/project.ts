import * as fs from "fs-extra";
import * as path from "path";

import { observable, computed, action } from "mobx";

import * as sizeOf from "image-size";
import * as ejs from "ejs";

export interface TemplateReplace {
    readonly replace: string;
    readonly default: string;
    readonly match?: string;
    readonly buildOnly?: boolean;
}

export interface Template {
    readonly name: string;
    readonly uri: string;
    readonly uriReplace: string;
    readonly htmlName: string;
    readonly htmlPath: string;
    readonly html: string;
    readonly htmlType: "ejs" | "html";
    readonly htmlReplace: { readonly [key: string]: TemplateReplace };
    readonly background: "css";
    readonly backgroundReplace: string;
}

export namespace Template {
    export async function loadAsync(folder: string): Promise<Template[]> {
        const files = await fs.readdir(folder);

        const result: Template[] = [];

        for (const file of files) {
            const fullPath = path.resolve(folder, file);
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
                const template = await fs.readJson(path.resolve(fullPath, "manifest.json"), "utf-8") as Template;
                // Temporarily breaks readonly contract
                (template as any).name = file;

                const htmlPath = path.resolve(fullPath, template.htmlName);
                (template as any).htmlPath = htmlPath;

                const html = await fs.readFile(htmlPath, "utf-8");
                (template as any).html = html;

                result.push(template);
            }
        }

        return result;
    }
}

interface ImageInfo {
    width: number;
    height: number;
    type: string;
}

async function sizeOfAsync(path: string): Promise<ImageInfo> {
    const buffer = await fs.readFile(path);
    return sizeOf(buffer);
}

export interface ProjectFile {
    name: string;
    template: string;
    templateReplace: { [key: string]: string };
    background: string[];
}

export interface ProjectBackground {
    path: string;
    relativePath: string | undefined;
    width: number;
    height: number;
}

export class Project {
    readonly name: string;
    readonly template: Template;
    readonly uri: string;

    filename: string | undefined;
    assetsPath: string | undefined;

    @observable
    dirty: boolean;

    @observable
    background: ProjectBackground[] = [];

    @observable
    templateReplace: Map<string, string> = new Map<string, string>();

    constructor(name: string, template: Template, filename: string | undefined = undefined, file: ProjectFile | undefined = undefined) {
        this.name = name;
        this.template = template;

        this.uri = template.uri.replace(template.uriReplace, name);

        if (file !== undefined) {
            this.filename = filename;

            for (const key of Object.keys(file.templateReplace))
                this.templateReplace.set(key, file.templateReplace[key]);

            this.initializeBackground(...file.background);
        } else {
            for (const key of Object.keys(template.htmlReplace))
                this.templateReplace.set(key, template.htmlReplace[key].default);
        }
    }

    private async initializeBackground(...files: string[]) {
        await this.addBackgroundAsync(...files.map(item => path.resolve(this.filename, item)));
        this.dirty = false;
    }

    async addBackgroundAsync(...fullPath: string[]) {
        for (const item of fullPath) {
            // Use unix path for `relativePath`
            // It will later be used in css
            let relativePath: string | undefined;
            if (this.filename !== undefined)
                relativePath = path.relative(this.filename, item).replace(/\\/g, "/");

            const size = await sizeOfAsync(item);

            this.background.push({
                path: item,
                relativePath,
                ...size
            });
        }
    }

    async saveAsync(filename: string) {
        this.filename = filename;

        const dirname = path.dirname(filename);
        await fs.mkdirp(dirname);

        // Copy assets
        this.assetsPath = path.resolve(dirname, this.name);
        await fs.mkdirp(this.assetsPath);

        const background: string[] = [];
        for (const item of this.background) {
            const name = path.resolve(this.assetsPath, path.basename(item.path));
            // Is this file already in assets folder?
            if (item.path !== name) {
                await fs.copy(item.path, name);
                background.push(name);
            } else {
                background.push(item.path);
            }
        }
        this.background = [];
        await this.addBackgroundAsync(...background);

        // Build html
        const content = await this.buildAsync(false);
        await fs.writeFile(path.resolve(this.assetsPath, this.template.htmlName), content);

        // Convert replace
        let replace: any = {};
        for (const [key, value] of this.templateReplace)
            replace[key] = value;

        const file: ProjectFile = {
            name: this.name,
            template: this.template.name,
            background: this.background.map(item => item.relativePath as string),
            templateReplace: replace
        }

        // Save
        await fs.writeJson(filename, file, { spaces: 4 });
    }

    async buildAsync(preview: boolean): Promise<string> {
        function fileUrl(file: string) {
            var pathName = path.resolve(file).replace(/\\/g, '/');

            // Windows drive letter must be prefixed with a slash
            if (pathName[0] !== '/') {
                pathName = '/' + pathName;
            }

            return encodeURI('file://' + pathName);
        };

        const template = this.template;

        let result = template.html;
        for (const key of Object.keys(template.htmlReplace)) {
            const replace = template.htmlReplace[key];
            if (replace.buildOnly && preview)
                continue;

            const value = this.templateReplace.get(key) as string;
            if (replace.match !== undefined)
                result = result.replace(new RegExp(replace.match, "g"), match => match.replace(new RegExp(replace.replace, "g"), value));
            else
                result = result.replace(replace.replace, value);
        }

        const background: string[] = [];
        switch (template.background) {
            case "css":
                if (this.background.length != 0) {
                    const backgroundPosition: string[] = ["0"];
                    let height = 0;
                    for (const item of this.background) {
                        if (preview)
                            background.push(`url("${fileUrl(item.path)}")`);
                        else
                            background.push(`url("${item.relativePath}")`);

                        height += item.height;
                        backgroundPosition.push(height + "px");
                    }

                    result = result.replace(template.backgroundReplace, `
background-image: ${background.join(", ")};
background-position-y: ${backgroundPosition.join(", ")};
height: ${height + "px"};
`);
                }
                else {
                    result = result.replace(template.backgroundReplace, "");
                }
                break;
        }
        // for (const item of this.background)
        //     background.push(`<img src="${item}">`);

        result = result.replace("{{CONTENT}}", "");

        if (preview) {
            switch (template.htmlType) {
                case "ejs":
                    result = ejs.render(result, undefined, {
                        filename: template.htmlPath
                    });
                    break;
            }
        }

        return result;
    }
}
