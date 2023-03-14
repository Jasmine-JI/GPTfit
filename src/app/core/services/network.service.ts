import { Injectable } from '@angular/core';
import { HintDialogService } from './index';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  constructor(private hintDialogService: HintDialogService, private translate: TranslateService) {}

  checkNetworkStatus() {
    const { onLine } = navigator;
    const errorMsg = this.translate.instant('universal_popUpMessage_noNetwork');
    if (!onLine) this.hintDialogService.openAlert(errorMsg);
    return onLine;
  }
}
