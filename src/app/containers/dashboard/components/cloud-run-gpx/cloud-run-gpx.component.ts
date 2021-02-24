import {
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { InnerAdminService } from '../../services/inner-admin.service';
import { saveAs } from 'file-saver'; // 引入前記得要裝： npm install file-saver
import { transform, WGS84, BD09, GCJ02 } from 'gcoord';
import { chinaBorder } from '../../../../shared/models/china-border-data';
import { taiwanBorder } from '../../../../shared/models/taiwan-border-data';

export interface PeriodicElement {
  crs: string;
  coordinateFormat: string;
  desc: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    crs: 'gcoord.WGS84',
    coordinateFormat: '[lng, lat]',
    desc: 'HWGS-84坐标系，GPS设备获取的经纬度坐标'
  },
  {
    crs: 'gcoord.GCJ02',
    coordinateFormat: '[lng,lat]',
    desc:
      'GCJ-02坐标系，google中国地图、soso地图、aliyun地图、mapabc地图和高德地图所用的经纬度坐标'
  },
  {
    crs: 'gcoord.BD09',
    coordinateFormat: '[lng,lat]',
    desc: 'BD-09坐标系，百度地图采用的经纬度坐标'
  }
];
declare var google: any;
declare var BMap: any;

@Component({
  selector: 'app-cloud-run-gpx',
  templateUrl: './cloud-run-gpx.component.html',
  styleUrls: ['./cloud-run-gpx.component.scss']
})
export class CloudRunGpxComponent implements OnInit {
  fileLink: string;
  isUploading = false;
  originalFileName: string;
  transformFileName: string;
  maxFileSize = 10485760; // 10MB
  acceptFileExtensions = ['GPX'];
  file: any;
  fromFormat: string;
  toFormat: string;
  isShowDownloadBtn = false;
  displayedColumns: string[] = ['crs', 'coordinateFormat', 'desc'];
  dataSource = ELEMENT_DATA;
  isShowMap = true;
  @ViewChild('gmap') gmapElement: ElementRef;
  map: any;
  @ViewChild('bmap') bmapElement: ElementRef;
  bmap: any;
  mapDatas: any;
  gpxBmapPoints = [];
  isInChinaArea: boolean;
  gpxPoints = [];
  startMark: any;
  endMark: any;
  constructor(private innerAdminService: InnerAdminService) {}

