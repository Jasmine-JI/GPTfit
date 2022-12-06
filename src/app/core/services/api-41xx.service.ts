import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
    return <any>this.http
      .post('/api/v2/operationAnalysis/getSystemOperationInfo', body)
      //.pipe(catchError((err) => throwError(err)))
      .pipe(
        catchError((err) => {
          switch (body.type) {
            case 1:
              return of(fake4101Res1);
            case 2:
              return of(fake4101Res2);
            case 3:
              return of(fake4101Res3);
          }
        })
      );
  }

  /**
   * api 4102-取得系統營運分析趨勢
   * @param body {any}-api 所需參數
   */
  fetchGetSystemOperationTrend(body: any): Observable<any> {
    return <any>this.http
      .post('/api/v2/operationAnalysis/getSystemOperationTrend', body)
      //.pipe(catchError((err) => throwError(err)))
      .pipe(
        catchError((err) => {
          switch (body.type) {
            case 1:
              return of(fake4102Res1);
            case 2:
              return of(fake4102Res2);
            case 3:
              return of(fake4102Res3);
          }
        })
      );
  }

  /**
   * api 4103-取得品牌群組分析概要列表
   * @param body {any}-api 所需參數
   */
  fetchGetBrandOperationInfoList(body: any): Observable<any> {
    return <any>this.http
      .post('/api/v2/operationAnalysis/getBrandOperationInfoList', body)
      //.pipe(catchError((err) => throwError(err)))
      .pipe(catchError((err) => of(fake4103Res)));
  }

  /**
   * api 4104-取得群組營運分析詳細
   * @param body {any}-api 所需參數
   */
  fetchGetGroupOperationDetail(body: any): Observable<any> {
    return <any>this.http
      .post('/api/v2/operationAnalysis/getGroupOperationDetail', body)
      //.pipe(catchError((err) => throwError(err)))
      .pipe(catchError((err) => of(fake4104Res)));
  }

  /**
   * api 4105-取得群組營運分析趨勢
   * @param body {any}-api 所需參數
   */
  fetchGetGroupOperationTrend(body: any): Observable<any> {
    return <any>this.http
      .post('/api/v2/operationAnalysis/getGroupOperationTrend', body)
      //.pipe(catchError((err) => throwError(err)))
      .pipe(catchError((err) => of(fake4105Res)));
  }

  /**
   * api 4106-取得課程階群組人員分析概要列表
   * @param body {any}-api 所需參數
   */
  fetchGetGroupMemberAnalysisList(body: any): Observable<any> {
    return <any>this.http
      .post('/api/v2/operationAnalysis/getGroupMemberAnalysisList', body)
      //.pipe(catchError((err) => throwError(err)))
      .pipe(
        catchError((err) => {
          switch (body.type) {
            case 1:
              return of(fake4106Res1);
            case 2:
              return of(fake4106Res2);
          }
        })
      );
  }
}

const fake4101Res1 = {
  processResult: {
    resultCode: '200',
    resultMessage: 'Request Success',
    apiCode: '4101',
    apiReturnCode: '1',
    apiReturnMessage: 'Request Success',
  },
  info: {
    baseCounts: {
      totalBrand: '150',
      inOperationBrand: '50',
      totalBranch: '500',
      totalClass: '1000',
      totalGroupMember: '4000',
      totalClassFile: '10000',
    },
    planAnalysis: {
      fieldName: ['p1', 'p2', 'p3', 'p99'],
      brandFieldValue: [40, 10, 5, 45],
      enterpriseFieldValue: [15, 5, 5, 25],
    },
    overviewAnalysis: {
      fieldName: [
        'brandCounts',
        'branchCounts',
        'classFileCounts',
        'memberCounts',
        'fileCounts',
        'deviceCounts',
      ],
      brandFieldValue: [100, 300, 700, 3000, 7000, 9000],
      enterpriseFieldValue: [50, 200, 300, 2000, 3000, 1000],
    },
    classTypeAnalysis: {
      typeFieldName: ['s1', 's2', 's3', 's4', 's5', 's6', 's7'],
      teachCountFieldValue: [99, 88, 77, 66, 55, 44, 33],
      fileCountFieldValue: [999, 888, 777, 666, 555, 444, 333],
    },
  },
};

