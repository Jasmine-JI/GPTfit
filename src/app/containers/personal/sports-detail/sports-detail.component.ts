import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SportsDetailService } from './sports-detail.service';
import { Subject, of, fromEvent } from 'rxjs';
import { takeUntil, map, switchMap, debounceTime } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { ResultCode, QueryString, DataUnitType } from '../../../core/enums/common';
import { SportType, WeightTrainingLevel } from '../../../core/enums/sports';
import { MapSource, MapType } from '../../../core/enums/compo';
import { appPath } from '../../../app-path.const';
import {
  LoadingBarComponent,
  LoadingMaskComponent,
  ConnectionErrorComponent,
  LineAreaCompareChartComponent,
} from '../../../components';
import { Api2103Response } from '../../../core/models/api/api-21xx';
import {
  HeaderComponent,
  EditButtonComponent,
  ChangePhotoButtonComponent,
  PrivacySettingButtonComponent,
  ShareButtonComponent,
  DownloadGpxButtonComponent,
  DownloadCsvButtonComponent,
  PrintButtonComponent,
  DeleteButtonComponent,
  ReturnButtonComponent,
  CompareFileSelectorComponent,
  InfoDataImageComponent,
  AllInfoDataComponent,
  LapInfoTableComponent,
  MapOptionComponent,
  TrendChartInfoComponent,
  QuadrantChartComponent,
  QuadrantInfoComponent,
  QuadrantSettingComponent,
  WeightTrainLevelComponent,
  InfoDataCompareRwdComponent,
} from './components/';
import { getUrlQueryStrings, deepCopy } from '../../../core/utils';
import { AuthService, UserService } from '../../../core/services';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  TreeMapChartComponent,
  GoogleMapComponent,
  LeafletMapComponent,
  SportsFileRoadComponent,
  MuscleMapComponent,
  MuscleInfoCardComponent,
  HrZoneHintComponent,
} from '../../../components';
import { SportsDetailHandler } from '../classes';
import { zoneColor } from '../../../core/models/represent-color';
import { FileSimpleInfo, QuadrantSetting, QuadrantData } from '../../../core/models/compo';
import {
  DataTypeTranslatePipe,
  DataTypeUnitPipe,
  SportPaceSibsPipe,
  TemperatureSibsPipe,
} from '../../../core/pipes';

declare let google;

@Component({
  selector: 'app-sports-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    LoadingBarComponent,
    LoadingMaskComponent,
    HeaderComponent,
    EditButtonComponent,
    ChangePhotoButtonComponent,
    PrivacySettingButtonComponent,
    ShareButtonComponent,
    DownloadGpxButtonComponent,
    DownloadCsvButtonComponent,
    PrintButtonComponent,
    DeleteButtonComponent,
    ReturnButtonComponent,
    ConnectionErrorComponent,
    CompareFileSelectorComponent,
    InfoDataImageComponent,
    AllInfoDataComponent,
    LapInfoTableComponent,
    TreeMapChartComponent,
    GoogleMapComponent,
    LeafletMapComponent,
    MapOptionComponent,
    TrendChartInfoComponent,
    DataTypeTranslatePipe,
    LineAreaCompareChartComponent,
    DataTypeUnitPipe,
    SportPaceSibsPipe,
    TemperatureSibsPipe,
    SportsFileRoadComponent,
    QuadrantChartComponent,
    QuadrantInfoComponent,
    QuadrantSettingComponent,
    MuscleMapComponent,
    MuscleInfoCardComponent,
    WeightTrainLevelComponent,
    InfoDataCompareRwdComponent,
    HrZoneHintComponent,
  ],
  templateUrl: './sports-detail.component.html',
  styleUrls: ['./sports-detail.component.scss'],
})
export class SportsDetailComponent implements OnInit, OnDestroy {
  private _ngUnsubscribe = new Subject();

  /**
   * 頁面載入進度
   */
  progress = 100;

  /**
   * 是否連線錯誤
   */
  connectionError = false;

  /**
   * 是否為檔案持有者
   */
  isFileOwner = false;

  /**
   * 是否為預覽列印模式
   */
  isPreviewPrint = false;

  /**
   * 是否為登入前模式
   */
  isPortal = false;

  /**
   * 原始數據，用來處理複合式運動頁面切換
   */
  private _originData: Api2103Response;

  /**
   * 基準檔案數據
   */
  baseFileData: SportsDetailHandler;

  /**
   * 比較檔案數據
   */
  compareFileData?: SportsDetailHandler;

  /**
   * 用來促使圖表重繪來自適應頁面寬度改變
   */
  reflowCount = 0;

  /**
   * 圖資來源
   */
  mapSource = MapSource.google;

