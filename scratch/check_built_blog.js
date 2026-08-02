const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../_site/blog/index.html'), 'utf-8');
const matches = [...html.matchAll(/href="\/blog\/([^"]+)\/"/g)].map(m => m[1]);
console.log('Post hrefs found in _site/blog/index.html:', [...new Set(matches)]);
