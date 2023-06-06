import { Pipe, PipeTransform } from '@angular/core';
import { FileSortType } from '../enums/api';

@Pipe({
  name: 'fileSortTypeKey',
  standalone: true,
})
export class FileSortTypePipe implements PipeTransform {
  /**
   * 回傳運動檔案排序類別多國語系翻譯鍵名
   * @param value 檔案排序類別
   */
  transform(value: FileSortType): string {
    const key = {
      [FileSortType.startDate]: 'universal_time_startTime',
      [FileSortType.totalSecond]: 'universal_activityData_totalTime',
      [FileSortType.avgHr]: 'universal_activityData_avgHr',
      [FileSortType.avgSpeed]: 'universal_activityData_avgSpeed',
      [FileSortType.distance]: 'universal_activityData_totalDistance',
      [FileSortType.totalWeight]: 'universal_activityData_totalWeight',
    };

    return key[value] ?? 'Error';
  }
}
