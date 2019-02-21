const fastXmlParser = require("fast-xml-parser");
const fs = require("fs");
const gcoord = require('gcoord');
let parsedGPX = fastXmlParser.parse(
  fs.readFileSync("/home/administrator/myWorkSpace/web/server/models/beijin_marathon_21k-cj02.gpx", "utf8"), {
    ignoreAttributes: false
  }
);
// console.log(parsedGPX.gpx.trk.trkseg[0].trkpt);
const points = parsedGPX.gpx.trk.trkseg;

// console.log('points: ', points);
const transFormPoints = points.map(_point => {
  // console.log(_point.trkpt.length);
  return _point.trkpt.map(_p => {
    const preLon = _p['@_lon'];
    const preLat = _p['@_lat'];
    const altitude = _p['ele'];
    // console.log('altitude: ', altitude);
    // console.log('pre : ', preLon, preLat);
    const transPt = gcoord.transform([+preLon, +preLat], gcoord['GCJ02'], gcoord['WGS84'])
    // console.log('transform: ', transPt);
    const latitude = transPt[1];
    const longitude = transPt[0];

    return `<trkpt lat="${latitude}" lon="${longitude}">
        <ele>${altitude}</ele>
      </trkpt>
    `;
  });
});
const trkptContent = transFormPoints.join('\n').replace(/,/gi, '');
console.log('trkptContent: ', trkptContent);

const content = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<gpx version="1.1" creator="GPS Visualizer http://www.gpsvisualizer.com/" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
<trk>
  <name>Untitled</name>
  <trkseg>${trkptContent}</trkseg>
</trk> </gpx>`;

console.log('content: ', content);
fs.writeFile('/var/www/html/dist/test.gpx', content, function (err) {
  if (err) console.log(err);
  else {
    console.log('write gpx file successfully');
  }
});
