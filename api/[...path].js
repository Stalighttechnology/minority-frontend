export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req, res) {
  // 1. Determine the subpath after /api/
  let pathStr = '';
  
  if (req.query && req.query.path) {
    const rawPath = req.query.path;
    pathStr = Array.isArray(rawPath) ? rawPath.join('/') : rawPath;
  } else if (req.url) {
    const cleanUrl = req.url.split('?')[0];
    if (cleanUrl.startsWith('/api/')) {
      pathStr = cleanUrl.slice('/api/'.length);
    } else if (cleanUrl.startsWith('/api')) {
      pathStr = cleanUrl.slice('/api'.length);
    }
  }

  // Strip leading slash
  pathStr = pathStr.replace(/^\/+/, '');

  // Django backend requires trailing slashes for standard REST routes
  if (pathStr && !pathStr.endsWith('/') && !pathStr.includes('.')) {
    pathStr += '/';
  }

  // Preserve query parameters (excluding the internal Vercel 'path' param)
  const urlObj = new URL(req.url, 'http://localhost');
  urlObj.searchParams.delete('path');
  const queryString = urlObj.search ? urlObj.search : '';

  const targetUrl = `http://168.144.124.158/api/${pathStr}${queryString}`;

  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase();
    if (!['host', 'connection', 'content-length'].includes(lower)) {
      headers[lower] = value;
    }
  }

  try {
    let body = undefined;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      if (typeof req.body === 'object' && req.body !== null) {
        body = JSON.stringify(req.body);
        if (!headers['content-type']) {
          headers['content-type'] = 'application/json';
        }
      } else if (typeof req.body === 'string') {
        body = req.body;
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
    });

    const responseData = await response.arrayBuffer();
    const buffer = Buffer.from(responseData);

    res.status(response.status);
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!['transfer-encoding', 'content-encoding'].includes(lower)) {
        res.setHeader(key, value);
      }
    });

    return res.send(buffer);
  } catch (err) {
    return res.status(502).json({
      error: 'Bad Gateway: Proxy to minority backend failed',
      details: err.message,
    });
  }
}
