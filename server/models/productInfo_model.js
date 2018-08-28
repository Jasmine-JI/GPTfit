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
const addressToDomain = function (_address) {
  if (_address === '192.168.1.234') {
    return 'app.alatech.com.tw';
  } else if (_address === '192.168.1.235') {
    return _address;
  } else {
    return '127.0.0.1';
  }
}

exports.getInfos = function(sn) {
  return new Promise((resolve, reject) => {
    let domain = addressToDomain(address);
    if (sn) {
      request(`http://${domain}/app/public_html/products/info.json`, function (error, response, body) {
        if (error) throw new Error(error);
        const data = {};
        const { productsInfo, modelType, appInfo } = JSON.parse(body);
        const year = sn.slice(0, 1).charCodeAt() + 1952; // 因為A代表2017，B代表2018
        let date = moment(new Date(year + ''), 'YYYY')
          .add(+sn.slice(1, 3), 'weeks');
        date = moment(date).format('YYYY/MM');

        const productsInfoData = productsInfo
              .filter(_data => sn
              .toLocaleLowerCase()
              .indexOf(_data.modelID) > -1)[0];
        let customerIdx;
        if (sn.length > 13) { // 如果是14碼，有商品號，去判斷是哪個客戶編號(customerId)
          customerIdx = productsInfoData.modelNameInquire.findIndex(_data => _data.customerID.toString() === sn.slice(8, 10));
        } else {
          customerIdx = productsInfoData.modelNameInquire.findIndex(_data => _data.customerID === '00');
        }
        if (customerIdx === -1) {
          customerIdx = 0;
        }
        const productData = productsInfoData.modelNameInquire[customerIdx];
        const mainAppData = productsInfoData ? appInfo.filter(_info => {
          if (productData.mainApp.length > 0)
            return _info.appId === productData.mainApp[0].appId
        })[0] : null;
        if (domain === '127.0.0.1') {
          domain = 'cloud.alatech.com.tw';
        }

        if (mainAppData) {
          mainAppData.appIconUrl = `http://${domain}/app/public_html/products` + mainAppData.appIconUrl;
          mainAppData.appIosImg = `http://${domain}/app/public_html/products/img/getApp_01_apple.png`;
          mainAppData.appAndroidImg = `http://${domain}/app/public_html/products/img/getApp_02_googleplay.png`;
          mainAppData.appApkImg = `http://${domain}/app/public_html/products/img/getApp_03_apk.png`;
        }

        const secondaryAppData = productsInfoData ? appInfo.filter(_info =>  {
          if (productData.secondaryApp.length > 0)
           return _info.appId === productData.secondaryApp[0].appId
        })[0] : null;
        if (secondaryAppData) {
          secondaryAppData.appIconUrl = `http://${domain}/app/public_html/products` + secondaryAppData.appIconUrl;
          secondaryAppData.appIosImg = `http://${domain}/app/public_html/products/img/getApp_01_apple.png`;
          secondaryAppData.appAndroidImg = `http://${domain}/app/public_html/products/img/getApp_02_googleplay.png`;
          secondaryAppData.appApkImg = `http://${domain}/app/public_html/products/img/getApp_03_apk.png`;
        }
        if (mainAppData) {
          data.informations = {
            'relatedLinks_zh-TW': productData["relatedLinks_zh-TW"],
            'relatedLinks_zh-CN': productData["relatedLinks_zh-CN"],
            'relatedLinks_en-US': productData["relatedLinks_en-US"]
          };
          data.modelImgUrl = `http://${domain}/app/public_html/products${productData.modelImg}`;
          data.modelName = productData.modelName;

          data.date = date;
          data.modelType = modelType[0][productsInfoData.modelType];
          data.mainAppData = mainAppData;
          data.secondaryAppData = secondaryAppData;
          resolve(data);
        } else {
          resolve('尚無相關設備資訊');
        }
      });
    } else {
      reject('no sn');
    }
  });
}