  /**
   * 地圖類別
   */
  mapType = MapType.normal;

  /**
   * 複合式運動檔案目前瀏覽索引
   */
  complexFileIndex = 0;

  /**
   * 象限圖設定
   */
  quadrantSetting$: Subject<QuadrantSetting>;

  /**
   * 基準象限圖相關數據
   */
  baseQuadrantData: QuadrantData;

  /**
   * 比較象限圖相關數據
   */
  compareQuadrantData?: QuadrantData;

  /**
   * 螢幕寬度
   */
  screenWidth = window.innerWidth;

  /**
   * 複合式運動簡易檔案資訊清單
   */
  private _infoList: Array<FileSimpleInfo>;

  readonly SportType = SportType;
  readonly MapSource = MapSource;
  readonly canUseGoogle = 'google' in window && typeof google?.maps === 'object';
  readonly rwdWidth = 767;

  constructor(
    private sportsDetailService: SportsDetailService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackbar: MatSnackBar,
    private userService: UserService
  ) {}

  /**
   * 取得是否為登入狀態
   */
  get isLogin() {
    return this.authService.isLogin;
  }

  /**
   * 取得使用者使用單位
   */
  get unit() {
    return this.userService.getUser().unit;
  }

  /**
   * 取得是否為公制
   */
  get isMetric() {
    return this.unit === DataUnitType.metric;
  }

  /**
   * 取得運動檔案類別
   */
  get sportsType() {
    return +(this.baseFileData?.activityInfoLayer.type ?? SportType.all);
  }

  /**
   * 取得配速sportPaceSibs pipe所需參數
   */
  get PacePipeArgs() {
    const { sportsType, unit } = this;
    return { sportType: sportsType, userUnit: unit, showUnit: false };
  }

  /**
   * 取得temperatureSibs pipe所需參數
   */
  get tempPipeArgs() {
    return { unitType: this.unit, showUnit: false };
  }

  /**
   * 取得複合式運動簡易概要資訊清單
   */
  get complexInfoList() {
    return this._infoList;
  }

  /**
   * 取得目前顯示檔案是否為主檔案
   */
  get isMainFile() {
    return this.complexFileIndex === 0;
  }

  /**
   * 取得使用者體重
   */
  get bodyWeight() {
    return this.userService.getUser().userProfile.bodyWeight;
  }

  /**
   * 取得使用者重訓程度
   */
  get weightTrainLevel() {
    return this.userService.getUser().userProfile.weightTrainingStrengthLevel;
  }

  /**
   * 是否為大螢幕畫面
   */
  get isLargeScreen() {
    return this.screenWidth > this.rwdWidth;
  }

  /**
   * 取得心率趨勢圖y軸心率區間提示限
   */
  get hrPlotLine() {
    const width = 2;
    const dashStyle = 'shortdash';
    const { z0, z1, z2, z3, z4 } = this.userService.getUser().userHrRange;
    const [, color1, color2, color3, color4, color5] = zoneColor;
    // 心率區間值為該區間最大值，故顏色對應需向下偏移
    return [
      { color: color1, width, value: z0, dashStyle },
      { color: color2, width, value: z1, dashStyle },
      { color: color3, width, value: z2, dashStyle },
      { color: color4, width, value: z3, dashStyle },
      { color: color5, width, value: z4, dashStyle },
    ];
  }

  /**
   * 初始化時即載入基本運動檔案資訊
   */
  ngOnInit(): void {
    this.subscribeResizeEvent();
    this.checkPathName();
    this.checkUrlParam();
    this.getBaseFileData();
  }

  /**
   * 訂閱視窗大小變更事件
   */
  subscribeResizeEvent() {
    const resizeEvent = fromEvent(window, 'resize');
    resizeEvent.pipe(debounceTime(100), takeUntil(this._ngUnsubscribe)).subscribe(() => {
      this.screenWidth = window.innerWidth;
    });
  }

  /**
   * 確認路徑位址為登入前頁面還是登入後
   */
  checkPathName() {
    const { pathname } = location;
    const [, firstPath] = pathname.split('/');
    this.isPortal = firstPath !== appPath.dashboard.home;
  }

  /**
   * 確認網址列的請求參數
   */
  checkUrlParam() {
    const { search } = location;
    const param = getUrlQueryStrings(search);
    Object.entries(param).forEach(([_key, _value]) => {
      switch (_key) {
        case QueryString.printMode:
          this.handlePrintPage();
          break;
      }
    });
  }

