import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api41xxService, AuthService, CorrespondTranslateKeyService } from '../../../core/services';
import { SystemAnalysisType } from '../../../core/enums/api';
import { Observable } from 'rxjs';
import {
  Api4101Post,
  Api4101Response,
  Api4102Post,
  Api4102Response,
} from '../../../core/models/api/api-41xx';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import {
  LoadingBarComponent,
  CategoryColumnChartComponent,
  OperationDataTableComponent,
  PieChartComponent,
  SingleDropListComponent,
  AsideIndexBoxComponent,
} from '../../../components';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OperationTableOption, SingleLayerList, IndexInfo } from '../../../core/models/compo';
import {
  OperationDataType,
  OperationTrendType,
  SingleTrendRange,
  CompareTrendRange,
} from '../../../core/enums/compo';
import {
  groupPlanCodeConvert,
  groupOverViewConvert,
  getSportsTypeKey,
  assignSportsTypeColor,
  getDevicTypeInfo,
  deepCopy,
  changeOpacity,
  getMonthKey,
  translateSportsCode,
  mathRounding,
} from '../../../core/utils';
import { genderColor } from '../../../core/models/represent-color';
import { DateUnit } from '../../../core/enums/common';
import { operationTrendColor, sportTypeColor } from '../../../core/models/represent-color';
import { TimeFormatPipe } from '../../../core/pipes';
import { MultipleUnfoldStatus } from '../../../core/classes';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

/**
 * 用於api 4101和 4102 post 的時間範圍單位
 */
enum PostDateUnit {
  week = 1,
  month,
}

// 趨勢圖表單一類別數據之設定資訊
const oneSeriesInfo = { data: [], color: 'rgba(124, 181, 236, 1)' };

@Component({
  selector: 'app-system-operation-report',
  templateUrl: './system-operation-report.component.html',
  styleUrls: ['./system-operation-report.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    LoadingBarComponent,
    CategoryColumnChartComponent,
    OperationDataTableComponent,
    PieChartComponent,
    SingleDropListComponent,
    TimeFormatPipe,
    AsideIndexBoxComponent,
  ],
})
export class SystemOperationReportComponent implements OnInit {
  /**
   * 頁面載入進度
   */
  progress = 100;

  /**
   * 資料最後更新時間
   */
  lastUpdateTime$: Observable<any>;

  /**
   * api 4101-4102 post 所需參數
   */
  postInfo = {
    token: this.authService.token,
    type: SystemAnalysisType.group,
    startDate: dayjs().startOf('isoWeek').diff(1, 'week').valueOf(),
    endDate: dayjs().endOf('isoWeek').diff(1, 'week').valueOf(),
    dateUnit: PostDateUnit.week,
    get api4101Post(): Api4101Post {
      const { token, type } = this;
      return { token, type };
    },
    get api4102Post(): Api4102Post {
      const { token, type, startDate, endDate, dateUnit } = this;
      return {
        token,
        type,
        startDate: dayjs(startDate).unix(),
        endDate: dayjs(endDate).unix(),
        dateUnit,
      };
    },

    /**
     * 取得完整日期範圍清單。用來比對 api 回覆的日期範圍
     */
    get completeDateRangeList() {
      const result = [];
      const { dateUnit, startDate, endDate } = this;
      switch (dateUnit) {
        case PostDateUnit.month: {
          const format = 'YYYY-MM';
          let [year, month] = dayjs(startDate).format(format).split('-');
          const [endYear, endMonth] = dayjs(endDate).format(format).split('-');
          while (year !== endYear || month !== endMonth) {
            result.push(+`${year}${month}`);
            if (month === '12') {
              month = '01';
              year = `${+year + 1}`;
            } else {
              month = `${+month + 1}`.padStart(2, '0');
            }
          }

          result.push(+`${endYear}${endMonth}`);
          break;
        }
        default: {
          const startDayjs = dayjs(startDate);
          let year = startDayjs.startOf('isoWeek').format('YYYY');
          let week = startDayjs.isoWeek().toString().padStart(2, '0');
          const yearEndWeek = startDayjs
            .endOf('year')
            .endOf('isoWeek')
            .isoWeek()
            .toString()
            .padStart(2, '0');
          const endDayjs = dayjs(endDate);
          const endYear = endDayjs.startOf('isoWeek').format('YYYY');
          const endWeek = endDayjs.isoWeek().toString().padStart(2, '0');
          while (year !== endYear || week !== endWeek) {
            result.push(+`${year}${week}`);
            if (week === yearEndWeek) {
              week = '01';
              year = `${+year + 1}`;
            } else {
              week = `${+week + 1}`.padStart(2, '0');
            }
          }

          result.push(+`${endYear}${endWeek}`);
          break;
        }
      }

      return result;
    },
  };

  trendList: Array<SingleLayerList> = [
    {
      titleKey: 'universal_group_singleTrend',
      id: OperationTrendType.singleTrend,
      list: [
        { textKey: '2018～', id: SingleTrendRange.unlimit },
        { textKey: 'universal_time_previous5Years', id: SingleTrendRange.nearlyFiveYears },
        { textKey: 'universal_time_previous3Years', id: SingleTrendRange.nearlyTwoYears },
        { textKey: 'universal_time_previousYear', id: SingleTrendRange.nearlyOneYear },
        { textKey: 'universal_time_previousSeason', id: SingleTrendRange.nearlyOneSeason },
      ],
    },
    {
      titleKey: 'universal_operating_compareTrends',
      id: OperationTrendType.compareTrend,
      list: [
        { textKey: 'universal_time_previous2Years', id: CompareTrendRange.nearlyTwoYears },
        { textKey: 'universal_time_previous2Season', id: CompareTrendRange.nearlyTwoSeasons },
        { textKey: 'universal_time_previous2Months', id: CompareTrendRange.nearlyTwoMonths },
        { textKey: 'universal_time_last2Years', id: CompareTrendRange.lastTwoYears },
        { textKey: 'universal_time_last2Seasons', id: CompareTrendRange.lastTwoSeasons },
        { textKey: 'universal_time_last2Months', id: CompareTrendRange.lastTwoMonths },
      ],
    },
  ];

  /**
   * 單獨更新趨勢數據或整頁數據更新的旗標
   */
  allRefresh = false;

  /**
   * 報告產生日期
   */
  creationTime: string = this.getCurrentTime();

  /**
   * api 4104 回覆內容
   */
  operationInfo: Api4101Response;

  /**
   * api 4105 回覆內容
   */
  operationTrend: Api4102Response;

  /**
   * 總體分析相關數據
   */
  overviewData: any;

  /**
   * 趨勢分析相關數據
   */
  trendData: any;

  /**
   * 趨勢分析是否為比較模式
   */
  isCompareMode = false;

  /**
   * 圖表時間單位
   */
  trendChartUnit = DateUnit.month;

  /**
   * 側邊快速索引區塊用清單
   */
  sectionIndexList: Array<IndexInfo> = [];

  /**
   * 用來切換總體分析各圖表的列表數據顯示與否
   */
  overviewTableDisplayStatus = new MultipleUnfoldStatus();

  /**
   * 用來切換趨勢分析各圖表的列表數據顯示與否
   */
  trendTableDisplayStatus = new MultipleUnfoldStatus();

  readonly SystemAnalysisType = SystemAnalysisType;
  readonly SingleTrendRange = SingleTrendRange;
  readonly OperationTrendType = OperationTrendType;

  constructor(
    private api41xxService: Api41xxService,
    private authService: AuthService,
    private translate: TranslateService,
    private correspondTranslateKeyService: CorrespondTranslateKeyService
  ) {}

  ngOnInit(): void {
    this.allRefresh = true;
    this.getDataUpdateTime();
    this.getReportInfo();
  }

  /**
   * 取得資料最後更新時間
   */
  getDataUpdateTime() {
    const body = {
      token: this.authService.token,
      groupId: '0-0-0-0-0-0',
    };
    this.lastUpdateTime$ = this.api41xxService.fetchGetUpdateAnalysisDataStatus(body);
  }

  /**
   * 串接api 4101獲取頁面所需資訊
   */
  getReportInfo() {
    if (this.progress === 100) {
      this.progress = 30;
      this.sectionIndexList = this.getSectionIndexList();
      this.getOperationInfo().subscribe((res) => {
        this.operationInfo = res as Api4101Response;
        this.overviewData = this.handleOverviewChartData(this.operationInfo);
        this.creationTime = this.getCurrentTime();
        this.progress = 100;
        this.allRefresh = false;
      });
    }
  }

  /**
   * 串接api 4102獲取頁面所需資訊
   */
  getReportTrend() {
    const { progress, allRefresh } = this;
    if (progress === 100 || allRefresh) {
      this.progress = 30;
      this.trendData = undefined;
      this.getOperationTrend().subscribe((res) => {
        this.operationTrend = this.fillUpCompleteDate(res as Api4102Response);
        this.trendData = this.handleTrendChartData(this.operationTrend);
        if (!allRefresh) this.progress = 100;
      });
    }
  }

  /**
   * 取得系統營運分析概要資訊
   */
  getOperationInfo() {
    return this.api41xxService.fetchGetSystemOperationInfo(this.postInfo.api4101Post);
  }

  /**
   * 取得營運分析趨勢
   */
  getOperationTrend() {
    return this.api41xxService.fetchGetSystemOperationTrend(this.postInfo.api4102Post);
  }

  /**
   * 處理總體分析圖表數據
   * @param data {any}-api 4101 res
   */
  handleOverviewChartData(data: any): any {
    const { info } = data;
    switch (this.postInfo.type) {
      case SystemAnalysisType.group: {
        const { planAnalysis, overviewAnalysis, classTypeAnalysis } = info;
        return {
          ...this.handlePlanAnalysisData(planAnalysis),
          ...this.handleOverviewAnalysis(overviewAnalysis),
          ...this.handleClassTypeAnalysis(classTypeAnalysis),
        };
      }
      case SystemAnalysisType.member: {
        const {
          activeAnalysis,
          ageAnalysis,
          sportsTypeAnalysis,
          baseCounts: { totalMember },
        } = info;
        return {
          ...this.handleMemberAnalysis(activeAnalysis, totalMember),
          ...this.handleAgeAnalysis(ageAnalysis),
          ...this.handleSportsTypeAnalysis(sportsTypeAnalysis),
        };
      }
      case SystemAnalysisType.device: {
        const { deviceTypeAnalysis } = info;
        return { ...this.handleDeviceTypeAnalysis(deviceTypeAnalysis) };
      }
    }
  }

