import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Location } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { MapGPXService } from '@shared/services/map-gpx.service';
import { MapService } from '@shared/services/map.service';
import { ActivatedRoute } from '@angular/router';
import { RankFormService } from '../../services/rank-form.service';
import { getUrlQueryStrings } from '@shared/utils/';
import { Router } from '@angular/router';

@Component({
  selector: 'app-map-info',
  templateUrl: './map-info.component.html',
  styleUrls: ['./map-info.component.css']
})
export class MapInfoComponent implements OnInit, AfterViewInit {
  constructor(
    public _location: Location, // 調用location.back()，來回到上一頁
    private _mapGpxService: MapGPXService,
    private mapSerivce: MapService,
    private rankFormService: RankFormService,
    private router: Router
  ) {}
  EMPTY_OBJECT = {};
  data: any;
  mapData: any;

  activity: any;
  activityName: string;
  activityComments: string;
  activityDate: Date;
  activityDistance: number;
  gpx: any;
  bgImageUrl: string;
  isLoading = false;
  mapImages: any;
  ngOnInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    const { mapId, month, userId, event, start_time, end_time } = queryStrings;

    this.fetchSportData(mapId, month, userId, event, start_time, end_time);
    this.mapSerivce.getMapUrls().subscribe(res => {
      this.mapImages = res;
      this.bgImageUrl = `url(${this.mapImages[mapId - 1]})`;
    });
    this.activity = this._mapGpxService.getActivity(Number(mapId));
  }
  ngAfterViewInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    const { mapId } = queryStrings;
    this._mapGpxService.plotActivity(Number(mapId));
    this.gpx = this.activity.gpxData;
  }
  fetchSportData(mapId, month, userId, event, start_time, end_time) {
    this.isLoading = true;
    let params = new HttpParams();
    params = params.set('mapId', mapId);
    if (month) {
      params = params.set('month', month);
    }
    if (event && event === '1') {
      params = params.set('isRealTime', 'true');
      params = params.set('start_time', start_time);
      params = params.set('end_time', end_time);
    }
    params = params.set('userId', userId);
    this.rankFormService.getMapInfos(params).subscribe(res => {
      this.data = res;
      this.isLoading = false;
    });
  }
  goBack() {
    const hosts = [
      '192.168.1.235',
      'app.alatech.com.tw',
      'cloud.alatech.com.tw'
    ];
    const isHostName = hosts.some(
      _host => document.referrer.indexOf(_host) > -1
    );

    if (isHostName) {
      return window.history.back();
    }
    return this.router.navigateByUrl('/');
  }
}
