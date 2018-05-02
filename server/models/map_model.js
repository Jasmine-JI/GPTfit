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

exports.getMapList = function() {
  return new Promise((resolve, reject) => {
    request('http://cloud.alatech.com.tw/app/public_html/cloudrun/update/mapList.json', function (error, response, body) {
      if (error) throw new Error(error);
        let urls = [];
        const datas = JSON.parse(body).mapList.raceMapInfo.map(_info => {
          const { mapId, distance, totalElevation, incline, mapUpdateFile } = _info;
          const race_elevation = Number(totalElevation.replace('m', ''));
          let img_url = 'http://' + address + '/app/public_html/cloudrun/update/';
          img_url += mapUpdateFile.replace('.zip', '/');
          urls.push('http://' + address + '/app/public_html/cloudrun/update/map-summary/map-mapdefinition_' + mapId + '.json');
          return ({
            map_index: mapId,
            race_total_distance: distance,
            race_elevation,
            race_average_incline: incline,
            img_url
          });
        });
      resolve({datas, urls});
    });
});


}
