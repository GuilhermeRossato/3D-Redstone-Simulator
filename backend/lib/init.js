import fs from "node:fs";
import process from "node:process";

import { getProjectFolderPath } from "../utils/getProjectFolderPath.js";

// Load environment variables from the .env file in the backend folder
const envFilePath = getProjectFolderPath('backend', '.env');
if (fs.existsSync(envFilePath)) {
  if (typeof process.loadEnvFile === "function") {
    console.log(
      "Loading environment variables with native loadEnvFile from:",
      envFilePath
    );
    process.loadEnvFile(envFilePath);
  } else {
    console.log(
      "Loading environment variables with loadEnvSync from:",
      envFilePath
    );
    const mod = await import("../utils/loadEnvSync.js");
    mod.loadEnvSync([envFilePath], process.env);
  }
} else {
  console.log(
    'Skipping loading of environment variables as (.env file not found)'
  );
}

// Check if the URL environment variable is set
let urlParam = process.env.URL||process.env.HOST||process.env.IP||process.env.ADDRESS;

if (!urlParam) {
  console.log(
    "No server address provided. Please provide a URL for the server using a URL env variable."
  );
  process.exit(4);
}

if (urlParam) {
  if (urlParam.startsWith("http://") || urlParam.startsWith("https://")) {
    urlParam = urlParam.substring(urlParam.indexOf("//") + 2);
  }
  if (urlParam.includes("/")) {
    urlParam = urlParam.split("/")[0];
  }
}
if (urlParam.endsWith("/")) {
  urlParam = urlParam.substring(urlParam.length - 1);
}

const q = urlParam.indexOf(":");

export const url = urlParam;
export const host = urlParam.substring(0, q === -1 ? urlParam.length : q);
export const port =
  q === -1 ? process.env.PORT || "8080" : urlParam.substring(q + 1);
