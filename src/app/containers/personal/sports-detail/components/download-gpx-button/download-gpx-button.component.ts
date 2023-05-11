import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Api2103Response, ActivityInfo } from '../../../../../core/models/api/api-21xx';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { SportType } from '../../../../../core/enums/sports';
import dayjs from 'dayjs';

@Component({
  selector: 'app-download-gpx-button',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './download-gpx-button.component.html',
  styleUrls: ['../../sports-detail.component.scss', './download-gpx-button.component.scss'],
})
export class DownloadGpxButtonComponent {
  /**
   * api 2103 回應
   */
  @Input() rawData: Api2103Response;

  /**
   * 將所需資料轉換為gpx格式，並執行下載
   */
  downloadGpx() {
    if (!this.rawData) return false;
    const {
      activityInfoLayer,
      activityPointLayer,
      fileInfo: { dispName, creationDate },
    } = this.rawData;

    of(activityPointLayer)
      .pipe(
        map((pointData) => this.switchGpxFile(pointData, activityInfoLayer, dispName)),
        map((data) => new Blob([data], { type: 'text/csv;charset=utf8' })),
        map((blob) => URL.createObjectURL(blob))
      )
      .subscribe((result) => {
        const link = document.createElement('a');
        const gpxName = `${dispName}${creationDate}.gpx`;
        document.body.appendChild(link);
        link.href = result;
        link.download = gpxName;
        link.click();
      });
  }

  /**
   * 將所需資料轉換為gpx格式
   * @param points 運動檔案單點資料
   * @param info 運動概要數據
   * @param dispName 運動檔案名稱
   */
  switchGpxFile(points: Array<any>, info: ActivityInfo, dispName: string) {
    const { startTime, type } = info;
    const cadenceKey = {
      [SportType.run]: 'runCadence',
      [SportType.cycle]: 'cycleCadence',
      [SportType.swim]: 'swimCadence',
      [SportType.row]: 'rowingCadence',
    };

    const powerKey = {
      [SportType.cycle]: 'cycleWatt',
      [SportType.row]: 'rowingWatt',
    };

    const startTimestamp = dayjs(startTime).valueOf();
    const keyIndex = this.getKeyIndex(points[0]);
    let content = '';
    points.forEach((_point, _index) => {
      if (_index !== 0) {
        const latitudeDegrees = _point[keyIndex['latitudeDegrees']];
        const longitudeDegrees = _point[keyIndex['longitudeDegrees']];
        const altitudeMeters = _point[keyIndex['altitudeMeters']];
        const pointSecond = _point[keyIndex['pointSecond']];
        const heartRateBpm = _point[keyIndex['heartRateBpm']];
        const distanceMeters = _point[keyIndex['distanceMeters']];
        const temp = _point[keyIndex['temp']];
        const cadence = _point[keyIndex[cadenceKey[+type]]];
        const power = _point[keyIndex[powerKey[+type]]];
        const alt = altitudeMeters || 0;
        const pointTimestamp = startTimestamp + pointSecond * 1000;
        const pointTime = dayjs(pointTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
        /**
         * const checkLat = latitudeDegrees && parseFloat(latitudeDegrees) !== 100;
         * const checkLng = longitudeDegrees && parseFloat(longitudeDegrees) !== 100;
         * if (checkLat && checkLng) {  // 暫不做座標是否有效的判斷
         */
        content += `<trkpt lat="${latitudeDegrees}" lon="${longitudeDegrees}">
                <ele>${alt}</ele>
                <time>${pointTime}</time>
                <extensions>
                  <gpxtpx:TrackPointExtension>
                    <gpxtpx:hr>${heartRateBpm}</gpxtpx:hr>
                    <gpxtpx:cad>${cadence}</gpxtpx:cad>
                    <gpxtpx:distance>${distanceMeters}</gpxtpx:distance>
                    <gpxtpx:atemp>${temp}</gpxtpx:atemp>
                    <gpxtpx:power>${power ?? null}</gpxtpx:power>
                  </gpxtpx:TrackPointExtension>
                </extensions>
              </trkpt>
            `;
        // }
      }
    });

    const gpxData = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <gpx xmlns="${'http://www.topografix.com/GPX/1/1'}" xmlns:gpxtpx="${'http://www.gptfit.com'}" xmlns:xsi="${'http://www.w3.org/2001/XMLSchema-instance'}" xsi:schemaLocation="${'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd'}">
          <trk>
            <name>${dispName}</name>
            <trkseg>
              ${content}
            </trkseg>
          </trk>
        </gpx>
      `;

    return gpxData;
  }

  /**
   * 取得數據類別對應在陣列中的序列
   * @param keyArray 數據類別名稱陣列
   */
  getKeyIndex(keyArray: Array<string>) {
    const result = {};
    keyArray.forEach((_key, _index) => {
      Object.assign(result, { [_key]: _index });
    });

    return result;
  }
}
