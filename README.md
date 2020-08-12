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

若仍run不起nodejs api server，檢查server.js檔，其SERVER_CONFIG所讀取的ssl憑證檔案路徑或副檔名是否有更動

順便一提
```
npm run pm2-kill
```
是kill掉nodejs api server process
（235環境無效，需要再下netstat -tlunp | grep 3000 查到pid後，再下kill -9 pid碼 進行刪除）
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
│   ├─ assets/ // 資源目錄，儲存靜態資源的 比如圖片、多語系json檔(i18n/)
│   ├─ environments/ // 環境配置。Angular是支援多環境開發的，我們可以在不同的環境下（開發環境，測試環境，生產環境）共用一套程式碼，主要用來配置環境的
|       ├─ environment.dev.web.ts // 指向235開發環境nodejs api 3001port的環境變數檔
|       ├─ environment.prod.ts // 指向130正式環境nodejs api 3000port的環境變數檔(130 build)
|       ├─ environment.ts // 指向234正式環境nodejs api 3000port的環境變數檔(本機開發) 
|       ├─ environment.tst.ts // 指向232開發環境nodejs api 3000port的環境變數檔(已棄用，但未來有多人開發前端，可選用此)
|       ├─ environment.uat.ts // 指向234正式環境nodejs api 3000port的環境變數檔(234 build) 
|       └─  environment.web.ts // 指向235正式環境nodejs api 3000port的環境變數檔(235 build) 
|
│   ├─ .htaccess // apache route config設定，沒此設定，無法啟用angular route於apache
│   ├─ favicon.ico // 瀏覽器的網址列、書籤、頁籤上都會用到的小 icon 圖檔。
│   ├─ icon.css // Rex custom icon 定義css檔
│   ├─ index.html // 整個應用的根html，程式啟動就是訪問這個頁面
│   ├─ main.ts  整個專案的入口點，Angular通過這個檔案來啟動專案
│   ├─ manifest.json  允許將站點添加至手機主屏幕，是PWA提供的一項重要功能
│   ├─ polyfills.ts  主要是用來匯入一些必要庫，為了讓Angular能正常執行在老舊瀏覽器版本下
│   ├─ styles.scss  整個網頁應用程式共用的樣式設定檔(scss版本，希望css檔慢慢變成以scss 去做預處理開發)
│   ├─ tsconfig.app.json  TypeScript編譯器的配置,新增第三方依賴的時候會修改這個檔案
│   ├─ tsconfig.spec.json  跟 tsconfig.app.json 用途類似，不過主要是針對測試檔。
│   ├─ typings.d.ts  typescript模組定義檔，為了讓 TypeScript 能與目前市面上各種 JavaScript 模組/函式庫一起運作
│   └─ test.ts // 跟 main.ts 檔類似，不過主要是用在測試檔上。
|
├─ angular.json  //  Angular CLI 的設定檔
├─ .gitignore // 讓 git 不要追蹤設定裡的檔案
├─ karma.conf.js //  Karma 的設定檔。Karma 是一套單元測試工具
├─ ngsw-config.json // pwa service worker設定檔
├─ protractor.conf.js // 也是一個做自動化測試的配置檔案
├─ proxy.conf.json // angular本機開發模式時，可以利用內建server反向代理到其他api(目前設置是反向到234 api)
├─ reset.sh // build完後，會run自己定的shell script(主要是搬遷build最新code到/var/web/html/dist)
├─ server.js // node js api server在正式環境的進入點(pm2 start 就是run起這個)
├─ package.json // 此專案的腳本與使用的模組
├─ tsconfig.json //  TypeScript 編譯時看的編譯設定檔
└─ tslint.json // TSLint 是 TypeScript 的格式驗證工具
```

## app資料夾結構
```
app
├─ containers/
│   ├─ dashboard/ // 需登入後的頁面
|   |  ├─ components/ // 專屬dashboard模組的元件
|   |  ├─ group/ // 群組的pages(裏頭有群組資訊、群組編輯、我的群組列表...等)
|   |  ├─ guards/ // 專屬dashboard模組的守衛
|   |  ├─ models/ // 有關typescript定義資料型態
|   |  ├─ pipes/ // 專屬dashboard模組的通道
|   |  ├─ services/ // 專屬dashboard模組的服務
|   |  ├─ dashboard-routing.module.ts // dashboard路由模組
|   |  ├─ dashboard.component.css
|   |  ├─ dashboard.component.spec.ts
|   |  ├─ dashboard.component.ts
|   |  ├─ dashboard.component.html
│   |  └─ dashboard.module // 需登入後的內部模組
|   |
│   └─ portal/ // 不用登入也可使用的頁面
|       ├─ components/ // 專屬外部模組的元件
|       ├─ models/ // 有關typescript定義資料型態
|       ├─ services/ // 專屬外部模組的服務
|       ├─ portal-routing.module.ts // 外部路由模組
|       ├─ portal.component.css
|       ├─ portal.component.spec.ts
|       ├─ portal.component.ts
|       ├─ portal.component.html
│       └─ portal.module // 需登入後的內部模組
|
├─ shared/ // 所有測試 code
│   ├─ components/ // 共用元件
│   ├─ guards/ // 共用守衛
│   ├─ interceptors/  // 共用攔截器 ex: token 、http status監控
│   ├─ models/ // 有關typescript定義資料型態
│   ├─ pipes/ // 共用通道，ex: group level、group status
│   ├─ services/ // 共用服務
│   ├─ utils/ // 自訂 共用function
│   ├─ custom-mat-paginator-intl.ts // 使用到 material table paginator的多語系就在此設定
│   ├─ custom-material.module.ts // 專案會用到的material component自成一個專屬module
│   ├─ equal-value-validator.ts // 此validator會判斷兩個form control是否相等的驗證器，目前使用於forgetpwd component裡，驗證"再次確認電話號碼"
│   ├─ global-events-manager.ts // 全域事件通知(event emitter管理)
│   ├─ shared.module.ts // 共用module
│   └─ version.ts // GPT center版本號
│
├─ app-routing.module.ts
├─ app.component.css
├─ app.component.html
├─ app.component.spec.ts
├─ app.component.ts
└─ app.module.ts
```

## Dependency notes

| Dependency Name | 版本 | 筆記 | 專案範例連結

| ---  | ---  | ---  | ---  |
| ---- | ---- | ---- | ---- |
|      |      |      |      |
**[@ngx-progressbar/core](https://github.com/murhafsousli/ngx-progressbar)** | 5.3.1 | 進度條，ex:使用於裝置資訊、QR配對頁面...等 | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/shared/components/activity-info/activity-info.component.html#L1)
**[@ngx-translate/core](https://github.com/ngx-translate/core)** | 10.0.2 | 處理多語系 | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/containers/portal/components/signin/signin.component.ts#L87)
**[@angular/pwa](https://angular.io/guide/service-worker-getting-started)** | 0.8.7 | pwa模組，`但目前center還沒啟用，連結是註解掉的部分` | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/app.module.ts#L48)
**[@angular/service-worker](https://angular.io/guide/service-worker-getting-started)** | 6.1.6 | service-worker模組，`但目前center還沒啟用，連結是註解掉的部分` | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/app.module.ts#L48)
**@types/googlemaps** | 3.30.16 | google map的typescript型別定義檔 | None
**@types/highcharts** | 5.0.31 | highcharts的typescript型別定義檔 | None
**@types/lodash** | 4.14.109 | lodash的typescript型別定義檔 | None
**@types/query-string** | 6.2.0 | query-string的typescript型別定義檔 | None
**[angularx-qrcode](https://github.com/cordobo/angularx-qrcode#readme)** | 1.5.3 | 產生qrcode功能 | [Link](https://gitlab.com/alatech_cloud/web/blob/release_internal_server/src/app/containers/dashboard/components/device/product-info/product-info.component.html#L146)
**[bootstrap](https://getbootstrap.com/)** | 4.1.3 | css framework，目前主要的排版layout樣式皆採用於此，ex: container、menu...等 | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/shared/components/navbar/navbar.component.html#L80)
**[file-saver](https://github.com/eligrey/FileSaver.js#readme)** | 1.3.3 | 是一款基於 HTML5 完成文件保存的插件，它可以幫我們直接從網頁中導出多種格式文件 | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/containers/dashboard/components/leaderboard-settings/leaderboard-settings.component.ts#L6)
**[font-awesome](https://fontawesome.com/v4.7.0/)** | 4.7.0 | icon font 的library，目前center已經很少使用，主要是用google mat icon 、和Rex自定的icon，建議可以考慮日後慢慢讓它退場。此icon font特點為<fa> tag| [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/containers/portal/portal.component.html#L40)
**[gcoord](https://github.com/hujiulong/gcoord#readme)** | 0.2.0| 轉換坐標系的套件 | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/shared/components/activity-info/activity-info.component.ts#L21)
**[hashids](https://hashids.org/javascript/)** | 1.2.2| hash字串的套件，目前使用於userId和group id，連結可以導往salt的設定 | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/shared/services/hash-id.service.ts#L8)
**[highcharts](https://www.highcharts.com/)** | 6.1.1| highchart套件 | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/shared/components/sport-report/components/scatter-chart/scatter-chart.component.ts#L9)
**[leaflet](https://github.com/Leaflet/Leaflet#readme)** | 1.2.0| 是一套對行動裝置友善的互動地圖並且開源的JavaScript函式庫 | [Link](https://gitlab.com/alatech_cloud/web/blob/master/angular.json#L38)
**[lodash](https://lodash.com/)** | 4.17.4| 是一个一致性、模块化、高性能的 JavaScript 实用工具库。 | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/containers/dashboard/components/inner-settings/inner-settings.component.ts#L5)
**[mapbox](https://github.com/mapbox/mapbox-sdk-js)** | 1.0.0-beta9| 是一些開放原始碼地圖函式庫 | None
**[material-design-icons](https://github.com/google/material-design-icons)** | 3.0.1| Material Design icons by Google 是目前與rex 自定icon大量使用於center的庫。特色是<i class="material-icons"></i> | [Link](https://gitlab.com/alatech_cloud/web/blob/release_internal_server/src/app/containers/portal/components/leaderboard/leaderboard.component.html#L98)
**[moment](http://momentjs.com/)** | 2.20.1|處理時間格式的函式庫 | None
**[mydatepicker](https://github.com/kekeh/mydatepicker#readme)** | 2.6.1|日期選擇器元件，目前使用於外部排行版與賽事管理系統，建議可以慢慢替換成material design(因為那時還沒出...) | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/containers/portal/portal.component.ts#L15)
**[query-string](https://github.com/sindresorhus/query-string#readmee)** | 6.1.0| 用来做url查询参数的解析| [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/shared/services/utils.service.ts#L3)
**[ml-regression-simple-linear](https://www.npmjs.com/package/ml-regression-simple-linear)** | 2.1.1| 用来做群組report的簡單回歸分析 | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/dashboard/group/group-info/com-life-tracking/com-life-tracking.component.ts#L3)
**[tui-calendar](https://ui.toast.com/tui-calendar/)** | 1.12.11| 行事曆套件 | [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/shared/components/tui-calender/tui-calender.component.ts)
**[daterangepicker](https://www.daterangepicker.com)** | 3.0.5| 可以雙開的日期選擇器| [Link](https://gitlab.com/alatech_cloud/web/blob/master/src/app/shared/components/date-range-picker/date-range-picker.component.ts)

## 套件修改
若有更新套件，請修改以下套件避免報錯或跑版

### tui-calendar

> 路徑：./var/web/node_modules/tui-calendar/dist/tui-calendar.css
> 說明：刪除小白點樣式。

```scss
// 刪除此樣式
.tui-full-calendar-weekday-schedule-bullet {
  position: absolute;
  padding: 0;
  width: 6px;
  height: 6px;
  top: 6px;
  left: 0;
  border-radius: 50%;
}
```

### ml-regression-simple-linear
> 路徑：./var/web/node_modules/ml-regression-simple-linear/regression-simple-linear.d.ts
> 說明：修改套件輸出檔案的寫法避免報錯。

```javascript
// 將輸出類修改成以下形式，並刪除最後export = SimpleLinearRegression;
export default class SimpleLinearRegression extends BaseRegression
```

### query-string
> 路徑：./var/web/node_modules/query-string/index.js
> 說明：修改套件輸出檔案的寫法避免報錯。

```javascript
// 目前僅需該套件的stringify,parse函式，故只輸出該兩個函式，修改內容可參考以下。
'use strict';
const strictUriEncode = require('strict-uri-encode');
const decodeComponent = require('decode-uri-component');
const splitOnFirst = require('split-on-first');

