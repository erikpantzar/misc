# SimHub mechanical odometer

A framework-free HTML, CSS, and JavaScript prototype of a five-reel mechanical
distance meter. The demo starts at 300 metres and supports readings from `00000`
through `99999`.

The page exposes a small browser API:

```js
window.rbrOdometer.setDistance(42798);
window.rbrOdometer.getDistance();
```

The `START` and `RESET` controls on the instrument are decorative. The controls
below it are only for testing the reel motion.

## SimHub installation

This integration targets SimHub 9.12's current **Dash Studio → Web page** item.
It uses SimHub's own local web server rather than an obsolete JavaScript plugin
or an external browser source.

1. Close SimHub.
2. Copy the entire `simhub-odometer` folder into SimHub's `Web` folder. With the
   default installation this becomes:
   `C:\Program Files (x86)\SimHub\Web\simhub-odometer`.
3. Start SimHub and open **Dash Studio**.
4. Create or edit a 342 × 122 dashboard/overlay and add a **Web page** item.
5. Set the Web page address to
   `http://localhost:8888/simhub-odometer/?simhub=1` and size the item to
   342 × 122 px at position 0, 0.
6. Enable transparency for the dashboard/overlay and the Web page item. Disable
   its border if one is shown. Leave click-through enabled if desired; the two
   instrument buttons are intentionally decorative.

The `?simhub=1` query enables production mode: the page and test controls are
hidden, the canvas is exactly 342 × 122 px, and the background outside the
instrument is transparent. Opening `index.html` without that query retains the
public demo and all of its test controls.

## Telemetry

The adapter reads SimHub's `TrackPositionMeters` property (the full formula name
is `DataCorePlugin.GameData.NewData.TrackPositionMeters`). Despite some RBR raw
properties using game-specific scales, this normalized SimHub property is in
metres and is passed unchanged to `window.rbrOdometer.setDistance(metres)`.

On load, the adapter requests the current snapshot before waiting for live
updates, so a stage already at roughly 300 m starts at that value rather than
zero. Invalid or missing values are ignored. The last valid reading survives
telemetry gaps and reconnects, small backwards corrections are rejected, and a
large backwards jump is treated as a stage restart and applied immediately.

## Public demo

The hosted demo remains available at:
https://erikpantzar.github.io/misc/simhub-odometer/

## Native Dash Studio version

`native-dashboard/RBR Mechanical Odometer.simhubdash` is a separate, fully
native Dash Studio implementation. Double-click it to import it into SimHub.
It does not use the Web page component or the files in SimHub's `Web` folder.

The faceplate, five reel cards, moving digits, masks, labels, and decorative
buttons are ordinary editable dashboard elements. JavaScript bindings on each
digit read `DataCorePlugin.GameData.NewData.TrackPositionMeters` directly and
apply proportional reel motion for `[10000, 1000, 100, 10, 1]`, plus subtle
jitter derived from the live `SpeedKmh` property. The native dashboard does not
interpolate or catch up to telemetry, so its digits and fractional reel offsets
always represent SimHub's current stage-distance value. The dashboard is 342 × 122 px with a
transparent canvas and can be opened, copied, resized, or converted to an
overlay in Dash Studio. It is disabled on SimHub's idle screen and has no demo
distance fallback; without valid telemetry it retains the last reading, or zero
before the first valid update.

Run `node build-native-dashboard.js` to regenerate the unpacked native dashboard
source after changing its element definitions. Recreate the `.simhubdash` ZIP
package from the resulting `native-dashboard/RBR Mechanical Odometer` folder.
