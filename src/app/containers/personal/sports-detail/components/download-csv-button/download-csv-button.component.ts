import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Api2103Response } from '../../../../../core/models/api/api-21xx';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-download-csv-button',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './download-csv-button.component.html',
  styleUrls: ['../../sports-detail.component.scss', './download-csv-button.component.scss'],
})
export class DownloadCsvButtonComponent {
  /**
   * api 2103 回應
   */
  @Input() rawData: Api2103Response;

  /**
   * 將所需資料轉換為csv格式，並執行下載
   */
  downloadRawData() {
    if (!this.rawData) return false;
    const { activityInfoLayer, activityLapLayer, activityPointLayer, fileInfo } = this.rawData;
    of([[], []])
      .pipe(
        map((initArr) => this.convertObjToArray(initArr, activityInfoLayer, 'activityInfoLayer')),
        map((arr1) =>
          this.concatData(arr1, activityLapLayer as Array<Array<any>>, 'activityLapLayer')
        ),
        map((arr2) =>
          this.concatData(arr2, activityPointLayer as Array<Array<any>>, 'activityPointLayer')
        ),
        map((arr3) => this.switchCSVFile(arr3)),
        map((finalData) => this.getCsvFileUrl(finalData))
      )
      .subscribe((result) => {
        const link = document.createElement('a'); // 建立連結供csv下載使用
        const { dispName, creationDate } = fileInfo;
        document.body.appendChild(link);
        link.href = result;
        link.download = `${dispName}${creationDate}.csv`;
        link.click();
      });
  }

  /**
   * 轉換物件內容為陣列
   * @param arr 將 api response 物件轉化為陣列的容器
   * @param obj 運動概要資訊
   * @param head 數據起始標頭
   */
  convertObjToArray(arr: Array<Array<any>>, obj: any, head: string) {
    for (const _key in obj) {
      const _headKey = `${head}.${_key}`;
      const _value = obj[_key];
      const isArray = Array.isArray(_value);
      const isArrayOfObj = isArray && _value[0] !== null && typeof _value[0] === 'object';
      if (isArrayOfObj) {
        arr = this.concatData(arr, this.convertToCjson(_value, _key), head);
      } else if (isArray) {
        arr = this.mergeArrayData(arr, _value, _headKey);
      } else {
        arr[0].push(_headKey);
        arr[1].push(_value ?? 'null');
      }
    }

    return arr;
  }

  /**
   * 接上運動檔案分段或分點資訊
   * @param arr 已二階扁平陣列化的運動數據
   * @param lap 運動分段或分點數據
   * @param head 數據類別
   */
  concatData(arr: Array<any>, data: Array<Array<string | number | null>>, head: string) {
    const arrChildLength = arr[0].length;
    data.forEach((_data, _index) => {
      if (!arr[_index]) arr[_index] = new Array(arrChildLength);
      if (!arr[_index].length < arrChildLength) arr[_index].length = arrChildLength;
      const concatData =
        _index === 0 ? _data.map((_str) => `${head}.${_str}`) : _data.map((_val) => _val ?? 'null');
      arr[_index] = arr[_index].concat(concatData);
    });

    return arr;
  }

  /**
   * 轉換物件內容為陣列
   * @param objArr 物件陣列
   * @param head 數據起始標頭
   */
  convertToCjson(objArr: Array<any>, head: string) {
    let result = [[]];
    objArr.forEach((_obj, _arrIndex) => {
      result.push([]);
      for (const _key in _obj) {
        const _completeKey = `${head}.${_key}`;
        if (_arrIndex === 0) result[0].push(_completeKey);
        const _value = _obj[_key];
        const isArray = Array.isArray(_value);
        const isArrayOfObj = isArray && _value[0] !== null && typeof _value[0] === 'object';
        if (isArrayOfObj) {
          result = result.concat(this.convertToCjson(_value, _completeKey));
        } else if (isArray) {
          // 這邊沒有標頭可換行顯示，故直接字串化
          result[_arrIndex + 1].push(_value.join('-'));
        } else {
          result[_arrIndex + 1].push(_value);
        }
      }
    });

    return result;
  }

  /**
   * 將運動數據陣列以「行」（cjson）的方式合併進結果
   * @param arr cjson格式的數據
   * @param dataArr 運動數據陣列
   * @param head 數據起始標頭
   */
  mergeArrayData(arr: Array<Array<string | number>>, dataArr: Array<number>, head: string) {
    const arrChildLength = arr[0].length;
    arr[0].push(head);

    // 空陣列則用null填上
    if (dataArr.length === 0) {
      arr[1].push('null');
      return arr;
    }

    dataArr.forEach((_val, _index) => {
      const _fillIndex = _index + 1; // 第一個array為標頭
      // 補填陣列缺少的長度
      if (!arr[_fillIndex]) {
        arr.push(new Array(arrChildLength));
      } else {
        if (!arr[_fillIndex][arrChildLength - 1]) arr[_fillIndex].length = arrChildLength;
      }

      arr[_fillIndex].push(_val ?? 'null');
    });

    return arr;
  }

  /**
   * 將所需資料轉換為csv格式
   * @param arr 已扁平化為二階陣列的運動數據陣列
   */
  switchCSVFile(arr: Array<Array<string | number | null>>) {
    let csvData = '\n';
    arr.forEach((_arr) => {
      csvData += _arr.join(',');
      csvData += '\n';
    });

    return csvData;
  }

  /**
   * 取得csv下載檔案資訊
   * @param data 運動數據
   */
  getCsvFileUrl(data: string) {
    const blob = new Blob(['\ufeff' + data], {
      // 加上bom（\ufeff）讓excel辨識編碼
      type: 'text/csv;charset=utf8',
    });
    const href = URL.createObjectURL(blob); // 建立csv檔url
    return href;
  }
}
