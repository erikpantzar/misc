# Rally boost gauge study

A rough 1980s/90s aftermarket-style turbo boost display prototype for rally SimHub dashboards.

The page runs as a plain static site. Open `index.html` directly or serve the folder with any static web server. The automatic demo shows spool, full boost, high-RPM fade, shift, and respool. Manual mode is available for testing values.

The future SimHub bridge can call:

```js
window.rbrTurboGauge.setBoost(bar)
```
