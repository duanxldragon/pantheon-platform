const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const port = Number(process.env.PORT || 5173);
const rootDir = path.resolve(__dirname, '..', 'build');
const backendOrigin = process.env.BACKEND_ORIGIN || 'http://127.0.0.1:8080';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
};

function sendFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
}

function proxyApiRequest(req, res) {
  const targetUrl = new URL(req.url || '/', backendOrigin);
  const proxyReq = http.request(
    targetUrl,
    {
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', (error) => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ code: 502, message: 'Bad gateway', details: error.message }));
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath.startsWith('/api/')) {
    proxyApiRequest(req, res);
    return;
  }

  const normalizedPath = urlPath === '/' ? '/index.html' : urlPath;
  const requestedPath = path.join(rootDir, normalizedPath);

  if (!requestedPath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(requestedPath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(requestedPath, res);
      return;
    }

    const fallbackPath = path.join(rootDir, 'index.html');
    fs.stat(fallbackPath, (fallbackError, fallbackStats) => {
      if (fallbackError || !fallbackStats.isFile()) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      sendFile(fallbackPath, res);
    });
  });
});

server.listen(port, () => {
  process.stdout.write(`Static server listening on http://localhost:${port}\n`);
});
