import * as webpack from "webpack";

import * as main from "./main";
import * as renderer from "./renderer";

export default function Complile(callback: () => void): void {
    webpack([main, renderer], (err: any, stats) => {
        if (err) {
            console.error(err.stack || err);
            if (err.details)
                console.error(err.details);
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
            return;
        }

        callback();
    });
}
