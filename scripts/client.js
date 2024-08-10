// To start the client, run:
// python3 server.py

// Then you can run the node.js client

// Two endpoints are available:

// Embeddings:
// node client.js embeddings "The model will return an embedding for this sentence."

// Masked LM:
// node client.js mask "The model will predict the [MASK]."


const http = require("http");
const querystring = require('node:querystring');

const endpoint = process.argv[2];

const postData = querystring.stringify({
  'sentence': process.argv[3],
});

const options = {
  host: 'localhost',
  port: 5000,
  path: '/api/' + endpoint + '?' + postData,
  method: 'POST',
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(data);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});

req.end();
