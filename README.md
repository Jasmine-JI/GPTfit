# GPT Center

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.5.0.
Angular version: 6.1.10

## Installation
```
npm install
```

## Development server
有分為加密模式與非加密模式

若要模擬加密模式的dev環境，或是要開發本機端的nodejs api server
```
npm run dev-ssl-start
```
它將利用在 **/etc/ssl/** 下的憑證，開啟https:/{{開發機domain}}:8080

若要非加密模式的dev環境，但也要開發本機端的nodejs api server
```
npm run web-start
```

若要api導向234主機的資料與service，非加密模式開發
```
npm start
```
詳細的environment變數可到[environment](https://gitlab.com/alatech_cloud/web/tree/master/src/environments)資料夾下查看

若run dev server時，遇到`ERROR in node_modules/gcoord/dist/types/transform.d.ts(1,35): error TS2307: Cannot find module './geojson'.`
請執行
```
mv node_modules/gcoord/src/geojson.d.ts node_modules/gcoord/dist/types
```


## Build
Build code的npm script分為三種環境

如果是自己的開發機環境(筆者是192.168.1.235)
```
npm run web-build
```
如果是234主機環境
```
npm run uat-build
```
如果是130主機環境
```
npm run prod-build
```

但要注意，目前在234環境build code時，pm2 不知道為何run不起nodejs api server
雖然[腳本](https://gitlab.com/alatech_cloud/web/blob/master/reset.sh)已設置
目前原因尚未查清楚
但手動再補執行
```
npm run pm2-start
```
即可run起 nodejs api server

順便一提
```
npm run pm2-kill
```
是kill掉nodejs api server process
