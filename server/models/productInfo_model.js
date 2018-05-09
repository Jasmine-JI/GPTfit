var request = require("request");
var os = require('os');
var moment = require('moment');

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
exports.getInfos = function(sn) {
  return new Promise((resolve, reject) => {
    request(`http://${address}/app/public_html/products/info.json`, function (error, response, body) {
      if (error) throw new Error(error);
      const data = {};
      const { productsInfo, modeType, appInfo } = JSON.parse(body);
      const year = sn.slice(0, 1).charCodeAt() + 1952; // 因為A代表2017，B代表2018
      const date = moment(moment(year + '')
          .add(sn.slice(1, 3), 'weeks')
          .calendar()).format('YYYY年MM月');
      const productsInfoData = productsInfo
            .filter(_data => sn
            .toLocaleLowerCase()
            .indexOf(_data.modeID) > -1)[0];
      const mainAppData = productsInfoData.mainApp ? appInfo.filter(
        _info => _info.appId === productsInfoData.mainApp[0].appId)[0]: null;
      if (mainAppData) {
        mainAppData.appIconUrl = `http://${address}/app/public_html/products` + mainAppData.appIconUrl;
        mainAppData.appIosImg = `http://${address}/app/public_html/products/img/getApp_01_apple.png`;
        mainAppData.appAndroidImg = `http://${address}/app/public_html/products/img/getApp_02_googleplay.png`;
        mainAppData.appApkImg = `http://${address}/app/public_html/products/img/getApp_03_apk.png`;
      }

      const secondaryAppData = productsInfoData.secondaryApp ? appInfo.filter(_info => _info.appId === productsInfoData.secondaryApp[0].appId)[0] : null;
      if (secondaryAppData) {
        secondaryAppData.appIconUrl = `http://${address}/app/public_html/products` + secondaryAppData.appIconUrl;
        secondaryAppData.appIosImg = `http://${address}/app/public_html/products/img/getApp_01_apple.png`;
        secondaryAppData.appAndroidImg = `http://${address}/app/public_html/products/img/getApp_02_googleplay.png`;
        secondaryAppData.appApkImg = `http://${address}/app/public_html/products/img/getApp_03_apk.png`;
      }

      data.modeImgUrl = `http://${address}/app/public_html/products${productsInfoData.modeImg}`;
      data.modeName = productsInfoData.modeName;
      data.InformationUrl = productsInfoData['product InformationUrl_zh-TW']; // to fix 等多語系要改
      data.date = date;
      data.modeType = modeType[0][productsInfoData.modeType];
      data.mainAppData = mainAppData;
      data.secondaryAppData = secondaryAppData;
      resolve(data);
    });
  });
}