  /**
   * 將api填補完整的時間範圍清單，同時為數據補零，方便後續繪製圖表與表格
   * @param res {Api4102Response}-api 4102 回覆內容
   */
  fillUpCompleteDate(res: Api4102Response): any {
    const { completeDateRangeList, type } = this.postInfo;
    const { trend, processResult } = res;
    const {
      timeRange: { fieldValue: timeRange },
    } = trend;
    let timeRangeIndex = 0;
    const finalAnalysis = this.getAnalysisModel(type);
    completeDateRangeList.forEach((_completeDate, _index) => {
      const currentTimeRange = timeRange[timeRangeIndex] ? timeRange[timeRangeIndex][0] : null;
      const haveData = _completeDate === currentTimeRange;
      switch (type) {
        case SystemAnalysisType.group: {
          const {
            groupCountsAnalysis: { fieldName, fieldValue },
          } = trend;
          const fieldNameLength = fieldName.length;
          finalAnalysis.groupCountsAnalysis.fieldName = fieldName;
          finalAnalysis.groupCountsAnalysis.fieldValue.push(
            haveData ? fieldValue[timeRangeIndex] : this.getZeroArray(fieldNameLength)
          );
          break;
        }
        case SystemAnalysisType.member: {
          const {
            memberAnalysis: {
              fieldName: memberAnalysisFieldName,
              fieldValue: memberAnalysisFieldValue,
            },
            sportsTypeAnalysis: {
              fieldName: sportsTypeFieldName,
              maleFieldValue,
              femaleFieldValue,
            },
          } = trend;
          const memberAnalysisLength = memberAnalysisFieldName.length;
          finalAnalysis.memberAnalysis.fieldName = memberAnalysisFieldName;
          finalAnalysis.memberAnalysis.fieldValue.push(
            haveData
              ? memberAnalysisFieldValue[timeRangeIndex]
              : this.getZeroArray(memberAnalysisLength)
          );

          const sportsTypeLength = sportsTypeFieldName.length;
          finalAnalysis.sportsTypeAnalysis.fieldName = sportsTypeFieldName;
          finalAnalysis.sportsTypeAnalysis.maleFieldValue.push(
            haveData ? maleFieldValue[timeRangeIndex] : this.getZeroArray(sportsTypeLength)
          );
          finalAnalysis.sportsTypeAnalysis.femaleFieldValue.push(
            haveData ? femaleFieldValue[timeRangeIndex] : this.getZeroArray(sportsTypeLength)
          );
          break;
        }
        case SystemAnalysisType.device: {
          const {
            deviceTypeAnalysis: { fieldName, enableFieldValue, registerFieldValue },
          } = trend;
          const fieldNameLength = fieldName.length;
          finalAnalysis.deviceTypeAnalysis.fieldName = fieldName;
          finalAnalysis.deviceTypeAnalysis.enableFieldValue.push(
            haveData ? enableFieldValue[timeRangeIndex] : this.getZeroArray(fieldNameLength)
          );
          finalAnalysis.deviceTypeAnalysis.registerFieldValue.push(
            haveData ? registerFieldValue[timeRangeIndex] : this.getZeroArray(fieldNameLength)
          );
          break;
        }
      }

      if (haveData) timeRangeIndex++;
    });

    return {
      processResult,
      trend: {
        timeRange: {
          fieldName: ['dateRange'],
          fieldValue: completeDateRangeList.map((_list) => [_list]),
        },
        ...finalAnalysis,
      },
    };
  }

  /**
   * 取得各類別趨勢數據模型，供數據加工用
   * @param type {SystemAnalysisType}-營運報告類型
   */
  getAnalysisModel(type: SystemAnalysisType) {
    switch (type) {
      case SystemAnalysisType.group: {
        return { groupCountsAnalysis: { fieldName: [], fieldValue: [] } };
      }
      case SystemAnalysisType.member: {
        return {
          memberAnalysis: { fieldName: [], fieldValue: [] },
          sportsTypeAnalysis: { fieldName: [], maleFieldValue: [], femaleFieldValue: [] },
        };
      }
      case SystemAnalysisType.device: {
        return {
          deviceTypeAnalysis: { fieldName: [], enableFieldValue: [], registerFieldValue: [] },
        };
      }
    }
  }

  /**
   * 取得指定長度的且數值皆為0的陣列
   * @param length {number}-數據
   */
  getZeroArray(length: number) {
    return new Array(length).fill(0);
  }

  /**
   * 處理趨勢分析圖表數據
   * @param data {any}-api 4102 res
   */
  handleTrendChartData(data: any) {
    const {
      postInfo: { type },
      isCompareMode,
      trendChartUnit,
    } = this;
    switch (type) {
      case SystemAnalysisType.group: {
        const aggregationData =
          trendChartUnit === DateUnit.year ? this.mergeSameYearGroupData(data) : data;
        return isCompareMode
          ? this.handleCompareGroupTrend(aggregationData)
          : this.handleSingleGroupTrend(aggregationData);
      }
      case SystemAnalysisType.member: {
        const aggregationData =
          trendChartUnit === DateUnit.year ? this.mergeSameYearMemberData(data) : data;
        return isCompareMode
          ? this.handleCompareMemberTrend(aggregationData)
          : this.handleSingleMemberTrend(aggregationData);
      }
      case SystemAnalysisType.device: {
        const aggregationData =
          trendChartUnit === DateUnit.year ? this.mergeSameYearDeviceData(data) : data;
        return isCompareMode
          ? this.handleCompareDeviceTrend(aggregationData)
          : this.handleSingleDeviceTrend(aggregationData);
      }
    }
  }

  /**
   * 合併同一年度範圍的群組數據
   * @param data {any}-api 4102 res
   */
  mergeSameYearGroupData(data: any) {
    const {
      trend: {
        timeRange: { fieldName: rangeFieldName, fieldValue: rangeValue },
        groupCountsAnalysis: { fieldName: dataName, fieldValue: dataValue },
      },
      processResult,
    } = data;
    const mergeRangeValue = [];
    const mergeDataValue = [];
    rangeValue.forEach((_rangeValue, _rangeIndex) => {
      const _year = _rangeValue[0].toString().slice(0, 4);
      const mergeLastIndex = mergeRangeValue.length - 1;
      const mergeLastYearArr = mergeRangeValue[mergeLastIndex];
      if (mergeLastYearArr && _year === mergeLastYearArr[0]) {
        mergeDataValue[mergeLastIndex] = mergeDataValue[mergeLastIndex].map(
          (_value, _dataIndex) => {
            return _value + dataValue[_rangeIndex][_dataIndex];
          }
        );
      } else {
        mergeRangeValue.push([_year]); // 符合api格式
        mergeDataValue.push(dataValue[_rangeIndex]);
      }
    });

    return {
      processResult,
      trend: {
        timeRange: { fieldName: rangeFieldName, fieldValue: mergeRangeValue },
        groupCountsAnalysis: { fieldName: dataName, fieldValue: mergeDataValue },
      },
    };
  }

  /**
   * 合併同一年度範圍的會員數據
   * @param data {any}-api 4102 res
   */
  mergeSameYearMemberData(data: any) {
    const {
      trend: {
        timeRange: { fieldName: rangeFieldName, fieldValue: rangeValue },
        memberAnalysis: { fieldName: dataName, fieldValue: dataValue },
        sportsTypeAnalysis: { fieldName: sportsTypeCode, femaleFieldValue, maleFieldValue },
      },
      processResult,
    } = data;

    const mergeRangeValue = [];
    const mergeMemberValue = [];
    const mergeMaleValue = [];
    const mergeFemaleValue = [];
    rangeValue.forEach((_rangeValue, _rangeIndex) => {
      const _year = _rangeValue[0].toString().slice(0, 4);
      const mergeLastIndex = mergeRangeValue.length - 1;
      if (mergeRangeValue[mergeLastIndex] && _year === mergeRangeValue[mergeLastIndex][0]) {
        mergeMemberValue[mergeLastIndex] = mergeMemberValue[mergeLastIndex].map(
          (_value, _dataIndex) => {
            return _value + dataValue[_rangeIndex][_dataIndex];
          }
        );

        mergeMaleValue[mergeLastIndex] = mergeMaleValue[mergeLastIndex].map(
          (_value, _dataIndex) => {
            return _value + maleFieldValue[_rangeIndex][_dataIndex];
          }
        );

        mergeFemaleValue[mergeLastIndex] = mergeFemaleValue[mergeLastIndex].map(
          (_value, _dataIndex) => {
            return _value + femaleFieldValue[_rangeIndex][_dataIndex];
          }
        );
      } else {
        mergeRangeValue.push([_year]); // 符合api格式
        mergeMemberValue.push(dataValue[_rangeIndex]);
        mergeMaleValue.push(maleFieldValue[_rangeIndex]);
        mergeFemaleValue.push(femaleFieldValue[_rangeIndex]);
      }
    });

    return {
      processResult,
      trend: {
        timeRange: { fieldName: rangeFieldName, fieldValue: mergeRangeValue },
        memberAnalysis: { fieldName: dataName, fieldValue: mergeMemberValue },
        sportsTypeAnalysis: {
          fieldName: sportsTypeCode,
          femaleFieldValue: mergeFemaleValue,
          maleFieldValue: mergeMaleValue,
        },
      },
    };
  }

  /**
   * 合併同一年度範圍的裝置數據
   * @param data {any}-api 4102 res
   */
  mergeSameYearDeviceData(data: any) {
    const {
      trend: {
        timeRange: { fieldName: rangeFieldName, fieldValue: rangeValue },
        deviceTypeAnalysis: { fieldName: deviceCode, enableFieldValue, registerFieldValue },
      },
      processResult,
    } = data;

    const mergeRangeValue = [];
    const mergeEnableValue = [];
    const mergeRegisterValue = [];
    rangeValue.forEach((_rangeValue, _rangeIndex) => {
      const _year = _rangeValue[0].toString().slice(0, 4);
      const mergeLastIndex = mergeRangeValue.length - 1;
      if (mergeRangeValue[mergeLastIndex] && _year === mergeRangeValue[mergeLastIndex][0]) {
        mergeEnableValue[mergeLastIndex] = mergeEnableValue[mergeLastIndex].map(
          (_value, _dataIndex) => {
            return _value + enableFieldValue[_rangeIndex][_dataIndex];
          }
        );

        mergeRegisterValue[mergeLastIndex] = mergeRegisterValue[mergeLastIndex].map(
          (_value, _dataIndex) => {
            return _value + registerFieldValue[_rangeIndex][_dataIndex];
          }
        );
      } else {
        mergeRangeValue.push([_year]); // 符合api格式
        mergeEnableValue.push(enableFieldValue[_rangeIndex]);
        mergeRegisterValue.push(registerFieldValue[_rangeIndex]);
      }
    });

    return {
      processResult,
      trend: {
        timeRange: { fieldName: rangeFieldName, fieldValue: mergeRangeValue },
        deviceTypeAnalysis: {
          fieldName: deviceCode,
          enableFieldValue: mergeEnableValue,
          registerFieldValue: mergeRegisterValue,
        },
      },
    };
  }

  /**
   * 處理方案分析數據
   * @param data {any}-方案分析數據
   */
  handlePlanAnalysisData(data: any) {
    const { fieldName, brandFieldValue, enterpriseFieldValue } = data;
    const planAnalysisChartData = {
      data: [[], []],
      seriesName: ['universal_group_brand', 'universal_group_enterprise'],
    };
    const planAnalysisTableData = {
      option: <OperationTableOption>{
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
        ],
        valueRowType: [
          OperationDataType.translateKey,
          OperationDataType.normal,
          OperationDataType.normal,
        ],
      },
      data: [['方案類別', ...planAnalysisChartData.seriesName]],
    };

