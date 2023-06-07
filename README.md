# GPTfit

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.0.1
Angular version: 11.0.0

## Installation

```
npm install
```

安裝完成後接著需再下

```
npm run patch
```

以修正部份套件程式碼避免編譯報錯

## Development server

有分為加密模式與非加密模式

若要模擬加密模式的 dev 環境，或是要開發本機端的 nodejs api server

```
npm run dev-ssl-start
```

它將利用在 **/etc/ssl/** 下的憑證，開啟 https:/{{開發機domain}}:8080

若要非加密模式的 dev 環境，但也要開發本機端的 nodejs api server

```
npm run web-start
```

若要 api 導向 234 主機的資料與 service，非加密模式開發

```
npm start
```

詳細的 environment 變數可到[environment](https://gitlab.com/alatech_cloud/web/tree/master/src/environments)資料夾下查看

若 run dev server 時，遇到`ERROR in node_modules/gcoord/dist/types/transform.d.ts(1,35): error TS2307: Cannot find module './geojson'.`
請執行

```
mv node_modules/gcoord/src/geojson.d.ts node_modules/gcoord/dist/types
```

> ※ Heap out of memory
> 在 run angular server 時若遇到 Heap out of memory 的錯誤訊息，目前有三種情況導致此現象發生
>
> 1. html code 有錯：因 angular error log 機制，在越前面的地方出錯，angular 會需要耗費越多記憶體印出 error log，當記憶體超出設定值，會導致直接顯示 Heap out of memory 而無法印出 error log，因此需再回頭檢視程式碼找出錯誤。
> 2. ~~angular 9 bug：angular 9 打包會造成 memory leak 的 bug。~~(目前已更新至 11 以上，目前此問題影響較小)。
> 3. 設定值太小：package.json 裡，scripts.start 有加一個"--max_old_space_size"參數，如確認問題原因非以上兩點，則可嘗試將此設定值調高，如調高仍無法解決，則需嘗試將 code 優化或請 mis 協助提高記憶體。

## Build

Build code 的 npm script 分為三種環境

如果是自己的開發機環境(筆者是 192.168.1.235)

```
npm run web-build
```

如果是 234 主機環境

```
npm run uat-build
```

如果是 130 主機環境

```
npm run prod-build
```

但要注意，目前在 234 環境 build code 時，pm2 不知道為何 run 不起 nodejs api server
雖然[腳本](https://gitlab.com/alatech_cloud/web/blob/master/reset.sh)已設置
目前原因尚未查清楚
但手動再補執行

```
npm run pm2-start
```

即可 run 起 nodejs api server

若仍 run 不起 nodejs api server，檢查 server.js 檔，其 SERVER_CONFIG 所讀取的 ssl 憑證檔案路徑或副檔名是否有更動

順便一提

```
npm run pm2-kill
```

是 kill 掉 nodejs api server process

若有更新 nodejs 的 code 或憑證更新，建議 build 之前先下

```
netstat -tlunp | grep 3000
```

查到 nodejs server pid 後，再下

```
kill -9 pid碼
```

確認該 process 沒在 run 之後，再 build angular
避免 nodejs server 還在跑舊程式碼

## web 本地圖片

web 本地圖片（如首頁圖片等），130/234/235 路徑皆為/var/www/html/app

由專案經理在 234 環境更新圖片，235 環境再去掛載 234 環境該資料夾。

掛載設定檔路徑為/etc/fstab，若未成功掛載，可下

```
mount -a
```

，不需要掛載時下

```
unmount
```

## Product error log

目前 device error log 代碼由研發定義，web 開發者負責文件維護與顯示，若有變更再一併更新下列檔案

> Excel：Q:\APP+CLOUD\05-翻譯管理\錯誤代碼查找表\_{{date}}.xlsx
> GPTfit：src/app/containers/dashboard/pipes/product-error-log.pipe.ts

## 資料夾結構

```
web
├─ apache.config/ // 各環境的apache config設定檔
│   ├─ dev.conf // 235 80port config
│   ├─ dev-ssl.conf // 235 443port config
│   ├─ prod.conf  // 130 80port config
│   ├─ prod-ssl.conf // 130 443port config
│   ├─ uat.conf // 234 80port config
│   └─ uat-ssl.conf // 234 443port config
│
├─ e2e/ // 應用程式 e2e 的測試(end-to-end 是測試整個 user story 的方法)
│
├─ server/ // nodejs api server folder(正式port: 3000，開發port: 3001)
│   ├─ models/ // 程式業務邏輯與資料庫存取
│   ├─ routes/ // 負責轉發請求並回應結果
│   ├─ utils/ // 自訂 共用function
│   ├─ package.json // 此專案的腳本與使用的模組
│   ├─ server.js // api應用程式進入點
│   └─ socket-server.js // 模擬測試socket應用程式進入點(開發port: 3002)
│
├─ src/
│   ├─ app/ // 包含應用的元件和模組，我們要寫的程式碼都在這個目錄
│   ├─ assets/ // 資源目錄，儲存靜態資源的、圖片、多語系json檔(i18n/)
│   ├─ environments/ // 環境配置，可以在不同的環境下（開發環境，測試環境，生產環境）共用一套程式碼
|       ├─ environment.dev.web.ts // 指向235開發環境nodejs api 3001port的環境變數檔
|       ├─ environment.prod.ts // 指向130正式環境nodejs api 3000port的環境變數檔(130 build)
|       ├─ environment.ts // 指向234正式環境nodejs api 3000port的環境變數檔(本機開發)
|       ├─ environment.tst.ts // 指向232開發環境nodejs api 3000port的環境變數檔(已棄用，但未來有多人開發前端，可選用此)
|       ├─ environment.uat.ts // 指向234測試環境nodejs api 3000port的環境變數檔(234 build)
|       ├─ environment.web.ts // 指向235正式環境nodejs api 3000port的環境變數檔(235 build)
|       ├─ index.uat.html // 234測試環境替換index.html（自動替換），以解決測試網域seo過前的問題
|       └─ index.web.html // 235開發環境替換index.html（自動替換）(測試用)
│   ├─ styles/ // 各頁面共用的css樣式，包含主題顏色等等
|       ├─ model/ // 一些基本scss模塊可供其他scss檔進行@import，以方便開發
|       ├─ module/ // 風格相近的頁面，其共用css樣式，方便直接引用
|       ├─ theme/ // 網站主題顏色（目前僅light/dark樣式，故顏色命名是以此為基礎）
|           ├─ light.scss // 清亮主題
|           └─ dark.scss // 暗黑主題
│       ├─ styles.scss  整個網頁應用程式共用的樣式設定檔
│       └─ icon.scss // custom icon 定義scss檔
|
│   ├─ .htaccess // apache route config設定，沒此設定，無法啟用angular route於apache
│   ├─ favicon.ico // 瀏覽器的網址列、書籤、頁籤上都會用到的小 icon 圖檔。
│   ├─ index.html // 整個應用的根html，程式啟動就是訪問這個頁面
│   ├─ main.ts  整個專案的入口點，Angular通過這個檔案來啟動專案
│   ├─ manifest.json  允許將站點添加至手機主屏幕，是PWA提供的一項重要功能
│   ├─ polyfills.ts  主要是用來匯入一些必要庫，為了讓Angular能正常執行在老舊瀏覽器版本下
│   ├─ tsconfig.app.json  TypeScript編譯器的配置,新增第三方依賴的時候會修改這個檔案
│   ├─ tsconfig.spec.json  跟 tsconfig.app.json 用途類似，不過主要是針對測試檔。
│   ├─ typings.d.ts  typescript模組定義檔，為了讓 TypeScript 能與目前市面上各種 JavaScript 模組/函式庫一起運作
│   └─ test.ts // 跟 main.ts 檔類似，不過主要是用在測試檔上。
|
├─ patch/  //  補丁包，用來覆寫套件某些檔案避免編譯錯誤。
├─ .husky/  //  用於git生命週期的套件
├─ angular.json  //  Angular CLI 的設定檔
├─ .gitignore // 讓 git 不要追蹤設定裡的檔案
├─ karma.conf.js //  Karma 的設定檔。Karma 是一套單元測試工具
├─ ngsw-config.json // pwa service worker設定檔
├─ protractor.conf.js // 也是一個做自動化測試的配置檔案
├─ proxy.conf.json // angular本機開發模式時，可以利用內建server反向代理到其他api(目前設置是反向到234 api)
├─ reset.sh // build完後，會run自己定的shell script(主要是搬遷build最新code到/var/web/html/dist)
├─ server.js // node js api server在正式環境的進入點(pm2 start 就是run起這個)
├─ package.json // 此專案的腳本與使用的模組
├─ package-lock.json // 紀錄(鎖定)此專案使用的套件版本
├─ tsconfig.json //  TypeScript 編譯時看的編譯設定檔
├─ robots.txt //  宣告不可以爬蟲的頁面
├─ sitemap.xml //  協助搜尋引擎爬蟲增加SEO
├─ .browserslistrc // 宣告專案支援的瀏覽器版本
├─ .eslintrc.json // eslint設定檔
├─ .prettierignore // 設定prettier執行時要忽略的檔案
├─ .prettierrc.json // prettier設定檔
├─ .editorconfig // vscode editorconfig套件設定檔
└─ tslint.json // TSLint 是 TypeScript 的格式驗證工具
```

## app 資料夾結構

```
app
├─ core/
│   ├─ classes/  // 共用class
│   ├─ enums/  // 共用的typescript enums(列舉)
│   ├─ guard/ // 共用守衛
│   ├─ interceptors/  // 共用攔截器 ex: token 、http status監控
│   ├─ models/  // 有關typescript定義資料型態或共用常數
│   ├─ pipes/  // 共用通道
│   ├─ services/  // 共用服務
│   ├─ utils/  // 自定義的共用function
│   ├─ custom-material.module.ts // 專案會用到的material component自成一個專屬module
│   └─ version.ts // GPTfit版本號
├─ components/  // 全域共用組件
├─ containers/
│   ├─ dashboard/ // 需登入後的頁面，皆為舊有非符合single component angular module(scam)格式
|   |  ├─ components/ // 專屬dashboard模組的元件
|   |  ├─ group/ // 群組的pages(裏頭有群組資訊、群組編輯、我的群組列表...等)
|   |  ├─ group-v2/ // 群組v2的pages(裏頭有群組資訊、群組編輯、我的群組列表...等)
|   |  ├─ guards/ // 專屬dashboard模組的守衛
|   |  ├─ models/ // 有關typescript定義資料型態
|   |  ├─ services/ // 專屬dashboard模組的服務
|   |  ├─ dashboard-routing.module.ts // dashboard路由模組
|   |  ├─ dashboard.component.scss
|   |  ├─ dashboard.component.spec.ts
|   |  ├─ dashboard.component.ts
|   |  ├─ dashboard.component.html
│   |  └─ dashboard.module // 需登入後的內部模組
|   |
│   ├─ portal/ // 不用登入也可使用的頁面，皆為舊有非符合single component angular module(scam)格式
|       ├─ components/ // 專屬外部模組的元件
|       ├─ models/ // 有關typescript定義資料型態
|       ├─ services/ // 專屬外部模組的服務
|       ├─ portal-routing.module.ts // 外部路由模組
|       ├─ portal.component.scss
|       ├─ portal.component.spec.ts
|       ├─ portal.component.ts
|       ├─ portal.component.html
│       └─ portal.module // 需登入後的內部模組
│   ├─ official-activity/ // 官方活動頁，皆為舊有非符合single component angular module(scam)格式
|   |  ├─ guards/ // 專屬dashboard模組的守衛
|   |  ├─ models/ // 有關typescript定義資料型態
|   |  ├─ pipes/ // 專屬official-activity模組的通道
|   |  ├─ services/ // 專屬official-activity模組的服務
|   |  ├─ official-activity-routing.module.ts // dashboard路由模組
|   |  ├─ official-activity.component.scss
|   |  ├─ official-activity.component.spec.ts
|   |  ├─ official-activity.component.ts
|   |  ├─ official-activity.component.html
│   |  └─ official-activity.module // 官方活動頁的內部模組
│   ├─ station-mail/ // 站內信，皆為舊有非符合single component angular module(scam)格式
|   |  ├─ guards/ // 專屬dashboard模組的守衛
|   |  ├─ models/ // 有關typescript定義資料型態
|   |  ├─ pipes/ // 專屬official-activity模組的通道
|   |  ├─ services/ // 專屬official-activity模組的服務
|   |  ├─ official-activity-routing.module.ts // dashboard路由模組
|   |  ├─ official-activity.component.scss
|   |  ├─ official-activity.component.spec.ts
|   |  ├─ official-activity.component.ts
|   |  ├─ official-activity.component.html
│   |  └─ official-activity.module // 官方活動頁的內部模組
│   ├─ personal/ // 個人相關頁面
│   ├─ professional/ // 群組相關頁面
│   ├─ admin-manage/ // 系統管理員操作頁面(後台)
│   └─ device-manage/ // 產品裝置相關頁面（暫定）
|
├─ shared/ // 所有測試 code
│   ├─ components/ // 共用元件，為舊有非standalone格式元件
│   ├─ classes/  // 多為用於 shared/components/ ，故不合併至core資料夾中
│   └─ shared.module.ts // 共用module
│
├─ app-path.const.ts // 路徑變數檔，將各頁面用到的單一路徑統一於此檔管理
├─ app-routing.module.ts // 入口路徑設定檔
├─ app.component.scss
├─ app.component.html
├─ app.component.spec.ts
├─ app.component.ts
└─ app.module.ts  // 內有設定網頁啟動時，需執行的動作（ex.檢查token有無）
```

## Dependency notes

| Dependency Name                                                                                                                | 版本        | 筆記                                                                                                                          | 專案範例連結                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| **[@angular/pwa](https://angular.io/guide/service-worker-getting-started)**                                                    | 0.8.7       | pwa 模組，`但目前center還沒啟用，連結是註解掉的部分`                                                                          | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/app.module.ts#L48)                                                                                     |
| **[@angular/service-worker](https://angular.io/guide/service-worker-getting-started)**                                         | 6.1.6       | service-worker 模組，`但目前center還沒啟用，連結是註解掉的部分`                                                               | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/app.module.ts#L48)                                                                                     |
| **[@ckeditor/ckeditor5-angular](https://ckeditor.com/docs/ckeditor5/latest/)**                                                 | 6.0.1       | 適用於 angular 的文字編輯器套件                                                                                               | none                                                                                                                                                                   |
| **[@ckeditor/ckeditor5-build-decoupled-document](https://www.npmjs.com/package/@ckeditor/ckeditor5-build-decoupled-document)** | 31.0.0      | ckeditor 其中一個編輯模式，該模式擁有最多功能可以使用。                                                                       | none                                                                                                                                                                   |
| **[@ngx-translate/core](https://github.com/ngx-translate/core)**                                                               | 15.0.0      | 處理多語系                                                                                                                    | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/containers/portal/components/signin/signin.component.ts#L87)                                           |
| **@types/googlemaps**                                                                                                          | 3.30.16     | google map 的 typescript 型別定義檔                                                                                           | None                                                                                                                                                                   |
| **@types/highcharts**                                                                                                          | 7.0.0       | highcharts 的 typescript 型別定義檔                                                                                           | None                                                                                                                                                                   |
| **@types/lodash**                                                                                                              | 4.14.109    | lodash 的 typescript 型別定義檔                                                                                               | None                                                                                                                                                                   |
| **[angularx-qrcode](https://github.com/cordobo/angularx-qrcode#readme)**                                                       | 13.0.3      | 產生 qrcode 功能                                                                                                              | [Link](https://gitlab.com/alatech_cloud/web/blob/release_internal_server/src/app/containers/dashboard/components/device/product-info/product-info.component.html#L146) |
| **[bootstrap](https://getbootstrap.com/)**                                                                                     | 4.4.1       | css framework，目前主要的排版 layout 樣式皆採用於此，ex: container、menu...等                                                 | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/shared/components/navbar/navbar.component.html#L80)                                                    |
| **[daterangepicker](https://www.daterangepicker.com)**                                                                         | 3.0.5       | 可以雙開的日期選擇器                                                                                                          | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/shared/components/date-range-picker/date-range-picker.component.ts)                                    |
| **[file-saver](https://github.com/eligrey/FileSaver.js#readme)**                                                               | 1.3.3       | 是一款基於 HTML5 完成文件保存的插件，它可以幫我們直接從網頁中導出多種格式文件                                                 | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/containers/dashboard/components/leaderboard-settings/leaderboard-settings.component.ts#L6)             |
| **[font-awesome](https://fontawesome.com/v4.7.0/)**                                                                            | 4.7.0       | icon font 的 library，目前 center 已經很少使用，主要是用 google mat icon 、和 Rex 自定的 icon，建議可以考慮日後慢慢讓它退場。 | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/containers/portal/portal.component.html#L40)                                                           |
| **[gcoord](https://github.com/hujiulong/gcoord#readme)**                                                                       | 0.2.0       | 轉換坐標系的套件                                                                                                              | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/shared/components/activity-info/activity-info.component.ts#L21)                                        |
| **[hashids](https://hashids.org/javascript/)**                                                                                 | 1.2.2       | hash 字串的套件，目前使用於 userId 和 group id，連結可以導往 salt 的設定                                                      | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/shared/services/hash-id.service.ts#L8)                                                                 |
| **[highcharts](https://www.highcharts.com/)**                                                                                  | 9.0.1       | highchart 套件                                                                                                                | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/shared/components/sport-report/components/scatter-chart/scatter-chart.component.ts#L9)                 |
| **[leaflet](https://github.com/Leaflet/Leaflet#readme)**                                                                       | 1.2.0       | 是一套對行動裝置友善的互動地圖並且開源的 JavaScript 函式庫                                                                    | [Link](https://gitlab.com/alatech_cloud/web/blob/master/angular.json#L38)                                                                                              |
| **[lodash](https://lodash.com/)**                                                                                              | 4.17.15     | 是一个一致性、模块化、高性能的 JavaScript 实用工具库。                                                                        | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/containers/dashboard/components/inner-settings/inner-settings.component.ts#L5)                         |
| **[mapbox](https://github.com/mapbox/mapbox-sdk-js)**                                                                          | 1.0.0-beta9 | 是一些開放原始碼地圖函式庫                                                                                                    | None                                                                                                                                                                   |
| **[material-design-icons](https://github.com/google/material-design-icons)**                                                   | 3.0.1       | Material Design icons by Google 是目前與 rex 自定 icon 大量使用於 center 的庫。                                               | [Link](https://gitlab.com/alatech_cloud/web/blob/release_internal_server/src/app/containers/portal/components/leaderboard/leaderboard.component.html#L98)              |
| **[dayjs](https://day.js.org)**                                                                                                | 1.10.8      | 處理時間格式的函式庫                                                                                                          | None                                                                                                                                                                   |
| **normalize.css**                                                                                                              | 8.0.1       | css 正規化                                                                                                                    | [Link](https://www.npmjs.com/package/normalize.css)                                                                                                                    |     |
| **[ml-regression-simple-linear](https://www.npmjs.com/package/ml-regression-simple-linear)**                                   | 2.0.2       | 用来做群組 report 的簡單回歸分析                                                                                              | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/dashboard/group/group-info/com-life-tracking/com-life-tracking.component.ts#L3)                        |
