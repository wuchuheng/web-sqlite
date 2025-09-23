#!/usr/bin/env tsx

import http from "http";
import fs from "fs";
import path from "path";
import url from "url";

const PORT = 7411;

// MIME type mapping
const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || "application/octet-stream";
}

// Centralized logging system
enum Color {
  red = "\x1b[31m",
  green = "\x1b[32m",
  bold = "\x1b[1m",
  reset = "\x1b[0m",
}

const inColor = (text: string, ...colors: Color[]) =>
  colors.join("") + text + Color.reset;

function formatTimestamp(): string {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");

  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}/${String(now.getDate()).padStart(2, "0")} ${hour}:${minute}:${second}`;
}

function logRequest(
  method: string,
  url: string,
  status: "success" | "not_found",
): void {
  const timestamp = formatTimestamp();

  if (status === "not_found") {
    const methodInRed = inColor(method, Color.red, Color.bold);
    const urlInRed = inColor(url, Color.red, Color.bold);
    console.log(`[${timestamp}] ${methodInRed} Not found ${urlInRed}`);
  } else {
    const methodInGreen = inColor(method, Color.green, Color.bold);
    console.log(`[${timestamp}] ${methodInGreen} ${url}`);
  }
}

const server = http.createServer((req, res) => {
  // 1. Input validation and header setup
  if (!req.url) {
    res.writeHead(400);
    res.end("Bad Request");
    return;
  }

  const method = req.method || "GET";
  const requestUrl = req.url;

  // 1.1 Set CORS and SharedArrayBuffer headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Range",
  );
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  // 1.2 Critical SharedArrayBuffer headers
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

  // 2. Core processing
  // 2.1 Parse URL and determine file path
  const parsedUrl = url.parse(requestUrl);
  let pathname = `.${parsedUrl.pathname}`;

  // 2.2 Handle directory requests
  if (pathname.endsWith("/")) {
    pathname = path.join(pathname, "index.html");
  }

  // 2.3 Security: prevent directory traversal
  const fullPath = path.resolve(pathname);
  const rootPath = path.resolve(".");
  if (!fullPath.startsWith(rootPath)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // 2.4 Process file/directory request
  fs.stat(pathname, (err, stats) => {
    if (err) {
      // File not found
      logRequest(method, requestUrl, "not_found");
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    if (stats.isDirectory()) {
      // Try to serve index.html
      const indexPath = path.join(pathname, "index.html");
      fs.stat(indexPath, (indexErr) => {
        if (indexErr) {
          // No index.html, show directory listing
          logRequest(method, requestUrl, "success");
          fs.readdir(pathname, (dirErr, files) => {
            if (dirErr) {
              res.writeHead(500);
              res.end("Internal Server Error");
              return;
            }

            res.writeHead(200, { "Content-Type": "text/html" });
            res.write(
              "<html><head><title>Directory Listing</title></head><body>",
            );
            res.write(`<h1>Directory: ${parsedUrl.pathname}</h1><ul>`);

            if (parsedUrl.pathname !== "/") {
              res.write('<li><a href="../">../</a></li>');
            }

            files.forEach((file) => {
              const filePath = `${parsedUrl.pathname}${
                parsedUrl.pathname?.endsWith("/") ? "" : "/"
              }${file}`;
              res.write(`<li><a href="${filePath}">${file}</a></li>`);
            });

            res.write("</ul></body></html>");
            res.end();
          });
        } else {
          // Serve index.html
          serveFile(indexPath, res, method, requestUrl);
        }
      });
    } else {
      // Serve the file
      serveFile(pathname, res, method, requestUrl);
    }
  });

  function serveFile(
    filePath: string,
    response: http.ServerResponse,
    method: string,
    requestUrl: string,
  ): void {
    const mimeType = getMimeType(filePath);

    fs.readFile(filePath, (fileErr, data) => {
      if (fileErr) {
        // File read error
        logRequest(method, requestUrl, "not_found");
        response.writeHead(500);
        response.end("Internal Server Error");
        return;
      }

      // Successful file serve
      logRequest(method, requestUrl, "success");
      response.writeHead(200, { "Content-Type": mimeType });
      response.end(data);
    });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Secure server running on http://127.0.0.1:${PORT}`);
  console.log("📋 Headers included:");
  console.log("   ✅ Cross-Origin-Embedder-Policy: require-corp");
  console.log("   ✅ Cross-Origin-Opener-Policy: same-origin");
  console.log("   ✅ Access-Control-Allow-Origin: *");
  console.log("");
  console.log("🎯 SharedArrayBuffer should now be supported!");
  console.log("");
  console.log(`🌐 Visit: http://127.0.0.1:${PORT}/examples/index.html`);
  console.log("");
  console.log("Press Ctrl+C to stop the server");
});
