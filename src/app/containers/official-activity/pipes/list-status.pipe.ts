import { Pipe, PipeTransform } from '@angular/core';
import { ListStatus } from '../models/activity-content';

/**
 * 將活動列表篩選狀態轉為多國語系翻譯的key
 * @author kidin-1101125
 */
@Pipe({name: 'listStatus'})
export class ListStatusPipe implements PipeTransform {
  transform(value: ListStatus): any {
    switch (value) {
      case ListStatus.all:
        return 'universal_adjective_all';
      case ListStatus.applying:
        return '報名中';
      case ListStatus.applyCutOff:
        return '報名截止';
      case ListStatus.racing:
        return '競賽進行中';
      case ListStatus.eventFinished:
        return '競賽結束';
      case ListStatus.eventCancel:
        return '賽事取消';
    }

  }

}
