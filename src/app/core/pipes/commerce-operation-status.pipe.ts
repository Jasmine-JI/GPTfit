import { Pipe, PipeTransform } from '@angular/core';
import { CommerceStatus } from '../enums/professional';

@Pipe({
  name: 'commerceOperationStatus',
  standalone: true,
})
export class CommerceOperationStatusPipe implements PipeTransform {
  constructor() {}

  /**
   * 根據營運狀態代碼回應多國語系翻譯鍵名
   * @param status {CommerceStatus}-營運狀態
   * @return {string}-多國語系鍵名
   */
  transform(status: CommerceStatus): string {
    switch (status) {
      case CommerceStatus.pauseOperation:
        return 'universal_group_outOfService';
      case CommerceStatus.closed:
        return 'universal_group_outOfBusiness';
      case CommerceStatus.pendingLogout:
        return 'universal_group_toBeDestroyed';
      default:
        return 'universal_group_InOperation';
    }
  }
}
