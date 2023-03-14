import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  Api41xxService,
  AuthService,
  HashIdService,
  CorrespondTranslateKeyService,
} from '../../../core/services';
import {
  Api4104Post,
  Api4104Response,
  MemberAnalysis,
  ClassTypeAnalysis,
  ClassTimeAnalysis,
  DeviceTypeAnalysis,
  ChildGroupAnalysis,
  Api4105Post,
  Api4105Response,
  TimeRange,
} from '../../../core/models/api/api-41xx';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { Subject, combineLatest, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProfessionalService } from '../services/professional.service';
import {
  displayGroupLevel,
  getSportsTypeKey,
  assignSportsTypeColor,
  mathRounding,
  getDevicTypeInfo,
  assignHslaColor,
  getNextLayerGroupLevelName,
  deepCopy,
} from '../../../core/utils';
import { GroupDetailInfo, UserSimpleInfo, GroupLevel } from '../../dashboard/models/group-detail';
import {
  LoadingBarComponent,
  CategoryColumnChartComponent,
  OperationDataTableComponent,
  PieChartComponent,
  SingleDropListComponent,
  AsideIndexBoxComponent,
  LineColumnCompareChartComponent,
} from '../../../components';
import { TimeFormatPipe, SportTypeIconPipe } from '../../../core/pipes';
import {
  OperationDataType,
  OperationTrendType,
  SingleTrendRange,
  CompareTrendRange,
} from '../../../core/enums/compo';
import {
  OperationTableOption,
  SingleLayerList,
  IndexInfo,
  TableStyleOption,
} from '../../../core/models/compo';
import { DateUnit } from '../../../core/enums/common';
import { genderColor, classTimeColor } from '../../../core/models/represent-color';
import { AnalysisCount } from '../../../core/classes';

dayjs.extend(isoWeek);

/**
 * 用於api 4104 和 4105 post 的時間範圍單位
 */
enum PostDateUnit {
  day = 1,
  week,
  month,
}

