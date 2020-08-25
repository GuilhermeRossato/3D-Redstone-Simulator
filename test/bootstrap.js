// @ts-check

import * as fs from "fs";
import { join } from "path";
import * as cp from "child_process";

const originPath = join(process.cwd(), "test");
const testFiles = fs.readdirSync(originPath).filter(file => file !== "bootstrap.js").map(file => join(originPath, file));

(async function init(filePathList) {
    const fileDesc = [];
    for (let file of filePathList) {
        if (!fs.existsSync(file)) {
            console.log(`File not found: "${file}"`);
            continue;
        }
        const friendlyPath = file.replace(originPath, "./").replace(/\//g, "/");
        process.stdout.write("\t" + friendlyPath.replace(/\\/g, "") + "\n");

        await new Promise((resolve, reject) => {
            const child = cp.spawn("node", ["--experimental-modules", file]);

            child.stderr.on('data', (data) => {
                data = data.toString("utf8");
                if (data.includes("ExperimentalWarning: The ESM module loader is experimental")) {
                    return;
                }
                if (data) {
                    process.stdout.write(data);
                }
            });

            child.stdout.on('data', (data) => {
                process.stdout.write(data);
            });

            child.on("close", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error("Script returned exit code " + code));
                }
            });
        });
    }

})(testFiles).catch(console.error);

