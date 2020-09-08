export default class ResourceLoader {
    static async load(filename) {
        const response = await fetch(filename);
        const text = await response.text();
        return text;
    }
}