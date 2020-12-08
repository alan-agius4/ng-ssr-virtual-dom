Skip to content
Search or jump to…

Pull requests
Issues
Marketplace
Explore
 
@alan-agius4 
alan-agius4
/
ng-ssr-virtual-dom
1
0
0
Code
Issues
Pull requests
Actions
Projects
Wiki
Security
Insights
Settings
ng-ssr-virtual-dom
/
README.md
 

Spaces

2

Soft wrap
1
# Angular SSR Virtual Dom
2
​
3
POC of Angular SSR with vitual DOM.
4
​
5
- What if Angular SSR didn't require the complex `@nguniversal` and `@angular/platform-server` package?
6
- What if we `Window is undefined` error was a thing of the past?
7
- What if you don't need multiple builds for an SSR'd application?
8
​
9
​
10
Problems to solve:
11
​
12
- [x] Application stablization
13
- [ ] State transfer
14
- [ ] Advanced use cases
15
​
16
Try it out
17
```
18
yarn
19
yarn build
20
yarn ssr
21
```
22
​
23
Changes in your application
24
​
25
**server.js+*
26
```js
27
const express = require('express');
28
const { SSRService } = require('@ngssr/server');
29
​
30
const PORT = 8080;
31
const DIST = './dist/demo/';
32
​
33
const app = express();
34
app.set('views', DIST);
35
app.get('*.*', express.static(DIST, {
36
  maxAge: '1y'
37
}));
38
​
39
const ssr = new SSRService({
40
  baseUrl: 'http://localhost:8080',
41
  publicPath: DIST,
42
});
43
​
44
app.get('*', (req, res) => {
45
  ssr.render({
@alan-agius4
Commit changes
Commit summary
Update README.md
Optional extended description
Add an optional extended description…
 Commit directly to the master branch.
 Create a new branch for this commit and start a pull request. Learn more about pull requests.
 
© 2020 GitHub, Inc.
Terms
Privacy
Security
Status
Help
Contact GitHub
Pricing
API
Training
Blog
About
