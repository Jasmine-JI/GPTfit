import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api41xxService, AuthService } from '../../../core/services';
import { SystemAnalysisType } from '../../../core/enums/api';
import { Observable } from 'rxjs';
import {
  Api4101Post,
  Api4101Response,
  Api4102Post,
  Api4102Response,
} from '../../../core/models/api/api-41xx';
import dayjs from 'dayjs';
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
  ageCodeConvert,
  getDevicTypeInfo,
  countPercentage,
  deepCopy,
  changeOpacity,
  getMonthKey,
  translateSportsCode,
} from '../../../core/utils';
import { genderColor } from '../../../core/models/represent-color';
import { DateUnit } from '../../../core/enums/common';
import { operationTrendColor, sportTypeColor } from '../../../shared/models/chart-data';
import { TimeFormatPipe } from '../../../core/pipes';

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
  };

  trendList: Array<SingleLayerList> = [
    {
      titleKey: '單一趨勢',
      id: OperationTrendType.singleTrend,
      list: [
        { textKey: '2018年～', id: SingleTrendRange.unlimit },
        { textKey: '近5年', id: SingleTrendRange.nearlyFiveYears },
        { textKey: '近3年', id: SingleTrendRange.nearlyTwoYears },
        { textKey: '近1年', id: SingleTrendRange.nearlyOneYear },
        { textKey: '近1季', id: SingleTrendRange.nearlyOneSeason },
      ],
    },
    {
      titleKey: '比較趨勢',
      id: OperationTrendType.compareTrend,
      list: [
        { textKey: '近2年', id: CompareTrendRange.nearlyTwoYears },
        { textKey: '近2季', id: CompareTrendRange.nearlyTwoSeasons },
        { textKey: '近2月', id: CompareTrendRange.nearlyTwoMonths },
        { textKey: '過去2年', id: CompareTrendRange.lastTwoYears },
        { textKey: '過去2季', id: CompareTrendRange.lastTwoSeasons },
        { textKey: '過去2月', id: CompareTrendRange.lastTwoMonths },
      ],
    },
  ];

  allRefresh = false;
  creationTime: string = this.getCurrentTime();
  operationInfo: Api4101Response;
  operationTrend: Api4102Response;
  overviewData: any;
  trendData: any;
  isCompareMode = false;
  trendChartUnit = DateUnit.month;
  sectionIndexList: Array<IndexInfo> = [];

  readonly SystemAnalysisType = SystemAnalysisType;
  readonly SingleTrendRange = SingleTrendRange;
  readonly OperationTrendType = OperationTrendType;

  constructor(
    private api41xxService: Api41xxService,
    private authService: AuthService,
    private translate: TranslateService
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
        this.operationTrend = res as Api4102Response;
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
   * 處理趨勢分析圖表數據
   * @param data {any}-api 4102 res
   */
  handleTrendChartData(data: any) {
    const {
      postInfo: { type },
      isCompareMode,
    } = this;
    const { trendChartUnit } = this;
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
      if (mergeRangeValue[mergeLastIndex] && _year === mergeRangeValue[mergeLastIndex][0]) {
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
      data: [['運動類別', '開課數量', '課程檔案數']],
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
      const _translateKey = ageCodeConvert(_ageFieldName);
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
    const sportsTypeTableData = {
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
      data: [
        ['運動類別', 'universal_userProfile_male', 'universal_userProfile_female', '總檔案數'],
      ],
    };

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
    return { maleSportsTypeChartData, femaleSportsTypeChartData, sportsTypeTableData };
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
        groupTrendChartData[_fieldName].chartData[0].data.push({
          name: this.getXAxisName(trendChartUnit, dateRange.startDate),
          y: dataValue,
        });

        const trendTableRowHeader = this.getTrendTableRowHeader(dateRange.startDate);
        if (!groupTrendTableData[_fieldName]) {
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
              [`日期範圍(${this.getDateUnitString()})`, dataName, '增長(%)'],
              [trendTableRowHeader, dataValue, '0'],
            ],
          };
        } else {
          const prevValue = analysisValue[_dateIndex - 1][_nameIndex];
          groupTrendTableData[_fieldName].data.push([
            trendTableRowHeader,
            dataValue,
            `${countPercentage(dataValue - prevValue, prevValue, 1)}`,
          ]);
        }
      });
    });

    return { groupTrendChartData, groupTrendTableData };
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
          `日期範圍(${this.getDateUnitString()})`,
          maleTranslateKey,
          '男性增長(%)',
          femaleTranslateKey,
          '女性增長(%)',
        ],
      ],
    };

    let malePrevTotal = 0;
    let femalePrevTotal = 0;
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
              [`日期範圍(${this.getDateUnitString()})`, dataName, '增長(%)'],
              [trendTableRowHeader, dataValue, '0'],
            ],
          };
        } else {
          const prevValue = memberAnalysisValue[_dateIndex - 1][_nameIndex];
          memberTrendTableData[_fieldName].data.push([
            trendTableRowHeader,
            dataValue,
            `${countPercentage(dataValue - prevValue, prevValue, 1)}`,
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
        `${countPercentage(maleFileTotal - malePrevTotal, malePrevTotal, 1)}`,
        femaleFileTotal,
        `${countPercentage(femaleFileTotal - femalePrevTotal, femalePrevTotal, 1)}`,
      ]);

      malePrevTotal = maleFileTotal;
      femalePrevTotal = femaleFileTotal;
    });

    return { memberTrendChartData, memberTrendTableData };
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
        const _newerValue = newerValue[i] ? newerValue[i][_nameIndex] : null;
        olderTotalValueObj[_fieldName] = (olderTotalValueObj[_fieldName] ?? 0) + (_olderValue ?? 0);
        newerTotalValueObj[_fieldName] = (newerTotalValueObj[_fieldName] ?? 0) + (_newerValue ?? 0);

        const trendTableRowHeader = this.translate.instant(this.getCompareRowHeader(i));
        groupTrendChartData[_fieldName].chartData[0].data.push({
          name: trendTableRowHeader,
          y: _olderValue ?? 0,
        });

        groupTrendChartData[_fieldName].chartData[1].data.push({
          name: trendTableRowHeader,
          y: _newerValue ?? 0,
        });

        if (!groupTrendTableData[_fieldName]) {
          const _mainColor = operationTrendColor[_nameIndex];
          groupTrendChartData[_fieldName].chartData[0].color = changeOpacity(_mainColor, 0.7);
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
                OperationDataType.normal,
                OperationDataType.normal,
                OperationDataType.normal,
                OperationDataType.normal,
              ],
            },
            data: [
              [`單位日期`, olderColumnHeader, newerColumnHeader, '增長(%)'],
              [trendTableRowHeader, _olderValue, _newerValue, '0'],
            ],
          };
        } else {
          groupTrendTableData[_fieldName].data.push([
            trendTableRowHeader,
            _olderValue ?? '-',
            _newerValue ?? '-',
            `${countPercentage(_newerValue - _olderValue, _olderValue, 1)}`,
          ]);
        }

        if (i === finalLength - 1) {
          const olderTotalValue = olderTotalValueObj[_fieldName];
          const newerTotalValue = newerTotalValueObj[_fieldName];
          groupTrendTableData[_fieldName].data.push([
            'universal_adjective_total',
            olderTotalValue,
            newerTotalValue,
            `${countPercentage(newerTotalValue - olderTotalValue, olderTotalValue, 1)}`,
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
   * 根據數據序列取得比較表格列標頭
   * @param index {number}-數據序列
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
   * 取得根據範圍日期顯示單位將數據切分兩個時期的切分序列
   * @param rangeValue {Array<Array<string>>}-報告日期清單
   */
  getSplitIndex(rangeValue: Array<Array<string>>) {
    const { trendChartUnit } = this;
    return rangeValue.findIndex((_range, _index) => {
      if (_index === 0) return false;
      const _previousIndex = _index - 1;
      const _currentYear = _range[0].toString().slice(0, 4);
      const _previousYear = rangeValue[_previousIndex][0].toString().slice(0, 4);
      switch (trendChartUnit) {
        case DateUnit.month:
          return _currentYear !== _previousYear;
        default: {
          const _currentWeek = _range[0].toString().slice(4, 6);
          const _currentDayjs = dayjs(_currentYear, 'YYYY')
            .endOf('year')
            .isoWeek(+_currentWeek)
            .endOf('isoWeek');
          const _previousWeek = rangeValue[_previousIndex][0].toString().slice(4, 6);
          const _previousDayjs = dayjs(_previousYear, 'YYYY')
            .endOf('year')
            .isoWeek(+_previousWeek)
            .endOf('isoWeek');
          if (rangeValue.length > 10) {
            // 代表兩季相比較
            const _currentSeason = _currentDayjs.quarter();
            const _previousSeason = _previousDayjs.quarter();
            return _currentSeason !== _previousSeason;
          } else {
            // 兩個月相比較
            const _currentMonth = _currentDayjs.month();
            const _previousMonth = _previousDayjs.month();
            return _currentMonth !== _previousMonth;
          }
        }
      }
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
          const _mainColor = isMemberAnalysis
            ? operationTrendColor[_nameIndex]
            : sportTypeColor[_typeIndex];
          memberTrendChartData[_fieldName].chartData[0].color = changeOpacity(_mainColor, 0.7);
          memberTrendChartData[_fieldName].chartData[1].color = _mainColor;
          const isSeasonData = finalLength > 6;
          const olderColumnHeader = this.getCompareColumnHeader(
            _olderRange.startDate,
            isSeasonData
          );
          const newerColumnHeader = this.getCompareColumnHeader(
            _newerRange.startDate,
            isSeasonData
          );

          memberTrendChartData[_fieldName].seriesName = [olderColumnHeader, newerColumnHeader];
          memberTrendTableData[_fieldName] = {
            option: {
              headerRowType: [
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
              ],
            },
            data: [
              [`單位日期`, olderColumnHeader, newerColumnHeader, '增長(%)'],
              [trendTableRowHeader, _olderValue, _newerValue, '0'],
            ],
          };
        } else {
          memberTrendTableData[_fieldName].data.push([
            trendTableRowHeader,
            _olderValue ?? '-',
            _newerValue ?? '-',
            `${countPercentage(_newerValue - _olderValue, _olderValue, 1)}`,
          ]);
        }

        if (i === finalLength - 1) {
          const olderTotalValue = olderTotalValueObj[_fieldName];
          const newerTotalValue = newerTotalValueObj[_fieldName];
          memberTrendTableData[_fieldName].data.push([
            'universal_adjective_total',
            olderTotalValue,
            newerTotalValue,
            `${countPercentage(newerTotalValue - olderTotalValue, olderTotalValue, 1)}`,
          ]);
        }
      });
    }

    return { memberTrendChartData, memberTrendTableData };
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
          const deviceCode = (_realIndex + 1).toString();
          const _mainColor = getDevicTypeInfo(deviceCode, 'color');
          deviceTrendChartData[_fieldName].chartData[0].color = changeOpacity(_mainColor, 0.7);
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
                OperationDataType.normal,
                OperationDataType.normal,
                OperationDataType.normal,
                OperationDataType.normal,
              ],
            },
            data: [
              [`單位日期`, olderColumnHeader, newerColumnHeader, '增長(%)'],
              [trendTableRowHeader, _olderValue, _newerValue, '0'],
            ],
          };
        } else {
          deviceTrendTableData[_fieldName].data.push([
            trendTableRowHeader,
            _olderValue ?? '-',
            _newerValue ?? '-',
            `${countPercentage(_newerValue - _olderValue, _olderValue, 1)}`,
          ]);
        }

        if (i === finalLength - 1) {
          const olderTotalValue = olderTotalValueObj[_fieldName];
          const newerTotalValue = newerTotalValueObj[_fieldName];
          deviceTrendTableData[_fieldName].data.push([
            'universal_adjective_total',
            olderTotalValue,
            newerTotalValue,
            `${countPercentage(newerTotalValue - olderTotalValue, olderTotalValue, 1)}`,
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
        return '課程部門數量';
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
   * 變更報告類型
   * @param type {SystemAnalysisType}-報告類型
   */
  chnageReportType(type: SystemAnalysisType) {
    if (this.progress === 100) {
      const { type: prevType } = this.postInfo;
      if (type !== prevType) {
        this.postInfo.type = type;
        this.allRefresh = true;
        this.getSingleTrendData(SingleTrendRange.nearlyOneYear);
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
          { indexLayer: 0, textKey: '總體分析圖表', elementId: 'overall__analysis__section' },
          { indexLayer: 1, textKey: '方案', elementId: 'plan__analysis' },
          { indexLayer: 1, textKey: '概要', elementId: 'summary__analysis' },
          { indexLayer: 1, textKey: '開課類別', elementId: 'teach__type__analysis' },
          { indexLayer: 0, textKey: '趨勢分析圖表', elementId: 'trend__chart__section' },
          { indexLayer: 1, textKey: '品牌企業數量', elementId: 'brand__counts__analysis' },
          { indexLayer: 1, textKey: '開課次數', elementId: 'teach__counts__analysis' },
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
          { indexLayer: 0, textKey: '總體分析圖表', elementId: 'overall__analysis__section' },
          { indexLayer: 1, textKey: '會員活躍度', elementId: 'active__analysis' },
          { indexLayer: 1, textKey: '會員年齡分佈', elementId: 'age__analysis' },
          { indexLayer: 1, textKey: '運動類別', elementId: 'sports__type__analysis' },
          { indexLayer: 0, textKey: '趨勢分析圖表', elementId: 'trend__chart__section' },
          { indexLayer: 1, textKey: '會員數', elementId: 'member__counts__analysis' },
        ];

        const singleTrendList = [
          { indexLayer: 1, textKey: '運動筆數', elementId: 'sports__count__analysis' },
          { indexLayer: 1, textKey: '運動類別', elementId: 'sports__type__trend' },
        ];

        const compareTrendList = [
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
          { indexLayer: 0, textKey: '總體分析圖表', elementId: 'overall__analysis__section' },
          { indexLayer: 1, textKey: '裝置類別', elementId: 'device__type__analysis' },
          { indexLayer: 0, textKey: '趨勢分析圖表', elementId: 'trend__chart__section' },
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
        this.postInfo.startDate = dayjs().subtract(1, 'quarter').startOf('quarter').valueOf();
        this.postInfo.endDate = dayjs().endOf('quarter').valueOf();
        this.postInfo.dateUnit = PostDateUnit.week;
        this.trendChartUnit = DateUnit.week;
        break;
      }
      case CompareTrendRange.nearlyTwoMonths: {
        this.postInfo.startDate = dayjs().subtract(1, 'month').startOf('month').valueOf();
        this.postInfo.endDate = dayjs().endOf('month').valueOf();
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
        this.postInfo.startDate = baseDayjsObj.subtract(1, 'quarter').startOf('quarter').valueOf();
        this.postInfo.endDate = baseDayjsObj.endOf('quarter').valueOf();
        this.postInfo.dateUnit = PostDateUnit.week;
        this.trendChartUnit = DateUnit.week;
        break;
      }
      case CompareTrendRange.lastTwoMonths: {
        const baseDayjsObj = dayjs().subtract(1, 'month');
        this.postInfo.startDate = baseDayjsObj.subtract(1, 'month').startOf('month').valueOf();
        this.postInfo.endDate = baseDayjsObj.endOf('month').valueOf();
        this.postInfo.dateUnit = PostDateUnit.week;
        this.trendChartUnit = DateUnit.week;
        break;
      }
    }
  }

  /**
   * 取得裝置趨勢圖表格直行標頭
   * @param deviceCode {Array<string>}-裝置代號
   */
  getDeviceColumnHeader(deviceCode: Array<string>) {
    const result = [];
    deviceCode.forEach((_name) => {
      const _code = _name.split('d')[1];
      result.push(...[getDevicTypeInfo(_code, 'key'), '增長(%)']);
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
      const increasePercentage = countPercentage(
        _currentData - _prevData,
        _prevData || Infinity,
        1
      );
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
}
