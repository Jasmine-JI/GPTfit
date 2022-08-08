import { Pipe, PipeTransform } from '@angular/core';

/**
 * 裝置日誌log轉譯
 * @version 20210428
 */
@Pipe({ name: 'productErrorLog' })
export class ProductErrorLogPipe implements PipeTransform {
  transform(value: string, args: string[]): any {
    switch (value) {
      case 'errorCode_treadmill_a00':
        return '控制器錯誤:上表顯示E00: 通訊異常';
      case 'errorCode_treadmill_a01':
        return '控制器錯誤:上表顯示ERR 1 速度訊號異常或遺失';
      case 'errorCode_treadmill_a02':
        return '控制器錯誤:上表顯示ERR 2 電機運作電壓過大';
      case 'errorCode_treadmill_a03':
        return '控制器錯誤:上表顯示ERR 3 電機運作電流過大';
      case 'errorCode_treadmill_a04':
        return '控制器錯誤:上表顯示ERR 4 電機端子未接或脫落';
      case 'errorCode_treadmill_a05':
        return '控制器錯誤:上表顯示ERR 5 電機加速度過大';
      case 'errorCode_treadmill_a07':
        return '控制器錯誤:上表顯示ERR 7 揚升校正出錯';
      case 'errorCode_treadmill_a08':
        return '控制器錯誤:上表顯示ERR 8 速度校正出錯';
      case 'errorCode_treadmill_a09':
        return '控制器錯誤:上表顯示ERR 9 MOSFET 異常或暴衝保護啟動';
      case 'errorCode_treadmill_a10':
        return '控制器錯誤:上表顯示ERR 10 EEPPROM 寫入異常';
      case 'errorCode_treadmill_a31':
        return '控制器錯誤:上表顯示ERR 31 電機短路(開機後自我檢測)';
      case 'errorCode_treadmill_a32':
        return '控制器錯誤:上表顯示ERR 32 電機短路(運轉中檢測)';
      case 'errorCode_treadmill_a41':
        return '控制器錯誤:上表顯示ERR 41 電機端子運轉中脫落';
      case 'errorCode_treadmill_a60':
        return '控制器錯誤:上表顯示ERR 60 揚升電機堵轉或端子脫落';
      case 'errorCode_treadmill_a61':
        return '控制器錯誤:上表顯示ERR 61 揚升VR 值遺失或端子脫落';
      case 'errorCode_treadmill_a80':
        return '上表錯誤:上表顯示ERR 80: 中斷異常1';
      case 'errorCode_treadmill_a81':
        return '上表錯誤:上表顯示ERR 81: 中斷異常2';
      case 'errorCode_treadmill_a99':
        return '上表錯誤:上表顯示ERR 99: 讀寫Flash/EEPROM異常';
      case 'errorCode_treadmill_o00':
        return '上表錯誤: 上表顯示錯誤.OTA更新失敗(_Tr1:補傳錯誤/_Chk1:檔案確認碼錯誤)';
      case 'errorCode_treadmill_b00':
        return 'BTM錯誤: 上表顯示斷線.BTM 通訊異常';
      case 'errorCode_treadmill_b01':
        return 'LOG : BTM RESET(_Pair/_Reset)';
      case 'errorCode_treadmill_b02':
        return 'LOG : 雲跑開始 (_1:App/_ 2:雲跑/ _3:虛跑/ _4:AppDist/ _5:AppTime)';
      case 'errorCode_treadmill_b03':
        return 'LOG : 雲跑結束 (_1:App/ _2:雲跑/ _3:虛跑/ _4:AppDist/ _5:AppTime)';
      case 'errorCode_treadmill_m00':
        return 'LOG : 安全KEY觸發';
      case 'errorCode_treadmill_s00':
        return 'LOG : 開機';
      case 'errorCode_treadmill_s01':
        return '收到控制器異常錯誤碼';

      case 'errorCode_spinBike_a99':
        return 'LOG : 記憶體錯誤';
      case 'errorCode_spinBike_m01':
        return 'LOG : 低電量，車表顯示低電量';
      case 'errorCode_spinBike_c00':
        return 'LOG : 阻力校正異常，車表顯示錯誤';
      case 'errorCode_spinBike_o00':
        return 'OTA更新失敗,車表顯示錯誤(_Tr1:補傳錯誤/_Chk1:檔案確認碼錯誤)';
      case 'errorCode_spinBike_b00':
        return 'BTM錯誤: 顯示斷線.BTM 通訊異常';
      case 'errorCode_spinBike_b01':
        return 'LOG : BTM RESET';
      case 'errorCode_spinBike_s00':
        return 'LOG : 開機';
      case 'errorCode_spinBike_s01':
        return '收到控制器異常錯誤碼';

      case 'errorCode_rowingMachine_a99':
        return 'LOG : 記憶體錯誤';
      case 'errorCode_rowingMachine_m01':
        return 'LOG : 低電量，車表顯示低電量';
      case 'errorCode_rowingMachine_o00':
        return 'OTA更新失敗,車表顯示錯誤';
      case 'errorCode_rowingMachine_b00':
        return 'BTM錯誤: 顯示斷線.BTM 通訊異常';
      case 'errorCode_rowingMachine_b01':
        return 'LOG : BTM RESET';
      case 'errorCode_rowingMachine_s00':
        return 'LOG : 開機';
      case 'errorCode_rowingMachine_s01':
        return '收到控制器異常錯誤碼';

      case 'errorCode_wearable_w01':
        return 'ActiveDistance距離為0';
      case 'errorCode_wearable_w02':
        return 'FTMS綁定失敗';
      case 'errorCode_wearable_w03':
        return 'Active TotalTime Always One Sec';
      case 'errorCode_wearable_w04':
        return '運動檔案錯誤';
      case 'errorCode_wearable_w05':
        return '光學心跳讀取錯誤';

      default:
        return `Can't find this key.`;
    }
  }
}
