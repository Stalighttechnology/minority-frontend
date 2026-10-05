export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req, res) {
  // Extract the path and query from req.url
  const rawUrl = req.url || '';
  
  // Remove leading /api or /api/
  let subPath = rawUrl.replace(/^\/?api\/?/, '');
  
  // Separate subPath into pathname and search params
  const [pathname, search] = subPath.split('?');
  let cleanPath = pathname || '';

  // Django backend requires trailing slashes for standard REST routes
  if (cleanPath && !cleanPath.endsWith('/') && !cleanPath.includes('.')) {
    cleanPath += '/';
  }

  const queryString = search ? `?${search}` : '';
  const targetUrl = `http://168.144.124.158/api/${cleanPath}${queryString}`;

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
