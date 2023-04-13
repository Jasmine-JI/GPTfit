import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { mathRounding } from '../utils';

@Injectable({
  providedIn: 'root',
})
export class Api41xxService {
  constructor(private http: HttpClient) {}

  /**
   * api 4101-取得系統營運分析概要
   * @param body {any}-api 所需參數
   */
  fetchGetSystemOperationInfo(body: any): Observable<any> {
    return <any>(
      this.http
        .post('/api/v2/operationAnalysis/getSystemOperationInfo', body)
        .pipe(catchError((err) => throwError(err)))
    );
  }

  /**
   * api 4102-取得系統營運分析趨勢
   * @param body {any}-api 所需參數
   */
  fetchGetSystemOperationTrend(body: any): Observable<any> {
    return <any>(
      this.http
        .post('/api/v2/operationAnalysis/getSystemOperationTrend', body)
        .pipe(catchError((err) => throwError(err)))
    );
  }

  /**
   * api 4103-取得品牌群組分析概要列表
   * @param body {any}-api 所需參數
   */
  fetchGetBrandOperationInfoList(body: any): Observable<any> {
    return <any>(
      this.http
        .post('/api/v2/operationAnalysis/getBrandOperationInfoList', body)
        .pipe(catchError((err) => throwError(err)))
    );
  }

  /**
   * api 4104-取得群組營運分析詳細
   * @param body {any}-api 所需參數
   */
  fetchGetGroupOperationDetail(body: any): Observable<any> {
    return <any>this.http.post('/api/v2/operationAnalysis/getGroupOperationDetail', body).pipe(
      // map((res) => this.createFate4104Data(res)),
      catchError((err) => throwError(err))
    );
  }

  /**
   * api 4105-取得群組營運分析趨勢
   * @param body {any}-api 所需參數
   */
  fetchGetGroupOperationTrend(body: any): Observable<any> {
    return <any>this.http.post('/api/v2/operationAnalysis/getGroupOperationTrend', body).pipe(
      // map((res) => this.createFate4105Data(res)),
      catchError((err) => throwError(err))
    );
  }

  /**
   * api 4106-取得課程階群組人員分析概要列表
   * @param body {any}-api 所需參數
   */
  fetchGetGroupMemberAnalysisList(body: any): Observable<any> {
    return <any>(
      this.http
        .post('/api/v2/operationAnalysis/getGroupMemberAnalysisList', body)
        .pipe(catchError((err) => throwError(err)))
    );
  }

  /**
   * api 4107-更新營運統計與分析資料
   * @param body {any}-api 所需參數
   */
  fetchUpdateAnalysisData(body: any): Observable<any> {
    return <any>(
      this.http
        .post('/api/v2/operationAnalysis/updateAnalysisData', body)
        .pipe(catchError((err) => throwError(err)))
    );
  }

  /**
   * api 4108-取得更新營運統計與分析資料之狀態
   * @param body {any}-api 所需參數
   */
  fetchGetUpdateAnalysisDataStatus(body: any): Observable<any> {
    return <any>(
      this.http
        .post('/api/v2/operationAnalysis/getUpdateAnalysisDataStatus', body)
        .pipe(catchError((err) => throwError(err)))
    );
  }

  /**
   * 製作參展用的假資料
   */
  createFate4104Data(res: any) {
    const { processResult, info } = res;
    const {
      baseCounts: { totalTeachCounts, totalAttendCounts, adminCounts, memberCounts },
      memberAnalysis,
      classTypeAnalysis,
      classTimeAnalysis,
      deviceTypeAnalysis,
      childGroupAnalysis,
    } = info;

    const finalTeachCounts = this.getRandomValue(totalTeachCounts);
    const finalAdminCounts = this.getRandomValue(adminCounts);
    return {
      processResult,
      info: {
        baseCounts: {
          branchCounts: this.getRandomValue(1, 3),
          classCounts: this.getRandomValue(1, 10),
          totalTeachCounts: finalTeachCounts,
          totalAttendCounts: this.getRandomValue(finalTeachCounts + totalAttendCounts),
          adminCounts: finalAdminCounts,
          memberCounts: this.getRandomValue(finalAdminCounts + memberCounts),
        },
        memberAnalysis: this.getFateMemberAnalysis(memberAnalysis),
        classTypeAnalysis: this.getFateClassTypeAnalysis(classTypeAnalysis),
        classTimeAnalysis: this.getFateClassTimeAnalysis(classTimeAnalysis),
        deviceTypeAnalysis: this.getFateDeviceTypeAnalysis(deviceTypeAnalysis),
        ...(childGroupAnalysis ? this.getFateChildGroupAnalysis(childGroupAnalysis) : {}),
      },
    };
  }

