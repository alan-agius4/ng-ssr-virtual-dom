# Angular SSR Virtual Dom

POC for Angular SSR with virtual JavaScript DOM.

- What if Angular SSR didn't require the complex `@nguniversal` and `@angular/platform-server` packages on boarding?
- What if we `Window is undefined` error was a thing of the past?
- What if you don't need multiple builds for an SSR/prerender application?
- What if an application shell can be generated without an extra build?

## Problems to solve:

- [x] Application stablization
- [x] Inline critical CSS
- [x] State transfer
- [x] Clean up `<style>` tags
- [x] i18n
- [x] Hybrid rendering
- [ ] Advanced use cases

## Try it out
```
yarn
yarn build
yarn ssr // SSR application
yarn app-shell // App-shell generation
```

## Changes in your application

### projects/demo/src/app/app.module.ts

```diff
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
+ import { SSRBrowserModule } from '@ngssr/server/browser';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule.withServerTransition({
      appId: 'myapp',
    }),
+    SSRBrowserModule.forRoot(),
    AppRoutingModule,
    BrowserAnimationsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### projects/demo/server.js
```js
const express = require('express');
const { SSREngine } = require('@ngssr/server');

const PORT = 8080;
const DIST = './dist/demo/';

const app = express();
app.set('views', DIST);
app.get('*.*', express.static(DIST, {
  maxAge: '1y'
}));

const ssr = new SSREngine();

app.get('*', (req, res) => {
  ssr.render({
    publicPath: DIST,
    url: {
      protocol: req.protocol,
      host: req.headers.host,
      originalUrl: req.originalUrl,
    },
    headers: req.headers
  })
    .then(html => res.send(html));
});

app.listen(PORT, () => {
  console.log(`Node Express server listening on http://localhost:${PORT}`);
});
```
