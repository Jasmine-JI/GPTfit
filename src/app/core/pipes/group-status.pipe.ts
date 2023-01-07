import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'groupStatus',
  standalone: true,
})
export class GroupStatusPipe implements PipeTransform {
  /**
   * 將群組狀態代號轉成多國語系的鍵
   * @param value {number}-群組狀態代號
   * @return {string}-翻譯的鍵
   */
  transform(value: number): any {
    switch (value) {
      case 1:
        return 'universal_group_freeToJoin';
      case 2:
        return 'universal_group_auditSystem';
      case 3:
        return 'universal_operating_hide';
      case 4:
        return 'universal_operating_disband';
      case 5:
        return 'universal_status_noData';
      case 6:
        return 'universal_status_disable';
      default:
        return 'universal_status_loading';
    }
  }
}
