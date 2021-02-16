import express from 'express';
import { SSREngine } from '@ngssr/server';
import { join } from 'path';

const PORT = 8080;
const DIST = join(__dirname, '../browser');

const app = express();
app.set('views', DIST);

app.get('*.*', express.static(DIST, {
  maxAge: '1y'
}));


// Redirect to default locale
app.get(/^(\/|\/favicon\.ico)$/, (req, res) => {
  res.redirect(301, `/en-US${req.originalUrl}`);
});

const ssr = new SSREngine();

app.get('*', (req, res) => {
  ssr.render({
    publicPath: DIST,
    url: {
      protocol: req.protocol,
      host: req.get('host') as string,
      originalUrl: req.originalUrl,
    },
    // Likely we should provide all headers.
    referrer: req.header('Referer')
  })
    .then(html => res.send(html));
});

app.listen(PORT, () => {
  console.log(`Node Express server listening on http://localhost:${PORT}`);
});
