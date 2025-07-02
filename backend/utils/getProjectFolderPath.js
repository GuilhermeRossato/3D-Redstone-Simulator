import fs from "fs";
import path from "path";
import process from "process";

let selfProjectPath = "";

/**
 * Checks if the given folder path is a valid project path.
 */
export function isValidProjectPath(folder) {
  const requiredFiles = ["package.json", "README.md", ".gitignore"];
  const requiredDirs = ["backend", "frontend"];

  // Check required files
  for (const file of requiredFiles) {
    const filePath = path.join(folder, file);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return false;
    }

    if (fs.statSync(filePath).size === 0) {
      // Check if the file is empty
      return false;
    }
  }

  // Check required directories
  for (const dir of requiredDirs) {
    const dirPath = path.join(folder, dir);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      return false;
    }

    const children = fs.readdirSync(dirPath);
    if (children.length === 0) {
      // Check if the folder has children
      return false;
    }
  }

  return true;
}

/**
 * Get this project's root folder path.
 */
export function getProjectFolderPath(...extraPaths) {
  if (!selfProjectPath) {
    const script = path.resolve(process.cwd(), process.argv[1]);
    let folder = fs.statSync(script).isFile()
      ? path.dirname(script)
      : script;
    if (!fs.existsSync(folder)) {
      throw new Error(`Invalid project folder: Path ${folder} does not exist`);
    }
    if (!fs.statSync(folder).isDirectory()) {
      throw new Error(`Invalid project folder: Path ${folder} is not a directory`);
    }
    for (let i = 0; i < 4 && folder.length > 4; i++) {
      if (isValidProjectPath(folder)) {
        break;
      }
      folder = path.dirname(folder);
    }
    if (!isValidProjectPath(folder)) {
      throw new Error(`Could not determine project folder path from: ${process.cwd()}`);
    }
    selfProjectPath = folder;
  }
  if (extraPaths.length > 0) {
    return path.join(selfProjectPath, ...extraPaths);
  }
  return selfProjectPath;
}
