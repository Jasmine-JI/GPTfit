import {
  WEARABLE_BACKGROUND_IMAGE_PATH,
  TREADMILL_BACKGROUND_IMAGE_PATH,
  SPINBIKE_BACKGROUND_IMAGE_PATH,
  ROWMACHINE_BACKGROUND_IMAGE_PATH,
  SENSOR_BACKGROUND_IMAGE_PATH,
  UNKNOWN_DEVICE_IMAGE_PATH,
} from '../models/const/image-path.model';
import { deviceColor } from '../models/represent-color';

/**
 * 根據裝置代號取得所需資訊
 * @param name {string}-裝置代號
 */
export function getDevicTypeInfo(name: string, args: 'key' | 'imgPath' | 'color') {
  const device = {
    wearable: {
      key: 'universal_vocabulary_wearableDevice',
      imgPath: WEARABLE_BACKGROUND_IMAGE_PATH,
      color: deviceColor.wearable,
    },
    treadmill: {
      key: 'universal_vocabulary_treadmill',
      imgPath: TREADMILL_BACKGROUND_IMAGE_PATH,
      color: deviceColor.treadmill,
    },
    spinBike: {
      key: 'universal_vocabulary_spinBike',
      imgPath: SPINBIKE_BACKGROUND_IMAGE_PATH,
      color: deviceColor.spinBike,
    },
    rowMachine: {
      key: 'universal_vocabulary_rowingMachine',
      imgPath: ROWMACHINE_BACKGROUND_IMAGE_PATH,
      color: deviceColor.rowMachine,
    },
    sensor: {
      key: 'universal_vocabulary_sensor',
      imgPath: SENSOR_BACKGROUND_IMAGE_PATH,
      color: deviceColor.sensor,
    },
    unknown: {
      key: 'Unknown',
      imgPath: UNKNOWN_DEVICE_IMAGE_PATH,
      color: deviceColor.unknown,
    },
  };

  switch (name) {
    case '1':
    case 'wearable':
      return device.wearable[args];
    case '2':
    case 'treadmill':
      return device.treadmill[args];
    case '3':
    case 'spinBike':
      return device.spinBike[args];
    case '4':
    case 'rowMachine':
      return device.rowMachine[args];
    case '5':
    case 'sensor':
      return device.sensor[args];
    default:
      return device.unknown[args];
  }
}
