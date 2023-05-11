import { FormControl } from '@angular/forms';

/**
 * api 2108 編輯運動檔案資訊用，
 * 目前僅只有 dispName需要做表單驗證，
 * 其餘不須驗證或未用到所以未建模型
 */
export interface EditActivityProfile {
  dispName?: FormControl<string | null>;
}
