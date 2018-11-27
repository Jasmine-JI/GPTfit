var request = require("request");
var os = require('os');

var address,
  ifaces = os.networkInterfaces();
for (var dev in ifaces) {
  ifaces[dev].filter(
    details =>
      details.family === 'IPv4' && details.internal === false
        ? (address = details.address)
        : undefined
  );
}
const addressToDomain = function (_address) {
  if (_address === '192.168.1.234') {
    return 'app.alatech.com.tw';
  } else if (_address === '192.168.1.235') {
    return _address;
  } else {
    return '127.0.0.1';
  }
}

exports.getMapList = function() {
  return new Promise((resolve, reject) => {
    let domain = addressToDomain(address);
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    request(`https://${domain}/app/public_html/cloudrun/update/mapList.json`, function (error, response, body) {
      if (error) throw new Error(error);
        let urls = [];
        const datas = JSON.parse(body).mapList.raceMapInfo.map(_info => {
          const { mapId, distance, totalElevation, incline, mapUpdateFile } = _info;
          const race_elevation = Number(totalElevation.replace('m', ''));
          let img_url = 'https://' + domain + '/app/public_html/cloudrun/update/';
          img_url += mapUpdateFile.replace('.zip', '/');
          urls.push('https://' + domain + '/app/public_html/cloudrun/update/map-summary/map-mapdefinition_' + mapId + '.json');
          return ({
            map_index: mapId,
            race_total_distance: distance,
            race_elevation,
            race_average_incline: incline,
            img_url,
            gpx_url: img_url
          });
        });
      resolve({datas, urls});
    });
});


}