@Component({
  selector: 'app-group-analysis-report',
  templateUrl: './group-analysis-report.component.html',
  styleUrls: ['./group-analysis-report.component.scss'],
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
    LineColumnCompareChartComponent,
  ],
  providers: [SportTypeIconPipe],
})
export class GroupAnalysisReportComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  readonly OperationTrendType = OperationTrendType;
  readonly SingleTrendRange = SingleTrendRange;
  readonly GroupLevel = GroupLevel;

  /**
   * 資料最後更新時間
   */
  lastUpdateTime$: Observable<any>;

  creationTime: string = this.getCurrentTime();

  post = {
    token: this.authService.token,
    groupId: '',
    startDate: dayjs().startOf('isoWeek').subtract(1, 'week').valueOf(),
    endDate: dayjs().endOf('isoWeek').subtract(1, 'week').valueOf(),
    dateUnit: 1,
    groupLevel: GroupLevel.class,
    get api4104Post(): Api4104Post {
      const { token, groupId, groupLevel } = this;
      return { token, groupId, groupLevel };
    },
    get api4105Post(): Api4105Post {
      const { token, groupId, startDate, endDate, dateUnit, groupLevel } = this;
      return {
        token,
        groupId,
        groupLevel,
        startDate: dayjs(startDate).unix(),
        endDate: dayjs(endDate).unix(),
        dateUnit,
      };
    },
  };

  analysisInfo: Api4104Response;
  analysisTrend: Api4105Response;

  /**
   * 此群組相關資訊
   */
  groupInfo = <GroupDetailInfo>{};

  /**
   * 使用者個人資訊（含權限）
   */
  userSimpleInfo: UserSimpleInfo;

  /**
   * 是否為比較模式
   */
  isCompareMode = false;

  trendChartUnit = DateUnit.month;

  /**
   * 比較趨勢分析時間範圍清單
   */
  trendList: Array<SingleLayerList> = [
    {
      titleKey: '單一趨勢',
      id: OperationTrendType.singleTrend,
      list: [
        { textKey: '2018～', id: SingleTrendRange.unlimit },
        { textKey: '近5年', id: SingleTrendRange.nearlyFiveYears },
        { textKey: '近3年', id: SingleTrendRange.nearlyTwoYears },
        { textKey: '近1年', id: SingleTrendRange.nearlyOneYear },
        { textKey: '近1季', id: SingleTrendRange.nearlyOneSeason },
        { textKey: '近1月', id: SingleTrendRange.nearlyOneMonth },
      ],
    },
    /**
    {
      titleKey: '比較趨勢',
      id: OperationTrendType.compareTrend,
      list: [
        { textKey: '近2年', id: CompareTrendRange.nearlyTwoYears },
        { textKey: '近2季', id: CompareTrendRange.nearlyTwoSeasons },
        { textKey: '近2月', id: CompareTrendRange.nearlyTwoMonths },
        { textKey: '近2週', id: CompareTrendRange.nearlyTwoWeeks },
        { textKey: '過去2年', id: CompareTrendRange.lastTwoYears },
        { textKey: '過去2季', id: CompareTrendRange.lastTwoSeasons },
        { textKey: '過去2月', id: CompareTrendRange.lastTwoMonths },
        { textKey: '過去2週', id: CompareTrendRange.lastTwoWeeks },
      ],
    },
     */
  ];

  overviewData: any;
  operationTrend: any;

  constructor(
    private api41xxService: Api41xxService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private hashIdService: HashIdService,
    private professionalService: ProfessionalService,
    private translate: TranslateService,
    private sportTypeIconPipe: SportTypeIconPipe,
    private correspondTranslateKeyService: CorrespondTranslateKeyService
  ) {}

  ngOnInit(): void {
    this.getGroupInfo();
  }

  /**
   * 取得現在時間
   */
  getCurrentTime() {
    return dayjs().format('YYYY-MM-DD HH:mm');
  }

  /**
   * 取得群組資訊
   */
  getGroupInfo() {
    combineLatest([
      this.professionalService.getRxGroupDetail(),
      this.professionalService.getRxCommerceInfo(),
      this.professionalService.getUserSimpleInfo(),
    ])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((resArr) => {
        const [groupDetail, commerceInfo, userSimpleInfo] = resArr;
        const { groupId } = groupDetail;
        const groupLevel = displayGroupLevel(groupId);
        Object.assign(groupDetail, { groupLevel });
        Object.assign(groupDetail, { expired: commerceInfo.expired });
        Object.assign(groupDetail, { commerceStatus: commerceInfo.commerceStatus });
        this.groupInfo = groupDetail;
        this.userSimpleInfo = userSimpleInfo;
        Object.assign(this.post, { groupId, groupLevel });
        this.getAnalysisInfo();
        this.getDataUpdateTime();
      });
  }

  /**
   * 取得群組營運分析概要
   */
  getAnalysisInfo() {
    this.api41xxService.fetchGetGroupOperationDetail(this.post.api4104Post).subscribe((res) => {
      this.analysisInfo = res;
      this.overviewData = this.handleOverviewChartData(this.analysisInfo);
      this.creationTime = this.getCurrentTime();
    });
  }

  /**
   * 處理總體概要圖表與列表資料
   * @param data {Api4104Response}- api 4104 回覆的資訊
   */
  handleOverviewChartData(data: Api4104Response) {
    const {
      memberAnalysis,
      classTypeAnalysis,
      classTimeAnalysis,
      deviceTypeAnalysis,
      childGroupAnalysis,
      baseCounts: { totalTeachCounts },
    } = data.info;

    return {
      ...this.handleMemerAnalysis(memberAnalysis),
      ...this.handleClassTypeAnalysis(classTypeAnalysis),
      ...this.handleClassTimeAnalysis(classTimeAnalysis),
      ...this.handleDeviceTypeAnalysis(deviceTypeAnalysis, totalTeachCounts),
      ...this.handleChildGroupAnalysis(childGroupAnalysis),
    };
  }

  /**
   * 處理群組學員總體分析圖表數據
   * @param data {MemberAnalysis}-群組學員分析
   */
  handleMemerAnalysis(data: MemberAnalysis) {
    const { ageFieldName, maleFieldValue, femaleFieldValue } = data;
    const ageAnalysisChartData = {
      data: [
        { data: <any>[], color: genderColor.male },
        { data: <any>[], color: genderColor.female },
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
      data: <Array<unknown>>[
        [
          'universal_userProfile_age',
          'universal_userProfile_male',
          'universal_userProfile_female',
          'universal_activityData_totalPeople',
        ],
      ],
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
    return { ageAnalysisChartData, ageAnalysisTableData };
  }

  /**
   * 處理課程類別總體分析圖表數據
   * @param data {MemberAnalysis}-群組學員分析
   */
  handleClassTypeAnalysis(data: ClassTypeAnalysis) {
    const {
      typeFieldName,
      teachCountsFieldValue,
      maleAttendCountsFieldValue,
      femaleAttendCountsFieldValue,
    } = data;
    const totalAttendCountsFieldValue = maleAttendCountsFieldValue.map((_value, _index) => {
      return _value + femaleAttendCountsFieldValue[_index];
    });

    const typeTeachCountsPieChartData = this.getSportsTypePieChartData(
      typeFieldName,
      teachCountsFieldValue
    );

    const typeAttendCountsPieChartData = this.getSportsTypePieChartData(
      typeFieldName,
      totalAttendCountsFieldValue
    );

    const classTypeColumnChartData = {
      data: [
        { data: <any>[], color: genderColor.male },
        { data: <any>[], color: genderColor.female },
      ],
      seriesName: ['universal_userProfile_male', 'universal_userProfile_female'],
    };

    const classTypeAnalysisTableData = {
      option: <OperationTableOption>{
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
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
          OperationDataType.normal,
          OperationDataType.normal,
        ],
      },
      data: <Array<unknown>>[
        [
          '開課類別',
          '開課次數',
          '總上課人次',
          this.getAvgPersonCourseTranslate(),
          '男性上課人次',
          '女性上課人次',
        ],
      ],
    };

    typeFieldName.forEach((_typeCode, _index) => {
      const _translateKey = getSportsTypeKey(_typeCode);
      const _teachCount = teachCountsFieldValue[_index];
      const _maleCount = maleAttendCountsFieldValue[_index];
      const _femaleCount = femaleAttendCountsFieldValue[_index];
      const _totalCount = _maleCount + _femaleCount;
      const _avgAttendCount = mathRounding(_totalCount / (_teachCount || Infinity), 1);
      classTypeColumnChartData.data[0].data.push({
        name: this.translate.instant(_translateKey),
        y: _maleCount,
      });
      classTypeColumnChartData.data[1].data.push({
        name: this.translate.instant(_translateKey),
        y: _femaleCount,
      });
      classTypeAnalysisTableData.data.push([
        _translateKey,
        _teachCount,
        _totalCount,
        _avgAttendCount,
        _maleCount,
        _femaleCount,
      ]);
    });

    return {
      typeTeachCountsPieChartData,
      typeAttendCountsPieChartData,
      classTypeAnalysisTableData,
      classTypeColumnChartData,
    };
  }

  /**
   * 取得運動類別相關圓餅圖數據
   * @param fieldName {Array<string>}-數據類型名稱
   * @param fieldValue {Array<number>}-該類型數據
   */
  getSportsTypePieChartData(fieldName: Array<string>, fieldValue: Array<number>) {
    return fieldName.map((_typeCode, _index) => {
      const _translateKey = getSportsTypeKey(_typeCode);
      const sportsTypeName = this.translate.instant(_translateKey);
      return {
        name: sportsTypeName,
        y: fieldValue[_index],
        color: assignSportsTypeColor(_typeCode),
      };
    });
  }

  /**
   * 取得'平均人次/課'的翻譯
   */
  getAvgPersonCourseTranslate() {
    const agePersonTranslate = this.translate.instant('平均人次');
    const courseTranslate = this.translate.instant('universal_group_class');
    return `${agePersonTranslate}/${courseTranslate}`;
  }

  /**
   * 處理開課時間總體分析圖表數據
   * @param data {MemberAnalysis}-群組學員分析
   */
  handleClassTimeAnalysis(data: ClassTimeAnalysis) {
    const { typeFieldName, teachCountsFieldValue, attendCountsFieldValue } = data;
    const classTimeTeachCountsPieChartData = this.getTimeRangePieChartData(
      typeFieldName,
      teachCountsFieldValue
    );

    const classTimeAttendCountsPieChartData = this.getTimeRangePieChartData(
      typeFieldName,
      attendCountsFieldValue
    );

    const classTimeAnalysisTableData = {
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
      data: <Array<unknown>>[['開課時段', '開課次數', '上課人次', '平均人次']],
    };

    typeFieldName.forEach((_code, _index) => {
      const _translateKey = this.getClassTimeRangeKey(_code);
      const _teachCount = teachCountsFieldValue[_index];
      const _attendCount = attendCountsFieldValue[_index];
      const _avgCount = _teachCount ? mathRounding(_attendCount / _teachCount, 1) : '-';
      classTimeAnalysisTableData.data.push([_translateKey, _teachCount, _attendCount, _avgCount]);
    });

    return {
      classTimeTeachCountsPieChartData,
      classTimeAttendCountsPieChartData,
      classTimeAnalysisTableData,
    };
  }

  /**
   * 根據課程時間範圍代碼取得對應的翻譯鍵名
   * @param code {string}-課程時間範圍代碼
   */
  getClassTimeRangeKey(code: string) {
    switch (code) {
      case 't1':
        return 'T06-08';
      case 't2':
        return 'T08-10';
      case 't3':
        return 'T10-12';
      case 't4':
        return 'T12-14';
      case 't5':
        return 'T14-16';
      case 't6':
        return 'T16-18';
      case 't7':
        return 'T18-20';
      case 't8':
        return 'T20-22';
      default:
        return 'universal_vocabulary_other';
    }
  }

  /**
   * 取得各開課時段相關圓餅圖數據
   * @param fieldName {Array<string>}
   * @param fieldValue {Array<number>}
   */
  getTimeRangePieChartData(fieldName: Array<string>, fieldValue: Array<number>) {
    return fieldName.map((_code, _index) => {
      const _translateKey = this.getClassTimeRangeKey(_code);
      const _value = fieldValue[_index];
      return {
        name: this.translate.instant(_translateKey),
        y: _value,
        color: classTimeColor[_index],
      };
    });
  }

  /**
   * 處理裝置類別相關總體分析圖表數據
   * @param data {MemberAnalysis}-群組學員分析
   * @param totalTeachCount {number}-總開課次數
   */
  handleDeviceTypeAnalysis(data: DeviceTypeAnalysis, totalTeachCount: number) {
    const { deviceFieldName, useCountsFieldValue } = data;
    const deviceTypeCountsPieChartData = <any>[];

    const deviceTypeAnalysisTableData = {
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
      data: <Array<unknown>>[['universal_deviceSetting_modeType', '課程使用次數', '平均使用次數']],
    };
    deviceFieldName.forEach((_code, _index) => {
      const deviceCode = _code.split('d')[1];
      const _translateKey = getDevicTypeInfo(deviceCode, 'key');
      const deviceTypeName = this.translate.instant(_translateKey);
      const _value = useCountsFieldValue[_index];
      const _avgValue = totalTeachCount ? mathRounding(_value / totalTeachCount, 1) : '-';
      deviceTypeCountsPieChartData.push({
        name: deviceTypeName,
        y: _value,
        color: getDevicTypeInfo(deviceCode, 'color'),
      });

      deviceTypeAnalysisTableData.data.push([deviceTypeName, _value, _avgValue]);
    });
    return { deviceTypeCountsPieChartData, deviceTypeAnalysisTableData };
  }

  /**
   * 處理下一階子群組相關分析圖表數據
   * @param data {MemberAnalysis}-群組學員分析
   */
  handleChildGroupAnalysis(data: ChildGroupAnalysis) {
    if (!data || Object.keys(data).length === 0) return {};
    const {
      groupIdFieldName,
      groupNameFieldValue,
      maleCoachCountsFieldValue,
      femaleCoachCountsFieldValue,
      maleMemberCountsFieldValue,
      femaleMemberCountsFieldValue,
      teachTimeFieldValue,
      teachCountsFieldValue,
      teachTypeFieldValue,
      maleAttendCountsFieldValue,
      femaleAttendCountsFieldValue,
      lastTeachDateFieldValue,
      wearableCountsFieldValue,
      sensorCountsFieldValue,
      treadmillCountsFieldValue,
      rowMachineCountsFieldValue,
      spinBikeCountsFieldValue,
    } = data;
    return {
      ...this.handleChildCoachData({
        groupIdFieldName,
        groupNameFieldValue,
        maleCoachCountsFieldValue,
        femaleCoachCountsFieldValue,
        teachTypeFieldValue,
      }),
      ...this.handleChildMemberData({
        groupIdFieldName,
        groupNameFieldValue,
        maleMemberCountsFieldValue,
        femaleMemberCountsFieldValue,
      }),
      ...this.handleChildTeachData({
        groupIdFieldName,
        groupNameFieldValue,
        teachTimeFieldValue,
        teachCountsFieldValue,
        maleAttendCountsFieldValue,
        femaleAttendCountsFieldValue,
        teachTypeFieldValue,
        lastTeachDateFieldValue,
      }),
      ...this.handleChildDeviceData({
        groupIdFieldName,
        groupNameFieldValue,
        wearableCountsFieldValue,
        sensorCountsFieldValue,
        treadmillCountsFieldValue,
        rowMachineCountsFieldValue,
        spinBikeCountsFieldValue,
      }),
    };
  }

  /**
   * 處理子群組教練相關分析數據
   * @param data {any}-與子群組教練相關的數據
   */
  handleChildCoachData(data: any) {
    const {
      groupIdFieldName,
      groupNameFieldValue,
      maleCoachCountsFieldValue,
      femaleCoachCountsFieldValue,
      teachTypeFieldValue,
    } = data;

    const {
      post: { groupLevel },
      groupInfo: { brandType },
    } = this;
    const childGroupCoachChartData = <any>[];
    const groupNameHeader = getNextLayerGroupLevelName(groupLevel, brandType);
    const childGroupCoachTableData = {
      option: <OperationTableOption>{
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
        ],
        valueRowType: [
          OperationDataType.link,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.iconList,
        ],
      },
      data: <Array<unknown>>[[groupNameHeader, '總教練數', '男性教練數', '女性教練數', '開課類別']],
    };

    const childGroupLength = groupIdFieldName.length;
    groupIdFieldName.forEach((_id, _index) => {
      const _groupName = groupNameFieldValue[_index];
      const _maleCoachCount = maleCoachCountsFieldValue[_index];
      const _femaleCoachCount = femaleCoachCountsFieldValue[_index];
      const _totalCoachCount = _maleCoachCount + _femaleCoachCount;
      const _teachTypeIconClassName = this.getIconClassName(teachTypeFieldValue[_index]);

      childGroupCoachChartData.push({
        name: _groupName,
        y: _totalCoachCount,
        color: assignHslaColor(_index, childGroupLength),
      });

      childGroupCoachTableData.data.push([
        this.getGroupLinkInfo(_id, _groupName),
        _totalCoachCount,
        _maleCoachCount,
        _femaleCoachCount,
        _teachTypeIconClassName,
      ]);
    });

    return { childGroupCoachChartData, childGroupCoachTableData };
  }

  /**
   * 根據群組id取得所需的網址連結相關資訊
   * @param groupId {string}-群組編號
   * @param groupName {string}-群組名稱
   */
  getGroupLinkInfo(groupId: string, groupName: string) {
    const hashGroupId = this.hashIdService.handleGroupIdEncode(groupId);
    return {
      name: groupName,
      url: `dashboard/group-info/${hashGroupId}/operation-report`,
    };
  }

  /**
   * 根據運動類別取得對應的icon class name
   * @param sportsTypeList {Array<string>}-運動類別清單
   */
  getIconClassName(sportsTypeList: Array<string>) {
    return sportsTypeList
      .filter((_type) => +_type)
      .map((_type) => {
        return this.sportTypeIconPipe.transform(+_type);
      });
  }

  /**
   * 處理子群組學員相關分析數據
   * @param data {any}-與子群組學員相關的數據
   */
  handleChildMemberData(data: any) {
    const {
      groupIdFieldName,
      groupNameFieldValue,
      maleMemberCountsFieldValue,
      femaleMemberCountsFieldValue,
    } = data;

    const {
      post: { groupLevel },
      groupInfo: { brandType },
    } = this;
    const childGroupMemberChartData = <any>[];
    const groupNameHeader = getNextLayerGroupLevelName(groupLevel, brandType);
    const childGroupMemberTableData = {
      option: <OperationTableOption>{
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
        ],
        valueRowType: [
          OperationDataType.link,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
        ],
      },
      data: <Array<unknown>>[[groupNameHeader, '總學員數', '男性學員數', '女性學員數']],
    };

    const childGroupLength = groupIdFieldName.length;
    groupIdFieldName.forEach((_id, _index) => {
      const _groupName = groupNameFieldValue[_index];
      const _maleMemberCount = maleMemberCountsFieldValue[_index];
      const _femaleMemberCount = femaleMemberCountsFieldValue[_index];
      const _totalMemberCount = _maleMemberCount + _femaleMemberCount;

      childGroupMemberChartData.push({
        name: _groupName,
        y: _totalMemberCount,
        color: assignHslaColor(_index, childGroupLength),
      });

      childGroupMemberTableData.data.push([
        this.getGroupLinkInfo(_id, _groupName),
        _totalMemberCount,
        _maleMemberCount,
        _femaleMemberCount,
      ]);
    });

    return { childGroupMemberChartData, childGroupMemberTableData };
  }

  /**
   * 處理子群組開課相關分析數據
   * @param data {any}-與子群組開課相關的數據
   */
  handleChildTeachData(data: any) {
    const {
      groupIdFieldName,
      groupNameFieldValue,
      teachTimeFieldValue,
      teachCountsFieldValue,
      maleAttendCountsFieldValue,
      femaleAttendCountsFieldValue,
      teachTypeFieldValue,
      lastTeachDateFieldValue,
    } = data;

    const {
      post: { groupLevel },
      groupInfo: { brandType },
    } = this;
    const teachChartData = {
      type: 'spline',
      name: '開課數',
      data: <any>[],
      yAxis: 1,
      marker: {
        symbol: 'circle',
        enabled: true,
      },
      dataLabels: {
        enabled: false,
      },
    };
    const maleAttendChartData = {
      type: 'column',
      name: '男性上課人次',
      data: <any>[],
      color: genderColor.male,
      dataLabels: {
        enabled: true,
      },
    };
    const femaleAttendChartData = {
      type: 'column',
      name: '女性上課人次',
      data: <any>[],
      color: genderColor.female,
      dataLabels: {
        enabled: true,
      },
    };

    const groupNameHeader = getNextLayerGroupLevelName(groupLevel, brandType);
    const childGroupTeachTableData = {
      option: <OperationTableOption>{
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
        ],
        valueRowType: [
          OperationDataType.link,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.iconList,
        ],
      },
      data: <Array<unknown>>[
        [
          groupNameHeader,
          '總開課計時',
          '開課次數',
          '總上課人次',
          this.getAvgPersonCourseTranslate(),
          '男性上課人次',
          '女性上課人次',
          '最後開課日',
          '開課類別',
        ],
      ],
    };

    groupIdFieldName.forEach((_id, _index) => {
      const _groupName = groupNameFieldValue[_index];
      const _teachTime = teachTimeFieldValue[_index];
      const _teachCount = teachCountsFieldValue[_index];
      const _maleAttendCount = maleAttendCountsFieldValue[_index];
      const _femaleAttendCount = femaleAttendCountsFieldValue[_index];
      const _totalAttendCount = _maleAttendCount + _femaleAttendCount;
      const _avgAttendCount = mathRounding(_totalAttendCount / (_teachCount || Infinity), 1);
      const _teachType = this.getIconClassName(teachTypeFieldValue[_index]);
      const _lastTeachTimestamp = lastTeachDateFieldValue[_index] * 1000;
      const _lastTeachDate = _lastTeachTimestamp
        ? dayjs(_lastTeachTimestamp).format('YYYY-MM-DD')
        : '-';

      teachChartData.data.push({ name: _groupName, y: _teachCount });
      maleAttendChartData.data.push({ name: _groupName, y: _maleAttendCount });
      femaleAttendChartData.data.push({ name: _groupName, y: _femaleAttendCount });

      childGroupTeachTableData.data.push([
        this.getGroupLinkInfo(_id, _groupName),
        _teachTime,
        _teachCount,
        _totalAttendCount,
        _avgAttendCount,
        _maleAttendCount,
        _femaleAttendCount,
        _lastTeachDate,
        _teachType,
      ]);
    });

    return {
      childGroupTeachChartData: [maleAttendChartData, femaleAttendChartData, teachChartData],
      childGroupTeachTableData,
    };
  }

  /**
   * 處理子群組裝置相關分析數據
   * @param data {any}-與子群組裝置相關的數據
   */
  handleChildDeviceData(data: any) {
    const {
      groupIdFieldName,
      groupNameFieldValue,
      wearableCountsFieldValue,
      sensorCountsFieldValue,
      treadmillCountsFieldValue,
      rowMachineCountsFieldValue,
      spinBikeCountsFieldValue,
    } = data;
    const {
      post: { groupLevel },
      groupInfo: { brandType },
    } = this;
    const groupNameHeader = getNextLayerGroupLevelName(groupLevel, brandType);
    const wearableI18nKey = 'universal_vocabulary_wearableDevice';
    const sensorI18nKey = 'universal_vocabulary_sensor';
    const treadmillI18nKey = 'universal_vocabulary_treadmill';
    const spinbikeI18nKey = 'universal_vocabulary_spinBike';
    const rowMechineI18nKey = 'universal_vocabulary_rowingMachine';
    const childDeviceChartData = {
      data: [
        {
          color: getDevicTypeInfo('wearable', 'color'),
          data: <any>[],
        },
        {
          color: getDevicTypeInfo('treadmill', 'color'),
          data: <any>[],
        },
        {
          color: getDevicTypeInfo('spinBike', 'color'),
          data: <any>[],
        },
        {
          color: getDevicTypeInfo('rowMachine', 'color'),
          data: <any>[],
        },
        {
          color: getDevicTypeInfo('sensor', 'color'),
          data: <any>[],
        },
      ],
      seriesName: [
        wearableI18nKey,
        treadmillI18nKey,
        spinbikeI18nKey,
        rowMechineI18nKey,
        sensorI18nKey,
      ],
    };

    const childDeviceTableData = {
      option: <OperationTableOption>{
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
        ],
        valueRowType: [
          OperationDataType.link,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
        ],
      },
      data: <Array<unknown>>[
        [
          groupNameHeader,
          wearableI18nKey,
          treadmillI18nKey,
          spinbikeI18nKey,
          rowMechineI18nKey,
          sensorI18nKey,
        ],
      ],
    };

    groupIdFieldName.forEach((_id, _index) => {
      const _groupName = groupNameFieldValue[_index];
      const _wearableCounts = wearableCountsFieldValue[_index];
      const _treadmillCounts = treadmillCountsFieldValue[_index];
      const _rowMachineCounts = rowMachineCountsFieldValue[_index];
      const _spinBikeCounts = spinBikeCountsFieldValue[_index];
      const _sensorCounts = sensorCountsFieldValue[_index];

      childDeviceChartData.data[0].data.push({ name: _groupName, y: _wearableCounts });
      childDeviceChartData.data[1].data.push({ name: _groupName, y: _treadmillCounts });
      childDeviceChartData.data[2].data.push({ name: _groupName, y: _spinBikeCounts });
      childDeviceChartData.data[3].data.push({ name: _groupName, y: _rowMachineCounts });
      childDeviceChartData.data[4].data.push({ name: _groupName, y: _sensorCounts });

      childDeviceTableData.data.push([
        this.getGroupLinkInfo(_id, _groupName),
        _wearableCounts,
        _treadmillCounts,
        _spinBikeCounts,
        _rowMachineCounts,
        _sensorCounts,
      ]);
    });
    return { childDeviceChartData, childDeviceTableData };
  }

  /**
   * 取得資料最後更新時間
   */
  getDataUpdateTime() {
    const {
      authService: { token },
      groupInfo: { groupId },
    } = this;
    const body = { token, groupId };
    this.lastUpdateTime$ = this.api41xxService.fetchGetUpdateAnalysisDataStatus(body);
  }

  /**
   * 取得群組營運分析趨勢
   */
  getAnalysisTrend() {
    return this.api41xxService
      .fetchGetGroupOperationTrend(this.post.api4105Post)
      .subscribe((res) => {
        this.analysisTrend = res;
        this.operationTrend = this.handleTrendChartData(this.analysisTrend);
      });
  }

  /**
   * 處理趨勢圖表與列表資料
   * @param data {Api4105Response}- api 4105 回覆的資訊
   */
  handleTrendChartData(data: Api4105Response) {
    const { isCompareMode, trendChartUnit } = this;
    const sameRangeData = trendChartUnit === DateUnit.year ? this.mergeSameYearData(data) : data;
    return isCompareMode
      ? this.handleCompareChartData(sameRangeData)
      : this.handleSingleChartData(sameRangeData);
  }

  /**
   * 合併同一年度範圍的數據
   * @param data {any}-api 4105 res
   */
  mergeSameYearData(data: Api4105Response) {
    const {
      processResult,
      trend: {
        timeRange: { fieldName, fieldValue },
        groupCountsAnalysis,
        deviceUsedCounts,
        childGroupAnalysisList,
      },
    } = data;
    const mergeRangeValue = <any>[];
    const groupMergeData = <any>[];
    const deviceUsedMergeData = <any>[];
    const childGroupMergeData = new Map();
    fieldValue.forEach((_rangeValue, _rangeIndex) => {
      const currentMergeIndex = mergeRangeValue.length - 1;
      const mergeYearArr = mergeRangeValue[currentMergeIndex] ?? null;
      const _year = +_rangeValue[0].toString().slice(0, 4);

      if (mergeYearArr && _year === mergeYearArr[0]) {
        groupMergeData[currentMergeIndex] = groupMergeData[currentMergeIndex].map(
          (_data, _index) => {
            return _data + groupCountsAnalysis.fieldValue[_rangeIndex][_index];
          }
        );
        deviceUsedMergeData[currentMergeIndex] = deviceUsedMergeData[currentMergeIndex].map(
          (_data, _index) => {
            return _data + deviceUsedCounts.useCountsFieldValue[_rangeIndex][_index];
          }
        );
        childGroupAnalysisList.childGroupList.forEach((_list) => {
          const { groupId, fieldValue: childFieldValue } = _list;
          const currentChildMergeData = childGroupMergeData.get(groupId);
          currentChildMergeData[currentMergeIndex] = currentChildMergeData[currentMergeIndex].map(
            (_data, _index) => {
              return _data + childFieldValue[_rangeIndex][_index];
            }
          );
          childGroupMergeData.set(groupId, currentChildMergeData);
        });
      } else {
        mergeRangeValue.push([_year]); // 符合 api 格式
        groupMergeData.push(groupCountsAnalysis.fieldValue[_rangeIndex]);
        deviceUsedMergeData.push(deviceUsedCounts.useCountsFieldValue[_rangeIndex]);
        childGroupAnalysisList.childGroupList.forEach((_list) => {
          const { groupId, fieldValue: childFieldValue } = _list;
          const currentChildMergeData = childGroupMergeData.get(groupId) ?? [];
          currentChildMergeData.push(childFieldValue[_rangeIndex]);
          childGroupMergeData.set(groupId, currentChildMergeData);
        });
      }
    });

    return {
      processResult,
      trend: {
        timeRange: {
          fieldName,
          fieldValue: mergeRangeValue,
        },
        groupCountsAnalysis: {
          fieldName: groupCountsAnalysis.fieldName,
          fieldValue: groupMergeData,
        },
        deviceUsedCounts: {
          fieldName: deviceUsedCounts.fieldName,
          useCountsFieldValue: deviceUsedMergeData,
        },
        childGroupAnalysisList: {
          innerFieldName: childGroupAnalysisList.innerFieldName,
          childGroupList: childGroupAnalysisList.childGroupList.map((_list) => {
            const { groupId, groupName } = _list;
            return { groupId, groupName, fieldValue: childGroupMergeData.get(groupId) };
          }),
        },
      },
    };
  }

  /**
   * 處理相關單一趨勢圖表數據
   * @param data {any}-api 4105 res 合併過後的數據
   */
  handleSingleChartData(data: Api4105Response) {
    const { childGroupAnalysisList, deviceUsedCounts, groupCountsAnalysis, timeRange } = data.trend;
    return {
      ...this.handleSingleChildTrend(timeRange, childGroupAnalysisList),
      ...this.handleSingleCreateChildTrend(timeRange, groupCountsAnalysis),
      ...this.handleSingleDeviceCountTrend(timeRange, deviceUsedCounts),
    };
  }

  /**
   * 將子群組相關數據依不同圖表類別數據進行分離後再分別處理
   * @param timeRange {TimeRange}-統計的日期時間範圍
   * @param data {any}-學員術趨勢分析數據
   */
  handleSingleChildTrend(timeRange: TimeRange, data: any) {
    if (!data) return {};
    return {
      ...this.handleChildMemberChartData(timeRange, data),
      ...this.handleChildMemberTrendTable(timeRange, data),
      ...this.handleTeachTrendData(timeRange, data),
      ...this.handleChildTeachTrendTableData(timeRange, data),
    };
  }

  /**
   * 處理子群組學員數趨勢相關折線圖數據
   * @param timeRange {TimeRange}-統計的日期時間範圍
   * @param data {any}-學員術趨勢分析數據
   */
  handleChildMemberChartData(timeRange: TimeRange, data: any) {
    const {
      trendChartUnit,
      groupInfo: { groupName },
    } = this;
    const { fieldValue: dateValue } = timeRange;
    const { childGroupList, innerFieldName } = data;
    const fieldNameCorrespondence = this.getFieldNameCorrespondence(innerFieldName);
    const memberSingleTrendChart = [
      {
        type: 'column',
        name: groupName,
        data: <any>[],
        dataLabels: {
          enabled: true,
        },
      },
      ...this.getSplineChartModel(childGroupList),
    ];

    dateValue.forEach((_date, _dateIndex) => {
      let allMemberCount = 0;
      const dateRange = this.getDateRangeTimestamp(_date[0]);
      const xAxisName = this.getXAxisName(trendChartUnit, dateRange?.startDate);
      childGroupList.forEach((_list, _listIndex) => {
        const { fieldValue: _dataValue } = _list;
        const maleMemberCount = _dataValue[_dateIndex][fieldNameCorrespondence['maleMember']];
        const femaleMemberCount = _dataValue[_dateIndex][fieldNameCorrespondence['femaleMember']];
        const totalMemberCount = maleMemberCount + femaleMemberCount;
        allMemberCount += totalMemberCount;
        memberSingleTrendChart[_listIndex + 1].data.push({
          name: xAxisName,
          y: totalMemberCount,
        });
      });

      memberSingleTrendChart[0].data.push({
        name: xAxisName,
        y: allMemberCount,
      });
    });

    return { memberSingleTrendChart };
  }

  /**
   * 處理子群組學員數趨勢相關列表數據
   * @param timeRange {TimeRange}-統計的日期時間範圍
   * @param data {any}-學員術趨勢分析數據
   */
  handleChildMemberTrendTable(timeRange: TimeRange, data: any) {
    const { trendChartUnit } = this;
    const { fieldValue: dateValue } = timeRange;
    const { childGroupList, innerFieldName } = data;
    if (!childGroupList?.length) return {};

    const { groupId, groupName } = this.groupInfo;
    const finalDateIndex = dateValue.length - 1;
    const fieldNameCorrespondence = this.getFieldNameCorrespondence(innerFieldName);
    const firstGroupBgColor = 'rgba(212, 249, 253, 1)';
    const memberSingleTrendTable = {
      option: <OperationTableOption>{
        secondColumnHeader: true,
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
        ],
        valueRowType: [
          OperationDataType.link,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
        ],
        valueRowStyle: [
          null,
          {
            bgColor: firstGroupBgColor,
          },
          {
            bgColor: firstGroupBgColor,
          },
        ],
      },
      data: <Array<unknown>>[
        [
          '群組名稱',
          'universal_activityData_dateRange',
          '總學員數',
          '學員增長(%)',
          '男性學員數',
          '男性增長(%)',
          '女性學員數',
          '女性增長(%)',
        ],
      ],
    };

    const startDateMemberCount = new AnalysisCount([0, 0]);
    const endDateMemberCount = new AnalysisCount([0, 0]);
    const startDateRange = this.getDateRangeTimestamp(dateValue[0][0]);
    const startDateString = this.getXAxisName(trendChartUnit, startDateRange?.startDate);
    const endDateRange = this.getDateRangeTimestamp(dateValue[finalDateIndex][0]);
    const endDateString = this.getXAxisName(trendChartUnit, endDateRange?.startDate);
    const maleMemberIndex = fieldNameCorrespondence['maleMember'];
    const femaleMemberIndex = fieldNameCorrespondence['femaleMember'];
    let childAnalysisTableData = <any>[];
    childGroupList.forEach((_list) => {
      const { groupId: childGroupId, groupName: childGroupName, fieldValue: _dataValue } = _list;
      // 30與40階層時間只取頭尾進行顯示，避免列表過長
      const _startDateMaleCount = _dataValue[0][maleMemberIndex];
      const _startDateFemaleCount = _dataValue[0][femaleMemberIndex];
      const _startDateTotalCount = _startDateMaleCount + _startDateFemaleCount;
      const _endDateMaleCount = _dataValue[finalDateIndex][maleMemberIndex];
      const _endDateFemaleCount = _dataValue[finalDateIndex][femaleMemberIndex];
      const _endDateTotalCount = _endDateMaleCount + _endDateFemaleCount;
      startDateMemberCount.add([_startDateMaleCount, _startDateFemaleCount]);
      endDateMemberCount.add([_endDateMaleCount, _endDateFemaleCount]);
      childAnalysisTableData = childAnalysisTableData.concat([
        [
          this.getGroupLinkInfo(childGroupId, childGroupName),
          startDateString,
          _startDateTotalCount,
          '-',
          _startDateMaleCount,
          '-',
          _startDateFemaleCount,
          '-',
        ],
        [
          null,
          endDateString,
          _endDateTotalCount,
          this.countIncreaseRatio(_endDateTotalCount, _startDateTotalCount, 1),
          _endDateMaleCount,
          this.countIncreaseRatio(_endDateMaleCount, _startDateMaleCount, 1),
          _endDateFemaleCount,
          this.countIncreaseRatio(_endDateFemaleCount, _startDateFemaleCount, 1),
        ],
      ]);
    });

    const {
      result: [startDateMaleCount, startDateFemaleCount],
      totalCount: startDateAllCount,
    } = startDateMemberCount;
    const {
      result: [endDateMaleCount, endDateFemaleCount],
      totalCount: endDateAllCount,
    } = endDateMemberCount;
    memberSingleTrendTable.data = memberSingleTrendTable.data.concat([
      [
        this.getGroupLinkInfo(groupId, groupName),
        startDateString,
        startDateAllCount,
        '-',
        startDateMaleCount,
        '-',
        startDateFemaleCount,
        '-',
      ],
      [
        null,
        endDateString,
        endDateAllCount,
        this.countIncreaseRatio(endDateAllCount, startDateAllCount, 1),
        endDateMaleCount,
        this.countIncreaseRatio(endDateMaleCount, startDateMaleCount, 1),
        endDateFemaleCount,
        this.countIncreaseRatio(endDateFemaleCount, startDateFemaleCount, 1),
      ],
      ...childAnalysisTableData,
    ]);

    return { memberSingleTrendTable };
  }

  /**
   * 處理目前群組開課相關單一趨勢圖表與列表數據
   * @param timeRange {TimeRange}-統計的日期時間範圍
   * @param data {any}-學員術趨勢分析數據
   */
  handleTeachTrendData(timeRange: TimeRange, data: any) {
    const {
      trendChartUnit,
      groupInfo: { groupName },
    } = this;
    const { fieldValue: dateValue } = timeRange;
    const { childGroupList, innerFieldName } = data;
    const fieldNameCorrespondence = this.getFieldNameCorrespondence(innerFieldName);
    const teachSingleTrendChart = [
      {
        type: 'column',
        name: '開課次數',
        data: <any>[],
        dataLabels: {
          enabled: true,
        },
      },
      {
        type: 'spline',
        name: '上課人次',
        data: <any>[],
        dataLabels: {
          enabled: false,
        },
      },
    ];

    const teachSingleTrendTable = {
      option: <OperationTableOption>{
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
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
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
        ],
      },
      data: <Array<unknown>>[
        [
          'universal_activityData_dateRange',
          '總開課次數',
          '平均課程時數',
          '總上課人次',
          '上課人次增長(%)',
          this.getAvgPersonCourseTranslate(),
          '男性上課人次',
          '男性增長(%)',
          '女性上課人次',
          '女性增長(%)',
        ],
      ],
    };

    let prevValue: AnalysisCount = new AnalysisCount([0, 0]); // 用來計算增長率
    dateValue.forEach((_date, _dateIndex) => {
      const dateRange = this.getDateRangeTimestamp(_date[0]);
      const xAxisName = this.getXAxisName(trendChartUnit, dateRange?.startDate);
      const attendCounts = new AnalysisCount([0, 0]);
      let totalTeachCounts = 0;
      let totalTeachTime = 0;
      childGroupList.forEach((_list, _listIndex) => {
        const { fieldValue: _dataValue } = _list;
        const _teachTime = _dataValue[_dateIndex][fieldNameCorrespondence['teachTime']];
        const _teachCounts = _dataValue[_dateIndex][fieldNameCorrespondence['teachCounts']];
        const _maleAttendCounts =
          _dataValue[_dateIndex][fieldNameCorrespondence['maleAttendCounts']];
        const _femaleAttendCounts =
          _dataValue[_dateIndex][fieldNameCorrespondence['femaleAttendCounts']];
        totalTeachCounts += _teachCounts;
        totalTeachTime += _teachTime;
        attendCounts.add([_maleAttendCounts, _femaleAttendCounts]);
      });

      teachSingleTrendChart[0].data.push({
        name: xAxisName,
        y: totalTeachCounts,
      });

      teachSingleTrendChart[1].data.push({
        name: xAxisName,
        y: attendCounts.totalCount,
      });

      const {
        totalCount: totalAttendCounts,
        result: [maleAttendCounts, femaleAttendCounts],
      } = attendCounts;
      const {
        totalCount: prevTotalAttendCount,
        result: [prevMaleAttendCounts, prevFemaleAttendCounts],
      } = prevValue;

      teachSingleTrendTable.data.push([
        xAxisName,
        totalTeachCounts,
        mathRounding(totalTeachTime / 3600 / (totalTeachCounts || Infinity), 1),
        totalAttendCounts,
        this.countIncreaseRatio(totalAttendCounts, prevTotalAttendCount, 1),
        mathRounding(totalAttendCounts / (totalTeachCounts || Infinity), 1),
        maleAttendCounts,
        this.countIncreaseRatio(maleAttendCounts, prevMaleAttendCounts, 1),
        femaleAttendCounts,
        this.countIncreaseRatio(femaleAttendCounts, prevFemaleAttendCounts, 1),
      ]);

      prevValue = deepCopy(attendCounts);
    });

    return { teachSingleTrendChart, teachSingleTrendTable };
  }

  /**
   * 處理子群組開課相關單一趨勢列表數據
   * @param timeRange {TimeRange}-統計的日期時間範圍
   * @param data {any}-學員術趨勢分析數據
   */
  handleChildTeachTrendTableData(timeRange: TimeRange, data: any) {
    const { trendChartUnit } = this;
    const { fieldValue: dateValue } = timeRange;
    const { childGroupList, innerFieldName } = data;
    if (!childGroupList?.length) return {};

    const { groupId, groupName } = this.groupInfo;
    const finalDateIndex = dateValue.length - 1;
    const fieldNameCorrespondence = this.getFieldNameCorrespondence(innerFieldName);
    const childTeachSingleTrendTable = {
      option: <OperationTableOption>{
        secondColumnHeader: true,
        headerRowType: [
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
          OperationDataType.translateKey,
        ],
        valueRowType: [
          OperationDataType.link,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
          OperationDataType.normal,
        ],
      },
      data: <Array<unknown>>[
        [
          '群組名稱',
          'universal_activityData_dateRange',
          '總開課次數',
          '平均課程時數',
          '總上課人次',
          '上課人次增長(%)',
          this.getAvgPersonCourseTranslate(),
          '男性上課人次',
          '男性增長(%)',
          '女性上課人次',
          '女性增長(%)',
        ],
      ],
    };

    const startDateRange = this.getDateRangeTimestamp(dateValue[0][0]);
    const startDateString = this.getXAxisName(trendChartUnit, startDateRange?.startDate);
    const endDateRange = this.getDateRangeTimestamp(dateValue[finalDateIndex][0]);
    const endDateString = this.getXAxisName(trendChartUnit, endDateRange?.startDate);
    const teachTimeIndex = fieldNameCorrespondence['teachTime'];
    const teachCountsIndex = fieldNameCorrespondence['teachCounts'];
    const maleAttendIndex = fieldNameCorrespondence['maleAttendCounts'];
    const femaleAtttendIndex = fieldNameCorrespondence['femaleAttendCounts'];
    childGroupList.forEach((_list) => {
      const { groupId: childGroupId, groupName: childGroupName, fieldValue: _dataValue } = _list;
      // 30與40階層時間只取頭尾進行顯示，避免列表過長
      const _startDateMaleCount = _dataValue[0][maleAttendIndex];
      const _startDateFemaleCount = _dataValue[0][femaleAtttendIndex];
      const _startDateAttendTotalCount = _startDateMaleCount + _startDateFemaleCount;
      const _startDateTeachTime = _dataValue[0][teachTimeIndex];
      const _startDateTeachCounts = _dataValue[0][teachCountsIndex];
      const _endDateMaleCount = _dataValue[finalDateIndex][maleAttendIndex];
      const _endDateFemaleCount = _dataValue[finalDateIndex][femaleAtttendIndex];
      const _endDateAttendTotalCount = _endDateMaleCount + _endDateFemaleCount;
      const _endDateTeachTime = _dataValue[finalDateIndex][teachTimeIndex];
      const _endDateTeachCounts = _dataValue[finalDateIndex][teachCountsIndex];
      childTeachSingleTrendTable.data.push(
        [
          this.getGroupLinkInfo(childGroupId, childGroupName),
          startDateString,
          _startDateTeachCounts,
          mathRounding(_startDateTeachTime / (_startDateTeachCounts || Infinity), 1),
          _startDateAttendTotalCount,
          '-',
          mathRounding(_startDateAttendTotalCount / (_startDateTeachCounts || Infinity), 1),
          _startDateMaleCount,
          '-',
          _startDateFemaleCount,
          '-',
        ],
        [
          null,
          endDateString,
          _endDateTeachCounts,
          mathRounding(_endDateTeachTime / (_endDateTeachCounts || Infinity), 1),
          _endDateAttendTotalCount,
          this.countIncreaseRatio(_endDateAttendTotalCount, _startDateAttendTotalCount, 1),
          mathRounding(_endDateAttendTotalCount / (_endDateTeachCounts || Infinity), 1),
          _endDateMaleCount,
          this.countIncreaseRatio(_endDateMaleCount, _startDateMaleCount, 1),
          _endDateFemaleCount,
          this.countIncreaseRatio(_endDateFemaleCount, _startDateFemaleCount, 1),
        ]
      );
    });

    return { childTeachSingleTrendTable };
  }

  /**
   * 取得名稱對應的陣列序列
   * @param fieldName {Array<string>}-cjson key
   */
  getFieldNameCorrespondence(fieldName: Array<string>) {
    const result = {};
    fieldName.forEach((_name, _index) => {
      Object.assign(result, { [_name]: _index });
    });

    return result;
  }

  /**
   * 根據群組數量多寡取得折線圖highchart模型
   * @param groupList {Array<any>}-群組數據清單
   */
  getSplineChartModel(groupList: Array<any>) {
    const groupLength = groupList.length;
    return groupList.map((_list, _index) => {
      return {
        type: 'spline',
        name: _list.groupName,
        data: [],
        color: assignHslaColor(_index, groupLength),
        dataLabels: {
          enabled: false,
        },
        yAxis: 1,
        marker: {
          enabled: true,
        },
      };
    });
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
      case DateUnit.day: {
        const date = rangeCheck.toString();
        const dayjsObj = dayjs(date, 'YYYYMMDD');
        return {
          startDate: dayjsObj.startOf('day').valueOf(),
          endDate: dayjsObj.endOf('day').valueOf(),
        };
      }
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
      case DateUnit.day:
        return this.translate.instant('universal_time_day');
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
      case DateUnit.day:
        return dayjsObj.format('YYYY-MM-DD');
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
   * 處理子群組建立數目單一趨勢圖表數據
   * @param timeRange {TimeRange}-統計的日期範圍
   * @param data {any}-子群組建立數目分析數據
   */
  handleSingleCreateChildTrend(timeRange: TimeRange, data: any) {
    const {
      post: { groupLevel },
      trendChartUnit,
    } = this;
    if (groupLevel >= GroupLevel.class) return {};
    const { fieldValue: dateValue } = timeRange;
    const { fieldName: dataName, fieldValue: dataValue } = data;
    const isBrandLevel = groupLevel === GroupLevel.brand;
    const fieldNameCorrespondence = this.getFieldNameCorrespondence(dataName);
    const branchIndex = fieldNameCorrespondence['branch'];
    const classIndex = fieldNameCorrespondence['class'];
    const singleCreateChildChartData = this.getSingleCreateChildDataModel(groupLevel);
    const singleCreateChildTableData = this.getSingleCreateChildTableModel(groupLevel);

    dateValue.forEach((_date, _dateIndex) => {
      const dateRnage = this.getDateRangeTimestamp(_date[0]);
      const xAxisName = this.getXAxisName(trendChartUnit, dateRnage?.startDate);
      const _classData = dataValue[_dateIndex][classIndex];
      const _previousClassData = _dateIndex === 0 ? null : dataValue[_dateIndex - 1][classIndex];
      const _classIncreaseRatio = this.countIncreaseRatio(_classData, _previousClassData, 1);
      singleCreateChildChartData[0].data.push({
        name: xAxisName,
        y: _classData,
      });
      if (isBrandLevel) {
        const _branchData = dataValue[_dateIndex][branchIndex];
        const _previousBranchData =
          _dateIndex === 0 ? null : dataValue[_dateIndex - 1][branchIndex];
        const _branchIncreaseRatio = this.countIncreaseRatio(_branchData, _previousBranchData, 1);
        singleCreateChildChartData[1].data.push({
          name: xAxisName,
          y: _branchData,
        });

        singleCreateChildTableData.data.push([
          xAxisName,
          _branchData,
          _branchIncreaseRatio,
          _classData,
          _classIncreaseRatio,
        ]);
      } else {
        singleCreateChildTableData.data.push([xAxisName, _classData, _classIncreaseRatio]);
      }
    });

    return { singleCreateChildChartData, singleCreateChildTableData };
  }

  /**
   * 根據群組階層取得子群組建立數目相關統計趨勢圖表用模型
   * @param groupLevel {GroupLevel}-群組階層
   */
  getSingleCreateChildDataModel(groupLevel: GroupLevel) {
    const isBrandLevel = groupLevel === GroupLevel.brand;
    return isBrandLevel
      ? [
          {
            type: 'spline',
            name: '課程群組數',
            data: <any>[],
            dataLabels: {
              enabled: true,
            },
            yAxis: 1,
            marker: {
              enabled: true,
            },
          },
          {
            type: 'column',
            name: '分店群組數',
            data: <any>[],
            dataLabels: {
              enabled: true,
            },
          },
        ]
      : [
          {
            type: 'column',
            name: '課程群組數',
            data: <any>[],
            dataLabels: {
              enabled: true,
            },
          },
        ];
  }

  /**
   * 根據群組階層取得子群組建立數目相關統計趨勢列表用模型
   * @param groupLevel {GroupLevel}-群組階層
   */
  getSingleCreateChildTableModel(groupLevel: GroupLevel) {
    const isBrandLevel = groupLevel === GroupLevel.brand;
    return isBrandLevel
      ? {
          option: <OperationTableOption>{
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
          data: <Array<unknown>>[
            [
              'universal_activityData_dateRange',
              '分店群組數',
              '分店群組增長(%)',
              '課程群組數',
              '課程群組增長(%)',
            ],
          ],
        }
      : {
          option: <OperationTableOption>{
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
          data: <Array<unknown>>[
            ['universal_activityData_dateRange', '課程群組數', '課程群組增長(%)'],
          ],
        };
  }

  /**
   * 處理使用裝置次數相關單一趨勢圖表數據
   * @param timeRange {TimeRange}-統計的日期時間範圍
   * @param data {any}-裝置使用次數分析數據
   */
  handleSingleDeviceCountTrend(timeRange: TimeRange, data: any) {
    const { trendChartUnit } = this;
    const { fieldValue: dateValue } = timeRange;
    const { fieldName: deviceCodeName, useCountsFieldValue } = data;
    const singleDeviceTrendChartData = this.getDeviceTrendModel(deviceCodeName, 'chartModel');
    const singleDeviceTrendTableData = {
      option: <OperationTableOption>{
        headerRowType: [
          OperationDataType.translateKey,
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
          OperationDataType.normal,
        ],
      },
      data: <Array<any>>[
        ['universal_activityData_dateRange', ...this.getDeviceTrendModel(deviceCodeName)],
      ],
    };

    dateValue.forEach((_date, _dateIndex) => {
      const dateRnage = this.getDateRangeTimestamp(_date[0]);
      const xAxisName = this.getXAxisName(trendChartUnit, dateRnage?.startDate);
      singleDeviceTrendTableData.data.push([xAxisName]);
      deviceCodeName.forEach((_codeName, _codeIndex) => {
        const _value = useCountsFieldValue[_dateIndex][_codeIndex];
        singleDeviceTrendChartData[_codeIndex].data.push({
          name: xAxisName,
          y: _value,
        });

        singleDeviceTrendTableData.data[_dateIndex + 1].push([_value]);
      });
    });
    return { singleDeviceTrendChartData, singleDeviceTrendTableData };
  }

  /**
   * 取得裝置單一趨勢圖表模型
   * @param codeName {Array<string>}-裝置代號清單
   */
  getDeviceTrendModel(codeName: Array<string>, type: 'chartModel' | 'name' = 'name') {
    return codeName.map((_code) => {
      const deviceCode = _code.split('d')[1];
      const _translateKey = getDevicTypeInfo(deviceCode, 'key');
      const deviceTypeName = this.translate.instant(_translateKey);
      return type === 'name'
        ? deviceTypeName
        : {
            type: 'column',
            name: deviceTypeName,
            color: getDevicTypeInfo(deviceCode, 'color'),
            data: [],
          };
    });
  }

  /**
   * 處理相關比較趨勢圖表數據
   * @param data {any}-api 4105 res 合併過後的數據
   */
  handleCompareChartData(data: Api4105Response) {
    return data;
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
    this.getAnalysisTrend();
  }

  /**
   * 取得單一趨勢數據
   * @param id {number}-趨勢範圍編號
   */
  getSingleTrendData(id: SingleTrendRange) {
    this.isCompareMode = false;
    switch (id) {
      case SingleTrendRange.unlimit:
        this.post.startDate = dayjs('2018', 'YYYY').startOf('year').valueOf();
        this.post.endDate = dayjs().endOf('year').valueOf();
        this.post.dateUnit = PostDateUnit.month;
        this.trendChartUnit = DateUnit.year;
        break;
      case SingleTrendRange.nearlyFiveYears:
        this.post.startDate = dayjs().subtract(4, 'year').startOf('year').valueOf();
        this.post.endDate = dayjs().endOf('year').valueOf();
        this.post.dateUnit = PostDateUnit.month;
        this.trendChartUnit = DateUnit.year;
        break;
      case SingleTrendRange.nearlyTwoYears:
        this.post.startDate = dayjs().subtract(23, 'month').startOf('month').valueOf();
        this.post.endDate = dayjs().endOf('month').valueOf();
        this.post.dateUnit = PostDateUnit.month;
        this.trendChartUnit = DateUnit.month;
        break;
      case SingleTrendRange.nearlyOneYear:
        this.post.startDate = dayjs().subtract(11, 'month').startOf('month').valueOf();
        this.post.endDate = dayjs().endOf('month').valueOf();
        this.post.dateUnit = PostDateUnit.month;
        this.trendChartUnit = DateUnit.month;
        break;
      case SingleTrendRange.nearlyOneSeason:
        this.post.startDate = dayjs().subtract(89, 'day').startOf('isoWeek').valueOf();
        this.post.endDate = dayjs().endOf('isoWeek').valueOf();
        this.post.dateUnit = PostDateUnit.week;
        this.trendChartUnit = DateUnit.week;
        break;
      case SingleTrendRange.nearlyOneMonth:
        this.post.startDate = dayjs().subtract(29, 'day').startOf('day').valueOf();
        this.post.endDate = dayjs().endOf('day').valueOf();
        this.post.dateUnit = PostDateUnit.day;
        this.trendChartUnit = DateUnit.day;
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
      case CompareTrendRange.nearlyTwoYears: {
        this.post.startDate = dayjs().subtract(1, 'year').startOf('year').valueOf();
        this.post.endDate = dayjs().endOf('year').valueOf();
        this.post.dateUnit = PostDateUnit.month;
        this.trendChartUnit = DateUnit.month;
        break;
      }
      case CompareTrendRange.nearlyTwoSeasons: {
        const startDayjs = dayjs().subtract(1, 'quarter');
        this.post.startDate = this.getWeekFirstDayByDate(startDayjs, 'quarter');
        this.post.endDate = dayjs().endOf('quarter').endOf('isoWeek').valueOf();
        this.post.dateUnit = PostDateUnit.week;
        this.trendChartUnit = DateUnit.week;
        break;
      }
      case CompareTrendRange.nearlyTwoMonths: {
        const startDayjs = dayjs().subtract(1, 'month');
        this.post.startDate = this.getWeekFirstDayByDate(startDayjs, 'month');
        this.post.endDate = dayjs().endOf('month').endOf('isoWeek').valueOf();
        this.post.dateUnit = PostDateUnit.week;
        this.trendChartUnit = DateUnit.week;
        break;
      }
      case CompareTrendRange.nearlyTwoWeeks: {
        const startDayjs = dayjs().subtract(7, 'day').startOf('isoWeek');
        this.post.startDate = startDayjs.valueOf();
        this.post.endDate = dayjs().endOf('isoWeek').valueOf();
        this.post.dateUnit = PostDateUnit.day;
        this.trendChartUnit = DateUnit.day;
        break;
      }
      case CompareTrendRange.lastTwoYears: {
        const baseDayjsObj = dayjs().subtract(2, 'year').startOf('year');
        this.post.startDate = baseDayjsObj.valueOf();
        this.post.endDate = baseDayjsObj.add(1, 'year').endOf('year').valueOf();
        this.post.dateUnit = PostDateUnit.month;
        this.trendChartUnit = DateUnit.month;
        break;
      }
      case CompareTrendRange.lastTwoSeasons: {
        const baseDayjsObj = dayjs().subtract(1, 'quarter');
        const startDayjs = baseDayjsObj.subtract(1, 'quarter');
        this.post.startDate = this.getWeekFirstDayByDate(startDayjs, 'quarter');
        this.post.endDate = baseDayjsObj.endOf('quarter').endOf('isoWeek').valueOf();
        this.post.dateUnit = PostDateUnit.week;
        this.trendChartUnit = DateUnit.week;
        break;
      }
      case CompareTrendRange.lastTwoMonths: {
        const baseDayjsObj = dayjs().subtract(1, 'month');
        const startDayjs = baseDayjsObj.subtract(1, 'month');
        this.post.startDate = this.getWeekFirstDayByDate(startDayjs, 'month');
        this.post.endDate = baseDayjsObj.endOf('month').endOf('isoWeek').valueOf();
        this.post.dateUnit = PostDateUnit.week;
        this.trendChartUnit = DateUnit.week;
        break;
      }
      case CompareTrendRange.lastTwoWeeks: {
        const baseDayjsObj = dayjs().subtract(14, 'day').startOf('isoWeek');
        this.post.startDate = baseDayjsObj.valueOf();
        this.post.endDate = baseDayjsObj.add(7, 'day').endOf('isoWeek').valueOf();
        this.post.dateUnit = PostDateUnit.day;
        this.trendChartUnit = DateUnit.day;
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
   * 取消rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
