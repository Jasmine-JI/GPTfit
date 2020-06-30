import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpParams } from '@angular/common/http';
import { EventInfoService } from '../../services/event-info.service';

@Component({
  selector: 'app-top3-dialog',
  templateUrl: './top3-dialog.component.html',
  styleUrls: ['./top3-dialog.component.css']
})
export class Top3DialogComponent implements OnInit {
  mapDatas: any;
  topDatas: any;
  gender = 2;
  mapId: string;
  get sessionId() {
    return this.data.sessionId;
  }

  get eventId() {
    return this.data.eventId;
  }

  get mapIds() {
    const ids = this.data.mapIdStr.split(',').map(id => Number(id));
    return ids;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: any,
    private eventInfoService: EventInfoService
  ) {}

  ngOnInit() {
    this.mapId = this.mapIds[0];

    this.eventInfoService.fetchMapDatas().subscribe(res => {
      this.mapDatas = res;
      if (+this.mapId !== 0) {
        this.mapDatas = this.mapDatas.filter(
          _map => this.mapIds.some(_id => _id === _map.map_index) === true
        );
      }
    });
    this.handleDisplayData();
  }
  handleDisplayData() {
    let params = new HttpParams();
    params = params.set('sessionId', this.sessionId);
    params = params.set('eventId', this.eventId);
    params = params.set('mapId', this.mapId);
    if (this.gender < 2) {
      params = params.set('gender', this.gender.toString());
    }
    this.eventInfoService.getTop3(params).subscribe(res => {
      this.topDatas = res;
    });
  }

  changeGender({ index }) {
    if (index > 0) {
      this.gender = index - 1;
    } else {
      this.gender = 2;
    }

    this.handleDisplayData();
  }
}
