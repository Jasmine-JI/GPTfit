import { Injectable } from '@angular/core';
import { HintDialogService } from './index';

@Injectable({
  providedIn: 'root',
})
export class ApiCommonService {
  constructor(private hintDialogService: HintDialogService) {}

  /**
   * 處理api回覆錯誤的情況
   * @param resultCode {number}-api 的resultCode
   * @param apiCode {number}-apiCode
   * @param apiMsg {string}-api resultMessage
   */
  handleError(resultCode: number, apiCode: number, apiMsg: string) {
    console.error(`${resultCode}: Api ${apiCode} ${apiMsg}`);
    const errorMsg = `Error!<br>Please try again later.`;
    this.hintDialogService.openAlert(errorMsg);
  }

  /**
   * 確認res resultCode是否回傳200(兼容兩個版本的response result)
   * @param res {any}-api response
   * @param showAlert {boolean}-是否顯示錯誤alert
   * @returns {boolean} resultCode是否回傳200
   */
  checkRes(res: any, showAlert = true): boolean {
    const { processResult, resultCode: resCode, apiCode: resApiCode, resultMessage: resMsg } = res;
    if (!processResult) {
      if (resCode !== 200) {
        if (showAlert) this.handleError(resCode, resApiCode, resMsg);

        return false;
      } else {
        return true;
      }
    } else {
      const { resultCode, apiCode, resultMessage } = processResult;
      if (resultCode !== 200) {
        if (showAlert) this.handleError(resultCode, apiCode, resultMessage);

        return false;
      } else {
        return true;
      }
    }
  }
}
