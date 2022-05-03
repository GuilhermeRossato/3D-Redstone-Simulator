export default async function loadTextResource(filePath) {
    const response = await fetch(filePath);
    const text = await response.text();
    return text;
}