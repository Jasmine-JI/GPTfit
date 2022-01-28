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
        return 'universal_vocabulary_signOpen';
      case ListStatus.applyCutOff:
        return 'universal_vocabulary_signEnd';
      case ListStatus.racing:
        return 'universal_vocabulary_raceInProgress';
      case ListStatus.eventFinished:
        return 'universal_vocabulary_raceEnd';
      case ListStatus.eventCancel:
        return 'universal_vocabulary_raceCancel';
    }

  }

}
