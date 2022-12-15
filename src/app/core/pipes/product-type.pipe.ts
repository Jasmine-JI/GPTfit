import { Pipe, PipeTransform } from '@angular/core';
import {
  WEARABLE_BACKGROUND_IMAGE_PATH,
  TREADMILL_BACKGROUND_IMAGE_PATH,
  SPINBIKE_BACKGROUND_IMAGE_PATH,
  ROWMACHINE_BACKGROUND_IMAGE_PATH,
  SENSOR_BACKGROUND_IMAGE_PATH,
  UNKNOWN_DEVICE_IMAGE_PATH,
} from '../models/const/image-path.model';

@Pipe({
  name: 'productType',
  standalone: true,
})
export class ProductTypePipe implements PipeTransform {
  /**
   * 根據裝置類型回傳對應多國語系的鍵或佈景圖片路徑
   * @param value {string | number}-裝置類別名稱或代號
   */
  transform(value: string | number, arg: 'key' | 'imgPath' = 'key'): string {
    const device = {
      wearable: {
        key: 'universal_vocabulary_wearableDevice',
        imgPath: WEARABLE_BACKGROUND_IMAGE_PATH,
      },
      treadmill: {
        key: 'universal_vocabulary_treadmill',
        imgPath: TREADMILL_BACKGROUND_IMAGE_PATH,
      },
      spinBike: {
        key: 'universal_vocabulary_spinBike',
        imgPath: SPINBIKE_BACKGROUND_IMAGE_PATH,
      },
      rowMachine: {
        key: 'universal_vocabulary_rowingMachine',
        imgPath: ROWMACHINE_BACKGROUND_IMAGE_PATH,
      },
      sensor: {
        key: 'universal_vocabulary_sensor',
        imgPath: SENSOR_BACKGROUND_IMAGE_PATH,
      },
      unknown: {
        key: 'Unknown',
        imgPath: UNKNOWN_DEVICE_IMAGE_PATH,
      },
    };

    switch (`${value}`) {
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
        return device.unknown[arg];
    }
  }
}
