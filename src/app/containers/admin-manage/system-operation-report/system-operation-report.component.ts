import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api41xxService, AuthService } from '../../../core/services';
import { SystemAnalysisType } from '../../../core/enums/api';
import { combineLatest } from 'rxjs';
import {
  Api4101Post,
  Api4101Response,
  Api4102Post,
  Api4102Response,
} from '../../../core/models/api/api-41xx';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import {
  LoadingBarComponent,
  CategoryColumnChartComponent,
  OperationDataTableComponent,
  PieChartComponent,
  SingleDropListComponent,
} from '../../../components';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OperationTableOption, SingleLayerList, ListItem } from '../../../core/models/compo';
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
} from '../../../core/utils';
import { genderColor } from '../../../core/models/represent-color';
import { DateUnit } from '../../../core/enums/common';
import { operationTrendColor } from '../../../shared/models/chart-data';

dayjs.extend(isoWeek);

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
  ],
})
export class SystemOperationReportComponent implements OnInit {
  /**
   * 頁面載入進度
   */
  progress = 100;

  /**
   * api 4101-4102 post 所需參數
   */
  postInfo = {
    token: this.authService.token,
    type: SystemAnalysisType.group,
    startDate: dayjs().startOf('isoWeek').diff(1, 'week').valueOf(),
    endDate: dayjs().endOf('isoWeek').diff(1, 'week').valueOf(),
    dateUnit: 1, // 1. 週 2. 月
    get api4101Post(): Api4101Post {
      const { token, type } = this;
      return { token, type };
    },
    get api4102Post(): Api4102Post {
      const { token, type, startDate, endDate, dateUnit } = this;
      return { token, type, startDate, endDate, dateUnit };
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
      id: OperationTrendType.singleTrend,
      list: [
        { textKey: '近2年', id: CompareTrendRange.nearlyTwoYears },
        { textKey: '近2季', id: CompareTrendRange.nearlyTwoSeasons },
        { textKey: '近2月', id: CompareTrendRange.nearlyTwoMonths },
      ],
    },
  ];

  creationTime: string = this.getCurrentTime();
  operationInfo: Api4101Response;
  operationTrend: Api4102Response;
  overviewData: any;
  trendData: any;
  isCompareMode = false;
  trendChartUnit = DateUnit.month;

  readonly SystemAnalysisType = SystemAnalysisType;
  readonly SingleTrendRange = SingleTrendRange;
  readonly OperationTrendType = OperationTrendType;

  constructor(
    private api41xxService: Api41xxService,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.getReportInfo();
  }

  /**
   * 串接api 4101獲取頁面所需資訊
   */
  getReportInfo() {
    if (this.progress === 100) {
      this.progress = 30;
      this.getOperationInfo().subscribe((res) => {
        this.operationInfo = res as Api4101Response;
        console.log('api4101', this.operationInfo);
        this.overviewData = this.handleOverviewChartData(this.operationInfo);
        this.creationTime = this.getCurrentTime();
        this.progress = 100;
      });
    }
  }

