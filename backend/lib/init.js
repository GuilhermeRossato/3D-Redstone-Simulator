import fs from "node:fs";
import process from "node:process";

console.log("Starting backend server script...");

import { extractArgs } from "../utils/extractArgs.js";

export const backendPath = fs.existsSync("./backend") ? "./backend" : ".";

if (fs.existsSync(`${backendPath}/.env`)) {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(`${backendPath}/.env`);
  } else {
    console.log("Could not find loadEnvFile function. Skipping loading env file.");
  }
} else {
  console.log(
    "Could not find .env file. Skipping loading environment variables."
  );
}

let urlParam = extractArgs(["--url", "--host", "--ip", "--address"], 2)[1];

if (
  !urlParam &&
  (process.argv[2]?.startsWith?.("localhost") ||
    process.argv[2]?.split?.(".")?.length === 4)
) {
  urlParam = process.argv[2];
}

if (!urlParam) {
  urlParam = process.env.URL;
}

if (!urlParam) {
  console.log(
    "No server address provided. Please provide a URL using the --url argument or the URL env variable."
  );
  process.exit(4);
}

if (urlParam.startsWith("http://")) {
  urlParam = urlParam.substring(7);
}
if (urlParam.startsWith("https://")) {
  urlParam = urlParam.substring(8);
}
if (urlParam.endsWith("/")) {
  urlParam = urlParam.substring(urlParam.length - 1);
}

const q = urlParam.indexOf(":");

export const url = urlParam;
export const host = urlParam.substring(0, q === -1 ? urlParam.length : q);
export const port =
  q === -1 ? process.env.PORT || "8080" : urlParam.substring(q + 1);
