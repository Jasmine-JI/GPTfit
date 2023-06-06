import { Injectable } from '@angular/core';
import {
  Api10xxService,
  Api11xxService,
  Api21xxService,
  AuthService,
  UserService,
  HashIdService,
} from '../../../core/services';
import {
  Api2103Post,
  Api2103Response,
  SportsFileInfo,
  ActivityInfo,
  ActivityLap,
  ActivityPoint,
} from '../../../core/models/api/api-21xx';
import { DisplayDetailField } from '../../../core/enums/api';
import { of } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';
import { checkResponse, splitNameInfo, handleSceneryImg } from '../../../core/utils';
import { appPath } from '../../../app-path.const';

@Injectable({
  providedIn: 'root',
})
export class SportsDetailService {
  /**
   * 運動檔案檔案是否有使用者自己上傳的佈景圖
   */
  private _haveFileSenery = false;

  constructor(
    private authService: AuthService,
    private api10xxService: Api10xxService,
    private api11xxService: Api11xxService,
    private api21xxService: Api21xxService,
    private userService: UserService,
    private hashIdService: HashIdService
  ) {}

  /**
   * 取得運動檔案是否已有自訂佈景圖
   */
  get haveFileSenery() {
    return this._haveFileSenery;
  }

  /**
   * 取得基本運動檔案，並判斷檔案持有人是否為登入者
   * @param fileId 運動檔案流水編號
   */
  getBaseSportsDetail(fileId: number) {
    const body = this.getApi2103Post(fileId);
    return this.api21xxService.fetchSportListDetail(body).pipe(
      switchMap((res1) => this.getFileScenery(res1, true)),
      switchMap((res2) => this.getBaseOwnerInfo(res2))
    );
  }

  /**
   * 取得 api 2103 post
   * @param fileId 運動檔案流水編號
   */
  getApi2103Post(fileId: number): Api2103Post {
    return {
      token: this.authService.token,
      fileId,
      displayDetailField: DisplayDetailField.showByCJson,
    };
  }

  /**
   * 取得檔案擁有人icon
   * @param res api 2103 回應
   */
  getBaseOwnerInfo(res: Api2103Response) {
    const userId = +splitNameInfo(res.fileInfo.author).userId;
    if (!userId) return this.handleOldFormat(res);

    const isFileOwner = this.userService.getUser().userId === +userId;
    return isFileOwner ? this.addUserInfo(res) : this.addOwnerInfo(res, userId);
  }

  /**
   * 若檔案無佈景圖，則依運動類別與副類別給予預設圖片
   * @param res api 2103 回應
   * @param isBaseData 是否為基準運動檔案數據
   */
  getFileScenery(res: Api2103Response, isBaseData: boolean) {
    const {
      fileInfo: { photo },
      activityInfoLayer: { type, subtype },
    } = res;
    const notHavePhoto = !photo;
    if (notHavePhoto) {
      res.fileInfo.photo = handleSceneryImg(+type, subtype ?? 0);
    }

    if (isBaseData) this._haveFileSenery = !notHavePhoto;
    return of(res);
  }

  /**
   * 舊有運動檔案 fileInfo.author欄位可能為非 $nickname?userId=$userId 的格式
   * @param res api 2103 回應
   */
  handleOldFormat(res: Api2103Response) {
    return of({ data: res, isFileOwner: false });
  }

  /**
   * 將 api 2103 添加登入者的icon url
   * @param res api 2103 回應
   */
  addUserInfo(res: Api2103Response) {
    const { icon, userId } = this.userService.getUser();
    const authorLink = this.getUserLink(userId);
    res.fileInfo = { ...res.fileInfo, authorIcon: icon, authorLink };
    return of({ data: res, isFileOwner: true });
  }

  /**
   * 取得使用者個人頁面連結
   */
  getUserLink(userId: number) {
    const hashUserId = this.hashIdService.handleUserIdEncode(userId);
    return `/${appPath.personal.home}/${hashUserId}`;
  }

  /**
   * 將 api 2103 添加非登入者的檔案持有者icon url
   * @param res api 2103 回應
   */
  addOwnerInfo(res: Api2103Response, userId: number) {
    const body = { targetUserId: userId };
    return this.api10xxService.fetchGetUserProfile(body).pipe(
      map((ownerInfo) => {
        const authorIcon = ownerInfo?.userProfile?.avatarUrl ?? '';
        const authorLink = this.getUserLink(userId);
        res.fileInfo = { ...res.fileInfo, authorIcon, authorLink };
        return { data: res, isFileOwner: false };
      })
    );
  }

  /**
   * 取得自己的運動檔案列表作為可選擇的比較清單
   * @param body
   */
  getCompareList(body) {
    return this.api21xxService
      .fetchSportList(body)
      .pipe(switchMap((res) => this.checkListResponse(res)));
  }

  /**
   * 確認運動列表回應有無問題，有問題就當作無資料
   * @param res
   */
  checkListResponse(res) {
    const isEffect = checkResponse(res, false);
    const result = isEffect ? res : { info: [], totalCounts: 0 };
    return of(result);
  }

  /**
   * 取得比較運動檔案詳細資料，並與基本運動檔案進行處理以符合各區塊顯示格式
   * @param fileId 運動檔案流水編號
   */
  getCompareSportsDetail(fileId: number) {
    const body = this.getApi2103Post(fileId);
    return this.api21xxService.fetchSportListDetail(body).pipe(
      switchMap((res1) => this.getFileScenery(res1, false)),
      switchMap((res2) => this.addUserInfo(res2))
    );
  }
}
