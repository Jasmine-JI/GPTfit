import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { MapService } from '@shared/services/map.service';
import { ActivatedRoute } from '@angular/router';
import { RankFormService } from '../../services/rank-form.service';
import { getUrlQueryStrings } from '@shared/utils/';
import { mapImages } from '@shared/mapImages';

@Component({
  selector: 'app-map-info',
  templateUrl: './map-info.component.html',
  styleUrls: ['./map-info.component.css']
})
export class MapInfoComponent implements OnInit {
  constructor(
    private _location: Location, // 調用location.back()，來回到上一頁
    private _mapService: MapService,
    private rankFormService: RankFormService
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
  ngOnInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    const {
      mapId,
      month,
      userId
    } = queryStrings;
    this.bgImageUrl = `url(${mapImages[mapId - 1]})`;
    this.activity = this._mapService.getActivity(Number(mapId));

    this.fetchSportData(mapId, month, userId);
  }
  ngAfterViewInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    const { mapId } = queryStrings;
    this._mapService.plotActivity(Number(mapId));
    this.gpx = this.activity.gpxData;
  }
  fetchSportData(mapId, month, userId) {
    let params = new HttpParams();
    params = params.append('mapId', mapId);
    params = params.append('month', month);
    params = params.append('userId', userId);
    this.rankFormService.getMapInfos(params).subscribe(res => {
      this.data = res;
    });
  }
}
