import { GetClientIpService, Api10xxService } from '../../core/services';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { checkResponse } from '../../core/utils/index';

enum UnlockFlow {
  requestImg = 1,
  unlock,
}

/**
 * 處理鎖定圖碼之請求與解瑣
 */
export class LockCaptcha {
  private randomCodeImg: string;
  private unlockFlow = UnlockFlow.requestImg;
  private unlockKey: string = null;
  private header: any;
  private unlockKeyError = false;

  constructor(
    private imgLockCode: string,
    private api10xxService: Api10xxService,
    private getClientIpService: GetClientIpService
  ) {
    this.requestLockImg();
  }

  /**
   * 請求圖碼解鎖圖片
   * @returns Observable
   */
  requestLockImg() {
    const { unlockFlow, imgLockCode } = this;
    const body = { unlockFlow, imgLockCode };
    this.getClientIpService
      .requestIpAddress()
      .pipe(
        switchMap((ipResult) => {
          this.header = { remoteAddr: (ipResult as any).ip };
          return this.api10xxService.fetchCaptcha(body, this.header);
        })
      )
      .subscribe((res: any) => {
        if (!checkResponse(res)) {
          this.randomCodeImg = '';
        } else {
          this.unlockFlow = UnlockFlow.unlock;
          this.randomCodeImg = res.captcha.randomCodeImg;
        }
      });
  }

  /**
   * 取得圖碼圖片
   */
  get lockImg() {
    return this.randomCodeImg;
  }

  /**
   * 輸入驗證碼
   * @param key {string}-使用者輸入的驗證
   */
  editUnlockKey(key: string) {
    this.unlockKey = key.trim();
  }

  /**
   * 確認是否輸入驗證碼
   */
  get unlockKeyEmpty() {
    return this.unlockKey === null || this.unlockKey === '';
  }

  /**
   * 取得驗證碼是否有誤
   */
  get foundUnlockKeyError() {
    return this.unlockKeyError;
  }

  /**
   * 送出驗證碼請求解鎖
   */
  requestUnlock() {
    const { unlockFlow, unlockKey } = this;
    const body = { unlockFlow, unlockKey };
    return this.api10xxService.fetchCaptcha(body, this.header).pipe(
      switchMap((res: any) => {
        if (!checkResponse(res)) {
          const { processResult } = res;
          const unlockErrorMsg = 'Found a wrong unlock key.';
          this.unlockKeyError = processResult && processResult.apiReturnMessage === unlockErrorMsg;
          return of(false);
        } else {
          this.unlockKeyError = false;
          return of(true);
        }
      })
    );
  }
}
