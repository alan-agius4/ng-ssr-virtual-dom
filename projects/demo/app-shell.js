const { SSRService } = require('@ngssr/server');
const { writeFileSync } = require('fs');
const { resolve } = require('path');

const ssr = new SSRService({
  baseUrl: 'http://localhost',
  publicPath: './dist/demo/',
});

ssr.render({ urlPath: 'shell' })
.then(html => {
  const path = resolve('./dist/demo/app-shell.html');
  writeFileSync(path, html);
  console.log(`App-shell written to: ${path}`)
});