const fake4101Res2 = {
  processResult: {
    resultCode: 200,
    resultMessage: 'Request Success',
    apiCode: 4101,
    apiReturnCode: 1,
    apiReturnMessage: 'Request Success',
  },
  info: {
    baseCounts: {
      totalMember: 3000,
      totalActiveMember: 1000,
      totalSportsFile: 100000,
      totalLifeTrackingFile: 10000,
    },
    activeAnalysis: {
      male: '700',
      female: '300',
    },
    sportsTypeAnalysis: {
      typeFieldName: ['s1', 's2', 's3', 's4', 's5', 's6', 's7'],
      maleFieldValue: [102, 101, 100, 99, 98, 97, 96],
      femaleFieldValue: [77, 88, 99, 55, 66, 44, 33],
    },
    ageAnalysis: {
      ageFieldName: ['o1', 'o2', 'o3', 'o4', 'o5', 'o6'],
      maleFieldValue: [99, 88, 77, 66, 55, 44],
      femaleFieldValue: [11, 22, 33, 44, 55, 44],
    },
  },
};

const fake4101Res3 = {
  processResult: {
    resultCode: 200,
    resultMessage: 'Request Success',
    apiCode: 4101,
    apiReturnCode: 1,
    apiReturnMessage: 'Request Success',
  },
  info: {
    baseCounts: {
      totalEnableDevice: 9999,
      totalRegisterDevice: 8888,
    },
    deviceTypeAnalysis: {
      deviceFieldName: ['d1', 'd2', 'd3', 'd4', 'd5'],
      enableFieldValue: [1111, 2222, 3333, 2222, 1111],
      registerFieldValue: [999, 888, 777, 666, 555],
    },
  },
};

const fake4102Res1 = {
  processResult: {
    resultCode: 200,
    resultMessage: 'Request Success',
    apiCode: 4102,
    apiReturnCode: 1,
    apiReturnMessage: 'Request Success',
  },
  trend: {
    timeRange: {
      fieldName: ['startDate', 'endDate'],
      fieldValue: [
        [1667750400, 1668355199],
        [1668960000, 1668959999],
      ],
    },
    groupCountsAnalysis: {
      fieldName: [
        'brand',
        'branch',
        'class',
        'teachCounts',
        'attendCounts',
        'classFile',
        'totalClassTime',
      ],
      fieldValue: [
        [1, 22, 33, 44, 55, 66, 777],
        [3, 22, 33, 66, 99, 100, 1000],
      ],
    },
  },
};

const fake4102Res2 = {
  processResult: {
    resultCode: 200,
    resultMessage: 'Request Success',
    apiCode: 4102,
    apiReturnCode: 1,
    apiReturnMessage: 'Request Success',
  },
  trend: {
    timeRange: {
      fieldName: ['startDate', 'endDate'],
      fieldValue: [
        [1667750400, 1668355199],
        [1668960000, 1668959999],
      ],
    },
    memberAnalysis: {
      fieldName: ['totalMembers'],
      fieldValue: [[1025], [2588]],
    },
    sportsTypeAnalysis: {
      fieldName: ['s1', 's2', 's3', 's4', 's5', 's6', 's7'],
      maleFieldValue: [
        [777, 888, 999, 666, 555, 444, 333],
        [555, 454, 222, 666, 555, 444, 333],
      ],
      femaleFieldValue: [
        [777, 888, 999, 666, 555, 444, 333],
        [333, 322, 111, 666, 555, 444, 333],
      ],
    },
  },
};

const fake4102Res3 = {
  processResult: {
    resultCode: 200,
    resultMessage: 'Request Success',
    apiCode: 4102,
    apiReturnCode: 1,
    apiReturnMessage: 'Request Success',
  },
  trend: {
    timeRange: {
      fieldName: ['startDate', 'endDate'],
      fieldValue: [
        [1667750400, 1668355199],
        [1668960000, 1668959999],
      ],
    },
    deviceTypeAnalysis: {
      fieldName: ['d1', 'd2', 'd3', 'd4', 'd5'],
      enableFieldValue: [
        [777, 666, 555, 444, 333],
        [555, 444, 333, 222, 111],
      ],
      registerFieldValue: [
        [555, 444, 333, 222, 111],
        [55, 44, 33, 22, 11],
      ],
    },
  },
};

