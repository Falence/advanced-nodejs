const cluster = require('cluster');
const express = require('express');
const app = express();

// is the file being executed in master mode?
if (cluster.isMaster) {
  // cause index.js to be executed again but in child/slave mode
  cluster.fork();
} else {
  // I'm a child, I'm going to act like the server and do nothing else
  function doWork(duration) {
    const start = Date.now();
    while (Date.now() - start) {}
  }

  app.get('/', (req, res) => {
    doWork(10000);
    res.send('Hi there');
  });

  app.listen(5000);
}