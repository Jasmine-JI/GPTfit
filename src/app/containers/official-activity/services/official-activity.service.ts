import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError, of, ReplaySubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OfficialActivityService {

  allMapInfo$ = new ReplaySubject(1);
  screenSize$ = new ReplaySubject(1);
  constructor(
    private http: HttpClient
  ) { }

  /**
   * api 6001-建立新官方賽事（限29權）
   * @param body {any}
   * @author kidin-1100928
   */
  createEvent(body: any) {
    return this.http.post<any>('api/v2/event/createEvent', body).pipe(
      catchError(err => {
        throwError(err);
        return of(this.createEventRes)
      })

    );

  }

  /**
   * api 6002-取得官方賽事詳細資訊
   * @param body {any}
   * @author kidin-1100928
   */
  getEventDetail(body: any) {
    return this.http.post<any>('api/v2/event/getEventDetail', body).pipe(
      catchError(err => {
        throwError(err);
        return of(this.getEventDetailRes)
      })

    );
    
  }

  /**
   * api 6003-編輯官方賽事詳細資訊
   * @param body {any}
   * @author kidin-1100928
   */
  editEventDetail(body: any) {
    return this.http.post<any>('api/v2/event/editEventDetail', body).pipe(
      catchError(err => {
        throwError(err);
        return of(this.editEventDetailRes)
      })

    );
    
  }

  /**
   * api 6004-取得官方賽事列表
   * @param body {any}
   * @author kidin-1100928
   */
  getEventList(body: any) {
    return this.http.post<any>('api/v2/event/getEventList', body).pipe(
      catchError(err => {
        throwError(err);
        return of(this.getEventListRes)
      })

    );
    
  }

  /**
   * api 6005-使用者報名官方賽事
   * @param body {any}
   * @author kidin-1100928
   */
  applyEvent(body: any) {
    return this.http.post<any>('api/v2/event/applyEvent', body).pipe(
      catchError(err => {
        throwError(err);
        return of(this.applyEventRes)
      })

    );
    
  }

  /**
   * api 6006-取得參賽者名單
   * @param body {any}
   * @author kidin-1100928
   */
   getParticipantList(body: any) {
    return this.http.post<any>('api/v2/event/getParticipantList', body).pipe(
      catchError(err => {
        throwError(err);
        return of(this.getParticipantListRes)
      })

    );
    
  }

  /**
   * api 6007-編輯參賽者名單
   * @param body {any}
   * @author kidin-1100928
   */
  editParticipantList(body: any) {
    return this.http.post<any>('api/v2/event/editParticipantList', body).pipe(
      catchError(err => {
        throwError(err);
        return of(this.editParticipantListRes)
      })

    );
    
  }

  /**
   * api 6008-取得使用者歷史參賽紀錄
   * @param body {any}
   * @author kidin-1100928
   */
  getParticipantHistory(body: any) {
    return this.http.post<any>('api/v2/event/getParticipantHistory', body).pipe(
      catchError(err => {
        throwError(err);
        return of(this.getParticipantHistoryRes)
      })

    );
    
  }

  /**
   * api 6009-取得指定賽事排行榜
   * @param body {any}
   * @author kidin-1100928
   */
  getEventLeaderboard(body: any) {
    return this.http.post<any>('api/v2/event/getEventLeaderboard', body).pipe(
      catchError(err => {
        throwError(err);
        return of(this.getEventLeaderboardRes)
      })

    );
    
  }

  /**
   * api 6010-getEventUserProfile
   * @param body {any}
   * @author kidin-1100928
   */
  getEventUserProfile(body: any) {
    return this.http.post<any>('api/v2/event/getEventUserProfile', body).pipe(
      catchError(err => {
        throwError(err);
        return of(this.getEventUserProfileRes)
      })

    );
    
  }

  /**
   * api 6011-取得廣告資訊
   * @param body {any}
   * @author kidin-1100928
   */
  getEventAdvertise(body: any) {
    return this.http.post<any>('api/v2/event/getEventAdvertise', body).pipe(
      catchError(err => {
        throwError(err);
        return of(this.getEventAdvertiseRes)
      })

    );
    
  }

  /**
   * api 6012-編輯廣告資訊
   * @param body {any}
   * @author kidin-1100928
   */
  updateEventAdvertise(body: any) {
    return this.http.post<any>('api/v2/event/updateEventAdvertise', body).pipe(
      catchError(err => {
        throwError(err);
        return of(this.updateEventAdvertiseRes)
      })

    );
    
  }

  
  /**
   * api 6013-建立商品訂單
   * @param body {any}
   * @author kidin-1100928
   */
   createProductOrder(body: any) {
    return this.http.post<any>('api/v2/event/createProductOrder', body).pipe(
      catchError(err => {
        throwError(err);
        return of(err)
      })

    );
    
  }

  
  /**
   * api 6014-更新商品訂單資訊
   * @param body {any}
   * @author kidin-1100928
   */
  updateProductOrder(body: any) {
    return this.http.post<any>('api/v2/event/updateProductOrder', body).pipe(
      catchError(err => {
        throwError(err);
        return of(err)
      })

    );
    
  }

  /**
   * 儲存所有雲跑地圖資訊供子頁面使用
   * @param info {any}-cloudrun 所有地圖資訊
   * @author kidin-1101007
   */
  saveAllMapInfo(info: any) {
    this.allMapInfo$.next(info);
  }

  /**
   * 藉由rxjs取得已儲存之雲跑地圖資訊
   * @author kidin-1101007
   */
  getRxAllMapInfo() {
    return this.allMapInfo$;
  }

  /**
   * 儲存裝置大小是否為攜帶型裝置
   * @param screenSize {number}-裝置螢幕大小
   * @author kidin-1101012
   */
  setScreenSize(screenSize: number) {
    this.screenSize$.next(screenSize);
  }

  /**
   * 取得裝置螢幕大小
   * @author kidin-1101012
   */
  getScreenSize() {
    return this.screenSize$;
  }


/********************************************************** fake data ********************************************/


  createEventRes = {
    "processResult": {
      "resultCode": 200,
      "resultMessage": "Request Success",
      "apiCode": 6001,
      "apiReturnCode": 1,
      "apiReturnMessage": "建立成功"
    },
    "eventId": 1
  };

  getEventDetailRes = {
    "processResult": {
      "resultCode": 200,
      "resultMessage": "Request Success",
      "apiCode": 6002,
      "apiReturnCode": 2,
      "apiReturnMessage": "取得賽事詳細資訊成功"
  },
    "eventInfo":{
        "eventId": 1,
        "eventName": "蘭嶼21K線上半馬",
        "themeImg": "https://app.alatech.com.tw/img/ui/lLZn24ZX/2/3b9bd972-2ff1-11ec-bc7a-c8d3ffbbae18.jpg",
        "description": "吹著海風，望著大海，比賽也可以很享受",
        "applyDate": {
            // "startDate": 1634659200,
            "startDate": 1638101600,
            "endDate": 1638201600
        },
        "raceDate":{
            "startDate": 1638288000,
            "endDate": 1640880000
        },
        "cloudrunMapId": 14,
        "creatorId": 384,
        "createDate": 1636041600,
        "editorId": 394,
        "lastEditDate": 1636041600
    },
    "eventDetail": {
        "content": [
            {
              "title": "路線圖",
              "contentId": 1,
              "cardType": 2,
              "img": "https://app.alatech.com.tw/img/ui/lLZn24ZX/2/3b9bd972-2ff1-11ec-bc7a-c8d3ffbbae18.jpg"
            },
            {
              "title": "參賽辦法",
              "contentId": 2,
              "cardType": 1,
              "text": "<h4>參賽辦法</h4><br><p>使用雲跑app參加比賽...</p>"
            },
            {
              "title": "",
              "contentId": 3,
              "cardType": 3,
              "videoLink": "https://www.youtube.com/embed/M7lc1UVf-VE"
            },
            {
              "title": "分組",
              "contentId": 4,
              "cardType": 1,
              "text": "<table><thead><tr><th>青年組</th><th>長青組</th></tr></thead><tbody><tr><td>18-40歲</td><td>41-65歲</td></tr></tbody></table>"
            },
            {
              "title": "路線圖",
              "contentId": 5,
              "cardType": 2,
              "img": "https://app.alatech.com.tw/img/ui/lLZn24ZX/2/3b9bd972-2ff1-11ec-bc7a-c8d3ffbbae18.jpg"
            },
            {
              "title": "參賽辦法",
              "contentId": 6,
              "cardType": 1,
              "text": "<h4>參賽辦法</h4><br><p>使用雲跑app參加比賽...</p>"
            },
            {
              "title": "",
              "contentId": 7,
              "cardType": 3,
              "videoLink": "https://www.youtube.com/embed/M7lc1UVf-VE"
            },
            {
              "title": "分組",
              "contentId": 8,
              "cardType": 1,
              "text": "<table><thead><tr><th>青年組</th><th>長青組</th></tr></thead><tbody><tr><td>18-40歲</td><td>41-65歲</td></tr></tbody></table>"
            }
        ],
        "applyFee": [
            {
                "feeId": 1,
                "title": "零優惠方案",
                "fee": 350,
                "img": "http://app.alatech.com.tw/app/public_html/products/img/wb002.png"
            },
            {
                "feeId": 2,
                "title": "搭配AT6000跑步機",
                "fee": 35000,
                "img": "https://app.alatech.com.tw/img/ui/lLZn24ZX/2/3b9bd972-2ff1-11ec-bc7a-c8d3ffbbae18.jpg"
            }
        ],
        "group": [
            {
                "id": 1,
                "name": "男子青壯年組",
                "gender": 0,
                "age": {
                    "min": 18,
                    "max": 65
                }
            },
            {
                "id": 2,
                "name": "男子長青組",
                "gender": 0,
                "age": {
                    "min": 66,
                    "max": 100
                }
            },
            {
                "id": 3,
                "name": "女子組",
                "gender": 1
            }
        ]
    },
    "currentTimestamp": 1636041600
  }

  editEventDetailRes = {
    "processResult": {
      "resultCode": 200,
      "resultMessage": "Request Success",
      "apiCode": 6003,
      "apiReturnCode": 3,
      "apiReturnMessage": "編輯賽事詳細資訊成功"
    }
  }

  getEventListRes = {
    "processResult": {
      "resultCode": 200,
      "resultMessage": "Request Success",
      "apiCode": 6004,
      "apiReturnCode": 4,
      "apiReturnMessage": "取得官方賽事列表成功"
    },
    "eventList": [
      {
          "eventId": 1,
          "eventName": "蘭嶼21K線上半馬",
          "description": "島上的達悟族人千百年來以利用自然資源的生活方式，發展出獨特的海島民族文化，因地理位置的特殊所蘊育的自然資源更為豐富多樣，許多珍貴稀有的動植物均生長於此。",
          "themeImg": "https://app.alatech.com.tw/app/public_html/cloudrun/update/map-summary/map-photo_11.jpg",
          "applyDate": {
            "startDate": 1639041600,
            "endDate": 1640201600
          },
          "raceDate": {
            "startDate": 1641288000,
            "endDate": 1642880000
          },
          "cloudrunMapId": 14,
          "creatorId": 384,
          "createDate": 1636041600,
          "editorId": 394,
          "lastEditDate": 1636041600
      },
      {
        "eventId": 2,
        "eventName": "台北劍南山雲端賽",
        "description": "由大直美麗華沿著劍南路上山，終點位於我可能不會愛你的私房夜景點。",
        "themeImg": "https://app.alatech.com.tw/app/public_html/cloudrun/update/map-summary/map-photo_36.jpg",
        "applyDate": {
          "startDate": 1636041600,
          "endDate": 1638201600
        },
        "raceDate": {
          "startDate": 1638288000,
          "endDate": 1640880000
        },
        "cloudrunMapId": 36,
        "creatorId": 384,
        "createDate": 1636041600,
        "editorId": 394,
        "lastEditDate": 1636041600
      },
      {
        "eventId": 3,
        "eventName": "歐伯維森菲爾德 奧林匹克體育場",
        "description": "於1972年德國慕尼黑夏季奧運會的主體育場，以頗具革命性的帳篷式屋頂結構聞名。體育場作為德國的國家體育場，能夠舉辦大部分的國際體育賽事。",
        "themeImg": "https://www.gptfit.com/app/public_html/cloudrun/update/map-summary/map-photo_48.jpg",
        "applyDate": {
          "startDate": 1633041600,
          "endDate": 1634201600
        },
        "raceDate": {
          "startDate": 1634288000,
          "endDate": 1635880000
        },
        "cloudrunMapId": 2,
        "creatorId": 384,
        "createDate": 1636041600,
        "editorId": 394,
        "lastEditDate": 1636041600
      }
    ],
    "totalCounts": 23,
    "currentTimestamp": 1636041600
  }

  applyEventRes = {
    "processResult": {
      "resultCode": 200,
      "resultMessage": "Request Success",
      "apiCode": 6005,
      "apiReturnCode": 5,
      "apiReturnMessage": "報名成功"
    },
    "register": {
        "token": "A5AOIJSDowlkzx57487fasdO...",
        "password": "Gg1233456789"
    }
  }

  getParticipantListRes = {
    "processResult": {
      "resultCode": 200,
      "resultMessage": "Request Success",
      "apiCode": 6006,
      "apiReturnCode": 6,
      "apiReturnMessage": "取得參賽者列表成功"
    },
    "participantList": [
      {
          "targetEventId": 1,
          "groupId": 2,
          "groupName": "男子長青組",
          "userId": 384,
          "icon": "https://gptfit.com/img/ui/2pHyHy9fRsJSB/3/7c9e6679-6645-40de-944b-e07fc1f90a33.png",
          "nickname": "金城五號",
          "mobileNumber": "0912345678",
          "countryCode": "886",
          "email": "google@google.com.tw",
          "taiwaness": "true",
          "idCardNumber": "A123456789",
          "birthday": "19900101",
          "gender": 0,
          "truthName": "金城五",
          "address": "台中市南區忠明南路758號43樓",
          "emergencyContact": {
              "name": "金城四",
              "mobileNumber": "0987654321",
              "relationship": "父子"
          },
          "remark": "晚上18:30至22:00可收貨",
          "applyStatus": 1,
          "paidStatus": 1,
          "paidId": "abcd12345678"
      }
    ]
  }

  editParticipantListRes = {
    "processResult": {
      "resultCode": 200,
      "resultMessage": "Request Success",
      "apiCode": 6007,
      "apiReturnCode": 7,
      "apiReturnMessage": "編輯參賽者列表成功"
    }
  }

  getParticipantHistoryRes = {
    "processResult": {
      "resultCode": 200,
      "resultMessage": "Request Success",
      "apiCode": 6008,
      "apiReturnCode": 8,
      "apiReturnMessage": "取得使用者歷史參賽紀錄成功"
    },
    "info": {
      "nickname": "金城五號",
      "userId": "384",
      "icon": "https://gptfit.com/img/ui/2pHyHy9fRsJSB/3/7c9e6679-6645-40de-944b-e07fc1f90a33.png",
      "history": [
        {
            "eventId": 1,
            "eventName": "蘭嶼21K半馬",
            "description": "吹著海風，望著大海，比賽也可以很享受",
            "themeImg": "https://app.alatech.com.tw/app/public_html/cloudrun/update/map-summary/map-photo_11.jpg",
            "paidStatus": 2,
            "applyDate": {
              "startDate": 1636041600,
              "endDate": 1638201600
            },
            "raceDate": {
              "startDate": 1638288000,
              "endDate": 1640880000
            },
            "cloudrunMapId": 14,
            "groupId": 2,
            "groupName": "男子青壯年組",
            "rank": null,
            "totalRacerCounts": null,
            "record": null
        },
        {
            "eventId": 2,
            "eventName": "歐伯維森菲爾德 奧林匹克體育場",
            "description": "於1972年德國慕尼黑夏季奧運會的主體育場，以頗具革命性的帳篷式屋頂結構聞名。體育場作為德國的國家體育場，能夠舉辦大部分的國際體育賽事。",
            "themeImg": "https://app.alatech.com.tw/app/public_html/cloudrun/update/map-summary/map-photo_36.jpg",
            "paidStatus": 3,
            "applyDate": {
              "startDate": 1633041600,
              "endDate": 1634201600
            },
            "raceDate": {
              "startDate": 1634288000,
              "endDate": 1635880000
            },
            "cloudrunMapId": 59,
            "groupId": 1,
            "groupName": "男子組",
            "rank": 101,
            "totalRacerCounts": 200,
            "record": 16780
        }
      ]
    },
    "currentTimestamp": 1636041600
  }

  getEventLeaderboardRes = {
    "processResult": {
      "resultCode": 200,
      "resultMessage": "Request Success",
      "apiCode": 6009,
      "apiReturnCode": 9,
      "apiReturnMessage": "取得指定賽事排行榜成功"
  },
  "eventId": 1,
  "leaderboard": [
          {
              "userId": 384,
              "nickname": "金城五號",
              "groupId": 1,
              "groupName": "男子青少年組",
              "icon": "https://gptfit.com/img/ui/2pHyHy9fRsJSB/3/7c9e6679-6645-40de-944b-e07fc1f90a33.png",
              "record": "15:14"
          },
          {
              "userId": 394,
              "nickname": "專門陪跑員",
              "groupId": 2,
              "groupName": "男子長青組",
              "icon": "https://gptfit.com/img/ui/2pHyHy9fRsJSB/3/7c9e6679-6645-40de-944b-e07fc1f90a34.png",
              "record": "15:15"
          }
    ]
  }

  getEventUserProfileRes = {
    "processResult": {
      "resultCode": 200,
      "resultMessage": "Request Success",
      "apiCode": 6010,
      "apiReturnCode": 10,
      "apiReturnMessage": "取得個人資訊成功"
  },
  "userProfile": {
      "nickname": "參賽者一號",
      "mobileNumber": "0912345678",
      "countryCode": "886",
      "email": "google@google.com.tw",
      "taiwaness": "true",
      "idCardNumber": "A123456789",
      "address": "台中市南區忠明南路758號43樓",
      "birthday": "19900101",
      "gender": 0,
      "truthName": "金城五",
      "emergencyContact": {
          "name": "金城四",
          "mobileNumber": "0987654321",
          "relationship": "父子"
      },
      "remark": "晚上18:30至22:00可收貨"
    }
  }

  getEventAdvertiseRes = {
    "processResult": {
      "resultCode": 200,
      "resultMessage": "Request Success",
      "apiCode": 6011,
      "apiReturnCode": 11,
      "apiReturnMessage": "取得廣告資訊成功"
  },
  "advertise": [
      {
          "advertiseId": 1,
          "link": "https://www.gptfit.com",
          "img": "https://app.alatech.com.tw/img/gi/j8HXH7WFYH1HG/12/4ecb79f6-3b52-11eb-bc1d-c8d3ffbbae18.jpg",
          "effectDate": 1638288000
      },
      {
          "advertiseId": 2,
          "link": "https://app.alatech.com.tw",
          "img": "https://app.alatech.com.tw/img/ui/lLZn24ZX/2/6490c726-1ffb-11ec-bc7a-c8d3ffbbae18.jpg",
          "effectDate": 1640880000
      }
    ]
  }

  updateEventAdvertiseRes = {
    "processResult": {
      "resultCode": 200,
      "resultMessage": "Request Success",
      "apiCode": 6012,
      "apiReturnCode": 12,
      "apiReturnMessage": "編輯廣告資訊成功"
    }
  }

}
