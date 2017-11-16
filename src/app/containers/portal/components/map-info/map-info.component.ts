import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import queryString from 'query-string';

@Component({
  selector: 'app-map-info',
  templateUrl: './map-info.component.html',
  styleUrls: ['./map-info.component.css']
})
export class MapInfoComponent implements OnInit {
  constructor(private _location: Location, private http: HttpClient) {}
  EMPTY_OBJECT = {};
  data: any;
  mapData: any;
  ngOnInit() {
    const queryStrings = this.getUrlQueryStrings(location.search);
    const {
      mapId,
      month,
      userId
    } = queryStrings;
    this.fetchSportData(mapId, month, userId);
    this.fetchMapData(mapId, userId);

  }
  fetchSportData(mapId, month, userId) {
    let params = new HttpParams();
    params = params.append('mapId', mapId);
    params = params.append('month', month);
    params = params.append('userId', userId);
    this.http
      .get('http://192.168.1.235:3000/rankform/mapInfo', { params })
      .subscribe(res => {
        this.data = res;
      });
  }
  fetchMapData(mapId, userId) {
    let params = new HttpParams();
    params = params.append('mapId', mapId);
    params = params.append('userId', userId);

    this.http
      .get('http://192.168.1.235:3000/rankform/mapInfo/map', { params })
      .subscribe(res => {
        this.mapData = res;
    });
  }
  getUrlQueryStrings(_search) {
    const search = _search || window.location.search;
    if (!search) {
      return this.EMPTY_OBJECT;
    }
    return queryString.parse(search);
  }
}
