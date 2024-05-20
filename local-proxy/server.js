const https = require('https');
const httpProxy = require('http-proxy');
const selfsigned = require('selfsigned');

// Generate self-signed certificate
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

// Create a proxy server with the secure option set to false
const proxy = httpProxy.createProxyServer({
  secure: false  // Accept self-signed certificates
});

// Define the target host
// const targetHost = 'https://192.168.1.4:8104';
const targetHost = 'https://192.168.1.13:8104';


// Create an HTTPS server to listen for requests and redirect them
const server = https.createServer({
  key: pems.private,
  cert: pems.cert
}, (req, res) => {
  // Proxy the request to the target host
  proxy.web(req, res, { target: targetHost, changeOrigin: true }, (err) => {
    if (err) {
      console.error('Error while proxying request:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Something went wrong.');
    }
  });
});

// Listen on port 7104
server.listen(7104, () => {
  console.log(`Proxy server is running on ${targetHost}`);
});

// Set the NODE_TLS_REJECT_UNAUTHORIZED environment variable to 0
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
