import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");
const port = Number(process.env.PORT || 42818);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};
http
  .createServer((req, res) => {
    let relative;
    try {
      relative = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
    } catch {
      res.writeHead(400).end("Bad request");
      return;
    }
    const filename = path.resolve(
      root,
      "." + (relative === "/" ? "/index.html" : relative),
    );
    if (filename !== root && !filename.startsWith(root + path.sep)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    fs.readFile(filename, (error, data) => {
      if (error) {
        res.writeHead(404).end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type":
          types[path.extname(filename)] || "application/octet-stream",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(data);
    });
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Local: http://127.0.0.1:${port}`),
  );
