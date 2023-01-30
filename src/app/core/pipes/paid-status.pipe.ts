import { Pipe, PipeTransform } from '@angular/core';
import { PaidStatusEnum } from '../../containers/official-activity/models/activity-content';

/**
 * 將繳費狀態代碼轉為多國語系翻譯的key
 */
@Pipe({
  name: 'paidStatus',
  standalone: true,
})
export class PaidStatusPipe implements PipeTransform {
  transform(value: PaidStatusEnum): any {
    switch (value) {
      case PaidStatusEnum.unPaid:
        return 'universal_vocabulary_notPaid';
      case PaidStatusEnum.paid:
        return 'universal_vocabulary_paid';
      case PaidStatusEnum.approve:
        return '已審核';
      case PaidStatusEnum.refund:
        return 'universal_vocabulary_refunded';
    }
  }
}