  /**
   * 處理列印頁面，讓頁面列印時可以分頁
   */
  handlePrintPage() {
    const mainBody = document.querySelector('.main-body') as HTMLDivElement;
    if (mainBody) {
      mainBody.style.overflowY = 'initial';
      mainBody.style.padding = '0';
    }

    const body = document.querySelector('body');
    if (body) body.style.overflowY = 'initial';

    const html = document.querySelector('html');
    if (html) {
      html.style.overflowX = 'initial';
      html.style.overflowY = 'scroll';
    }

    this.isPreviewPrint = true;
  }

  /**
   * 取得此運動檔案資料
   */
  getBaseFileData() {
    this.progress = 30;
    of('')
      .pipe(
        map(() => this.getFileId()),
        switchMap((fileId) => this.getBaseSportsFile(fileId))
      )
      .subscribe({
        next: (res) => {
          this._originData = deepCopy(res.data);
          this.handleBaseData(res);
        },
        error: (error) => this.handleApiError(error),
      });
  }

  /**
   * 取得此檔案流水編號
   */
  getFileId(): number {
    return +(this.route.snapshot.paramMap.get('fileId') as string);
  }

  /**
   * 取得此運動檔案數據
   * @param fileId 運動檔案流水編號
   */
  getBaseSportsFile(fileId: number) {
    return this.sportsDetailService.getBaseSportsDetail(fileId);
  }

  /**
   * 儲存基本檔案數據
   * @param
   */
  handleBaseData({ data, isFileOwner }) {
    const type = +data.activityInfoLayer.type;
    if (type === SportType.complex) this._infoList = this.getInfoList();

    const args = this.getFileHandlerArgs(type);
    this.baseFileData = new SportsDetailHandler(data, args);

    if (this.displayQuadrantData()) this.subscribeQuadrantData(data);

    this.isFileOwner = isFileOwner;
    this.progress = 100;
  }

  /**
   * 取得 SportsDetailHandler args 參數
   * @param sportsType 運動類別
   */
  getFileHandlerArgs(sportsType: SportType) {
    const { z0, z1, z2, z3, z4, z5 } = this.userService.getUser().userHrRange;
    let args: any = { unit: this.unit as DataUnitType, hrRange: [z0, z1, z2, z3, z4, z5] };
    if (sportsType === SportType.weightTrain) {
      const { bodyWeight, weightTrainLevel } = this;
      args = { ...args, bodyWeight, weightTrainLevel };
    }

    return args;
  }

  /**
   * 確認檔案是否不符隱私權規則或找不到該運動檔案
   * @param error 錯誤資訊
   */
  handleApiError(error: any) {
    this.progress = 100;
    const resultCode = +(error.message ?? ResultCode.pageNotFound);
    if (resultCode === ResultCode.connectError) {
      this.connectionError = true;
    } else {
      this.redirectErrorPage(resultCode);
    }
  }

  /**
   * 轉址至對應錯誤訊息頁面
   * @param resultCode 錯誤代碼
   */
  redirectErrorPage(resultCode: ResultCode) {
    const errorPage = {
      [ResultCode.forbidden]: appPath.pageNoPermission,
    };
    const redirectPath = errorPage[resultCode] ?? appPath.pageNotFound;
    const redirectPage = this.getRedirectPage(redirectPath);
    this.router.navigateByUrl(redirectPage);
  }

  /**
   * 判斷是否為 dashboard 頁面，以轉不同網址
   * @param childPath 轉址子路徑
   */
  getRedirectPage(childPath: string) {
    const [, firstPath] = location.pathname.split('/');
    const isDashboard = firstPath === appPath.dashboard.home;
    return isDashboard ? `/${firstPath}/${childPath}` : `/${childPath}`;
  }

  /**
   * 更新檔案名稱
   * @param name 新的檔案名稱
   */
  updateFileName(name: string) {
    this.baseFileData.fileName = name;
  }

  /**
   * 更新基準運動檔案佈景圖
   * @param url 新的檔案佈景圖路徑
   */
  changeFileSenery(url: string) {
    this.baseFileData.photo = url;
  }

  /**
   * 取消比較模式
   */
  cancelFileCompare() {
    this.compareFileData = undefined;
    this.compareQuadrantData = undefined;
    this.reflowCount++;
  }

  /**
   * 選擇比較檔案或取消比較
   * @param fileId 比較檔案編號
   */
  selectCompareFile(fileId: number | null) {
    this.reflowCount++;
    this.initStatus();
    if (!fileId) {
      this.compareFileData = undefined;
      return false;
    }

    this.sportsDetailService.getCompareSportsDetail(fileId).subscribe({
      next: (res) => this.handleCompareData(res),
      error: (error) => this.handleCompareDataError(error),
    });
  }

  /**
   * 將部份狀態初始化
   */
  initStatus() {
    const { sportsType } = this;
    if (sportsType === SportType.weightTrain) this.baseFileData.weightTrainData.blurMuscle();
  }

