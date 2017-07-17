import fs from "fs-extra";
import path from "path";

import ejs from "ejs";
import sizeOf from "image-size";

import { action, observable } from "../object-proxy";

export interface TemplateReplace {
    readonly replace: string;
    readonly default: string;
    readonly match?: string;
    readonly buildOnly?: boolean;
    readonly hidden?: boolean;
}

export interface Template {
    readonly category: string;
    readonly customScript?: string;
    readonly name: string;
    readonly uri: string;
    readonly uriReplace: string;
    readonly htmlName: string;
    readonly htmlPath: string;
    readonly html: string;
    readonly htmlType: "ejs" | "html";
    readonly htmlReplace: { readonly [key: string]: TemplateReplace };
    readonly contentReplace: string | undefined;
    readonly background: "css";
    readonly backgroundReplace: string;
}

export interface TemplateCategory {
    name: string;
    templates: Template[];
}

export const Template = {
    async loadAsync(folder: string): Promise<TemplateCategory[]> {
        const result: TemplateCategory[] = [];

        for (const categoryName of await fs.readdir(folder)) {
            // Some SVN client adds `.svn` folder recursively, ignore them.
            if (categoryName.startsWith("."))
                continue;

            const categoryPath = path.resolve(folder, categoryName);
            if ((await fs.stat(categoryPath)).isDirectory()) {
                const templates: Template[] = [];
                const category: TemplateCategory = {
                    name: categoryName,
                    templates,
                };
                result.push(category);

                for (const templateName of await fs.readdir(categoryPath)) {
                    // Some SVN client adds `.svn` folder recursively, ignore them.
                    if (templateName.startsWith("."))
                        continue;

                    const templatePath = path.resolve(categoryPath, templateName);
                    if ((await fs.stat(templatePath)).isDirectory()) {
                        const template = await fs.readJson(path.resolve(templatePath, "manifest.json")) as Template;
                        // Temporarily breaks readonly contract
                        (template as any).category = categoryName;
                        (template as any).name = templateName;

                        if (template.customScript !== undefined) {
                            const script = path.resolve(templatePath, template.customScript);
                            (template as any).customScript = script;
                        }

                        const htmlPath = path.resolve(templatePath, template.htmlName);
                        (template as any).htmlPath = htmlPath;

                        const html = await fs.readFile(htmlPath, "utf-8");
                        (template as any).html = html;

                        if (template.htmlType === undefined)
                            (template as any).htmlType = "html";

                        templates.push(template);
                    }
                }
            }
        }

        return result;
    },
};

interface ImageInfo {
    width: number;
    height: number;
    type: string;
}

async function sizeOfAsync(filePath: string): Promise<ImageInfo> {
    const buffer = await fs.readFile(filePath);
    return sizeOf(buffer);
}

export interface ProjectFile {
    name: string;
    template: string;
    templateReplace: { [key: string]: string };
    background: string[];
    content: string;
}

export interface ProjectBackground {
    path: string;
    relativePath: string | undefined;
    width: number;
    height: number;
}

export class Project {
    public readonly name: string;
    public readonly template: Template;
    public readonly uri: string;
    public filename: string | undefined;
    public assetsPath: string | undefined;

    @observable
    public content: string;

    @observable
    public dirty: boolean;

    @observable.array
    public background: ProjectBackground[] = [];

    @observable.deep
    public templateReplace: { [key: string]: string };

    constructor(name: string, template: Template, filename?: string, file?: ProjectFile) {
        this.name = name;
        this.template = template;

        this.uri = template.uri.replace(template.uriReplace, name);

        if (file !== undefined) {
            this.filename = filename;

            this.templateReplace = { ...file.templateReplace };
            this.initializeBackground(...file.background);

            this.content = file.content;
        } else {
            this.templateReplace = {};
            for (const key of Object.keys(template.htmlReplace))
                this.templateReplace[key] = template.htmlReplace[key].default;

            this.content = "";
        }
    }

    public async addBackgroundAsync(...fullPath: string[]) {
        const result: ProjectBackground[] = [];
        for (const item of fullPath) {
            // Use unix path for `relativePath`
            // It will later be used in css
            let relativePath: string | undefined;
            if (this.filename !== undefined)
                relativePath = path.relative(this.filename, item).replace(/\\/g, "/");

            const size = await sizeOfAsync(item);
            const temp = {
                path: item,
                relativePath,
                ...size,
            };

            result.push(temp);
        }

        this.addBackgroundsCore(result);
    }

    @action
    public reorderBackground(oldIndex: number, newIndex: number) {
        const splice = this.background.splice(oldIndex, 1);
        this.background.splice(newIndex, 0, splice[0]);
    }

    public async saveAsync(filename: string) {
        this.filename = filename;

        const dirname = path.dirname(filename);
        await fs.ensureDir(dirname);

        // Copy assets
        this.assetsPath = path.resolve(dirname, this.name);
        await fs.ensureDir(this.assetsPath);

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

        const file: ProjectFile = {
            background: this.background.map((item) => item.relativePath as string),
            content: this.content,
            name: this.name,
            template: `${this.template.category}/${this.template.name}`,
            templateReplace: this.templateReplace,
        };

        // Save
        await fs.writeJson(filename, file, { spaces: 4 });
    }

    public async buildAsync(preview: boolean): Promise<string> {
        function fileUrl(file: string) {
            let pathName = path.resolve(file).replace(/\\/g, "/");

            // Windows drive letter must be prefixed with a slash
            if (pathName[0] !== "/")
                pathName = "/" + pathName;

            return encodeURI("file://" + pathName);
        }

        const template = this.template;

        let result = template.html;
        for (const key of Object.keys(template.htmlReplace)) {
            const replace = template.htmlReplace[key];
            if (replace.buildOnly && preview)
                continue;

            const value = this.templateReplace[key];
            if (replace.match !== undefined)
                result = result.replace(new RegExp(replace.match, "g"), (match) => match.replace(new RegExp(replace.replace, "g"), value));
            else
                result = result.replace(replace.replace, value);
        }

        const background: string[] = [];
        switch (template.background) {
            case "css":
                if (this.background.length !== 0) {
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
                } else {
                    result = result.replace(template.backgroundReplace, "");
                }
                break;
        }

        if (template.contentReplace)
            result = result.replace(template.contentReplace, this.content);

        if (template.customScript !== undefined) {
            const build = (global as any).require(template.customScript);
            result = await build(result, preview);
        }

        if (preview) {
            switch (template.htmlType) {
                case "ejs":
                    result = ejs.render(result, undefined, {
                        filename: template.htmlPath,
                    });
                    break;
            }
        }

        return result;
    }

    @action
    private addBackgroundsCore(items: ProjectBackground[]) {
        this.background.push(...items);
    }

    private async initializeBackground(...files: string[]) {
        await this.addBackgroundAsync(...files.map((item) => path.resolve(this.filename, item)));
        this.dirty = false;
    }
}

export interface ProjectProps {
    project: Project;
}
