'use strict';

export default class AssetLoader {
  static parseJSONL(jsonl) {
    const lines = jsonl.split('\n').map(a=>a.trim()).map(a=>a.endsWith('},')?a.substring(0, a.length - 1):a).filter(line => line.length);
    const objects = lines.map(line => JSON.parse(line));
    return objects;
  }
  
  /**
   * Loads a text file from the server.
   * @param {string} target - The path to the text file to load.
   * @returns {Promise<string>} - The content of the text file or an Error if loading failed.
   */
  static async loadText(target) {
      const response = await fetch(target, {
          cache: 'no-store'
      });
      if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Could not load text file "${target}"`);
      }
      return await response.text();
  }
  
  /**
   * Loads a binary file (blob) from the server.
   * @param {string} target - The path to the binary file to load.
   * @returns {Promise<Blob>} - The binary content of the file or an Error if loading failed.
   */
  static async loadBlob(target) {
      const response = await fetch(target, {
          cache: 'no-store'
      });
      if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Could not load blob file "${target}"`);
      }
      return await response.blob();
  }
  
  loadImage(filename) {
    return new Promise((resolve, reject) => {
      if (!filename || filename.trim().length === 0) {
        reject(new Error("Required parameter 'filename' not provided for loadImage"))
      }
      try {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Could not load image \"" + filename + "\""));
        image.src = filename;
      } catch (err) {
        console.log("caught before");
        console.log(err);
        reject(err);
      }
      window.setTimeout(reject.bind(this, new Error("Timeout on image load (" + filename + ")")), 8000);
    })
  }
}