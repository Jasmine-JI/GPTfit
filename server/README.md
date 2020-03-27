# GPT Center nodejs api server

This project was generated with [express](http://expressjs.com/) version 4.16.2.

Nodejs version: 9.2.0
Npm version 5.5.1

## Installation
```
npm install
```
## 資料夾結構

```
server/ // nodejs api server folder(正式port: 3000，開發port: 3001)
  ├─ models/ // 程式業務邏輯與資料庫存取
  ├─ routes/ // 負責轉發請求並回應結果
  ├─ utils/ // 自訂 共用function
  ├─ package.json // 此專案的腳本與使用的模組
  ├─ server.js // api應用程式進入點
  └─ socket-server.js // 模擬測試socket應用程式進入點(開發port: 3002)
```
## Postman collection
This ia an GPT center nodejs api collection

[GPT-center-nodejs-api-collection json連結]()

please set environment => url

若不會設postman環境變數，可以參考這篇[文章](https://dotblogs.com.tw/kinanson/2015/11/07/153838)


*  nodejs-prod:  https://cloud.alatech.com.tw:3000/nodejs/api/

*  nodejs-tst: http://192.168.1.232:3000/nodejs/api/

*  nodejs-uat: https://app.alatech.com.tw:3000/nodejs/api/

*  nodejs-web-dev:  https://192.168.1.235:3001/nodejs/api/

*  nodejs-web-prod: http://192.168.1.235:3000/nodejs/api/

然後headers請設置
Authorization:{{自己的token}}
因為nodejs設置的middleware有一層會檢查


235 server db password: a1atech


### 取得Device log列表

```
Host https://xxx.xxx.xx.xx/nodejs/api/deviceLog/lists
PORT 3000 or 3001
Method GET
Description 依權限取得所有Device log列表
```
**Query string parameters**
```
pageNumber: 1,(非必填，預設為1)
pageSize: 10(非必填，預設為10)
sort: 'asc'/'desc'(非必填，預設為desc)
keyword: ''(非必填)
```
**Response JSON**
```
{
    "datas": [
        {
            "info": "vincent_shih@alatech.com.tw",
            "time": "2018-07-31 13:57:07",
            "user_id": 1,
            "number": 3374
        },
        {
            "info": "cidalatech@gmail.com",
            "time": "2018-07-31 11:52:13",
            "user_id": 97,
            "number": 3848
        },
        {
            "info": "+886930971298",
            "time": "2018-07-31 11:02:06",
            "user_id": 98,
            "number": 331
        },
        {
            "info": "frank.su@alatech.com.tw",
            "time": "2018-07-31 09:12:02",
            "user_id": 12,
            "number": 10734
        },
        {
            "info": "pondercode+002@gmail.com",
            "time": "2018-07-30 09:40:46",
            "user_id": 22,
            "number": 9687
        },
        {
            "info": "s81704100@gmail.com",
            "time": "2018-07-26 11:55:25",
            "user_id": 16,
            "number": 1946
        },
        {
            "info": "christina_chang@alatech.com.tw",
            "time": "2018-07-18 11:33:01",
            "user_id": 26,
            "number": 70
        },
        {
            "info": "buddalee1stlove@gmail.com",
            "time": "2018-07-16 10:20:23",
            "user_id": 46,
            "number": 371
        },
        {
            "info": "pondercode+004@gmail.com",
            "time": "2018-07-13 09:43:40",
            "user_id": 94,
            "number": 107
        },
        {
            "info": "pondercode+003@gmail.com",
            "time": "2018-07-12 14:50:23",
            "user_id": 23,
            "number": 1679
        }
    ],
    "meta": {
        "pageSize": 10,
        "pageCount": 57,
        "pageNumber": 1
    }
}
```
### 尋找device log的帳號關鍵字(email or phone)

```
Host https://xxx.xxx.xx.xx/nodejs/api/deviceLog/search
PORT 3000 or 3001
Method GET
Description 依關鍵字取得帳號資訊
```
**Query string parameters**
```
keyword: 'budd'(必填)
```
**Response JSON**
```
[
    "buddalee1stlove@gmail.com"
]
```
### 取得Device log個人詳細資訊

```
Host https://xxx.xxx.xx.xx/nodejs/api/deviceLog/lists
PORT 3000 or 3001
Method GET
Description 依權限取得Device log個人詳細資訊
```
**Query string parameters**
```
pageNumber: 1,(非必填，預設為1)
pageSize: 10(非必填，預設為10)
sort: 'asc'/'desc'(非必填，預設為desc)
userId: 46(必填)
startDate: '2019-03-06 00:00:00.000000'(非必填)
endDate: '2019-03-06 23:59:59.000000'(非必填)
```
**Response JSON**
```
{
  "datas": [
    {
      "info": "buddalee1stlove@gmail.com",
      "message": "iPhone 6S Plus-12.0 [ 用戶憑證0d0ddafc410621067477c3cd3f2a7cbf ] BETA:1",
      "time": "2019-03-06 09:11:31",
      "equipment_sn": ""
    }
  ],
  "meta": {
    "pageSize": "10",
    "pageCount": 1,
    "pageNumber": 1
  }
}
```

### 上傳GPX檔案去轉換座標系

```
Host https://xxx.xxx.xx.xx/nodejs/api/gpx/upload
PORT 3000 or 3001
Method POST
Description 上傳GPX檔案去轉換座標系
```
**Form Data**
```
file: 檔案(binary)
fromFormat: 'WGS84'
toFormat: 'BD09'
```
**Response JSON**
```
{
    "resultCode": 200,
    "rtnMsg": "success",
    "fileName": "20190312100423_test.gpx",
    "coordinates": [{
      "latitudeDegrees": 39.915432939899084,
      "longitudeDegrees": 116.41013736560625
    }]
}
```
### 群組總人員列表

```
Host https://xxx.xxx.xx.xx/nodejs/api/center/searchMember
PORT 3000 or 3001
Method GET
Description 群組總人員列表
```
**Query string parameters**
```
type: 0,(必填) // 0: 沒有權限的篩選， 1: 有
keyword: ''(必填)
groupId: '0-0-0-0-0-0'(必填，群組的id)
```
**Response JSON**
```
[
    {
        "userName": "admin",
        "groupName": "Alatech",
        "userId": 0
    }
]
```

### 取得自身權限所在群組的列表

```
Host https://xxx.xxx.xx.xx/nodejs/api/center/getGroupList
PORT 3000 or 3001
Method GET
Description 此api會拿header的token去判斷該使用者所處的群組
```
**Response JSON**
```
[
    {
        "groupName": "Alatech",
        "groupId": "0-0-0-0-0-0",
        "accessRight": "20",
        "JoinStatus": 1
    }
]
```
### 取得內部管理員列表

```
Host https://xxx.xxx.xx.xx/nodejs/api/center/innerAdmin
PORT 3000 or 3001
Method GET
Description 取得內部管理員列表
```
**Response JSON**
```
[
    {
        "groupId": "0-0-0-0-0-0",
        "accessRight": "20",
        "userId": 1,
        "userName": "vincent_shih",
        "groupName": "Alatech"
    }
]
```
### 更新內部管理員的權限

```
Host https://xxx.xxx.xx.xx/nodejs/api/center/innerAdmin
PORT 3000 or 3001
Method POST
Description 更新內部管理員的權限
```
**POST JSON**
```
{
  "targetRight": 29,
  "userIds": [1, 6]
}
```
**Response JSON**
```
{"resultCode":200,"rtnMsg":"success"}
```

### 取得Device 資訊

```
Host https://xxx.xxx.xx.xx/nodejs/api/center/innerAdmin
PORT 3000 or 3001
Method GET
Description 去解析http://{{domain}}/app/public_html/products/info.json
```
**Query string parameters**
```
device_sn: A36WB001D0120(必填)
```
**Response JSON**
```
{
  "date": "2017/09",
  "informations": {
    "manual_en-US": "",
    "manual_zh-CN": "",
    "manual_zh-TW": "",
    "relatedLinks_en-US": [
      { "dispName": ""}
    ],
    "relatedLinks_zh-CN": [],
    "relatedLinks_zh-TW": []
  },
  "mainAppData": {
    "appAndroidImg": "",
    "appAndroidUrl": "",
    "appApkImg": "",
    "appApkUrl": "",
    "appIconUrl": "",
    "appId": "",
    "appIosImg": "",
    "appIosUrl": "",
    "appManual_en-US": "",
    "appManual_zh-CN": "",
    "appManual_zh-TW": "",
    "appName": ""
  },
  "modelImgUrl": "",
  "modelName": "",
  "modelType": "",
  "secondaryAppData": { ...跟mainAppData結構相同}
}
```

## 外部排行版

### 更新地圖資訊

```
Host https://xxx.xxx.xx.xx/nodejs/api/map
PORT 3000 or 3001
Method GET
Description 更新地圖資訊，若Rex有更新圖資的話
```

### 取得地圖的gpx檔位址

```
Host https://xxx.xxx.xx.xx/nodejs/api/map/gpxUrl
PORT 3000 or 3001
Method GET
Description 取得地圖的gpx檔位址
```
**Response JSON**
```
[
  {
    "id": 1,
    "gpxData": "https://192.168.1.235/app/public_html/cloudrun/update/v0/eiffel_tower_road_running/tour_eiffel.gpx"
  }
]
```
### 取得地圖的圖檔位址

```
Host https://xxx.xxx.xx.xx/nodejs/api/map/mapUrl
PORT 3000 or 3001
Method GET
Description 取得地圖的圖檔位址
```
**Response JSON**
```
[
  "https://192.168.1.235/app/public_html/cloudrun/update/v0/eiffel_tower_road_running/tour_eiffel_web_bg.jpg"
]
```

### 取得顯示在外部排行榜的賽事tab

```
Host https://xxx.xxx.xx.xx/nodejs/api/raceEventInfo/rankTab
PORT 3000 or 3001
Method GET
Description 取得顯示在外部排行榜的賽事tab
```
**Response JSON**
```
[
  {
    "is_show_portal": 1,
    "is_real_time": 0,
    "time_stamp_start": 1519660800,
    "time_stamp_end": 1520179200,
    "session_name": "萬金石暖身賽(0227-0301)",
    "session_id": 20182270,
    "event_id": 20182270,
    "specific_map": "6"
  },
  {
    "is_show_portal": 1,
    "is_real_time": 0,
    "time_stamp_start": 1521351000,
    "time_stamp_end": 1521370800,
    "session_name": "美迪亞",
    "session_id": 201831813,
    "event_id": 201831812,
    "specific_map": "1"
  }
]
```

### 取得外部排行版資訊

```
Host https://xxx.xxx.xx.xx/nodejs/api/rankForm 
PORT 3000 or 3001
Method GET
Description 取得外部排行版資訊
```
**Query string parameters**
```
pageNumber: 1
pageSize: 10
startDate: '2018-1-1'
endDate: '2019-3-12'
mapId: 1
event_id: '20182270'(非必填，只有ranTab查特定賽事要必填)
```
**Response JSON**
```
{
  "datas": [
    {
      "rank": "1",
      "offical_time": "00:00:56.000",
      "user_id": 16,
      "map_id": 1,
      "gender": 0,
      "month": "06",
      "login_acc": "bill ",
      "map_name": "艾菲爾鐵塔路跑",
      "race_category": null,
      "race_total_distance": 1.45
    },
    {
      "rank": "2",
      "offical_time": "00:01:07.000",
      "user_id": 5,
      "map_id": 1,
      "gender": 0,
      "month": "01",
      "login_acc": "walen",
      "map_name": "艾菲爾鐵塔路跑",
      "race_category": null,
      "race_total_distance": 1.45
    },
    {
      "rank": "2",
      "offical_time": "00:01:07.000",
      "user_id": 2,
      "map_id": 1,
      "gender": 0,
      "month": "01",
      "login_acc": "吳品萱",
      "map_name": "艾菲爾鐵塔路跑",
      "race_category": null,
      "race_total_distance": 1.45
    },
    {
      "rank": "3",
      "offical_time": "00:01:09.000",
      "user_id": 3,
      "map_id": 1,
      "gender": 0,
      "month": "01",
      "login_acc": "ALA_Eric",
      "map_name": "艾菲爾鐵塔路跑",
      "race_category": null,
      "race_total_distance": 1.45
    },
    {
      "rank": "3",
      "offical_time": "00:01:09.000",
      "user_id": 7,
      "map_id": 1,
      "gender": 0,
      "month": "01",
      "login_acc": "claire",
      "map_name": "艾菲爾鐵塔路跑",
      "race_category": null,
      "race_total_distance": 1.45
    },
    {
      "rank": "4",
      "offical_time": "00:01:10.000",
      "user_id": 6,
      "map_id": 1,
      "gender": 1,
      "month": "01",
      "login_acc": "Stella",
      "map_name": "艾菲爾鐵塔路跑",
      "race_category": null,
      "race_total_distance": 1.45
    },
    {
      "rank": "5",
      "offical_time": "00:01:11.000",
      "user_id": 8,
      "map_id": 1,
      "gender": 0,
      "month": "01",
      "login_acc": "頂港有名聲",
      "map_name": "艾菲爾鐵塔路跑",
      "race_category": null,
      "race_total_distance": 1.45
    },
    {
      "rank": "6",
      "offical_time": "00:01:12.000",
      "user_id": 4,
      "map_id": 1,
      "gender": 0,
      "month": "03",
      "login_acc": "Peter",
      "map_name": "艾菲爾鐵塔路跑",
      "race_category": null,
      "race_total_distance": 1.45
    },
    {
      "rank": "7",
      "offical_time": "00:01:40.000",
      "user_id": 1,
      "map_id": 1,
      "gender": 0,
      "month": "01",
      "login_acc": "vincent_shih ' s",
      "map_name": "艾菲爾鐵塔路跑",
      "race_category": null,
      "race_total_distance": 1.45
    },
    {
      "rank": "8",
      "offical_time": "00:04:20.000",
      "user_id": 107,
      "map_id": 1,
      "gender": 0,
      "month": "10",
      "login_acc": "Stone1",
      "map_name": "艾菲爾鐵塔路跑",
      "race_category": null,
      "race_total_distance": 1.45
    }
  ],
  "meta": {
    "pageSize": 10,
    "pageCount": 38,
    "pageNumber": 1
  }
}
```
### 利用關鍵字搜尋相關跑者名稱

```
Host https://xxx.xxx.xx.xx/nodejs/api/rankForm/rankInfo/userName
PORT 3000 or 3001
Method GET
Description 利用關鍵字搜尋相關跑者名稱
```
**Query string parameters**
```
startDate: '2018-1-1'
endDate: '2019-3-12'
mapId: 1
keyword: 'r' // 填入想尋巡的關鍵名稱
```
**Response JSON**
```
[
  "peter006",
  "Peter003",
  "peter005",
  "Peter002",
  "George"
]
```

### 取得地圖詳細資訊與跑者該地圖最佳的簡單運動資料

```
Host https://xxx.xxx.xx.xx/nodejs/api/rankForm/mapInfo
PORT 3000 or 3001
Method GET
Description 取得地圖詳細資訊與跑者該地圖最佳的簡單運動資料
```
**Query string parameters**
```
mapId: 6
userId: 101
```
**Response JSON**
```
{
  "map_id": 6,
  "user_id": 101,
  "max_speed": 20,
  "average_speed": 19.8,
  "max_pace": "03'00\"",
  "average_pace": "03'01\"",
  "map_name": "萬金石暖身賽",
  "race_total_distance": 4.2,
  "race_category": null
}
```
## 賽事管理

### 取得賽事總覽列表

```
Host https://xxx.xxx.xx.xx/nodejs/api/raceEventInfo
PORT 3000 or 3001
Method GET
Description 取得賽事總覽列表
```
Define:
活動(session)是賽事(event)的子集合

**Response JSON**
```
[
  {
    description: "" // 賽事介紹
    end_date: "2018-03-18T11:00:00.000Z"
    event_id: 201831812 // 賽事ID
    event_name: "美迪亞" // 賽事名稱
    event_time_end: 1521311400 // 賽事結束time stamp
    event_time_name: "2018-3-18 12:30 ~ 2018-3-18 02:30" // 賽事時間名稱範圍
    event_time_start: 1521347400 // 賽事開始time stamp
    is_real_time: 0 // 0: 否, 1: 是  ，是否是及時排行版資訊(目前此資訊已被棄用)
    is_show_portal: 1 // 0: 否, 1: 是  ，是否show 在外部排行版
    is_specific_map: 1 // 0: 否, 1: 是 ，是否有指定比賽地圖
    lanuch_date: "2018-11-27T05:31:26.000Z" // 建立賽事活動時間
    launch_time_stamp: 1543296686  // 建立賽事活動time stamp
    launch_user_name: "Roy" // 建立賽事活動者名稱
    session_id: 201831813 //活動id
    session_name: "美迪亞" //活動名稱
    specific_map: "1"  // 指定地圖
    start_date: "2018-03-18T05:30:00.000Z"
    time_stamp_end: 1521370800
    time_stamp_start: 1521351000
  }
]
```
