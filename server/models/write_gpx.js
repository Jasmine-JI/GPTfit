module.exports = function writeGpx(results, fs) {
  return new Promise((resolve, reject) => {
    let trkptDatas = results.map(_result => {
      const { longitude, latitude, altitude, utc } = _result;
      return `<trkpt lat="${latitude}" lon="${longitude}">
          <ele>${altitude}</ele>
          <time>${utc}</time>
        </trkpt>`;
    });
    trkptDatas = trkptDatas.join('\n');
    const content = `<?xml version="1.0" encoding="UTF-8"?>
    <gpx creator="Alatech Connect" version="1.0">
      <metadata>
        <link href="alatechcloud.alatech.com.tw">
          <text>Alatech Connect</text>
        </link>
        <time>2017-11-06T11:35:42.000Z</time>
      </metadata>
      <trk>
        <name>跑步</name>
        <type>running</type>
        <trkseg>
         ${trkptDatas}
        </trkseg>
      </trk>
    </gpx>`;
    fs.writeFile('./test.gpx', content, function(err) {
      if (err) reject(err);
      else  {
        resolve(true);
      }
    });
  });
};