  ngOnInit() {}
  handleAttachmentChange(file) {
    if (file) {
      const { value, link } = file;
      this.originalFileName = value.name;
      this.fileLink = link;
      this.file = value;
    }
  }
  downloadOriginalFile(e) {
    e.preventDefault();
    location.href = this.fileLink;
  }
  uploadFile() {
    if (this.fileLink && this.fromFormat && this.toFormat) {
      const formData = new FormData();
      formData.append('file', this.file);
      formData.append('fromFormat', this.fromFormat);
      formData.append('toFormat', this.toFormat);
      this.innerAdminService.uploadGpxFile(formData).subscribe(result => {
        if (result.resultCode === 200) {
          this.isShowDownloadBtn = true;
          this.transformFileName = result.fileName;
          this.mapDatas = result.coordinates;
          this.isInChinaArea = false;
          let isInTaiwan = false;
          let isSomeGpsPoint = false;
          this.mapDatas.forEach(_point => {
            if (
              this.handleBorderData(
                [+_point.longitudeDegrees, +_point.latitudeDegrees],
                taiwanBorder
              )
            ) {
              isInTaiwan = true;
            }
            if (
              this.handleBorderData(
                [+_point.longitudeDegrees, +_point.latitudeDegrees],
                chinaBorder
              )
            ) {
              this.isInChinaArea = true;
            }
            if (
              _point.hasOwnProperty('latitudeDegrees') &&
              +_point.latitudeDegrees !== 100 &&
              _point.latitudeDegrees &&
              !isSomeGpsPoint
            ) {
              isSomeGpsPoint = true;
            }
          });
          if (isSomeGpsPoint) {
            this.isShowMap = true;
          } else {
            this.isShowMap = false;
          }
          if (this.isShowMap) {
            this.handleGoogleMap(isInTaiwan);
            this.handleBMap();
          }
        } else {
          this.isShowDownloadBtn = false;
        }
      });
    }
  }
  downloadGPXFile() {
    this.innerAdminService.downloadGpxFile().subscribe(res => {
      const blob = new Blob([res], { type: 'application/xml' }); // 檔案類型 file type
      saveAs(blob, this.transformFileName);
    });
  }
  handleBMap() {
    this.bmap = new BMap.Map(this.bmapElement.nativeElement);
    let isNormalPoint = false;
    const originRealIdx = [];
    this.mapDatas.forEach((_point, idx) => {
      if (+_point.latitudeDegrees === 100 && +_point.longitudeDegrees === 100) {
        isNormalPoint = false;
        this.gpxBmapPoints.push(null);
      } else {
        if (!isNormalPoint) {
          isNormalPoint = true;
          originRealIdx.push(idx);
        }
        let p;
        if (this.isInChinaArea) {
          const transformPoint = transform(
            [
              parseFloat(_point.longitudeDegrees),
              parseFloat(_point.latitudeDegrees)
            ],
            WGS84,
            BD09
          );
          p = new BMap.Point(transformPoint[0], transformPoint[1]);
        } else {
          p = new BMap.Point(
            parseFloat(_point.longitudeDegrees),
            parseFloat(_point.latitudeDegrees)
          );
        }
        this.gpxBmapPoints.push(p);
      }
    });
    this.gpxBmapPoints = this.gpxBmapPoints.map((_gpxPoint, idx) => {
      if (!_gpxPoint) {
        const index = originRealIdx.findIndex(_tip => _tip > idx);
        if (index === -1) {
          return this.gpxBmapPoints[originRealIdx[originRealIdx.length - 1]];
        }
        return this.gpxBmapPoints[originRealIdx[index]];
      }
      return _gpxPoint;
    });
    const polyline = new BMap.Polyline(this.gpxBmapPoints); // 创建折线
    this.bmap.centerAndZoom(
      this.gpxBmapPoints[this.gpxBmapPoints.length - 1],
      16
    );

    this.bmap.enableScrollWheelZoom(true);
    const startIcon = new BMap.Icon(
      '/assets/map_marker_start.svg',
      new BMap.Size(33, 50),
      {
        anchor: new BMap.Size(16, 50)
      }
    );
    const startBMK = new BMap.Marker(this.gpxBmapPoints[0], {
      icon: startIcon
    });
    const endIcon = new BMap.Icon(
      '/assets/map_marker_end.svg',
      new BMap.Size(33, 50),
      {
        anchor: new BMap.Size(16, 50)
      }
    );
    const endBMK = new BMap.Marker(
      this.gpxBmapPoints[this.gpxBmapPoints.length - 1],
      {
        icon: endIcon
      }
    );
    const playIcon = new BMap.Icon(
      '/assets/map_marker_player.svg',
      new BMap.Size(12, 12),
      {
        anchor: new BMap.Size(6, 12)
      }
    );
    this.bmap.addOverlay(startBMK);
    this.bmap.addOverlay(endBMK);

    this.bmap.addOverlay(polyline); // 将折线覆盖到地图上
  }
  handleBorderData(point, vs) {
    const x = point[0],
      y = point[1];
    let inside = false;

    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0],
        yi = vs[i][1];
      const xj = vs[j][0],
        yj = vs[j][1];
      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  }
  handleGoogleMap(isInTaiwan) {
    const mapProp = {
      center: new google.maps.LatLng(24.123499, 120.66014),
      zoom: 18,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    this.map = new google.maps.Map(this.gmapElement.nativeElement, mapProp);
    const bounds = new google.maps.LatLngBounds();
    let isNormalPoint = false;
    const originRealIdx = [];
    this.mapDatas.forEach((_point, idx) => {
      if (+_point.latitudeDegrees === 100 && +_point.longitudeDegrees === 100) {
        isNormalPoint = false;
        this.gpxPoints.push(null);
      } else {
        if (!isNormalPoint) {
          isNormalPoint = true;
          originRealIdx.push(idx);
        }
        let p;
        if (this.isInChinaArea && !isInTaiwan) {
          const _transformPoint = transform(
            [
              parseFloat(_point.longitudeDegrees),
              parseFloat(_point.latitudeDegrees)
            ],
            WGS84,
            GCJ02
          );
          p = new google.maps.LatLng(_transformPoint[1], _transformPoint[0]);
        } else {
          p = new google.maps.LatLng(
            parseFloat(_point.latitudeDegrees),
            parseFloat(_point.longitudeDegrees)
          );
        }
        this.gpxPoints.push(p);
      }
    });
    this.gpxPoints = this.gpxPoints.map((_gpxPoint, idx) => {
      if (!_gpxPoint) {
        const index = originRealIdx.findIndex(_tip => _tip > idx);
        if (index === -1) {
          bounds.extend(
            this.gpxPoints[originRealIdx[originRealIdx.length - 1]]
          );
          return this.gpxPoints[originRealIdx[originRealIdx.length - 1]];
        }
        bounds.extend(this.gpxPoints[originRealIdx[index]]);
        return this.gpxPoints[originRealIdx[index]];
      }
      bounds.extend(_gpxPoint);
      return _gpxPoint;
    });
    this.startMark = new google.maps.Marker({
      position: this.gpxPoints[0],
      title: 'start point',
      icon: '/assets/map_marker_start.svg'
    });
    this.startMark.setMap(this.map);
    this.endMark = new google.maps.Marker({
      position: this.gpxPoints[this.gpxPoints.length - 1],
      title: 'end point',
      icon: '/assets/map_marker_end.svg'
    });
    this.endMark.setMap(this.map);
    const poly = new google.maps.Polyline({
      path: this.gpxPoints,
      strokeColor: '#FF00AA',
      strokeOpacity: 0.7,
      strokeWeight: 4
    });
    poly.setMap(this.map);
    this.map.fitBounds(bounds);
  }
}
