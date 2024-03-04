// This is a static http server script

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join, resolve } from 'path';
import { createServer } from 'http';
import { stat, readFile } from 'fs';

/**
 * @param {string} parameter
 * @param {string} fallback
 */
function getArgumentOrDefault(parameter, fallback) {
    const before = process.argv.slice(2).map((arg, index) => ({arg, index})).filter(({arg}) => arg === parameter).pop();
    return before ? process.argv[2 + before.index + 1] || fallback : fallback;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = {host: getArgumentOrDefault('--host', 'localhost'), port: getArgumentOrDefault('--port', '8080'), path: getArgumentOrDefault('--path', __dirname)};
const mimeLookup = {'aac':'audio/aac','abw':'application/x-abiword','arc':'application/x-freearc','avi':'video/x-msvideo','azw':'application/vnd.amazon.ebook','bin':'application/octet-stream','bmp':'image/bmp','bz':'application/x-bzip','bz2':'application/x-bzip2','csh':'application/x-csh','css':'text/css','csv':'text/csv','doc':'application/msword','docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','eot':'application/vnd.ms-fontobject','epub':'application/epub+zip','gz':'application/gzip','gif':'image/gif','htm':'text/html','html':'text/html','ico':'image/vnd.microsoft.icon','ics':'text/calendar','jar':'application/java-archive','jpeg':'image/jpeg','jpg':'image/jpeg','js':'text/javascript','json':'application/json','jsonld':'application/ld+json','mid':'audio/midi','midi':'audio/midi','mjs':'text/javascript','mp3':'audio/mpeg','mpeg':'video/mpeg','mpkg':'application/vnd.apple.installer+xml','odp':'application/vnd.oasis.opendocument.presentation','ods':'application/vnd.oasis.opendocument.spreadsheet','odt':'application/vnd.oasis.opendocument.text','oga':'audio/ogg','ogv':'video/ogg','ogx':'application/ogg','opus':'audio/opus','otf':'font/otf','png':'image/png','pdf':'application/pdf','php':'application/x-httpd-php','ppt':'application/vnd.ms-powerpoint','pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation','rar':'application/vnd.rar','rtf':'application/rtf','sh':'application/x-sh','svg':'image/svg+xml','swf':'application/x-shockwave-flash','tar':'application/x-tar','tif':'image/tiff','tiff':'image/tiff','ts':'video/mp2t','ttf':'font/ttf','txt':'text/plain','vsd':'application/vnd.visio','wav':'audio/wav','weba':'audio/webm','webm':'video/webm','webp':'image/webp','woff':'font/woff','woff2':'font/woff2','xhtml':'application/xhtml+xml','xls':'application/vnd.ms-excel','xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','xml':'application/xml ','xul':'application/vnd.mozilla.xul+xml','zip':'application/zip','3gp':'video/3gpp','3g2':'video/3gpp2','7z':'application/x-7z-compressed'};

createServer(function (request, response) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const uri = url.pathname;
    if (uri.includes("..")) {
        console.log(`[${(new Date()).toISOString()}] 404 ${uri} (unsafe request blocked)`);
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.write('404 Not Found\n');
        response.end();
        return;
    }
    let filename = join(config.path, decodeURIComponent(uri));
    stat(filename, function (err, stats) {
        if (err) {
            if (err.code === "ENOENT") {
                console.log(`[${(new Date()).toISOString()}] 404 ${uri} Not found: "${resolve(filename)}"`);
                response.writeHead(404, {'Content-Type': 'text/plain'});
                response.write('404 Not Found\n');
            } else {
                console.log(`[${(new Date()).toISOString()}] 500 ${uri} ${err.toString()}`);
                response.writeHead(500, {'Content-Type': 'text/plain'});
                response.write(err + '\n');
            }
            response.end();
            return;
        }
        if (stats.isDirectory()) {
            filename += '/index.html';
        }
        readFile(filename, 'binary', function (err, file) {
            if (err) {
                if (err.code === "ENOENT") {
                    console.log(`[${(new Date()).toISOString()}] 404 ${uri} Not found: "${resolve(filename)}"`);
                    response.writeHead(404, {'Content-Type': 'text/plain'});
                    response.write('404 Not Found\n');
                } else {
                    console.log(`[${(new Date()).toISOString()}] 500 ${uri} ${err.toString()}`);
                    response.writeHead(500, {'Content-Type': 'text/plain'});
                    response.write(err + '\n');
                }
                response.end();
                return;
            }
            const type = mimeLookup[filename.substring(filename.lastIndexOf(".")+1)];
            response.writeHead(200, {'Content-Type': type || "text/plain"});
            response.write(file, 'binary');
            response.end();
            console.log(`[${(new Date()).toISOString()}] 200 ${uri}`);
        });
    });
}).listen(
    parseInt(config.port.toString(), 10),
    config.host,
    () => console.log(`[${(new Date()).toISOString()}] Listening at 'http://${config.host}${config.port.toString() !== '80' ? ':' + config.port : ''}/' and serving '${resolve(config.path)}'`)
);
