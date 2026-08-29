# SimHub odometer prototype

A framework-free HTML, CSS, and JavaScript prototype of a five-reel mechanical
distance meter. The demo starts at 300 metres and supports readings from `00000`
through `99999`.

The page exposes a small browser API for future SimHub integration:

```js
window.rbrOdometer.setDistance(42798);
window.rbrOdometer.getDistance();
```

The `START` and `RESET` controls on the instrument are decorative. The controls
below it are only for testing the reel motion.
