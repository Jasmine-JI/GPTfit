var request = require("request");

exports.getMapList = function() {
  return new Promise((resolve, reject) => {
    request('http://cloud.alatech.com.tw/app/public_html/cloudrun/update/mapList.json', function (error, response, body) {
      if (error) throw new Error(error);
        let urls = [];
        const datas = JSON.parse(body).mapList.raceMapInfo.map(_info => {
          const { mapId, distance, totalElevation, incline, mapUpdateFile } = _info;
          const race_elevation = Number(totalElevation.replace('m', ''));
          let img_url =  '/app/public_html/cloudrun/update/'
          img_url += mapUpdateFile.replace('.zip', '/');
          urls.push('http://cloud.alatech.com.tw/app/public_html/cloudrun/update/map-summary/map-mapdefinition_' + mapId + '.json');
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
