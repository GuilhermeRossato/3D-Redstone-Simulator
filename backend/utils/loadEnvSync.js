import fs from "node:fs";
import path from "node:path";

export function loadEnvSync(folderList = [], envRecord = {}, whiteList = []) {
  if (folderList.length === 0) {
    folderList.push(process.cwd());
  }
  for (const folder of folderList) {
    try {
      if (!folder || typeof folder !== "string" || !fs.existsSync(folder)) {
        continue;
      }
      const target = fs.statSync(folder).isDirectory() ? path.resolve(folder, ".env") : folder;
      const text = fs.readFileSync(target, "utf-8");
      const list = text.split("\n").reverse();
      for (const line of list) {
        if (!line.trim().length || ["#", "/"].includes(line.trim()[0])) {
          continue;
        }
        const i = line.indexOf("=");
        const key = line.substring(0, i === -1 ? line.length : i).trim();
        if (key.includes(" ") || key.includes("\t")) {
          continue;
        }
        if (whiteList && whiteList.length && !whiteList.includes(key)) {
          continue;
        }
        const value = i === -1 ? "" : line.substring(i + 1);
        if (!envRecord[key] && value) {
          envRecord[key] =
            value.startsWith('"') && value.endsWith('"') ? value.substring(1, value.length - 1) : value.trim();
        }
      }
    } catch (err) {
      continue;
    }
  }
  return envRecord;
}
