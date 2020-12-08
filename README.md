# Angular SSR Virtual Dom

POC for Angular SSR with virtual JavaScript DOM.

- What if Angular SSR didn't require the complex `@nguniversal` and `@angular/platform-server` packages setup?
- What if we `Window is undefined` error was a thing of the past?
- What if you don't need multiple builds for an SSR/prerender application?
- What if an application shell can be generated without an extra build?

Problems to solve:

- [x] Application stablization
- [ ] State transfer
- [ ] Advanced use cases

Try it out
```
yarn
yarn build
yarn ssr // SSR application
yarn app-shell // App-shell generation
```

Changes in your application

**/projects/demo/server.js**
```js
const express = require('express');
const { SSRService } = require('@ngssr/server');

const PORT = 8080;
const DIST = './dist/demo/';

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
```

**/projects/demo/src/app/app.module.ts**
```diff
 import { BrowserModule } from '@angular/platform-browser';
 import { AppRoutingModule } from './app-routing.module';
 import { AppComponent } from './app.component';
 import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
+import { SSRBrowserModule } from '@ngssr/browser';
 
 @NgModule({
   declarations: [
     BrowserModule,
     AppRoutingModule,
     BrowserAnimationsModule,
+    SSRBrowserModule,
   ],
   providers: [],
   bootstrap: [AppComponent]
```
