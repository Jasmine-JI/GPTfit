import {
  wearableBackgroundImagePath,
  treadmillBackgroundImagePath,
  spinbikeBackgroundImagePath,
  rowmachineBackgroundImagePath,
  sensorBackgroundImagePath,
  unknownDeviceImagePath,
} from '../models/const/image-path.model';
import { deviceColor } from '../models/represent-color';

/**
 * 根據裝置代號取得所需資訊
 * @param name {string}-裝置代號
 */
export function getDevicTypeInfo(name: string, args: 'key' | 'imgPath' | 'color' | 'type') {
  const device = {
    wearable: {
      key: 'universal_vocabulary_wearableDevice',
      imgPath: wearableBackgroundImagePath,
      color: deviceColor.wearable,
      type: 'wearable',
    },
    treadmill: {
      key: 'universal_vocabulary_treadmill',
      imgPath: treadmillBackgroundImagePath,
      color: deviceColor.treadmill,
      type: 'treadmill',
    },
    spinBike: {
      key: 'universal_vocabulary_spinBike',
      imgPath: spinbikeBackgroundImagePath,
      color: deviceColor.spinBike,
      type: 'spinBike',
    },
    rowMachine: {
      key: 'universal_vocabulary_rowingMachine',
      imgPath: rowmachineBackgroundImagePath,
      color: deviceColor.rowMachine,
      type: 'rowMachine',
    },
    sensor: {
      key: 'universal_vocabulary_sensor',
      imgPath: sensorBackgroundImagePath,
      color: deviceColor.sensor,
      type: 'sensor',
    },
    unknown: {
      key: 'Unknown',
      imgPath: unknownDeviceImagePath,
      color: deviceColor.unknown,
      type: 'unknown',
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