  /**
   * 串接api 4102獲取頁面所需資訊
   */
  getReportTrend() {
    this.getOperationTrend().subscribe((res) => {
      this.operationTrend = res as Api4102Response;
      console.log('api4102', this.operationTrend);
      this.trendData = this.handleTrendChartData(this.operationTrend);
    });
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
        return isCompareMode
          ? this.handleCompareMemberTrend(data)
          : this.handleSingleMemberTrend(data);
      }
      case SystemAnalysisType.device: {
        return isCompareMode
          ? this.handleCompareDeviceTrend(data)
          : this.handleSingleDeviceTrend(data);
      }
    }
  }

  /**
   * 合併同一年度範圍的f群組數據
   * @param data {any}-api 4102 res
   */
  mergeSameYearGroupData(data: any) {
    const {
      timeRange: { fieldValue: rangeValue },
      groupCountsAnalysis: { fieldValue: dataValue },
    } = data;
    const mergeRangeValue = [];
    const mergeDataValue = [];
    rangeValue.forEach((_rangeValue, _rangeIndex) => {
      const _year = _rangeValue.slice(0, 4);
      const mergeLastIndex = mergeDataValue.length - 1;
      if (_year === mergeRangeValue[mergeLastIndex]) {
        mergeDataValue[mergeLastIndex] = mergeDataValue[mergeLastIndex].map(
          (_value, _dataIndex) => {
            return _value + dataValue[_dataIndex];
          }
        );
      } else {
        mergeRangeValue.push(_year);
        mergeDataValue.push(dataValue[_rangeIndex]);
      }
    });
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
      data: [[], []],
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
      ageAnalysisChartData.data[0].push({
        name: this.translate.instant(_translateKey),
        y: _maleCount,
        color: genderColor.male,
      });
      ageAnalysisChartData.data[1].push({
        name: this.translate.instant(_translateKey),
        y: _femaleCount,
        color: genderColor.female,
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
      data: [['運動類別', 'universal_userProfile_male', 'universal_userProfile_female', '總人數']],
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
    console.log('handleSingleGroupTrend', data);
    const { operationTrend, trendChartUnit } = this;
    const { groupCountsAnalysis, timeRange } = operationTrend.trend;
    const { fieldValue: rangeValue } = timeRange;
    const { fieldName: analysisName, fieldValue: analysisValue } = groupCountsAnalysis;
    const groupTrendChartData = this.getTrendChartModel(analysisName);
    console.log('groupTrendChartData', groupTrendChartData);
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
    console.log('SingleGroupTrend', groupTrendChartData, groupTrendTableData);
    return { groupTrendChartData, groupTrendTableData };
  }

  /**
   * 處理會員相關單一趨勢數據
   * @param data {any}-api 4102 res 合併過後的數據
   */
  handleSingleMemberTrend(data: any) {}

  /**
   * 處理裝置相關單一趨勢數據
   * @param data {any}-api 4102 res 合併過後的數據
   */
  handleSingleDeviceTrend(data: any) {}

  /**
   * 處理群組相關比較趨勢圖表數據
   * @param data {any}-api 4102 res 合併過後的數據
   */
  handleCompareGroupTrend(data: any) {}

  /**
   * 處理會員相關比較趨勢數據
   * @param data {any}-api 4102 res 合併過後的數據
   */
  handleCompareMemberTrend(data: any) {}

  /**
   * 處理裝置相關比較趨勢數據
   * @param data {any}-api 4102 res 合併過後的數據
   */
  handleCompareDeviceTrend(data: any) {}

  /**
   * 將fieldName轉為物件供圖表數據整合用
   * @param fieldName {Array<string>}-api 數據類別名稱
   */
  getTrendChartModel(fieldName: Array<string>) {
    const obj: {
      [key: string]: {
        chartData: Array<{ data: Array<any>; color: string }>;
        seriesName: Array<string>;
      };
    } = {};
    fieldName.forEach(
      (_name) =>
        (obj[_name] = {
          chartData: [{ data: [], color: 'rgba(124, 181, 236, 1)' }],
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
   * @param range {string}-日期範圍字串
   */
  getDateRangeTimestamp(range: string) {
    const { trendChartUnit } = this;
    switch (trendChartUnit) {
      case DateUnit.year: {
        const dayjsObj = dayjs(range, 'YYYY');
        return {
          startDate: dayjsObj.startOf('year').valueOf(),
          endDate: dayjsObj.endOf('year').valueOf(),
        };
      }
      case DateUnit.month: {
        const dayjsObj = dayjs(range, 'YYYYMM');
        return {
          startDate: dayjsObj.startOf('month').valueOf(),
          endDate: dayjsObj.endOf('month').valueOf(),
        };
      }
      case DateUnit.week: {
        const dayjsObj = dayjs(range, 'YYYYMM');
        return {
          startDate: dayjsObj.startOf('month').valueOf(),
          endDate: dayjsObj.endOf('month').valueOf(),
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
        this.getReportInfo();
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
   * 選擇趨勢圖日期範圍
   * @param e {[number, number]}-指定的日期範圍選項
   */
  selectTrend(e: [number, number]) {
    console.log('selectTrend', e);
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
    switch (id) {
      case SingleTrendRange.unlimit:
        this.postInfo.startDate = dayjs('2018', 'YYYY').startOf('year').valueOf();
        this.postInfo.endDate = dayjs().endOf('year').valueOf();
        this.postInfo.dateUnit = 2;
        this.trendChartUnit = DateUnit.year;
        break;
      case SingleTrendRange.nearlyFiveYears:
        this.postInfo.startDate = dayjs().subtract(4, 'year').startOf('year').valueOf();
        this.postInfo.endDate = dayjs().endOf('year').valueOf();
        this.postInfo.dateUnit = 2;
        this.trendChartUnit = DateUnit.year;
        break;
      case SingleTrendRange.nearlyTwoYears:
        this.postInfo.startDate = dayjs().subtract(23, 'month').startOf('month').valueOf();
        this.postInfo.endDate = dayjs().endOf('month').valueOf();
        this.postInfo.dateUnit = 2;
        this.trendChartUnit = DateUnit.month;
        break;
      case SingleTrendRange.nearlyOneYear:
        this.postInfo.startDate = dayjs().subtract(11, 'month').startOf('month').valueOf();
        this.postInfo.endDate = dayjs().endOf('month').valueOf();
        this.postInfo.dateUnit = 2;
        this.trendChartUnit = DateUnit.month;
        break;
      case SingleTrendRange.nearlyOneSeason:
        this.postInfo.startDate = dayjs().subtract(89, 'day').startOf('isoWeek').valueOf();
        this.postInfo.endDate = dayjs().endOf('isoWeek').valueOf();
        this.postInfo.dateUnit = 1;
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
    switch (id) {
      case CompareTrendRange.nearlyTwoYears:
        this.postInfo.startDate = dayjs().subtract(23, 'month').startOf('month').valueOf();
        this.postInfo.endDate = dayjs().endOf('month').valueOf();
        this.postInfo.dateUnit = 2;
        this.trendChartUnit = DateUnit.month;
        break;
      case CompareTrendRange.nearlyTwoSeasons:
        this.postInfo.startDate = dayjs().subtract(1, 'quarter').startOf('quarter').valueOf();
        this.postInfo.endDate = dayjs().endOf('quarter').valueOf();
        this.postInfo.dateUnit = 1;
        this.trendChartUnit = DateUnit.week;
        break;
      case CompareTrendRange.nearlyTwoMonths:
        this.postInfo.startDate = dayjs().subtract(1, 'month').startOf('month').valueOf();
        this.postInfo.endDate = dayjs().endOf('month').valueOf();
        this.postInfo.dateUnit = 1;
        this.trendChartUnit = DateUnit.week;
        break;
    }
  }
}