  /**
   * 4104 memberAnalysis
   */
  getFateMemberAnalysis(data) {
    const { ageFieldName, maleFieldValue, femaleFieldValue } = data;
    return {
      ageFieldName,
      maleFieldValue: this.getRandomArray(maleFieldValue),
      femaleFieldValue: this.getRandomArray(femaleFieldValue),
    };
  }

  /**
   * 4104 classTypeAnalysis
   */
  getFateClassTypeAnalysis(data) {
    const {
      typeFieldName,
      teachCountsFieldValue,
      maleAttendCountsFieldValue,
      femaleAttendCountsFieldValue,
    } = data;
    const finalTeachCountsFieldValue = this.getRandomArray(teachCountsFieldValue) as any;
    return {
      typeFieldName,
      teachCountsFieldValue: finalTeachCountsFieldValue,
      maleAttendCountsFieldValue: this.getRandomArray(
        maleAttendCountsFieldValue,
        finalTeachCountsFieldValue
      ),
      femaleAttendCountsFieldValue: this.getRandomArray(
        femaleAttendCountsFieldValue,
        finalTeachCountsFieldValue
      ),
    };
  }

  /**
   * 4104 classTimeAnalysis
   */
  getFateClassTimeAnalysis(data) {
    const { typeFieldName, teachCountsFieldValue, attendCountsFieldValue } = data;
    const finalTeachCountsFieldValue = this.getRandomArray(teachCountsFieldValue) as any;
    return {
      typeFieldName,
      teachCountsFieldValue: finalTeachCountsFieldValue,
      attendCountsFieldValue: this.getRandomArray(
        attendCountsFieldValue,
        finalTeachCountsFieldValue
      ),
    };
  }

  /**
   * 4104 deviceTypeAnalysis
   */
  getFateDeviceTypeAnalysis(data) {
    const { deviceFieldName, useCountsFieldValue } = data;
    return {
      deviceFieldName,
      useCountsFieldValue: this.getRandomArray(useCountsFieldValue),
    };
  }

  /**
   * 4104 childGroupAnalysis
   */
  getFateChildGroupAnalysis(data) {
    const {
      groupIdFieldName,
      groupNameFieldValue,
      lastTeachDateFieldValue,
      femaleAttendCountsFieldValue,
      femaleCoachCountsFieldValue,
      femaleMemberCountsFieldValue,
      maleAttendCountsFieldValue,
      maleCoachCountsFieldValue,
      maleMemberCountsFieldValue,
      teachCountsFieldValue,
      teachTimeFieldValue,
      teachTypeFieldValue,
      rowMachineCountsFieldValue,
      sensorCountsFieldValue,
      spinBikeCountsFieldValue,
      treadmillCountsFieldValue,
      wearableCountsFieldValue,
    } = data;
    const finalTeachCountFieldValue = this.getRandomArray(teachCountsFieldValue);
    return {
      childGroupAnalysis: {
        groupIdFieldName,
        groupNameFieldValue,
        lastTeachDateFieldValue,
        teachTypeFieldValue,
        teachCountsFieldValue: finalTeachCountFieldValue,
        teachTimeFieldValue: this.getRandomArray(teachTimeFieldValue, null, 1800),
        maleCoachCountsFieldValue: this.getRandomArray(maleCoachCountsFieldValue, null, 10),
        femaleCoachCountsFieldValue: this.getRandomArray(femaleCoachCountsFieldValue, null, 10),
        maleMemberCountsFieldValue: this.getRandomArray(maleMemberCountsFieldValue),
        femaleMemberCountsFieldValue: this.getRandomArray(femaleMemberCountsFieldValue),
        maleAttendCountsFieldValue: this.getRandomArray(maleAttendCountsFieldValue),
        femaleAttendCountsFieldValue: this.getRandomArray(femaleAttendCountsFieldValue),
        rowMachineCountsFieldValue: this.getRandomArray(rowMachineCountsFieldValue),
        sensorCountsFieldValue: this.getRandomArray(sensorCountsFieldValue),
        spinBikeCountsFieldValue: this.getRandomArray(spinBikeCountsFieldValue),
        treadmillCountsFieldValue: this.getRandomArray(treadmillCountsFieldValue),
        wearableCountsFieldValue: this.getRandomArray(wearableCountsFieldValue),
      },
    };
  }