const fake4103Res = {
  processResult: {
    resultCode: 200,
    resultMessage: 'Request Success',
    apiCode: 4103,
    apiReturnCode: 1,
    apiReturnMessage: 'Request Success',
  },
  totalCounts: 1599,
  info: [
    {
      baseInfo: {
        groupId: '0-0-123-0-0-0',
        groupName: '野餐團',
        groupIcon: 'https://xxx.xxx.xxx/xxx/xxx/xxx.jpg',
        createDate: 1667750400,
        brandType: 1,
        branchCounts: 123,
        classCounts: 456,
      },
      commerceInfo: {
        plan: 1,
        status: 1,
        planExpired: 1669050400,
        maxGroupMembers: 1000,
        currentGroupMembers: 500,
      },
      device: {
        countsFieldName: ['d1', 'd2', 'd3', 'd4', 'd5'],
        countsFieldValue: [111, 222, 333, 444, 555],
        modelTypeList: ['WB002', 'OB001'],
      },
      classAnalysis: {
        teachCounts: 500,
        attendsCounts: 1000,
        classFile: 1010,
      },
      oneMonthAnalysis: {
        teachCounts: 300,
        attendsCounts: 600,
        classFile: 600,
        newMember: 150,
        lossMember: 99,
      },
    },
  ],
};

const fake4104Res = {
  processResult: {
    resultCode: 200,
    resultMessage: 'Request Success',
    apiCode: 4104,
    apiReturnCode: 1,
    apiReturnMessage: 'Request Success',
  },
  info: {
    baseCounts: {
      branchCounts: 3,
      classCounts: 15,
      totalTeachCounts: 123,
      totalAttendCounts: 758,
      adminCounts: 30,
      memberCounts: 3000,
    },
    memberAnalysis: {
      ageFieldName: ['o1', 'o2', 'o3', 'o4', 'o5', 'o6'],
      maleFieldValue: [200, 200, 200, 400, 600, 400],
      femaleFieldValue: [100, 100, 100, 200, 300, 200],
    },
    classTypeAnalysis: {
      typeFieldName: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's100'],
      teachCountsFieldValue: [22, 33, 11, 0, 55, 10, 0, 3],
      maleAttendCountsFieldValue: [333, 444, 222, 0, 222, 111, 0, 55],
      femaleAttendCountsFieldValue: [111, 333, 111, 0, 111, 66, 0, 22],
    },
    classTimeAnalysis: {
      typeFieldName: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'],
      teachCountsFieldValue: [3, 6, 9, 12, 15, 18, 21, 9],
      attendCountsFieldValue: [30, 60, 90, 120, 150, 180, 210, 90],
    },
    deviceTypeAnalysis: {
      deviceFieldName: ['d1', 'd2', 'd3', 'd4', 'd5'],
      useCountsFieldValue: [1111, 2222, 3333, 2222, 1111],
    },
    childGroupAnalysis: {
      groupIdFieldName: ['0-0-123-1-0-0', '0-0-123-2-0-0'],
      groupNameFieldValue: ['台北店', '台中店'],
      maleCoachCountsFieldValue: [55, 44],
      femaleCoachCountsFieldValue: [33, 22],
      maleMemberCountsFieldValue: [555, 444],
      femaleMemberCountsFieldValue: [333, 222],
      teachTimeFieldValue: [14500, 400],
      teachCountsFieldValue: [1450, 40],
      teachTypeFieldValue: [
        [1, 2, 3, 5, 6, 100],
        [1, 2, 3, 5],
      ],
      maleAttendCountsFieldValue: [8500, 300],
      femaleAttendCountsFieldValue: [6000, 100],
      lastTeachDateFieldValue: [1667750400, 1668960000],
      wearableCountsFieldValue: [155, 95],
      sensorCountsFieldValue: [100, 60],
      treadmillCountsFieldValue: [80, 55],
      spinBikeCountsFieldValue: [90, 60],
      rowMachineCountsFieldValue: [30, 20],
    },
  },
};

