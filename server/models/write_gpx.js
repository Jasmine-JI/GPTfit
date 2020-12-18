module.exports = function writeGpx(results, fs) {

  return new Promise((resolve, reject) => {
    let trkptDatas = results.map(_result => {
      const {
        longitude,
        latitude,
        altitude,
        utc,
        file_name,
        heart_rate,
        cadence,
        pace,
        calorie,
        incline
      } = _result;
    let timeArr = file_name.split('');
    timeArr =timeArr.slice(0, 8);

    timeArr.splice(4, 0, '-');
    timeArr.splice(7, 0, '-');
    timeArr.splice(10, 0, 'T');

    let timeStr = timeArr.join('');
    let utcValue = utc;
    if (utcValue.length !== 8) {
      utcValue = '0' + utcValue;
    }
    timeStr = timeStr + utcValue + '.000Z';

    return `<trkpt lat="${latitude}" lon="${longitude}">
        <ele>${altitude}</ele>
        <time>${timeStr}</time>
        <extensions>
          <ns3:TrackPointExtension>
            <ns3:hr>${heart_rate}</ns3:hr>
            <ns3:cad>${cadence}</ns3:cad>
            <ns3:pace>${pace}</ns3:pace>
            <ns3:cal>${calorie}</ns3:cal>
            <ns3:inc>${incline}</ns3:inc>
          </ns3:TrackPointExtension>
        </extensions>
      </trkpt>`;
  });
  const { file_name } = results[0];
  let timeArr = file_name.split('');

  timeArr.splice(4, 0, '-');
  timeArr.splice(7, 0, '-');
  timeArr.splice(10, 0, 'T');
  timeArr.splice(13, 0, ':');
  timeArr.splice(16, 0, ':');
  timeArr.splice(19, 0, '.000Z');
  const timeStr = timeArr.join('');
    trkptDatas = trkptDatas.join('\n');
    const content = `<?xml version="1.0" encoding="UTF-8"?>
    <gpx creator="Alatech Connect" version="1.0"
      xmlns="http://www.topografix.com/GPX/1/1"
      xmlns:ns3="https://www.gptfit.com"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"
    >
      <metadata>
        <link href="https://www.gptfit.com">
          <text>Alatech Connect</text>
        </link>
        <time>${timeStr}</time>
      </metadata>
      <trk>
        <name>跑步</name>
        <type>running</type>
        <trkseg>
         ${trkptDatas}
        </trkseg>
      </trk>
    </gpx>`;
    fs.writeFile('/var/www/html/dist/test.gpx', content, function(err) {
      if (err) reject(err);
      else {
        resolve(true);
      }
    });
  });
};
