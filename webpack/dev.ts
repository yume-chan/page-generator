import * as path from 'path';
import { spawn } from 'child_process';

import * as webpack from "webpack";
import * as WebpackDevServer from "webpack-dev-server";

import { main, renderer } from "./config";

webpack(main, (err: any, stats) => {
    if (err) {
        console.error(err.stack || err);
        if (err.details)
            console.error(err.details);
        process.exit(0);
        return;
    }

    const info = stats.toJson();

    if (stats.hasWarnings()) {
        for (const item of info.warnings)
            console.error(item);
    }

    if (stats.hasErrors()) {
        for (const item of info.errors)
            console.error(item);
        process.exit(0);
        return;
    }

    const serverConfig: any = {
        hot: true,
        contentBase: "out",
        stats: {
            colors: true
        },
    };
    (renderer.entry as string[]).unshift("webpack-dev-server/client?http://localhost:3000/", "webpack/hot/dev-server");
    const server = new WebpackDevServer(webpack(renderer), serverConfig);
    server.listen(3000, () => {
        let electronPath =
            process.platform == "win32" ?
                path.resolve(__dirname, "..", "node_modules", ".bin", "electron.cmd") :
                path.resolve(__dirname, "..", "node_modules", ".bin", "electron");
        if (electronPath.includes(" "))
            electronPath = `"${electronPath}"`;
        const electron = spawn(electronPath, [path.resolve(main.output!.path, main.output!.filename), "--devTools"]);
        electron.on("exit", () => {
            process.exit(0);
        });
    });
});
