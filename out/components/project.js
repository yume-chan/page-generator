import * as tslib_1 from "tslib";
import * as fs from "fs-extra";
import * as path from "path";
import * as sizeOf from "image-size";
import * as ejs from "ejs";
import { observable } from "../object-proxy";
import { action } from "../object-proxy/";
export var Template;
(function (Template) {
    async function loadAsync(folder) {
        const result = [];
        for (const categoryName of await fs.readdir(folder)) {
            const categoryPath = path.resolve(folder, categoryName);
            if ((await fs.stat(categoryPath)).isDirectory()) {
                const templates = [];
                const category = {
                    name: categoryName,
                    templates
                };
                result.push(category);
                for (const templateName of await fs.readdir(categoryPath)) {
                    const templatePath = path.resolve(categoryPath, templateName);
                    if ((await fs.stat(templatePath)).isDirectory()) {
                        const template = await fs.readJson(path.resolve(templatePath, "manifest.json"), "utf-8");
                        // Temporarily breaks readonly contract
                        template.category = categoryName;
                        template.name = templateName;
                        if (template.customScript !== undefined) {
                            const script = path.resolve(templatePath, template.customScript);
                            template.customScript = script;
                        }
                        const htmlPath = path.resolve(templatePath, template.htmlName);
                        template.htmlPath = htmlPath;
                        const html = await fs.readFile(htmlPath, "utf-8");
                        template.html = html;
                        templates.push(template);
                    }
                }
            }
        }
        return result;
    }
    Template.loadAsync = loadAsync;
})(Template || (Template = {}));
async function sizeOfAsync(path) {
    const buffer = await fs.readFile(path);
    return sizeOf(buffer);
}
export class Project {
    constructor(name, template, filename = undefined, file = undefined) {
        this.background = [];
        this.name = name;
        this.template = template;
        this.uri = template.uri.replace(template.uriReplace, name);
        if (file !== undefined) {
            this.filename = filename;
            this.templateReplace = Object.assign({}, file.templateReplace);
            this.initializeBackground(...file.background);
        }
        else {
            this.templateReplace = {};
            for (const key of Object.keys(template.htmlReplace))
                this.templateReplace[key] = template.htmlReplace[key].default;
        }
    }
    async initializeBackground(...files) {
        await this.addBackgroundAsync(...files.map(item => path.resolve(this.filename, item)));
        this.dirty = false;
    }
    async addBackgroundAsync(...fullPath) {
        for (const item of fullPath) {
            // Use unix path for `relativePath`
            // It will later be used in css
            let relativePath;
            if (this.filename !== undefined)
                relativePath = path.relative(this.filename, item).replace(/\\/g, "/");
            const size = await sizeOfAsync(item);
            const temp = Object.assign({ path: item, relativePath }, size);
            this.background.push(temp);
        }
    }
    reorderBackground(oldIndex, newIndex) {
        const splice = this.background.splice(oldIndex, 1);
        this.background.splice(newIndex, 0, splice[0]);
    }
    async saveAsync(filename) {
        this.filename = filename;
        const dirname = path.dirname(filename);
        await fs.ensureDir(dirname);
        // Copy assets
        this.assetsPath = path.resolve(dirname, this.name);
        await fs.ensureDir(this.assetsPath);
        const background = [];
        for (const item of this.background) {
            const name = path.resolve(this.assetsPath, path.basename(item.path));
            // Is this file already in assets folder?
            if (item.path !== name) {
                await fs.copy(item.path, name);
                background.push(name);
            }
            else {
                background.push(item.path);
            }
        }
        this.background = [];
        await this.addBackgroundAsync(...background);
        // Build html
        const content = await this.buildAsync(false);
        await fs.writeFile(path.resolve(this.assetsPath, this.template.htmlName), content);
        const file = {
            name: this.name,
            template: `${this.template.category}/${this.template.name}`,
            background: this.background.map(item => item.relativePath),
            templateReplace: this.templateReplace
        };
        // Save
        await fs.writeJson(filename, file, { spaces: 4 });
    }
    async buildAsync(preview) {
        function fileUrl(file) {
            var pathName = path.resolve(file).replace(/\\/g, '/');
            // Windows drive letter must be prefixed with a slash
            if (pathName[0] !== '/') {
                pathName = '/' + pathName;
            }
            return encodeURI('file://' + pathName);
        }
        ;
        const template = this.template;
        let result = template.html;
        for (const key of Object.keys(template.htmlReplace)) {
            const replace = template.htmlReplace[key];
            if (replace.buildOnly && preview)
                continue;
            const value = this.templateReplace[key];
            if (replace.match !== undefined)
                result = result.replace(new RegExp(replace.match, "g"), match => match.replace(new RegExp(replace.replace, "g"), value));
            else
                result = result.replace(replace.replace, value);
        }
        const background = [];
        switch (template.background) {
            case "css":
                if (this.background.length != 0) {
                    const backgroundPosition = ["0"];
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
        if (template.customScript !== undefined) {
            const build = global.require(template.customScript);
            result = await build(result, preview);
        }
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
tslib_1.__decorate([
    observable
], Project.prototype, "dirty", void 0);
tslib_1.__decorate([
    observable.array
], Project.prototype, "background", void 0);
tslib_1.__decorate([
    observable.deep
], Project.prototype, "templateReplace", void 0);
tslib_1.__decorate([
    observable
], Project.prototype, "content", void 0);
tslib_1.__decorate([
    action
], Project.prototype, "reorderBackground", null);
//# sourceMappingURL=project.js.map