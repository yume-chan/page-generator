process.env.NODE_ENV = "production";

import * as fs from "fs-extra";

import * as packager from "electron-packager";

import Compile from "./core";

Compile(() => {
    packager({
        dir: "./out",
        out: "./bin",
        overwrite: true
    }, async (err, path) => {
        if (err) {
            console.error(err);
            return;
        }

        for (const item of path) {
            await fs.copy("./react-dev-tools", item + "/react-dev-tools");
            await fs.copy("./templates", item + "/templates");
        }
    })
});