  /**
   * 製作參展用的假資料
   */
  createFate4105Data(res: any) {
    const { processResult, trend } = res;
    const { childGroupAnalysisList, deviceUsedCounts, groupCountsAnalysis, timeRange } = trend;

    return {
      processResult,
      trend: {
        timeRange,
        groupCountsAnalysis: this.getFateGroupCountsTrend(groupCountsAnalysis),
        deviceUsedCounts: this.getFateDeviceUsedCountsTrend(deviceUsedCounts),
        ...(childGroupAnalysisList ? this.getFateChildGroupTrend(childGroupAnalysisList) : {}),
      },
    };
  }

  /**
   * api 4105 groupCountsAnalysis
   */
  getFateGroupCountsTrend(data) {
    const { fieldName, fieldValue } = data;
    return {
      fieldName,
      fieldValue: this.getIncreaseColumnArray(fieldValue, 2),
    };
  }

  /**
   * api 4105 deviceUsedCounts
   */
  getFateDeviceUsedCountsTrend(data) {
    const { fieldName, useCountsFieldValue } = data;
    return {
      fieldName,
      useCountsFieldValue: this.getIncreaseColumnArray(useCountsFieldValue),
    };
  }

  /**
   * api 4105 childGroupAnalysisList
   */
  getFateChildGroupTrend(data) {
    const { innerFieldName, childGroupList } = data;
    return {
      childGroupAnalysisList: {
        innerFieldName,
        childGroupList: childGroupList.map((_list) => {
          const { groupId, groupName, fieldValue } = _list;
          return {
            groupId,
            groupName,
            fieldValue: this.getIncreaseColumnArray(fieldValue),
          };
        }),
      },
    };
  }

  /**
   * 將陣列內的數值調整為大於10的數值
   */
  getRandomArray(array: Array<number>, baseArray = null, range = 100) {
    return array.map((_arr, _index) => {
      if (baseArray && _arr < baseArray[_index]) _arr + baseArray[_index];
      return _arr < 10 ? this.getRandomValue(10, range) : _arr;
    });
  }

  /**
   * 將數據陣列數值調整為非0且向上遞增的陣列
   */
  getIncreaseArray(array: Array<number>) {
    return array.map((_arr, _index) => {
      if (_index === 0) {
        return _arr || this.getRandomValue();
      }

      const prevValue = array[_index - 1];
      return (_arr < prevValue ? prevValue : _arr) + this.getRandomValue();
    });
  }

  /**
   * 將兩層數據陣列數值調整為非0且縱向向上遞增的陣列
   */
  getIncreaseColumnArray(array: Array<Array<number>>, timeIndex: number | null = null) {
    let prevArray: Array<number>;
    return array.map((_array, _index) => {
      const result = _array.map((_arr, _secondIndex) => {
        const prevValue = prevArray ? prevArray[_secondIndex] : 0;
        if (_arr < prevValue) _arr = prevValue;
        if (timeIndex !== null && timeIndex === _secondIndex)
          return _arr + this.getRandomValue(36000, 144000);
        return _arr + this.getRandomValue();
      });

      prevArray = [...result];
      return result;
    });
  }

  /**
   * 取得隨機數值
   */
  getRandomValue(initValue = 1, range = 100) {
    const randomValue = Math.random() * range + initValue;
    return mathRounding(randomValue, 0);
  }
}
