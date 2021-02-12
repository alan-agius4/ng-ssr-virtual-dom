import express from 'express';
import { SSRService } from '@ngssr/server';
import { join } from 'path';

const PORT = 8080;
const DIST = join(__dirname, '../browser');

const app = express();
app.set('views', DIST);
app.get('*.*', express.static(DIST, {
  maxAge: '1y'
}));

const ssr = new SSRService({
  baseUrl: 'http://localhost:8080',
  publicPath: DIST,
});

app.get('*', (req, res) => {
  ssr.render({
    urlPath: req.originalUrl,
    // Likely we should provide all headers.
    referrer: req.header('Referer')
  })
    .then(html => res.send(html));
});

app.listen(PORT, () => {
  console.log(`Node Express server listening on http://localhost:${PORT}`);
});