const isNullOrUndefined = value => value === null || value === undefined;

function encoderForArrayFormat(options) {
	switch (options.arrayFormat) {
		case 'index':
			return key => (result, value) => {
				const index = result.length;

				if (
					value === undefined ||
					(options.skipNull && value === null) ||
					(options.skipEmptyString && value === '')
				) {
					return result;
				}

				if (value === null) {
					return [...result, [encode(key, options), '[', index, ']'].join('')];
				}

				return [
					...result,
					[encode(key, options), '[', encode(index, options), ']=', encode(value, options)].join('')
				];
			};

		case 'bracket':
			return key => (result, value) => {
				if (
					value === undefined ||
					(options.skipNull && value === null) ||
					(options.skipEmptyString && value === '')
				) {
					return result;
				}

				if (value === null) {
					return [...result, [encode(key, options), '[]'].join('')];
				}

				return [...result, [encode(key, options), '[]=', encode(value, options)].join('')];
			};

		case 'comma':
		case 'separator':
			return key => (result, value) => {
				if (value === null || value === undefined || value.length === 0) {
					return result;
				}

				if (result.length === 0) {
					return [[encode(key, options), '=', encode(value, options)].join('')];
				}

				return [[result, encode(value, options)].join(options.arrayFormatSeparator)];
			};

		default:
			return key => (result, value) => {
				if (
					value === undefined ||
					(options.skipNull && value === null) ||
					(options.skipEmptyString && value === '')
				) {
					return result;
				}

				if (value === null) {
					return [...result, encode(key, options)];
				}

				return [...result, [encode(key, options), '=', encode(value, options)].join('')];
			};
	}
}

