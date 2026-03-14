import http from 'http';
import httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer({
  target: 'http://localhost:3000',
  changeOrigin: true,
});

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/visa')) {
    // 移除 /visa 前缀，代理到应用根路径
    req.url = req.url.replace(/^\/visa/, '') || '/';
    proxy.web(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(8080, '0.0.0.0', () => {
  console.log('✓ 本地测试代理服务器运行在 http://localhost:8080');
  console.log('✓ 访问 http://localhost:8080/visa 来测试应用');
});