const fake4105Res = {
  processResult: {
    resultCode: 200,
    resultMessage: 'Request Success',
    apiCode: 4105,
    apiReturnCode: 1,
    apiReturnMessage: 'Request Success',
  },
  trend: {
    timeRange: {
      fieldName: ['startDate', 'endDate'],
      fieldValue: [
        [1667750400, 1668355199],
        [1668960000, 1668959999],
      ],
    },
    groupCountsAnalysis: {
      fieldName: [
        'branch',
        'class',
        'teachTime',
        'teachCounts',
        'maleAttendCounts',
        'femaleAttendCounts',
      ],
      fieldValue: [
        [5, 15, 18650, 325, 725, 655],
        [7, 25, 45260, 975, 1950, 1750],
      ],
    },
    childGroupAnalysisList: {
      innerFieldName: [
        'maleMember',
        'femaleMember',
        'teachTime',
        'teachCounts',
        'maleAttendCounts',
        'femaleAttendCounts',
      ],
      childGroupList: [
        {
          groupId: '0-0-100-1-0-0',
          groupName: '台北店',
          fieldValue: [
            [99, 88, 18650, 325, 725, 655],
            [111, 101, 45260, 975, 1950, 1750],
          ],
        },
        {
          groupId: '0-0-100-2-0-0',
          groupName: '台中店',
          fieldValue: [
            [99, 88, 18650, 325, 725, 655],
            [111, 101, 45260, 975, 1950, 1750],
          ],
        },
      ],
    },
    deviceCounts: {
      fieldName: ['d1', 'd2', 'd3', 'd4', 'd5'],
      useCountsFieldValue: [
        [123, 12, 234, 122, 23],
        [234, 24, 345, 244, 45],
      ],
    },
  },
};

const fake4106Res1 = {
  processResult: {
    resultCode: 200,
    resultMessage: 'Request Success',
    apiCode: 4106,
    apiReturnCode: 1,
    apiReturnMessage: 'Request Success',
  },
  info: [
    {
      baseInfo: {
        userId: 123,
        userName: 'teacher',
        userIcon: 'https://xxx.xxx.xxx/xxx/xxx/xxx.jpg',
        gender: 1,
        birthday: 19900101,
      },
      groupBelonging: [
        {
          branchName: '台北店',
          className: '週一飛輪',
        },
        {
          branchName: '台中店',
          className: '週三有氧',
        },
      ],
      classInfo: {
        teachType: [2, 3, 5],
        totalTeachCounts: 100,
        totalTeachTime: 1000,
        maleAttendCounts: 500,
        femaleAttendCounts: 200,
        lastTeachDate: 1668959999,
      },
      oneMonthClassInfo: {
        teachCounts: 10,
        teachTotalTime: 100,
        teachType: [2, 3],
      },
      useDevice: [1, 2, 4],
    },
  ],
};

const fake4106Res2 = {
  processResult: {
    resultCode: 200,
    resultMessage: 'Request Success',
    apiCode: 4105,
    apiReturnCode: 1,
    apiReturnMessage: 'Request Success',
  },
  info: [
    {
      baseInfo: {
        userId: 456,
        userName: 'student',
        userIcon: 'https://xxx.xxx.xxx/xxx/xxx/xxx.jpg',
        gender: 1,
        birthday: 19900101,
      },
      groupBelonging: [
        {
          branchName: '台北店',
          className: '週一飛輪',
        },
        {
          branchName: '台中店',
          className: '週三有氧',
        },
      ],
      attendInfo: {
        attendClassType: [2, 3, 5],
        totalAttendCounts: 100,
        totalAttendTime: 1000,
        lastAttendDate: 1668959999,
      },
      oneMonthAttendInfo: {
        attendClassCounts: 10,
        attendClassTotalTime: 100,
        attendClassType: [2, 3],
      },
      useDevice: [1, 2, 4],
    },
  ],
};
