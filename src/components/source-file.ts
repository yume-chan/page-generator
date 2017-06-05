import * as fs from "fs";
import * as path from "path";

import { observable, computed } from "mobx";

export interface Template {
    name: string;
    uri: string;
    uriReplace: string;
    html: string;
    htmlReplace: { [key: string]: { replace: string; default: string } };
}

export namespace fsAsync {
    export function readdir(path: string | Buffer): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            fs.readdir(path, (err, files) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(files);
            })
        })
    }

    export function readFile(filename: string, encoding: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(filename, encoding, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(data);
            });
        });
    }

    export function stat(path: string | Buffer): Promise<fs.Stats> {
        return new Promise<fs.Stats>((resolve, reject) => {
            fs.stat(path, (err, stats) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(stats);
            });
        });
    }

    export function exists(path: string | Buffer): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            fs.exists(path, exists => {
                resolve(exists);
            });
        });
    }
}

export namespace Template {
    export async function loadAsync(folder: string): Promise<Template[]> {
        const files = await fsAsync.readdir(folder);

        const result: Template[] = [];

        for (const file of files) {
            const parsed = path.parse(file);
            if (parsed.ext == ".json") {
                const fullPath = path.resolve(folder, file);
                const data = await fsAsync.readFile(fullPath, "utf-8");

                const template = JSON.parse(data) as Template;
                template.name = parsed.name;

                const htmlPath = path.resolve(folder, template.html);
                const html = await fsAsync.readFile(htmlPath, "utf-8");
                template.html = html;

                result.push(template);
            }
        }

        return result;
    }
}

export interface ProjectFile {
    name: string;
    template: string;
    templateReplace: { [key: string]: string };

}

export class Project {
    @observable dirty: boolean;
    path: string | undefined;

    templateReplace: { [key: string]: string };

    constructor(public name: string, public template: Template, templateReplace: { [key: string]: string } | undefined = undefined) {
        if (templateReplace !== undefined) {
            this.templateReplace = templateReplace;
        } else {
            this.templateReplace = {};
            for (const key of Object.keys(template.htmlReplace))
                this.templateReplace[key] = template.htmlReplace[key].default;
        }
    }
}
