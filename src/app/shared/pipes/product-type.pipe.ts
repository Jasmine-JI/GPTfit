import { Pipe, PipeTransform } from '@angular/core';


@Pipe({name: 'productType'})
export class ProductTypePipe implements PipeTransform {
  /**
   * 根據裝置類型回傳對應多國語系的鍵或佈景圖片路徑
   * @param value {string | number}-裝置類別名稱或代號
   * @returns {string}-翻譯的鍵
   */
  transform(value: string | number, arg: 'key' | 'imgPath' = 'key'): string {
    const device = {
      wearable: {
        key: 'universal_vocabulary_wearableDevice',
        imgPath: '/assets/images/deviceBg/wearable.jpg'
      },
      treadmill: {
        key: 'universal_vocabulary_treadmill',
        imgPath: '/assets/images/deviceBg/run.jpg'
      },
      spinBike: {
        key: 'universal_vocabulary_spinBike',
        imgPath: '/assets/images/deviceBg/bike.jpg'
      },
      rowMachine: {
        key: 'universal_vocabulary_rowingMachine',
        imgPath: '/assets/images/deviceBg/row.jpg'
      },
      sensor: {
        key: 'universal_vocabulary_sensor',
        imgPath: '/assets/images/deviceBg/wt.jpg'
      },
    };
    switch (value + '') {
      case '1':
      case 'wearable':
        return device.wearable[arg];
      case '2':
      case 'treadmill':
        return device.treadmill[arg];
      case '3':
      case 'spinBike':
        return device.spinBike[arg];
      case '4':
      case 'rowMachine':
        return device.rowMachine[arg];
      case '5':
      case 'sensor':
        return device.sensor[arg];
      default:
        return 'unknown type';
    }

  }

}