  /**
   * 處理比較檔案數據
   * @param data 比較檔案數據
   */
  handleCompareData({ data }) {
    const args = this.getFileHandlerArgs(this.sportsType);
    this.compareFileData = new SportsDetailHandler(data, args);
    if (this.displayQuadrantData()) this.subscribeCompareQuadrant(data);
  }

  /**
   * 處理比較檔案數據載入錯誤
   */
  handleCompareDataError(error: string) {
    console.error(error);
    this.snackbar.open('Load failed.', 'OK', { duration: 2000 });
  }

  /**
   * 變更地圖圖資
   * @param source 圖資來源
   */
  mapSourceChange(source: MapSource) {
    this.mapSource = source;
  }

  /**
   * 此運動類別是否包含於清單中
   * @param list
   */
  isIncluded(list: Array<SportType>) {
    return list.includes(this.sportsType);
  }

  /**
   * 是否需顯示象限圖數據
   */
  private displayQuadrantData() {
    return this.isIncluded([SportType.run, SportType.cycle, SportType.swim, SportType.row]);
  }

  /**
   * 選擇顯示的複合式運動子檔案
   * @param index {number}-指定的複合式檔案索引
   */
  selectFile(index: number) {
    this.complexFileIndex = index;
    const targetFile = this.getAssignFile(index);
    this.sportsDetailService.handleBaseComplexDetail(targetFile).subscribe((res) => {
      this.handleBaseData(res);
    });
  }

  /**
   * 取得各檔案概要資訊列表
   */
  private getInfoList(): Array<FileSimpleInfo> {
    const { activityInfoLayer, fileInfo, info } = this._originData;
    const infoList = (info as Array<any>).map((_list) => {
      const {
        activityInfoLayer: { type, totalSecond, avgHeartRateBpm, avgSpeed },
        fileInfo: { dispName },
      } = _list;
      return {
        type: +type,
        totalSecond: totalSecond ?? 0,
        avgHeartRateBpm: avgHeartRateBpm ?? 0,
        avgSpeed: avgSpeed ?? 0,
        dispName,
      };
    });

    infoList.unshift({
      type: +activityInfoLayer.type,
      totalSecond: activityInfoLayer.totalSecond ?? 0,
      avgHeartRateBpm: activityInfoLayer.avgHeartRateBpm ?? 0,
      avgSpeed: activityInfoLayer.avgSpeed ?? 0,
      dispName: fileInfo.dispName,
    });

    return infoList;
  }

  /**
   * 訂閱象限圖相關設定以及基準檔案象限圖資訊與數據
   * @param baseData 基準運動檔案
   */
  private subscribeQuadrantData(baseData: Api2103Response) {
    this.quadrantSetting$ = this.sportsDetailService.getRxQuadrantSetting();
    this.sportsDetailService
      .getRxQuadrantData(baseData)
      .pipe(takeUntil(this._ngUnsubscribe))
      .subscribe((data) => {
        this.baseQuadrantData = data;
      });
  }

  /**
   * 訂閱檔案象限圖資訊與數據
   * @param compareData 比較運動檔案
   */
  private subscribeCompareQuadrant(compareData: Api2103Response) {
    this.sportsDetailService
      .getRxQuadrantData(compareData)
      .pipe(takeUntil(this._ngUnsubscribe))
      .subscribe((data) => {
        this.compareQuadrantData = data;
      });
  }

  /**
   * 取得指定檔案數據
   * @param index {number}-檔案索引
   */
  getAssignFile(index: number) {
    const { _originData } = this;
    return index === 0 ? _originData : (_originData.info as Array<any>)[index - 1];
  }

  /**
   * 聚焦肌肉部位
   * @param e 聚焦肌肉部位id
   */
  focusMusclePart(e: number) {
    this.baseFileData.weightTrainData.setFocusMuscle(e);
    this.compareFileData?.weightTrainData.setFocusMuscle(e);
  }

  /**
   * 聚焦肌群
   * @param e 聚焦肌群id
   */
  focusMuscleGroup(e: number) {
    this.baseFileData.weightTrainData.setFocusMuscleGroup(e);
    this.compareFileData?.weightTrainData.setFocusMuscleGroup(e);
  }

  /**
   * 變更使用者重訓程度
   * @param level 重訓程度
   */
  changeLevel(level: WeightTrainingLevel) {
    this.baseFileData.weightTrainData.changeWeightTrainLevel(level);
    this.compareFileData?.weightTrainData.changeWeightTrainLevel(level);
  }

  /**
   * 列印頁面
   */
  printPage() {
    window.print();
  }

  ngOnDestroy(): void {
    this._ngUnsubscribe.next(null);
    this._ngUnsubscribe.complete();
  }
}
