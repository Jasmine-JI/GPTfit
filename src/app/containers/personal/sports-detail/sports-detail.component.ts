import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { SportsDetailService } from './sports-detail.service';
import { Subject, of } from 'rxjs';
import { takeUntil, map, switchMap } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { ResultCode, QueryString } from '../../../core/enums/common';
import { appPath } from '../../../app-path.const';
import {
  LoadingBarComponent,
  LoadingMaskComponent,
  ConnectionErrorComponent,
} from '../../../components';
import {
  Api2103Response,
  SportsFileInfo,
  ActivityInfo,
  ActivityLap,
  ActivityPoint,
} from '../../../core/models/api/api-21xx';
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
} from './components/';
import { getUrlQueryStrings } from '../../../core/utils';
import { AuthService } from '../../../core/services';
import { SportType } from '../../../core/enums/sports';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  ],
  templateUrl: './sports-detail.component.html',
  styleUrls: ['./sports-detail.component.scss'],
})
export class SportsDetailComponent implements OnInit, OnDestroy {
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
   * 基準檔案數據
   */
  baseFileData: Api2103Response;

  /**
   * 比較檔案數據
   */
  compareFileData: Api2103Response;

  readonly SportType = SportType;

  constructor(
    private sportsDetailService: SportsDetailService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackbar: MatSnackBar
  ) {}

  /**
   * 取得是否為登入狀態
   */
  get isLogin() {
    return this.authService.isLogin;
  }

  /**
   * 初始化時即載入基本運動檔案資訊
   */
  ngOnInit(): void {
    this.checkUrlParam();
    this.getBaseFileData();
  }

  /**
   * 確認網址列的請求參數
   */
  checkUrlParam() {
    const { search } = location;
    const param = getUrlQueryStrings(search);
    Object.entries(param).forEach(([_value, _key]) => {
      switch (_key) {
        case QueryString.printMode:
          this.isPreviewPrint = true;
          break;
      }
    });
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
        next: (res) => this.handleBaseData(res),
        error: (error) =>
          error.name ? this.handleConnectionError(error) : this.handleApiError(error),
      });
  }

  /**
   * 取得此檔案流水編號
   */
  getFileId(): number {
    return +this.route.snapshot.paramMap.get('fileId');
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
    this.baseFileData = data;
    this.isFileOwner = isFileOwner;
    this.progress = 100;
  }

  /**
   * 處理連線異常問題
   * @param error angular httpErrorResponse
   */
  handleConnectionError(error: HttpErrorResponse) {
    this.progress = 100;
    this.connectionError = true;
  }

  /**
   * 確認檔案是否不符隱私權規則或找不到該運動檔案
   * @param error api resultCode(200以外)
   */
  handleApiError(error: ResultCode) {
    this.progress = 100;

    const errorPage = {
      [ResultCode.forbidden]: appPath.pageNoPermission,
    };
    const redirectPath = errorPage[error as ResultCode] ?? appPath.pageNotFound;
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
    this.baseFileData.fileInfo.dispName = name;
  }

  /**
   * 更新基準運動檔案佈景圖
   * @param url 新的檔案佈景圖路徑
   */
  changeFileSenery(url: string) {
    this.baseFileData.fileInfo.photo = url;
  }

  /**
   * 選擇比較檔案或取消比較
   * @param fileId 比較檔案編號
   */
  selectCompareFile(fileId: number | null) {
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
   * 處理比較檔案數據
   * @param data 比較檔案數據
   */
  handleCompareData({ data }) {
    this.compareFileData = data;
  }

  /**
   * 處理比較檔案數據載入錯誤
   */
  handleCompareDataError(error: string) {
    console.error(error);
    this.snackbar.open('Load failed.', 'OK', { duration: 2000 });
  }

  ngOnDestroy(): void {}
}