function parserForArrayFormat(options) {
	let result;

	switch (options.arrayFormat) {
		case 'index':
			return (key, value, accumulator) => {
				result = /\[(\d*)\]$/.exec(key);

				key = key.replace(/\[\d*\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				}

				if (accumulator[key] === undefined) {
					accumulator[key] = {};
				}

				accumulator[key][result[1]] = value;
			};

		case 'bracket':
			return (key, value, accumulator) => {
				result = /(\[\])$/.exec(key);
				key = key.replace(/\[\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				}

				if (accumulator[key] === undefined) {
					accumulator[key] = [value];
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};

		case 'comma':
		case 'separator':
			return (key, value, accumulator) => {
				const isArray = typeof value === 'string' && value.split('').indexOf(options.arrayFormatSeparator) > -1;
				const newValue = isArray ? value.split(options.arrayFormatSeparator).map(item => decode(item, options)) : value === null ? value : decode(value, options);
				accumulator[key] = newValue;
			};

		default:
			return (key, value, accumulator) => {
				if (accumulator[key] === undefined) {
					accumulator[key] = value;
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};
	}
}

function validateArrayFormatSeparator(value) {
	if (typeof value !== 'string' || value.length !== 1) {
		throw new TypeError('arrayFormatSeparator must be single character string');
	}
}

function encode(value, options) {
	if (options.encode) {
		return options.strict ? strictUriEncode(value) : encodeURIComponent(value);
	}

	return value;
}

function decode(value, options) {
	if (options.decode) {
		return decodeComponent(value);
	}

	return value;
}

function keysSorter(input) {
	if (Array.isArray(input)) {
		return input.sort();
	}

	if (typeof input === 'object') {
		return keysSorter(Object.keys(input))
			.sort((a, b) => Number(a) - Number(b))
			.map(key => input[key]);
	}

	return input;
}

function removeHash(input) {
	const hashStart = input.indexOf('#');
	if (hashStart !== -1) {
		input = input.slice(0, hashStart);
	}

	return input;
}

function getHash(url) {
	let hash = '';
	const hashStart = url.indexOf('#');
	if (hashStart !== -1) {
		hash = url.slice(hashStart);
	}

	return hash;
}

function extract(input) {
	input = removeHash(input);
	const queryStart = input.indexOf('?');
	if (queryStart === -1) {
		return '';
	}

	return input.slice(queryStart + 1);
}

function parseValue(value, options) {
	if (options.parseNumbers && !Number.isNaN(Number(value)) && (typeof value === 'string' && value.trim() !== '')) {
		value = Number(value);
	} else if (options.parseBooleans && value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
		value = value.toLowerCase() === 'true';
	}

	return value;
}

function parse(input, options) {
	options = Object.assign({
		decode: true,
		sort: true,
		arrayFormat: 'none',
		arrayFormatSeparator: ',',
		parseNumbers: false,
		parseBooleans: false
	}, options);

	validateArrayFormatSeparator(options.arrayFormatSeparator);

	const formatter = parserForArrayFormat(options);

	// Create an object with no prototype
	const ret = Object.create(null);

	if (typeof input !== 'string') {
		return ret;
	}

	input = input.trim().replace(/^[?#&]/, '');

	if (!input) {
		return ret;
	}

	for (const param of input.split('&')) {
		let [key, value] = splitOnFirst(options.decode ? param.replace(/\+/g, ' ') : param, '=');

		// Missing `=` should be `null`:
		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
		value = value === undefined ? null : ['comma', 'separator'].includes(options.arrayFormat) ? value : decode(value, options);
		formatter(decode(key, options), value, ret);
	}

	for (const key of Object.keys(ret)) {
		const value = ret[key];
		if (typeof value === 'object' && value !== null) {
			for (const k of Object.keys(value)) {
				value[k] = parseValue(value[k], options);
			}
		} else {
			ret[key] = parseValue(value, options);
		}
	}

	if (options.sort === false) {
		return ret;
	}

	return (options.sort === true ? Object.keys(ret).sort() : Object.keys(ret).sort(options.sort)).reduce((result, key) => {
		const value = ret[key];
		if (Boolean(value) && typeof value === 'object' && !Array.isArray(value)) {
			// Sort object keys, not values
			result[key] = keysSorter(value);
		} else {
			result[key] = value;
		}

		return result;
	}, Object.create(null));
}

function stringify (object, options) {
	if (!object) {
		return '';
	}

	options = Object.assign({
		encode: true,
		strict: true,
		arrayFormat: 'none',
		arrayFormatSeparator: ','
	}, options);

	validateArrayFormatSeparator(options.arrayFormatSeparator);

	const shouldFilter = key => (
		(options.skipNull && isNullOrUndefined(object[key])) ||
		(options.skipEmptyString && object[key] === '')
	);

	const formatter = encoderForArrayFormat(options);

	const objectCopy = {};

	for (const key of Object.keys(object)) {
		if (!shouldFilter(key)) {
			objectCopy[key] = object[key];
		}
	}

	const keys = Object.keys(objectCopy);

	if (options.sort !== false) {
		keys.sort(options.sort);
	}

	return keys.map(key => {
		const value = object[key];

		if (value === undefined) {
			return '';
		}

		if (value === null) {
			return encode(key, options);
		}

		if (Array.isArray(value)) {
			return value
				.reduce(formatter(key), [])
				.join('&');
		}

		return encode(key, options) + '=' + encode(value, options);
	}).filter(x => x.length > 0).join('&');
};

function parseUrl (input, options) {
	options = Object.assign({
		decode: true
	}, options);

	const [url, hash] = splitOnFirst(input, '#');

	return Object.assign(
		{
			url: url.split('?')[0] || '',
			query: parse(extract(input), options)
		},
		options && options.parseFragmentIdentifier && hash ? {fragmentIdentifier: decode(hash, options)} : {}
	);
};

function stringifyUrl (input, options) {
	options = Object.assign({
		encode: true,
		strict: true
	}, options);

	const url = removeHash(input.url).split('?')[0] || '';
	const queryFromUrl = extract(input.url);
	const parsedQueryFromUrl = parse(queryFromUrl, {sort: false});

	const query = Object.assign(parsedQueryFromUrl, input.query);
	let queryString = stringify(query, options);
	if (queryString) {
		queryString = `?${queryString}`;
	}

	let hash = getHash(input.url);
	if (input.fragmentIdentifier) {
		hash = `#${encode(input.fragmentIdentifier, options)}`;
	}

	return `${url}${queryString}${hash}`;
};

export {stringify, parse};
```