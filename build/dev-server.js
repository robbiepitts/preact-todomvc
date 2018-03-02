const express = require('express');
const compression = require('compression');
const { join } = require('path');
const mongerfile = require('../mongerfile');

const dist = join(process.cwd(), 'dist');
const app = express();

app.use(compression({ threshold: 0 }));
app.use(express.static(dist));
app.listen(3000, () => console.log('http://localhost:3000'));

mongerfile.run(dist, err => {
	if (err) throw err;
});
