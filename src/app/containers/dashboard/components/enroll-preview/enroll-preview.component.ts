import { Component, OnInit } from '@angular/core';
import { EventEnrollService } from '../../services/event-enroll.service';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { getUrlQueryStrings } from '@shared/utils/';
import { HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { EventInfoService } from '../../services/event-info.service';

@Component({
  selector: 'app-enroll-preview',
  templateUrl: './enroll-preview.component.html',
  styleUrls: ['./enroll-preview.component.css']
})
export class EnrollPreviewComponent implements OnInit {
  results: any;
  event_id: string;
  session_id: string;
  eventInfo: any;
  constructor(
    private eventEnrollService: EventEnrollService,
    private globalEventsManager: GlobalEventsManager,
    private route: ActivatedRoute,
    private eventInfoService: EventInfoService
  ) {}
  ngOnInit() {
    this.event_id = this.route.snapshot.paramMap.get('event_id');
    const queryStrings = getUrlQueryStrings(location.search);
    const { session_id } = queryStrings;
    this.session_id = session_id;
    this.getData();
    let params = new HttpParams();
    if (this.event_id && this.session_id) {
      params = params.set('event_id', this.event_id);
      params = params.set('session_id', this.session_id);
    }
    // this.eventInfoService
    //   .fetchEventInfo(params)
    //   .subscribe(datas => (this.eventInfo = datas[0]));
  }
  getData() {
    this.globalEventsManager.showLoading(true);
    let params = new HttpParams();
    if (this.event_id && this.session_id) {
      params = params.set('event_id', this.event_id);
      params = params.set('session_id', this.session_id);
    }
    this.eventEnrollService.fetchEnrollData(params).subscribe(_results => {
      this.globalEventsManager.showLoading(false);
      this.results = _results;
    });
  }
}
