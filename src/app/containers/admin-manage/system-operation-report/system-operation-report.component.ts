import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api41xxService, AuthService } from '../../../core/services';
import { SystemAnalysisType } from '../../../core/enums/api/api-41xx.enum';
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
} from '../../../components';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OperationTableOption } from '../../../core/models/compo';
import { OperationDataType } from '../../../core/enums/compo';
import {
  groupPlanCodeConvert,
  groupOverViewConvert,
  getSportsTypeKey,
  assignSportsTypeColor,
  ageCodeConvert,
  getDevicTypeInfo,
} from '../../../core/utils';
import { genderColor } from '../../../core/models/represent-color';

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

  creationTime: string = this.getCurrentTime();
  operationInfo: Api4101Response;
  operationTrend: Api4102Response;
  overviewData: any;
  trendData: any;

  readonly SystemAnalysisType = SystemAnalysisType;

  constructor(
    private api41xxService: Api41xxService,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.getReportInfo();
  }

  /**
   * 串接api 4101-4102獲取頁面所需資訊
   */
  getReportInfo() {
    if (this.progress === 100) {
      this.progress = 30;
      combineLatest([this.getOperationInfo(), this.getOperationTrend()]).subscribe((resArray) => {
        [this.operationInfo, this.operationTrend] = resArray as [Api4101Response, Api4102Response];
        console.log('api4101', this.operationInfo, '\n', 'api4102', this.operationTrend);
        this.overviewData = this.handleOverviewChartData(this.operationInfo);
        this.creationTime = this.getCurrentTime();
        this.progress = 100;
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
   * @param data {any}-api 4101 res
   */
  handleTrendChartData(data: any) {}

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
}
