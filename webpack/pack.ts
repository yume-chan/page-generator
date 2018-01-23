process.env.NODE_ENV = "production";

import * as fs from "fs-extra";

import * as packager from "electron-packager";
import * as webpack from "webpack";

import { main, renderer } from "./config";

webpack([renderer, main], (err: any, stats) => {
    if (err) {
        console.error(err.stack || err);
        if (err.details)
            console.error(err.details);
        return;
    }

    const info = stats.toJson();

    if (stats.hasWarnings())
        for (const item of info.warnings)
            console.error(item);

    if (stats.hasErrors()) {
        for (const item of info.errors)
            console.error(item);
        return;
    }

    const packConfig = {
        dir: "./out",
        out: "./bin",
        overwrite: true,
    };
    // tslint:disable-next-line:no-shadowed-variable
    packager(packConfig, async (err, path) => {
        if (err) {
            console.error(err);
            return;
        }

        for (const item of path) {
            await fs.copy("./react-dev-tools", item + "/react-dev-tools");
            await fs.copy("./templates", item + "/templates");
        }

        process.exit(0);
    });
});
