// @ts-check

// Script to either host a local web server or run npm scripts

const http = require("http");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const folder = path.resolve(process.argv[2] || '../frontend');

/**
 * Returns a UTC-3 datetime string in the format "yyyy-mm-dd hh/mm/ss"
 * @param {Date} date
 */
function getBrazilianDateTimeString(date = new Date()) {
    date.setTime(date.getTime() - 3 * 60 * 60 * 1000);
    return date.toISOString().replace("T", " ").split(".")[0];
}

function getLogPrefix() {
    return "[" + getBrazilianDateTimeString() + "]";
}

function startLocalWebServer() {
    const server = http.createServer(onRequestStart);

    server.listen(8080, onStartListening);

    function onStartListening() {
        const htmlFiles = fs.readdirSync(folder).filter(file => file.endsWith(".html"));
        let startScript = "start http://localhost:8080/";
        if (htmlFiles.length > 0 && !htmlFiles.includes("index.html")) {
            startScript = "start http://localhost:8080/"+htmlFiles[0];
        }
        cp.execSync(startScript);
        console.log(getLogPrefix(), "Started web server at http://localhost:8080/");
    }


    function getMimeTypeFromExtension(extension = "txt") {
        if (extension[0] === ".") {
            extension = extension.substring(1);
        }
        return {
            "aac": "audio/aac",
            "abw": "application/x-abiword",
            "arc": "application/x-freearc",
            "avi": "video/x-msvideo",
            "azw": "application/vnd.amazon.ebook",
            "bin": "application/octet-stream",
            "bmp": "image/bmp",
            "bz": "application/x-bzip",
            "bz2": "application/x-bzip2",
            "cda": "application/x-cdf",
            "csh": "application/x-csh",
            "css": "text/css",
            "csv": "text/csv",
            "doc": "application/msword",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "eot": "application/vnd.ms-fontobject",
            "epub": "application/epub+zip",
            "gz": "application/gzip",
            "gif": "image/gif",
            "htm": "text/html",
            "html": "text/html",
            "ico": "image/vnd.microsoft.icon",
            "ics": "text/calendar",
            "jar": "application/java-archive",
            "jpeg": "image/jpeg",
            "jpg": "image/jpeg",
            "js": "text/javascript",
            "json": "application/json",
            "jsonld": "application/ld+json",
            "mid": "audio/midi audio/x-midi",
            "midi": "audio/midi audio/x-midi",
            "mjs": "text/javascript",
            "mp3": "audio/mpeg",
            "mp4": "video/mp4",
            "mpeg": "video/mpeg",
            "mpkg": "application/vnd.apple.installer+xml",
            "odp": "application/vnd.oasis.opendocument.presentation",
            "ods": "application/vnd.oasis.opendocument.spreadsheet",
            "odt": "application/vnd.oasis.opendocument.text",
            "oga": "audio/ogg",
            "ogv": "video/ogg",
            "ogx": "application/ogg",
            "opus": "audio/opus",
            "otf": "font/otf",
            "png": "image/png",
            "pdf": "application/pdf",
            "php": "application/x-httpd-php",
            "ppt": "application/vnd.ms-powerpoint",
            "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "rar": "application/vnd.rar",
            "rtf": "application/rtf",
            "sh": "application/x-sh",
            "svg": "image/svg+xml",
            "swf": "application/x-shockwave-flash",
            "tar": "application/x-tar",
            "tif": "image/tiff",
            "tiff": "image/tiff",
            "ts": "video/mp2t",
            "ttf": "font/ttf",
            "txt": "text/plain",
            "vsd": "application/vnd.visio",
            "wav": "audio/wav",
            "weba": "audio/webm",
            "webm": "video/webm",
            "webp": "image/webp",
            "woff": "font/woff",
            "woff2": "font/woff2",
            "xhtml": "application/xhtml+xml",
            "xls": "application/vnd.ms-excel",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "xml": "application/xml",
            "xul": "application/vnd.mozilla.xul+xml",
            "zip": "application/zip",
            "3gp": "video/3gpp",
            "3g2": "video/3gpp2",
            "7z": "application/x-7z-compressed"
        }[extension] || "application/octet-stream";
    }

    /**
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse} res
     */
    function onRequestStart(req, res) {
        if (req.method !== "GET") {
            console.log(getLogPrefix(), `${req.method} ${req.url} 405`);
            res.writeHead(405, "Method Not Allowed");
            return res.end();
        }
        if (req.url === '/') {
            res.setHeader("Content-Type", getMimeTypeFromExtension(".html"));
            const data = fs.readFileSync(path.resolve(folder, 'index.html'), 'utf-8');
            res.end(data.replace('<script src="./src/index.js" async defer type="module"></script>', '<script src="./index.js" async defer type="module"></script>'));
            return;
        }
        if (req.url === '/index.js') {
            res.setHeader("Content-Type", getMimeTypeFromExtension(".js"));
            const data = fs.readFileSync(path.resolve(folder, 'dist', 'index.js'), 'utf-8');
            res.end(data);
            return;
        }
        const parts = (req.url ? req.url.split('/') : []).map(part => decodeURIComponent(part)).join('/');
        const target = path.resolve(folder + parts);
        if (!fs.existsSync(target)) {
            console.log(getLogPrefix(), `${req.method} ${req.url} 404 (${target})`);
            res.writeHead(404, "Not Found");
            return res.end();
        }
        res.setHeader("Content-Type", getMimeTypeFromExtension(path.extname(target) || ".html"));
        if (fs.statSync(target).isDirectory()) {
            if (fs.existsSync(target + "/index.html")) {
                res.write(fs.readFileSync(target + "/index.html"), (err) => {
                    if (err) {
                        console.log(err);
                    }
                    console.log(getLogPrefix(), `${req.method} ${req.url} 200`);
                    res.end();
                });
                return;
            } else {
                console.log(getLogPrefix(), `${req.method} ${req.url} 404`);
                res.writeHead(404, "Not Found");
                return res.end();
            }
        }
        res.write(fs.readFileSync(target), (err) => {
            if (err) {
                console.log(err);
            }
            console.log(getLogPrefix(), `${req.method} ${req.url} 200`);
            res.end();
        });
        return;
    }
}

startLocalWebServer();