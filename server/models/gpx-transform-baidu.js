const fastXmlParser = require("fast-xml-parser");
const fs = require("fs");
const gcoord = require('gcoord');
const moment = require('moment');

exports.writeCloudRunGpx = function (path, fromFormat, toFormat, res) {
  let parsedGPX = fastXmlParser.parse(
    fs.readFileSync(path, "utf8"), {
      ignoreAttributes: false
    }
  );
  const points = parsedGPX.gpx.trk.trkseg;
  const coordinates = [];
  const transFormPoints = points.map(_point => {
    return _point.trkpt.map(_p => {
      const preLon = _p['@_lon'];
      const preLat = _p['@_lat'];
      const altitude = _p['ele'];
      const transPt = gcoord.transform([+preLon, +preLat], gcoord[fromFormat], gcoord[toFormat])
      const latitude = transPt[1];
      const longitude = transPt[0];
      coordinates.push({
        latitudeDegrees: latitude,
        longitudeDegrees: longitude
      })
      return `<trkpt lat="${latitude}" lon="${longitude}">
            <ele>${altitude}</ele>
          </trkpt>
        `;
    });
  });
  const trkptContent = transFormPoints.join('\n').replace(/,/gi, '');

  const content = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
    <gpx version="1.1" creator="GPS Visualizer http://www.gpsvisualizer.com/" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
    <trk>
      <name>Untitled</name>
      <trkseg>${trkptContent}</trkseg>
    </trk> </gpx>`;
  return fs.writeFile(`/var/www/html/dist/test.gpx`, content, function (err) {
    if (err) {
      console.log(err);
      return res.json({
        resultCode: 500,
        rtnMsg: 'failed'
      });
    } else {
      console.log('write gpx file successfully');
      res.status(200).json({
        resultCode: 200,
        rtnMsg: 'success',
        fileName: `${moment().format('YYYYMMDDHHmmss')}_test.gpx`,
        coordinates
      });
    }
  });
}
