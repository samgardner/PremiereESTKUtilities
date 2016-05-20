# PremiereESTKUtilities
Useful utility .jsx classes used when building Premiere CC HTML5 Panels.

###Timecode.jsx
Class to manipulate SMPTE timecodes, based on [timecode.js](https://github.com/reidransom/timecode.js) and ported to be friendly with Adobe CEP style jsx scripts. Functionality will be added as required - please note I live in PAL land, so NTSC things like drop-frame are currently untested.

######Usage:
```
#include "Timecode.jsx";

var zeroTimecode = new Timecode({framerate: "25", timecode: "00:00:00:00"});
var fiveSecondsElapsed = Timecode.addTimecodes(zeroTimecode, new Timecode({framerate: "25", timecode: "00:00:05:00"}));

```
