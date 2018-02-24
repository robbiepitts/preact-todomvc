const express = require('express');
const compression = require('compression');
const { join } = require('path');
const watchmonger = require('./watchmonger');
const mongerfile = require('../mongerfile');

const dist = join(process.cwd(), 'dist');
const app = express();

mongerfile.run(dist);

app.use(compression({ threshold: 0 }));
app.use(express.static(dist));

app.listen(3000, () => console.log('http://localhost:3000'));
