const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 4173;
const rootDir = path.resolve(__dirname, "..");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".vcf": "text/vcard; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".zip": "application/zip"
};

function resolvePath(urlPath) {
  const pathname = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = pathname === "/" ? "/index.html" : pathname;
  const absolute = path.normalize(path.join(rootDir, normalized));

  if (!absolute.startsWith(rootDir)) {
    return null;
  }

  if (fs.existsSync(absolute) && fs.statSync(absolute).isDirectory()) {
    return path.join(absolute, "index.html");
  }

  return absolute;
}

const server = http.createServer((req, res) => {
  const filePath = resolvePath(req.url || "/");

  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  let finalPath = filePath;
  if (!fs.existsSync(finalPath) && !path.extname(finalPath)) {
    const htmlCandidate = `${finalPath}.html`;
    if (fs.existsSync(htmlCandidate)) {
      finalPath = htmlCandidate;
    }
  }

  if (!fs.existsSync(finalPath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const stat = fs.statSync(finalPath);
  if (stat.isDirectory()) {
    const indexPath = path.join(finalPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    finalPath = indexPath;
  }

  const ext = path.extname(finalPath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";

  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(finalPath).pipe(res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Static site available at http://127.0.0.1:${PORT}`);
});