    fieldName.forEach((_name, _index) => {
      const _translateKey = groupPlanCodeConvert(_name);
      const _brandValue = brandFieldValue[_index];
      const _enterpriseValue = enterpriseFieldValue[_index];
      planAnalysisChartData.data[0].push([_translateKey, _brandValue]);
      planAnalysisChartData.data[1].push([_translateKey, _enterpriseValue]);
      planAnalysisTableData.data.push([_translateKey, _brandValue, _enterpriseValue]);
    });

    this.overviewTableDisplayStatus.setNewStatus('planAnalysis');
    return { planAnalysisChartData, planAnalysisTableData };
  }

  /**
   * 處理概要分析數據
   * @param data {any}-概要分析數據
   */
  handleOverviewAnalysis(data: any) {
    const { fieldName, brandFieldValue, enterpriseFieldValue } = data;
    const overviewAnalysisTableData = {
      option: <OperationTableOption>{
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
        ],
        valueRowType: [
          OperationDataType.translateKey,
          OperationDataType.normal,
          OperationDataType.normal,
        ],
      },
      data: [['統計類別', 'universal_group_brand', 'universal_group_enterprise']],
    };

    fieldName.forEach((_name, _index) => {
      const _translateKey = groupOverViewConvert(_name);
      const _brandValue = brandFieldValue[_index];
      const _enterpriseValue = enterpriseFieldValue[_index];
      overviewAnalysisTableData.data.push([_translateKey, _brandValue, _enterpriseValue]);
    });

    this.overviewTableDisplayStatus.setNewStatus('overviewInfoAnalysis');
    return { overviewAnalysisTableData };
  }

  /**
   * 處理開課類別相關數據
   * @param data {any}-開課類別相關數據
   */
  handleClassTypeAnalysis(data: any) {
    const { typeFieldName, teachCountFieldValue, fileCountFieldValue } = data;
    const teachSportsTypeChartData = [];
    const fileSportsTypeChartData = [];
    const classTypeAnalysisTableData = {
      option: <OperationTableOption>{
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
        ],
        valueRowType: [
          OperationDataType.translateKey,
          OperationDataType.normal,
          OperationDataType.normal,
        ],
      },
      data: [['universal_group_classType', 'universal_group_classCounts', '課程檔案數']],
    };

    typeFieldName.forEach((_code, _index) => {
      const _translateKey = getSportsTypeKey(_code);
      const _teachCountValue = teachCountFieldValue[_index];
      const _fileCountValue = fileCountFieldValue[_index];
      teachSportsTypeChartData.push({
        name: this.translate.instant(_translateKey),
        y: _teachCountValue,
        color: assignSportsTypeColor(_code),
      });
      fileSportsTypeChartData.push({
        name: this.translate.instant(_translateKey),
        y: _fileCountValue,
        color: assignSportsTypeColor(_code),
      });
      classTypeAnalysisTableData.data.push([_translateKey, _teachCountValue, _fileCountValue]);
    });

    this.overviewTableDisplayStatus.setNewStatus('classTypeAnalysis');
    return { teachSportsTypeChartData, fileSportsTypeChartData, classTypeAnalysisTableData };
  }

  /**
   * 處理會員活躍度相關數據
   * @param data {any}-開課類別相關數據
   * @param totalMember {number}-總會員數
   */
  handleMemberAnalysis(data: any, totalMember: number) {
    const { female, male } = data;
    const inactive = totalMember - male - female;
    const activeAnalysisChartData = [
      {
        name: '男性活躍數',
        y: male,
        color: genderColor.male,
      },
      {
        name: '女性活躍數',
        y: female,
        color: genderColor.female,
      },
      {
        name: '非活躍數',
        y: inactive,
        color: 'rgba(95, 95, 95, 1)',
      },
    ];

    const activeAnalysisTableData = {
      option: <OperationTableOption>{
        headerRowType: [OperationDataType.translateKey, OperationDataType.translateKey],
        valueRowType: [OperationDataType.translateKey, OperationDataType.normal],
      },
      data: [
        ['項目', '人數'],
        ['男性活躍數', male],
        ['女性活躍數', female],
        ['非活躍數', inactive],
        ['總會員數', totalMember],
      ],
    };

    this.overviewTableDisplayStatus.setNewStatus('activeAnalysis');
    return { activeAnalysisChartData, activeAnalysisTableData };
  }

  /**
   * 處理會員年齡相關數據
   * @param data {any}-開課類別相關數據
   */
  handleAgeAnalysis(data: any) {
    const { ageFieldName, femaleFieldValue, maleFieldValue } = data;
    const ageAnalysisChartData = {
      data: [
        { data: [], color: genderColor.male },
        { data: [], color: genderColor.female },
      ],
      seriesName: ['universal_userProfile_male', 'universal_userProfile_female'],
    };

    const ageAnalysisTableData = {
      option: <OperationTableOption>{
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
        ],
        valueRowType: [
          OperationDataType.translateKey,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
        ],
      },
      data: [['年齡範圍', 'universal_userProfile_male', 'universal_userProfile_female', '總人數']],
    };

    ageFieldName.forEach((_ageFieldName, _index) => {
      const _translateKey = this.correspondTranslateKeyService.ageCodeConvert(_ageFieldName);
      const _maleCount = maleFieldValue[_index];
      const _femaleCount = femaleFieldValue[_index];
      const _totalCount = _maleCount + _femaleCount;
      ageAnalysisChartData.data[0].data.push({
        name: this.translate.instant(_translateKey),
        y: _maleCount,
      });
      ageAnalysisChartData.data[1].data.push({
        name: this.translate.instant(_translateKey),
        y: _femaleCount,
      });
      ageAnalysisTableData.data.push([_translateKey, _maleCount, _femaleCount, _totalCount]);
    });

    this.overviewTableDisplayStatus.setNewStatus('ageAnalysis');
    return { ageAnalysisChartData, ageAnalysisTableData };
  }

  /**
   * 處理會員運動檔案運動類別相關數據
   * @param data {any}-開課類別相關數據
   */
  handleSportsTypeAnalysis(data: any) {
    const { typeFieldName, maleFieldValue, femaleFieldValue } = data;
    const maleSportsTypeChartData = [];
    const femaleSportsTypeChartData = [];
    const sportsTypeTableData = this.getGenderSportsTypeTableModel();
    typeFieldName.forEach((_name, _index) => {
      const _translateKey = getSportsTypeKey(_name);
      const _maleValue = maleFieldValue[_index];
      const _femaleValue = femaleFieldValue[_index];
      const _totalCount = _maleValue + _femaleValue;
      const _sportsColor = assignSportsTypeColor(_name);
      maleSportsTypeChartData.push({
        name: this.translate.instant(_translateKey),
        y: _maleValue,
        color: _sportsColor,
      });
      femaleSportsTypeChartData.push({
        name: this.translate.instant(_translateKey),
        y: _femaleValue,
        color: _sportsColor,
      });
      sportsTypeTableData.data.push([_translateKey, _maleValue, _femaleValue, _totalCount]);
    });

    this.overviewTableDisplayStatus.setNewStatus('sportTypeAnalysis');
    return { maleSportsTypeChartData, femaleSportsTypeChartData, sportsTypeTableData };
  }

  /**
   * 取得依性別與運動類別混合分析列表模型
   */
  getGenderSportsTypeTableModel() {
    return {
      option: <OperationTableOption>{
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
        ],
        valueRowType: [
          OperationDataType.translateKey,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
        ],
      },
      data: <Array<Array<string | number>>>[
        ['運動類別', 'universal_userProfile_male', 'universal_userProfile_female', '總檔案數'],
      ],
    };
  }

  /**
   * 處理裝置類別相關數據
   * @param data {any}-開課類別相關數據
   */
  handleDeviceTypeAnalysis(data: any) {
    const { deviceFieldName, enableFieldValue, registerFieldValue } = data;
    const enableChartData = [];
    const registerChartData = [];
    const deviceTableData = {
      option: <OperationTableOption>{
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
        ],
        valueRowType: [
          OperationDataType.translateKey,
          OperationDataType.normal,
          OperationDataType.normal,
        ],
      },
      data: [['裝置類別', '啟用數量', '註冊數量']],
    };
    deviceFieldName.forEach((_name, _index) => {
      const _code = _name.split('d')[1];
      const _translateKey = getDevicTypeInfo(_code, 'key');
      const _color = getDevicTypeInfo(_code, 'color');
      const enableValue = enableFieldValue[_index];
      const registerValue = registerFieldValue[_index];
      enableChartData.push({
        name: this.translate.instant(_translateKey),
        y: enableValue,
        color: _color,
      });
      registerChartData.push({
        name: this.translate.instant(_translateKey),
        y: registerValue,
        color: _color,
      });
      deviceTableData.data.push([_translateKey, enableValue, registerValue]);
    });

    this.overviewTableDisplayStatus.setNewStatus('deviceAnalysis');
    return { enableChartData, registerChartData, deviceTableData };
  }

  /**
   * 處理群組相關單一趨勢圖表數據
   * @param data {any}-api 4102 res 合併過後的數據
   */
  handleSingleGroupTrend(data: any) {
    const { trendChartUnit } = this;
    const { groupCountsAnalysis, timeRange } = data.trend;
    const { fieldValue: rangeValue } = timeRange;
    const { fieldName: analysisName, fieldValue: analysisValue } = groupCountsAnalysis;
    const groupTrendChartData = this.getTrendChartModel(analysisName);
    const groupTrendTableData = {};
    rangeValue.forEach((_dateRange, _dateIndex) => {
      const dateRange = this.getDateRangeTimestamp(_dateRange[0]);
      analysisName.forEach((_fieldName, _nameIndex) => {
        const dataValue = analysisValue[_dateIndex][_nameIndex];
        const processedValue = this.countClassHour(_fieldName, dataValue);
        groupTrendChartData[_fieldName].chartData[0].data.push({
          name: this.getXAxisName(trendChartUnit, dateRange.startDate),
          y: mathRounding(processedValue, 1),
        });

        const trendTableRowHeader = this.getTrendTableRowHeader(dateRange.startDate);
        if (!groupTrendTableData[_fieldName]) {
          this.trendTableDisplayStatus.setNewStatus(_fieldName);
          groupTrendChartData[_fieldName].chartData[0].color = operationTrendColor[_nameIndex];
          const dataName = this.getTrendTableColumnHeader(_fieldName);
          groupTrendChartData[_fieldName].seriesName.push(dataName);
          groupTrendTableData[_fieldName] = {
            option: {
              headerRowType: [
                OperationDataType.translateKey,
                OperationDataType.translateKey,
                OperationDataType.translateKey,
              ],
              valueRowType: [
                OperationDataType.normal,
                OperationDataType.normal,
                OperationDataType.normal,
              ],
            },
            data: [
              [
                `日期範圍(${this.getDateUnitString()})`,
                dataName,
                `${this.translate.instant('universal_group_growth')}(%)`,
              ],
              [trendTableRowHeader, processedValue, '-'],
            ],
          };
        } else {
          const prevValue = analysisValue[_dateIndex - 1][_nameIndex];
          const prevProcessedValue = this.countClassHour(_fieldName, prevValue);
          groupTrendTableData[_fieldName].data.push([
            trendTableRowHeader,
            processedValue,
            `${this.countIncreaseRatio(processedValue, prevProcessedValue, 1)}`,
          ]);
        }
      });
    });

    return { groupTrendChartData, groupTrendTableData };
  }

  /**
   * 依數據類別轉為小時或返回原值
   * @param fieldName {string}-數據類別
   * @param value {number}-數值
   */
  countClassHour(fieldName: string, value: number) {
    const hour = 3600;
    return fieldName === 'totalClassTime' ? mathRounding(value / hour, 1) : value;
  }

  /**
   * 處理會員相關單一趨勢數據
   * @param data {any}-api 4102 res 合併過後的數據
   */
  handleSingleMemberTrend(data: any) {
    const { trendChartUnit } = this;
    const { memberAnalysis, sportsTypeAnalysis, timeRange } = data.trend;
    const { fieldValue: rangeValue } = timeRange;
    const { fieldName: memberAnalysisName, fieldValue: memberAnalysisValue } = memberAnalysis;
    const { fieldName: sportTypeCode, maleFieldValue, femaleFieldValue } = sportsTypeAnalysis;
    const typeFieldName = 'sportsType';
    const genderFieldName = 'gender';
    const memberTrendChartData = this.getTrendChartModel([
      ...memberAnalysisName,
      typeFieldName,
      genderFieldName,
    ]);
    const memberTrendTableData = {};
    const sportsTypeKey = sportTypeCode.map((_code) => getSportsTypeKey(_code));
    memberTrendChartData[typeFieldName].seriesName = sportsTypeKey;
    memberTrendChartData[typeFieldName].chartData = sportTypeCode.map((_code) => {
      return {
        data: [],
        color: assignSportsTypeColor(_code),
      };
    });

    memberTrendTableData[typeFieldName] = {
      option: {
        headerRowType: [
          OperationDataType.translateKey,
          ...sportTypeCode.map(() => OperationDataType.translateKey),
        ],
        valueRowType: [
          OperationDataType.normal,
          ...sportTypeCode.map(() => OperationDataType.normal),
        ],
      },
      data: [[`日期範圍(${this.getDateUnitString()})`, ...sportsTypeKey]],
    };

    const maleTranslateKey = 'universal_userProfile_male';
    const femaleTranslateKey = 'universal_userProfile_female';
    memberTrendChartData[genderFieldName].seriesName = [maleTranslateKey, femaleTranslateKey];
    memberTrendChartData[genderFieldName].chartData = [
      { data: [], color: genderColor.male },
      { data: [], color: genderColor.female },
    ];

    this.trendTableDisplayStatus.setNewStatus(genderFieldName);
    memberTrendTableData[genderFieldName] = {
      option: {
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
        ],
        valueRowType: [
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
        ],
      },
      data: [
        [
          `${this.translate.instant(
            'universal_activityData_dateRange'
          )}(${this.getDateUnitString()})`,
          maleTranslateKey,
          `${this.translate.instant('universal_group_maleUserGrowth')}(%)`,
          femaleTranslateKey,
          `${this.translate.instant('universal_group_femaleUserGrowth')}(%)`,
        ],
      ],
    };

    let malePrevTotal = 0;
    let femalePrevTotal = 0;
    const maleTrendPieDataMap = new Map();
    const femaleTrendPieDataMap = new Map();
    rangeValue.forEach((_dateRange, _dateIndex) => {
      const dateRange = this.getDateRangeTimestamp(_dateRange[0]);
      const trendTableRowHeader = this.getTrendTableRowHeader(dateRange.startDate);

      // handle trend.memberAnalysis
      memberAnalysisName.forEach((_fieldName, _nameIndex) => {
        const dataValue = memberAnalysisValue[_dateIndex][_nameIndex];
        memberTrendChartData[_fieldName].chartData[0].data.push({
          name: this.getXAxisName(trendChartUnit, dateRange.startDate),
          y: dataValue,
        });

        if (!memberTrendTableData[_fieldName]) {
          this.trendTableDisplayStatus.setNewStatus(_fieldName);
          memberTrendChartData[_fieldName].chartData[0].color = operationTrendColor[_nameIndex];
          const dataName = this.getTrendTableColumnHeader(_fieldName);
          memberTrendChartData[_fieldName].seriesName.push(dataName);
          memberTrendTableData[_fieldName] = {
            option: {
              headerRowType: [
                OperationDataType.translateKey,
                OperationDataType.translateKey,
                OperationDataType.translateKey,
              ],
              valueRowType: [
                OperationDataType.normal,
                OperationDataType.normal,
                OperationDataType.normal,
              ],
            },
            data: [
              [
                `日期範圍(${this.getDateUnitString()})`,
                dataName,
                `${this.translate.instant('universal_group_growth')}(%)`,
              ],
              [trendTableRowHeader, dataValue, '-'],
            ],
          };

          this.trendTableDisplayStatus.setNewStatus(_fieldName);
        } else {
          const prevValue = memberAnalysisValue[_dateIndex - 1][_nameIndex];
          memberTrendTableData[_fieldName].data.push([
            trendTableRowHeader,
            dataValue,
            `${this.countIncreaseRatio(dataValue, prevValue, 1)}`,
          ]);
        }
      });

      // handle trend.sportsTypeAnalysis
      let maleFileTotal = 0;
      let femaleFileTotal = 0;
      const typeCounts = [];
      sportTypeCode.forEach((_code, _typeIndex) => {
        const maleValue = maleFieldValue[_dateIndex][_typeIndex];
        const femaleValue = femaleFieldValue[_dateIndex][_typeIndex];
        const typeValue = maleValue + femaleValue;
        maleTrendPieDataMap.set(_code, (maleTrendPieDataMap.get(_code) ?? 0) + maleValue);
        femaleTrendPieDataMap.set(_code, (femaleTrendPieDataMap.get(_code) ?? 0) + femaleValue);
        maleFileTotal += maleValue;
        femaleFileTotal += femaleValue;
        memberTrendChartData[typeFieldName].chartData[_typeIndex].data.push({
          name: this.getXAxisName(trendChartUnit, dateRange.startDate),
          y: typeValue,
        });

        typeCounts.push(typeValue);
      });

      memberTrendTableData[typeFieldName].data.push([trendTableRowHeader, ...typeCounts]);

      memberTrendChartData[genderFieldName].chartData[0].data.push({
        name: this.getXAxisName(trendChartUnit, dateRange.startDate),
        y: maleFileTotal,
      });

      memberTrendChartData[genderFieldName].chartData[1].data.push({
        name: this.getXAxisName(trendChartUnit, dateRange.startDate),
        y: femaleFileTotal,
      });

      memberTrendTableData[genderFieldName].data.push([
        trendTableRowHeader,
        maleFileTotal,
        `${this.countIncreaseRatio(maleFileTotal, malePrevTotal, 1)}`,
        femaleFileTotal,
        `${this.countIncreaseRatio(femaleFileTotal, femalePrevTotal, 1)}`,
      ]);

      malePrevTotal = maleFileTotal;
      femalePrevTotal = femaleFileTotal;
    });

    this.trendTableDisplayStatus.setNewStatus(genderFieldName);
    return {
      memberTrendChartData,
      memberTrendTableData,
      ...this.getGenderSportsTypeTrend(maleTrendPieDataMap, femaleTrendPieDataMap),
    };
  }

  /**
   * 將運動類別Map物件轉highchart可用的圖表數據
   * @param maleMap {Map<number, number>}-男性運動類別資訊
   * @param femaleMap {Map<number, number>}-女性運動類別資訊
   */
  getGenderSportsTypeTrend(maleMap: Map<string, number>, femaleMap: Map<string, number>) {
    const malePieChartData = [];
    const femalePieChartData = [];
    const sportsTypeTrendTableData = this.getGenderSportsTypeTableModel();
    maleMap.forEach((_maleValue, _typeCode) => {
      const _femaleValue = femaleMap.get(_typeCode);
      const _translateKey = getSportsTypeKey(_typeCode);
      const sportsTypeName = this.translate.instant(_translateKey);
      malePieChartData.push({
        name: sportsTypeName,
        y: _maleValue,
        color: assignSportsTypeColor(_typeCode),
      });

      femalePieChartData.push({
        name: sportsTypeName,
        y: _femaleValue,
        color: assignSportsTypeColor(_typeCode),
      });

      const _totalCount = _maleValue + _femaleValue;
      sportsTypeTrendTableData.data.push([_translateKey, _maleValue, _femaleValue, _totalCount]);
    });

    this.trendTableDisplayStatus.setNewStatus('sportsTypeTotal');
    return { malePieChartData, femalePieChartData, sportsTypeTrendTableData };
  }

  /**
   * 處理裝置相關單一趨勢數據
   * @param data {any}-api 4102 res 合併過後的數據
   */
  handleSingleDeviceTrend(data: any) {
    const { trendChartUnit } = this;
    const { deviceTypeAnalysis, timeRange } = data.trend;
    const { fieldValue: rangeValue } = timeRange;
    const { fieldName: deviceTypeCode, enableFieldValue, registerFieldValue } = deviceTypeAnalysis;
    const enableName = 'enable';
    const registerName = 'register';
    const deviceTrendChartData = this.getTrendChartModel([enableName, registerName]);
    const chartDataModel = deviceTypeCode.map((_name) => {
      const _code = _name.split('d')[1];
      return {
        data: [],
        color: getDevicTypeInfo(_code, 'color'),
      };
    });
    deviceTrendChartData[enableName].chartData = deepCopy(chartDataModel);
    deviceTrendChartData[registerName].chartData = deepCopy(chartDataModel);
    const seriesName = deviceTypeCode.map((_name) => {
      const _code = _name.split('d')[1];
      return getDevicTypeInfo(_code, 'key');
    });
    deviceTrendChartData[enableName].seriesName = seriesName;
    deviceTrendChartData[registerName].seriesName = seriesName;
    const deviceTypeLength = deviceTypeCode.length;
    const deviceTableModel = {
      option: {
        headerRowType: [
          OperationDataType.translateKey,
          ...new Array(deviceTypeLength * 2).fill(OperationDataType.translateKey),
        ],
        valueRowType: [
          OperationDataType.normal,
          ...new Array(deviceTypeLength * 2).fill(OperationDataType.normal),
        ],
      },
      data: [
        [`日期範圍(${this.getDateUnitString()})`, ...this.getDeviceColumnHeader(deviceTypeCode)],
      ],
    };

    const deviceTrendTableData = {
      [enableName]: deepCopy(deviceTableModel),
      [registerName]: deepCopy(deviceTableModel),
    };

    rangeValue.forEach((_dateRange, _dateIndex) => {
      const dateRange = this.getDateRangeTimestamp(_dateRange[0]);
      const trendTableRowHeader = this.getTrendTableRowHeader(dateRange.startDate);
      deviceTypeCode.forEach((_code, _codeIndex) => {
        const enableValue = enableFieldValue[_dateIndex][_codeIndex];
        const registerValue = registerFieldValue[_dateIndex][_codeIndex];
        deviceTrendChartData[enableName].chartData[_codeIndex].data.push({
          name: this.getXAxisName(trendChartUnit, dateRange.startDate),
          y: enableValue,
        });

        deviceTrendChartData[registerName].chartData[_codeIndex].data.push({
          name: this.getXAxisName(trendChartUnit, dateRange.startDate),
          y: registerValue,
        });
      });

      deviceTrendTableData[enableName].data.push([
        trendTableRowHeader,
        ...this.getTableData(enableFieldValue[_dateIndex], enableFieldValue[_dateIndex - 1]),
      ]);

      deviceTrendTableData[registerName].data.push([
        trendTableRowHeader,
        ...this.getTableData(registerFieldValue[_dateIndex], registerFieldValue[_dateIndex - 1]),
      ]);
    });

    return { deviceTrendChartData, deviceTrendTableData };
  }

  /**
   * 處理群組相關比較趨勢圖表數據
   * @param data {any}-api 4102 res 合併過後的數據
   */
  handleCompareGroupTrend(data: any) {
    const { range, value } = this.splitGroupCompareData(data.trend);
    const { older: olderRange, newer: newerRange } = range;
    const { fieldName, older: olderValue, newer: newerValue } = value;
    const groupTrendChartData = this.getTrendChartModel(fieldName);
    const groupTrendTableData = {};

    // 避免新舊數據因週數不同造成數據長度不同
    const olderDataLength = olderRange.length;
    const newerDataLength = newerRange.length;
    const finalLength = newerDataLength >= olderDataLength ? newerDataLength : olderDataLength;
    const olderTotalValueObj = {};
    const newerTotalValueObj = {};

    for (let i = 0; i < finalLength; i++) {
      const _olderRange = olderRange[i] ? this.getDateRangeTimestamp(olderRange[i]) : null;
      const _newerRange = newerRange[i] ? this.getDateRangeTimestamp(newerRange[i]) : null;
      fieldName.forEach((_fieldName, _nameIndex) => {
        const _olderValue = olderValue[i] ? olderValue[i][_nameIndex] : null;
        const _olderProcessedValue = this.countClassHour(_fieldName, _olderValue);
        const _newerValue = newerValue[i] ? newerValue[i][_nameIndex] : null;
        const _newerProcessedValue = this.countClassHour(_fieldName, _newerValue);
        olderTotalValueObj[_fieldName] =
          (olderTotalValueObj[_fieldName] ?? 0) + (_olderProcessedValue ?? 0);
        newerTotalValueObj[_fieldName] =
          (newerTotalValueObj[_fieldName] ?? 0) + (_newerProcessedValue ?? 0);

        const trendTableRowHeader = this.translate.instant(this.getCompareRowHeader(i));
        groupTrendChartData[_fieldName].chartData[0].data.push({
          name: trendTableRowHeader,
          y: _olderProcessedValue ?? 0,
        });

        groupTrendChartData[_fieldName].chartData[1].data.push({
          name: trendTableRowHeader,
          y: _newerProcessedValue ?? 0,
        });

        if (!groupTrendTableData[_fieldName]) {
          const _mainColor = operationTrendColor[_nameIndex];
          groupTrendChartData[_fieldName].chartData[0].color = changeOpacity(_mainColor, 0.5);
          groupTrendChartData[_fieldName].chartData[1].color = _mainColor;
          const isSeasonData = finalLength > 6;
          const olderColumnHeader = this.getCompareColumnHeader(
            _olderRange.startDate,
            isSeasonData
          );
          const newerColumnHeader = this.getCompareColumnHeader(
            _newerRange.startDate,
            isSeasonData
          );

          groupTrendChartData[_fieldName].seriesName = [olderColumnHeader, newerColumnHeader];
          groupTrendTableData[_fieldName] = {
            option: {
              headerRowType: [
                OperationDataType.translateKey,
                OperationDataType.translateKey,
                OperationDataType.translateKey,
                OperationDataType.translateKey,
              ],
              valueRowType: [
                OperationDataType.translateKey,
                OperationDataType.normal,
                OperationDataType.normal,
                OperationDataType.normal,
              ],
            },
            data: [
              [
                this.translate.instant('universal_time_dateUnit'),
                olderColumnHeader,
                newerColumnHeader,
                `${this.translate.instant('universal_group_growth')}(%)`,
              ],
              [trendTableRowHeader, _olderProcessedValue, _newerProcessedValue, '-'],
            ],
          };
        } else {
          groupTrendTableData[_fieldName].data.push([
            trendTableRowHeader,
            _olderProcessedValue ?? '-',
            _newerProcessedValue ?? '-',
            `${this.countIncreaseRatio(_newerProcessedValue, _olderProcessedValue, 1)}`,
          ]);
        }

        if (i === finalLength - 1) {
          const olderTotalValue = olderTotalValueObj[_fieldName];
          const newerTotalValue = newerTotalValueObj[_fieldName];
          groupTrendTableData[_fieldName].data.push([
            'universal_adjective_total',
            mathRounding(olderTotalValue, 1),
            mathRounding(newerTotalValue, 1),
            `${this.countIncreaseRatio(newerTotalValue, olderTotalValue, 1)}`,
          ]);
        }
      });
    }

    return { groupTrendTableData, groupTrendChartData };
  }

  /**
   * 因數據包含兩個時期的數據，故將數據切分以便生成比較圖表與數據
   * @param trendData {any}-api 4102 res 合併過後的 trend 物件
   */
  splitGroupCompareData(trendData: any) {
    const { groupCountsAnalysis, timeRange } = trendData;
    const { fieldValue: rangeValue } = timeRange;
    const { fieldName, fieldValue: analysisValue } = groupCountsAnalysis;
    const splitIndex = this.getSplitIndex(rangeValue);
    const copyRange = [...rangeValue];
    const copyValue = [...analysisValue];
    const [olderRange, newerRange] = [copyRange.splice(0, splitIndex), copyRange];
    const [olderValue, newerValue] = [copyValue.splice(0, splitIndex), copyValue];
    return {
      range: {
        older: olderRange,
        newer: newerRange,
      },
      value: {
        fieldName,
        older: olderValue,
        newer: newerValue,
      },
    };
  }

  /**
   * 根據數據索引取得比較表格列標頭
   * @param index {number}-數據索引
   */
  getCompareRowHeader(index: number) {
    const { trendChartUnit } = this;
    switch (trendChartUnit) {
      case DateUnit.month:
        return getMonthKey(index);
      default:
        return `Week ${index + 1}`;
    }
  }

  /**
   * 根據起始日期取得比較表格行標頭
   * @param date {number}-新或舊數據起始timestamp
   */
  getCompareColumnHeader(date: number, isSeasonData = false) {
    const { trendChartUnit } = this;
    switch (trendChartUnit) {
      case DateUnit.month:
        return dayjs(date).format('YYYY');
      default:
        return isSeasonData ? this.getSeasonName(date) : getMonthKey(dayjs(date).month());
    }
  }

  /**
   * 根據時間取得該季名稱，ex. 2022Q1
   * @param date {number}-新或舊數據起始timestamp
   */
  getSeasonName(date: number) {
    const dayjsObj = dayjs(date);
    const year = dayjsObj.format('YYYY');
    const season = dayjsObj.quarter();
    return `${year}Q${season}`;
  }

  /**
   * 取得根據範圍日期顯示單位將數據切分兩個時期的切分索引
   * @param rangeValue {Array<Array<number>>}-報告日期清單
   */
  getSplitIndex(rangeValue: Array<Array<number>>) {
    const { trendChartUnit } = this;
    switch (trendChartUnit) {
      case DateUnit.month:
        return this.getSplitYearIndex(rangeValue);
      default: {
        return rangeValue.length > 12
          ? this.getSplitSeasonIndex(rangeValue)
          : this.getSplitMonthIndex(rangeValue);
      }
    }
  }

  /**
   * 取得根據範圍日期顯示單位將數據切分兩年的切分索引
   * @param rangeValue {Array<Array<number>>}-報告日期清單
   */
  getSplitYearIndex(rangeValue: Array<Array<number>>) {
    return rangeValue.findIndex((_range, _index) => {
      if (_index === 0) return false;
      const _previousIndex = _index - 1;
      const _currentYear = _range[0].toString().slice(0, 4);
      const _previousYear = rangeValue[_previousIndex][0].toString().slice(0, 4);
      return _currentYear !== _previousYear;
    });
  }

  /**
   * 取得根據範圍日期顯示單位將數據切分兩季的切分索引
   * @param rangeValue {Array<Array<number>>}-報告日期清單
   */
  getSplitSeasonIndex(rangeValue: Array<Array<number>>) {
    const dateFirst = rangeValue[0][0].toString();
    const [yearFirst, weekFirst] = [dateFirst.slice(0, 4), +dateFirst.slice(4, 6)];
    // 用該週第一天當作季的判斷基準
    const getSeason = (year: string, week: number) =>
      dayjs(year, 'YYYY').endOf('year').isoWeek(week).startOf('isoWeek').quarter();
    const seasonFirst = getSeason(yearFirst, weekFirst);
    return rangeValue.findIndex((_range, _index) => {
      if (_index === 0) return false;
      const _currentRange = _range[0].toString();
      const [_currentYear, _currentWeek] = [_currentRange.slice(0, 4), +_currentRange.slice(4, 6)];
      const _currentSeason = getSeason(_currentYear, _currentWeek);
      return _currentSeason !== seasonFirst;
    });
  }

  /**
   * 取得根據範圍日期顯示單位將數據切分兩月的切分索引
   * @param rangeValue {Array<Array<number>>}-報告日期清單
   */
  getSplitMonthIndex(rangeValue: Array<Array<number>>) {
    const dateFirst = rangeValue[0][0].toString();
    const [yearFirst, weekFirst] = [dateFirst.slice(0, 4), +dateFirst.slice(4, 6)];
    // 用該週第一天當作月的判斷基準
    const getMonth = (year: string, week: number) =>
      dayjs(year, 'YYYY').endOf('year').isoWeek(week).startOf('isoWeek').month();
    const monthFirst = getMonth(yearFirst, weekFirst);
    return rangeValue.findIndex((_range, _index) => {
      if (_index === 0) return false;
      const _currentRange = _range[0].toString();
      const [_currentYear, _currentWeek] = [_currentRange.slice(0, 4), +_currentRange.slice(4, 6)];
      const _currentMonth = getMonth(_currentYear, _currentWeek);
      return _currentMonth !== monthFirst;
    });
  }

  /**
   * 處理會員相關比較趨勢數據
   * @param data {any}-api 4102 res 合併過後的數據
   */
  handleCompareMemberTrend(data: any) {
    const { range, memberValue, sportsTypeValue } = this.splitMemberCompareData(data.trend);
    const { older: olderRange, newer: newerRange } = range;
    const { memberFieldName, olderMemberValue, newerMemberValue } = memberValue;
    const { typeFieldName, olderMaleValue, newerMaleValue, olderFemaleValue, newerFemaleValue } =
      sportsTypeValue;
    const sportsTypeName = this.getSportsTypeName(typeFieldName);
    const allFieldName = memberFieldName.concat(sportsTypeName);
    const memberTrendChartData = this.getTrendChartModel(allFieldName);
    const memberTrendTableData = {};

    // 避免新舊數據因週數不同造成數據長度不同
    const olderDataLength = olderRange.length;
    const newerDataLength = newerRange.length;
    const finalLength = newerDataLength >= olderDataLength ? newerDataLength : olderDataLength;
    const memberFieldNameLength = memberFieldName.length;
    const olderTotalValueObj = {};
    const newerTotalValueObj = {};
    const olderPieDataMap = new Map();
    const newerPieDataMap = new Map();
    const isSeasonData = finalLength > 6;
    const firstOlderRange = this.getDateRangeTimestamp(olderRange[0]);
    const firstNewerRange = this.getDateRangeTimestamp(newerRange[0]);
    const olderColumnHeader = this.getCompareColumnHeader(firstOlderRange.startDate, isSeasonData);
    const newerColumnHeader = this.getCompareColumnHeader(firstNewerRange.startDate, isSeasonData);
    const valueHeader = [olderColumnHeader, newerColumnHeader];
    for (let i = 0; i < finalLength; i++) {
      const _olderRange = olderRange[i] ? this.getDateRangeTimestamp(olderRange[i]) : null;
      const _newerRange = newerRange[i] ? this.getDateRangeTimestamp(newerRange[i]) : null;
      allFieldName.forEach((_fieldName, _nameIndex) => {
        let _olderValue: number;
        let _newerValue: number;
        const isMemberAnalysis = _nameIndex < memberFieldNameLength;
        const _typeIndex = _nameIndex - memberFieldNameLength;

        if (isMemberAnalysis) {
          _olderValue = _olderRange ? olderMemberValue[i][_nameIndex] : null;
          _newerValue = _newerRange ? newerMemberValue[i][_nameIndex] : null;
        } else {
          _olderValue = _olderRange
            ? olderMaleValue[i][_typeIndex] + olderFemaleValue[i][_typeIndex]
            : null;
          _newerValue = _newerRange
            ? newerMaleValue[i][_typeIndex] + newerFemaleValue[i][_typeIndex]
            : null;

          const _typeCode = typeFieldName[_typeIndex];
          olderPieDataMap.set(
            _typeCode,
            (olderPieDataMap.get(_typeCode) ?? 0) + (_olderValue ?? 0)
          );
          newerPieDataMap.set(
            _typeCode,
            (newerPieDataMap.get(_typeCode) ?? 0) + (_newerValue ?? 0)
          );
        }

        olderTotalValueObj[_fieldName] = (olderTotalValueObj[_fieldName] ?? 0) + (_olderValue ?? 0);
        newerTotalValueObj[_fieldName] = (newerTotalValueObj[_fieldName] ?? 0) + (_newerValue ?? 0);

        const trendTableRowHeader = this.translate.instant(this.getCompareRowHeader(i));
        memberTrendChartData[_fieldName].chartData[0].data.push({
          name: trendTableRowHeader,
          y: _olderValue ?? 0,
        });

        memberTrendChartData[_fieldName].chartData[1].data.push({
          name: trendTableRowHeader,
          y: _newerValue ?? 0,
        });

        if (!memberTrendTableData[_fieldName]) {
          this.trendTableDisplayStatus.setNewStatus(_fieldName);
          const _mainColor = isMemberAnalysis
            ? operationTrendColor[_nameIndex]
            : sportTypeColor[_typeIndex];
          memberTrendChartData[_fieldName].chartData[0].color = changeOpacity(_mainColor, 0.5);
          memberTrendChartData[_fieldName].chartData[1].color = _mainColor;
          memberTrendChartData[_fieldName].seriesName = valueHeader;
          memberTrendTableData[_fieldName] = {
            option: {
              headerRowType: [
                OperationDataType.translateKey,
                OperationDataType.translateKey,
                OperationDataType.translateKey,
                OperationDataType.translateKey,
              ],
              valueRowType: [
                OperationDataType.translateKey,
                OperationDataType.normal,
                OperationDataType.normal,
                OperationDataType.normal,
              ],
            },
            data: [
              [
                this.translate.instant('universal_time_dateUnit'),
                olderColumnHeader,
                newerColumnHeader,
                `${this.translate.instant('universal_group_growth')}(%)`,
              ],
              [trendTableRowHeader, _olderValue, _newerValue, '-'],
            ],
          };
        } else {
          memberTrendTableData[_fieldName].data.push([
            trendTableRowHeader,
            _olderValue ?? '-',
            _newerValue ?? '-',
            `${this.countIncreaseRatio(_newerValue, _olderValue, 1)}`,
          ]);
        }

        if (i === finalLength - 1) {
          const olderTotalValue = olderTotalValueObj[_fieldName];
          const newerTotalValue = newerTotalValueObj[_fieldName];
          memberTrendTableData[_fieldName].data.push([
            'universal_adjective_total',
            olderTotalValue,
            newerTotalValue,
            `${this.countIncreaseRatio(newerTotalValue, olderTotalValue, 1)}`,
          ]);
        }
      });
    }

    return {
      memberTrendChartData,
      memberTrendTableData,
      ...this.getSportsTypeTrendPieData(olderPieDataMap, newerPieDataMap, valueHeader),
    };
  }

  /**
   * 取得運動類別比較趨勢總量數據
   * @param olderMap {Map<number, number>}-舊比較數據Map物件
   * @param newerMap {Map<number, number>}-新比較數據Map物件
   */
  getSportsTypeTrendPieData(
    olderMap: Map<string, number>,
    newerMap: Map<string, number>,
    header: Array<string | number>
  ) {
    const olderPieChartData = [];
    const newerPieChartData = [];
    const sportsTypeTrendTableData = {
      option: <OperationTableOption>{
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
        ],
        valueRowType: [
          OperationDataType.translateKey,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
        ],
      },
      data: <Array<Array<string | number>>>[
        ['運動類別', ...header, `${this.translate.instant('universal_group_growth')}(%)`],
      ],
    };

    olderMap.forEach((_olderValue, _typeCode) => {
      const _newerValue = newerMap.get(_typeCode);
      const _translateKey = getSportsTypeKey(_typeCode);
      const sportsTypeName = this.translate.instant(_translateKey);
      olderPieChartData.push({
        name: sportsTypeName,
        y: _olderValue,
        color: assignSportsTypeColor(_typeCode),
      });

      newerPieChartData.push({
        name: sportsTypeName,
        y: _newerValue,
        color: assignSportsTypeColor(_typeCode),
      });

      const _diffRatio = this.countIncreaseRatio(_newerValue, _olderValue, 1);
      sportsTypeTrendTableData.data.push([_translateKey, _olderValue, _newerValue, _diffRatio]);
    });

    this.trendTableDisplayStatus.setNewStatus('sportsTypeTotal');
    return { olderPieChartData, newerPieChartData, sportsTypeTrendTableData, valueHeader: header };
  }

  /**
   * 因數據包含兩個時期的數據，故將數據切分以便生成比較圖表與數據
   * @param trendData {any}-api 4102 res 合併過後的 trend 物件
   */
  splitMemberCompareData(trendData: any) {
    const { memberAnalysis, sportsTypeAnalysis, timeRange } = trendData;
    const { fieldValue: rangeValue } = timeRange;
    const { fieldName: memberFieldName, fieldValue: analysisValue } = memberAnalysis;
    const { fieldName: typeFieldName, maleFieldValue, femaleFieldValue } = sportsTypeAnalysis;
    const splitIndex = this.getSplitIndex(rangeValue);
    const copyRange = [...rangeValue];
    const copyMemberValue = [...analysisValue];
    const copyMaleValue = [...maleFieldValue];
    const copyFemaleValue = [...femaleFieldValue];
    const [olderRange, newerRange] = [copyRange.splice(0, splitIndex), copyRange];
    const [olderMemberValue, newerMemberValue] = [
      copyMemberValue.splice(0, splitIndex),
      copyMemberValue,
    ];
    const [olderMaleValue, newerMaleValue] = [copyMaleValue.splice(0, splitIndex), copyMaleValue];
    const [olderFemaleValue, newerFemaleValue] = [
      copyFemaleValue.splice(0, splitIndex),
      copyFemaleValue,
    ];
    return {
      range: {
        older: olderRange,
        newer: newerRange,
      },
      memberValue: {
        memberFieldName,
        olderMemberValue,
        newerMemberValue,
      },
      sportsTypeValue: {
        typeFieldName,
        olderMaleValue,
        newerMaleValue,
        olderFemaleValue,
        newerFemaleValue,
      },
    };
  }

  /**
   * 將 cjson 運動類別代碼轉為運動類別名稱
   * @param fieldName {Array<string>}-cjson 運動類別代碼
   */
  getSportsTypeName(fieldName: Array<string>) {
    return fieldName.map((_name) => translateSportsCode(_name));
  }

  /**
   * 處理裝置相關比較趨勢數據
   * @param data {any}-api 4102 res 合併過後的數據
   */
  handleCompareDeviceTrend(data: any) {
    const { range, deviceTypeValue } = this.splitDeviceCompareData(data.trend);
    const { older: olderRange, newer: newerRange } = range;
    const {
      typeFieldName,
      olderEnableValue,
      newerEnableValue,
      olderRegisterValue,
      newerRegisterValue,
    } = deviceTypeValue;
    const deviceAnalysisName = this.getDeviceAnalysisName(typeFieldName);
    const deviceTrendChartData = this.getTrendChartModel(deviceAnalysisName);
    const deviceTrendTableData = {};

    // 避免新舊數據因週數不同造成數據長度不同
    const olderDataLength = olderRange.length;
    const newerDataLength = newerRange.length;
    const finalLength = newerDataLength >= olderDataLength ? newerDataLength : olderDataLength;
    const deviceTypeLength = typeFieldName.length;
    const olderTotalValueObj = {};
    const newerTotalValueObj = {};

    for (let i = 0; i < finalLength; i++) {
      const _olderRange = olderRange[i] ? this.getDateRangeTimestamp(olderRange[i]) : null;
      const _newerRange = newerRange[i] ? this.getDateRangeTimestamp(newerRange[i]) : null;
      deviceAnalysisName.forEach((_fieldName, _nameIndex) => {
        let _olderValue: number;
        let _newerValue: number;
        const _realIndex =
          _nameIndex < deviceTypeLength ? _nameIndex : _nameIndex - deviceTypeLength;
        if (_nameIndex < deviceTypeLength) {
          _olderValue = olderEnableValue[i] ? olderEnableValue[i][_realIndex] : null;
          _newerValue = newerEnableValue[i] ? newerEnableValue[i][_realIndex] : null;
        } else {
          _olderValue = olderRegisterValue[i] ? olderRegisterValue[i][_realIndex] : null;
          _newerValue = newerRegisterValue[i] ? newerRegisterValue[i][_realIndex] : null;
        }

        olderTotalValueObj[_fieldName] = (olderTotalValueObj[_fieldName] ?? 0) + (_olderValue ?? 0);
        newerTotalValueObj[_fieldName] = (newerTotalValueObj[_fieldName] ?? 0) + (_newerValue ?? 0);

        const trendTableRowHeader = this.translate.instant(this.getCompareRowHeader(i));
        deviceTrendChartData[_fieldName].chartData[0].data.push({
          name: trendTableRowHeader,
          y: _olderValue ?? 0,
        });

        deviceTrendChartData[_fieldName].chartData[1].data.push({
          name: trendTableRowHeader,
          y: _newerValue ?? 0,
        });

        if (!deviceTrendTableData[_fieldName]) {
          this.trendTableDisplayStatus.setNewStatus(_fieldName);
          const deviceCode = (_realIndex + 1).toString();
          const _mainColor = getDevicTypeInfo(deviceCode, 'color');
          deviceTrendChartData[_fieldName].chartData[0].color = changeOpacity(_mainColor, 0.5);
          deviceTrendChartData[_fieldName].chartData[1].color = _mainColor;
          const isSeasonData = finalLength > 6;
          const olderColumnHeader = this.getCompareColumnHeader(
            _olderRange.startDate,
            isSeasonData
          );
          const newerColumnHeader = this.getCompareColumnHeader(
            _newerRange.startDate,
            isSeasonData
          );

          deviceTrendChartData[_fieldName].seriesName = [olderColumnHeader, newerColumnHeader];
          deviceTrendTableData[_fieldName] = {
            option: {
              headerRowType: [
                OperationDataType.translateKey,
                OperationDataType.translateKey,
                OperationDataType.translateKey,
                OperationDataType.translateKey,
              ],
              valueRowType: [
                OperationDataType.translateKey,
                OperationDataType.normal,
                OperationDataType.normal,
                OperationDataType.normal,
              ],
            },
            data: [
              [
                this.translate.instant('universal_time_dateUnit'),
                olderColumnHeader,
                newerColumnHeader,
                `${this.translate.instant('universal_group_growth')}(%)`,
              ],
              [trendTableRowHeader, _olderValue, _newerValue, '-'],
            ],
          };
        } else {
          deviceTrendTableData[_fieldName].data.push([
            trendTableRowHeader,
            _olderValue ?? '-',
            _newerValue ?? '-',
            `${this.countIncreaseRatio(_newerValue, _olderValue, 1)}`,
          ]);
        }

        if (i === finalLength - 1) {
          const olderTotalValue = olderTotalValueObj[_fieldName];
          const newerTotalValue = newerTotalValueObj[_fieldName];
          deviceTrendTableData[_fieldName].data.push([
            'universal_adjective_total',
            olderTotalValue,
            newerTotalValue,
            `${this.countIncreaseRatio(newerTotalValue, olderTotalValue, 1)}`,
          ]);
        }
      });
    }

    return { deviceTrendTableData, deviceTrendChartData };
  }

  /**
   * 因數據包含兩個時期的數據，故將數據切分以便生成比較圖表與數據
   * @param trendData {any}-api 4102 res 合併過後的 trend 物件
   */
  splitDeviceCompareData(trendData: any) {
    const { deviceTypeAnalysis, timeRange } = trendData;
    const { fieldValue: rangeValue } = timeRange;
    const { fieldName: typeFieldName, enableFieldValue, registerFieldValue } = deviceTypeAnalysis;
    const splitIndex = this.getSplitIndex(rangeValue);
    const copyRange = [...rangeValue];
    const copyEnableValue = [...enableFieldValue];
    const copyRegisterValue = [...registerFieldValue];
    const [olderRange, newerRange] = [copyRange.splice(0, splitIndex), copyRange];
    const [olderEnableValue, newerEnableValue] = [
      copyEnableValue.splice(0, splitIndex),
      copyEnableValue,
    ];
    const [olderRegisterValue, newerRegisterValue] = [
      copyRegisterValue.splice(0, splitIndex),
      copyRegisterValue,
    ];
    return {
      range: {
        older: olderRange,
        newer: newerRange,
      },
      deviceTypeValue: {
        typeFieldName,
        olderEnableValue,
        newerEnableValue,
        olderRegisterValue,
        newerRegisterValue,
      },
    };
  }

  /**
   * 將 cjson 運動類別代碼轉為裝置類別名稱
   * @param fieldName {Array<string>}-cjson 裝置類別代碼
   */
  getDeviceAnalysisName(fieldName: Array<string>) {
    const enableType = [];
    const registerType = [];
    fieldName.forEach((_name) => {
      const _typeName = getDevicTypeInfo(_name.split('d')[1], 'type');
      enableType.push(`${_typeName}Enable`);
      registerType.push(`${_typeName}Register`);
    });

    return enableType.concat(registerType);
  }

  /**
   * 將fieldName轉為物件供圖表數據整合用
   * @param fieldName {Array<string>}-api 數據類別名稱
   */
  getTrendChartModel(fieldName: Array<string>) {
    const { isCompareMode } = this;
    const obj: {
      [key: string]: {
        chartData: Array<{ data: Array<any>; color: string }>;
        seriesName: Array<string>;
      };
    } = {};
    fieldName.forEach(
      (_name) =>
        (obj[_name] = {
          chartData: isCompareMode
            ? [deepCopy(oneSeriesInfo), deepCopy(oneSeriesInfo)]
            : [deepCopy(oneSeriesInfo)],
          seriesName: [],
        })
    );

    return obj;
  }

  /**
   * 取得x軸標線名稱
   * @param unit {DateUnit}-圖表x軸日期單位
   * @param startDate {number}-該數據開始時間timestamp
   */
  getXAxisName(unit: DateUnit, startDate: number) {
    let format: string;
    switch (unit) {
      case DateUnit.year:
        format = 'YYYY';
        break;
      case DateUnit.month:
        format = 'YYYY/MM';
        break;
      default:
        format = 'MM/DD';
        break;
    }

    return dayjs(startDate).format(format);
  }

  /**
   * 根據趨勢圖表日期單位，取得日期範圍字串其實際開始日期與結束日期(timestamp)
   * @param range {string | number}-日期範圍字串
   */
  getDateRangeTimestamp(range: string | number) {
    const rangeCheck = range.toString();
    const { trendChartUnit } = this;
    switch (trendChartUnit) {
      case DateUnit.year: {
        const dayjsObj = dayjs(rangeCheck, 'YYYY');
        return {
          startDate: dayjsObj.startOf('year').valueOf(),
          endDate: dayjsObj.endOf('year').valueOf(),
        };
      }
      case DateUnit.month: {
        const dayjsObj = dayjs(rangeCheck, 'YYYYMM');
        return {
          startDate: dayjsObj.startOf('month').valueOf(),
          endDate: dayjsObj.endOf('month').valueOf(),
        };
      }
      case DateUnit.week: {
        const year = rangeCheck.toString().slice(0, 4);
        const week = rangeCheck.toString().slice(4, 6);

        // 使用 endOf('year') 確保第一週是從該年開始計算而不是去年
        const dayjsObj = dayjs(year, 'YYYY')
          .endOf('year')
          .isoWeek(+week);
        return {
          startDate: dayjsObj.startOf('isoWeek').valueOf(),
          endDate: dayjsObj.endOf('isoWeek').valueOf(),
        };
      }
    }
  }

  /**
   * 取得趨勢表格之橫列標頭
   * @param startDate {number}-日期範圍開始日期(timestamp)
   */
  getTrendTableRowHeader(startDate: number) {
    const dayjsObj = dayjs(startDate);
    switch (this.trendChartUnit) {
      case DateUnit.year:
        return dayjsObj.format('YYYY');
      case DateUnit.month:
        return dayjsObj.format('YYYY-MM');
      case DateUnit.week:
        return dayjsObj.format('YYYY-MM-DD');
    }
  }

  /**
   * 依數據類別取得趨勢表格之直行標頭
   * @param name {string}-數據類別
   */
  getTrendTableColumnHeader(name: string) {
    switch (name) {
      case 'brand':
        return '品牌企業數量';
      case 'branch':
        return '分店分公司數量';
      case 'class':
        return 'universal_group_classGroupAmount';
      case 'teachCounts':
        return '開課次數';
      case 'attendCounts':
        return '出席次數';
      case 'classFile':
        return '檔案上傳數量';
      case 'totalClassTime':
        return '總課程時間';
      case 'totalMembers':
        return '總會員數';
      case 'fileCounts':
        return '檔案數量';
      case 'enable':
        return '啟用數量';
      case 'register':
        return '註冊數量';
      default:
        return 'Other';
    }
  }

  /**
   * 取得日期單位文字
   */
  getDateUnitString() {
    switch (this.trendChartUnit) {
      case DateUnit.year:
        return this.translate.instant('universal_time_year');
      case DateUnit.month:
        return this.translate.instant('universal_time_months');
      case DateUnit.week:
        return this.translate.instant('universal_time_week');
    }
  }

  /**
   * 計算增長率
   * @param currentValue {number}-現在數值
   * @param prevValue {number}-上個數值
   * @param decimal {number}-四捨五入位數
   */
  countIncreaseRatio(currentValue: number, prevValue: number, decimal: number) {
    if (!prevValue || prevValue <= 0) return '-';
    return mathRounding((((currentValue ?? 0) - prevValue) / prevValue) * 100, decimal);
  }

  /**
   * 變更報告類型
   * @param type {SystemAnalysisType}-報告類型
   */
  chnageReportType(type: SystemAnalysisType) {
    if (this.progress === 100) {
      const { type: prevType } = this.postInfo;
      if (type !== prevType) {
        this.postInfo.type = type;
        this.allRefresh = true;
        this.overviewTableDisplayStatus.removeAllStatus();
        this.trendTableDisplayStatus.removeAllStatus();
        this.getReportInfo();
        this.getReportTrend();
      }
    }
  }

  /**
   * 取得現在時間
   */
  getCurrentTime() {
    return dayjs().format('YYYY-MM-DD HH:mm');
  }

  /**
   * 根據報告類別生成區塊索引列表
   */
  getSectionIndexList(): Array<IndexInfo> {
    const { type } = this.postInfo;
    switch (type) {
      case SystemAnalysisType.group:
        return [
          {
            indexLayer: 0,
            textKey: 'universal_activityData_summary',
            elementId: 'summary__info__section',
          },
          {
            indexLayer: 0,
            textKey: 'universal_group_generalAnalysisChart',
            elementId: 'overall__analysis__section',
          },
          { indexLayer: 1, textKey: '方案', elementId: 'plan__analysis' },
          { indexLayer: 1, textKey: '概要', elementId: 'summary__analysis' },
          // { indexLayer: 1, textKey: 'universal_group_classType', elementId: 'teach__type__analysis' },
          {
            indexLayer: 0,
            textKey: 'universal_group_trendAnalysisCharts',
            elementId: 'trend__chart__section',
          },
          { indexLayer: 1, textKey: '品牌企業數量', elementId: 'brand__counts__analysis' },
          {
            indexLayer: 1,
            textKey: 'universal_group_classCounts',
            elementId: 'teach__counts__analysis',
          },
          { indexLayer: 1, textKey: '總課程時間', elementId: 'class__time__analysis' },
          { indexLayer: 1, textKey: '出席次數', elementId: 'attend__counts__analysis' },
          { indexLayer: 1, textKey: '檔案數量', elementId: 'file__counts__analysis' },
        ];
      case SystemAnalysisType.member: {
        const list = [
          {
            indexLayer: 0,
            textKey: 'universal_activityData_summary',
            elementId: 'summary__info__section',
          },
          {
            indexLayer: 0,
            textKey: 'universal_group_generalAnalysisChart',
            elementId: 'overall__analysis__section',
          },
          { indexLayer: 1, textKey: '會員活躍度', elementId: 'active__analysis' },
          { indexLayer: 1, textKey: '會員年齡分佈', elementId: 'age__analysis' },
          { indexLayer: 1, textKey: '運動類別', elementId: 'sports__type__analysis' },
          {
            indexLayer: 0,
            textKey: 'universal_group_trendAnalysisCharts',
            elementId: 'trend__chart__section',
          },
          { indexLayer: 1, textKey: '會員數', elementId: 'member__counts__analysis' },
        ];

        const singleTrendList = [
          { indexLayer: 1, textKey: '運動筆數', elementId: 'sports__count__analysis' },
          { indexLayer: 1, textKey: '運動類別總量', elementId: 'sports__type__pie' },
          { indexLayer: 1, textKey: '運動類別', elementId: 'sports__type__trend' },
        ];

        const compareTrendList = [
          { indexLayer: 1, textKey: '運動類別總量', elementId: 'sports__type__pie' },
          { indexLayer: 1, textKey: '跑步類別', elementId: 'run__count__trend' },
          { indexLayer: 1, textKey: '騎乘類別', elementId: 'cycle__count__trend' },
          { indexLayer: 1, textKey: '重訓類別', elementId: 'weightTrain__count__trend' },
          { indexLayer: 1, textKey: '游泳類別', elementId: 'swim__count__trend' },
          { indexLayer: 1, textKey: '有氧類別', elementId: 'aerobic__count__trend' },
          { indexLayer: 1, textKey: '划船類別', elementId: 'row__count__trend' },
          { indexLayer: 1, textKey: '球類類別', elementId: 'ball__count__trend' },
        ];
        return list.concat(this.isCompareMode ? compareTrendList : singleTrendList);
      }
      case SystemAnalysisType.device: {
        const list = [
          {
            indexLayer: 0,
            textKey: 'universal_activityData_summary',
            elementId: 'summary__info__section',
          },
          {
            indexLayer: 0,
            textKey: 'universal_group_generalAnalysisChart',
            elementId: 'overall__analysis__section',
          },
          { indexLayer: 1, textKey: '裝置類別', elementId: 'device__type__analysis' },
          {
            indexLayer: 0,
            textKey: 'universal_group_trendAnalysisCharts',
            elementId: 'trend__chart__section',
          },
        ];

        const singleTrendList = [
          { indexLayer: 1, textKey: '裝置啟用', elementId: 'device__enabled__trend' },
          { indexLayer: 1, textKey: '裝置註冊', elementId: 'device__register__trend' },
        ];

        const compareTrendList = [
          { indexLayer: 1, textKey: '穿戴式啟用', elementId: 'wearable__enabled__trend' },
          { indexLayer: 1, textKey: '穿戴式註冊', elementId: 'wearable__register__trend' },
          { indexLayer: 1, textKey: '跑步機啟用', elementId: 'treadmill__enabled__trend' },
          { indexLayer: 1, textKey: '跑步機註冊', elementId: 'treadmill__register__trend' },
          { indexLayer: 1, textKey: '飛輪啟用', elementId: 'spinbike__enabled__trend' },
          { indexLayer: 1, textKey: '飛輪註冊', elementId: 'spinbike__register__trend' },
          { indexLayer: 1, textKey: '划船器啟用', elementId: 'row__machine__enabled__trend' },
          { indexLayer: 1, textKey: '划船器註冊', elementId: 'row__machine__register__trend' },
          { indexLayer: 1, textKey: '感應器啟用', elementId: 'sensor__enabled__trend' },
          { indexLayer: 1, textKey: '感應器註冊', elementId: 'sensor__register__trend' },
        ];

        return list.concat(this.isCompareMode ? compareTrendList : singleTrendList);
      }
    }
  }

  /**
   * 選擇趨勢圖日期範圍
   * @param e {[number, number]}-指定的日期範圍選項
   */
  selectTrend(e: [number, number]) {
    const [typeIndex, itemIndex] = e;
    this.trendTableDisplayStatus.removeAllStatus();
    typeIndex === OperationTrendType.singleTrend
      ? this.getSingleTrendData(itemIndex)
      : this.getCompareTrendData(itemIndex);
    this.getReportTrend();
  }

  /**
   * 取得單一趨勢數據
   * @param id {number}-趨勢範圍編號
   */
  getSingleTrendData(id: SingleTrendRange) {
    this.isCompareMode = false;
    this.sectionIndexList = this.getSectionIndexList();
    switch (id) {
      case SingleTrendRange.unlimit:
        this.postInfo.startDate = dayjs('2018', 'YYYY').startOf('year').valueOf();
        this.postInfo.endDate = dayjs().endOf('year').valueOf();
        this.postInfo.dateUnit = PostDateUnit.month;
        this.trendChartUnit = DateUnit.year;
        break;
      case SingleTrendRange.nearlyFiveYears:
        this.postInfo.startDate = dayjs().subtract(4, 'year').startOf('year').valueOf();
        this.postInfo.endDate = dayjs().endOf('year').valueOf();
        this.postInfo.dateUnit = PostDateUnit.month;
        this.trendChartUnit = DateUnit.year;
        break;
      case SingleTrendRange.nearlyTwoYears:
        this.postInfo.startDate = dayjs().subtract(23, 'month').startOf('month').valueOf();
        this.postInfo.endDate = dayjs().endOf('month').valueOf();
        this.postInfo.dateUnit = PostDateUnit.month;
        this.trendChartUnit = DateUnit.month;
        break;
      case SingleTrendRange.nearlyOneYear:
        this.postInfo.startDate = dayjs().subtract(11, 'month').startOf('month').valueOf();
        this.postInfo.endDate = dayjs().endOf('month').valueOf();
        this.postInfo.dateUnit = PostDateUnit.month;
        this.trendChartUnit = DateUnit.month;
        break;
      case SingleTrendRange.nearlyOneSeason:
        this.postInfo.startDate = dayjs().subtract(89, 'day').startOf('isoWeek').valueOf();
        this.postInfo.endDate = dayjs().endOf('isoWeek').valueOf();
        this.postInfo.dateUnit = PostDateUnit.week;
        this.trendChartUnit = DateUnit.week;
        break;
    }
  }

  /**
   * 取得比較趨勢數據
   * @param id {number}-趨勢範圍編號
   */
  getCompareTrendData(id: CompareTrendRange) {
    this.isCompareMode = true;
    this.sectionIndexList = this.getSectionIndexList();
    switch (id) {
      case CompareTrendRange.nearlyTwoYears: {
        this.postInfo.startDate = dayjs().subtract(1, 'year').startOf('year').valueOf();
        this.postInfo.endDate = dayjs().endOf('year').valueOf();
        this.postInfo.dateUnit = PostDateUnit.month;
        this.trendChartUnit = DateUnit.month;
        break;
      }
      case CompareTrendRange.nearlyTwoSeasons: {
        const startDayjs = dayjs().subtract(1, 'quarter');
        this.postInfo.startDate = this.getWeekFirstDayByDate(startDayjs, 'quarter');
        this.postInfo.endDate = dayjs().endOf('quarter').endOf('isoWeek').valueOf();
        this.postInfo.dateUnit = PostDateUnit.week;
        this.trendChartUnit = DateUnit.week;
        break;
      }
      case CompareTrendRange.nearlyTwoMonths: {
        const startDayjs = dayjs().subtract(1, 'month');
        this.postInfo.startDate = this.getWeekFirstDayByDate(startDayjs, 'month');
        this.postInfo.endDate = dayjs().endOf('month').endOf('isoWeek').valueOf();
        this.postInfo.dateUnit = PostDateUnit.week;
        this.trendChartUnit = DateUnit.week;
        break;
      }
      case CompareTrendRange.lastTwoYears: {
        const baseDayjsObj = dayjs().subtract(2, 'year').startOf('year');
        this.postInfo.startDate = baseDayjsObj.valueOf();
        this.postInfo.endDate = baseDayjsObj.add(1, 'year').endOf('year').valueOf();
        this.postInfo.dateUnit = PostDateUnit.month;
        this.trendChartUnit = DateUnit.month;
        break;
      }
      case CompareTrendRange.lastTwoSeasons: {
        const baseDayjsObj = dayjs().subtract(1, 'quarter');
        const startDayjs = baseDayjsObj.subtract(1, 'quarter');
        this.postInfo.startDate = this.getWeekFirstDayByDate(startDayjs, 'quarter');
        this.postInfo.endDate = baseDayjsObj.endOf('quarter').endOf('isoWeek').valueOf();
        this.postInfo.dateUnit = PostDateUnit.week;
        this.trendChartUnit = DateUnit.week;
        break;
      }
      case CompareTrendRange.lastTwoMonths: {
        const baseDayjsObj = dayjs().subtract(1, 'month');
        const startDayjs = baseDayjsObj.subtract(1, 'month');
        this.postInfo.startDate = this.getWeekFirstDayByDate(startDayjs, 'month');
        this.postInfo.endDate = baseDayjsObj.endOf('month').endOf('isoWeek').valueOf();
        this.postInfo.dateUnit = PostDateUnit.week;
        this.trendChartUnit = DateUnit.week;
        break;
      }
    }
  }

  /**
   * 取得指定日期範圍的第一週星期一
   * @param dayjsObj {Dayjs}-dayjs物件
   * @param unit {any}-日期範圍單位
   */
  getWeekFirstDayByDate(dayjsObj: Dayjs, unit: any): number {
    const startUnitDayjs = dayjsObj.startOf(unit);
    const dayInWeek = startUnitDayjs.isoWeekday();
    let shiftDay: number;
    switch (dayInWeek) {
      case 0:
        shiftDay = 1;
        break;
      case 1:
        shiftDay = 0;
        break;
      default:
        shiftDay = 8 - dayInWeek;
        break;
    }

    return startUnitDayjs.add(shiftDay, 'day').valueOf();
  }

  /**
   * 取得裝置趨勢圖表格直行標頭
   * @param deviceCode {Array<string>}-裝置代號
   */
  getDeviceColumnHeader(deviceCode: Array<string>) {
    const result = [];
    deviceCode.forEach((_name) => {
      const _code = _name.split('d')[1];
      result.push(
        ...[
          getDevicTypeInfo(_code, 'key'),
          `${this.translate.instant('universal_group_growth')}(%)`,
        ]
      );
    });

    return result;
  }

  /**
   * 取得趨勢圖表格數據
   * @param currentData {Array<number>}-目前遞迴的數據
   * @param prevData {Array<number>}-上一個遞迴的數據
   */
  getTableData(currentData: Array<number>, prevData: Array<number>) {
    const result = [];
    currentData.forEach((_currentData, _index) => {
      const _prevData = prevData ? prevData[_index] : 0;
      const increasePercentage = this.countIncreaseRatio(_currentData, _prevData, 1);
      result.push(_currentData);
      result.push(increasePercentage);
    });

    return result;
  }

  /**
   * 將頁面捲動至指定標題區塊位置
   * @param elementId {string}-頁面區塊id
   */
  scrollToTitle(elementId: string) {
    const mainBodyEle = document.querySelector('.main__container') as Element;
    const targetElement = document.getElementById(elementId);
    if (targetElement) {
      const top = targetElement.offsetTop - 80;
      mainBodyEle.scrollTo({ top, behavior: 'smooth' });
    }
  }

  /**
   * 切換數據列表顯示與否
   * @param type 列表類別
   * @param key 狀態鍵名
   */
  toggleTableDisplayStatus(type: 'overview' | 'trend', key: string) {
    switch (type) {
      case 'overview':
        this.overviewTableDisplayStatus.toggleStatus(key);
        break;
      default:
        this.trendTableDisplayStatus.toggleStatus(key);
        break;
    }
  }
}
