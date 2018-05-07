import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventInfoService } from '../../services/event-info.service';
import { HttpParams } from '@angular/common/http';
import * as moment from 'moment';
import { Top3DialogComponent } from '../top3-dialog/top3-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-event-management',
  templateUrl: './event-management.component.html',
  styleUrls: ['./event-management.component.css']
})
export class EventManagementComponent implements OnInit {
  events: any;
  yetSessions: any;
  completeSessions: any;

  todayTimeStamp = Math.floor(Date.now() / 1000);
  isNotYetDone = false;
  constructor(
    private router: Router,
    private eventInfoService: EventInfoService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    const params = new HttpParams();
    this.getEventInfo(params);
  }
  goEnroll(eventId, sessionId) {
    this.router.navigateByUrl(
      `/dashboardalaala/enroll/${eventId}?session_id=${sessionId}`
    );
  }
  handleDisplayTop3(sessionId, eventId, mapIdStr) {
    this.dialog.open(Top3DialogComponent, {
      hasBackdrop: true,
      data: {
        sessionId,
        eventId,
        mapIdStr
      }
    });
  }
  getEventInfo(params) {
    this.eventInfoService.fetchEventInfo(params).subscribe(results => {
      const eventId = params.get('event_id');
      this.isNotYetDone = results.some(
        _result => _result.event_time_end > this.todayTimeStamp
      );
      if (!eventId) {
        this.events = results.filter((value, idx, self) => {
          return (
            self.findIndex(_self => _self.event_id === value.event_id) === idx
          );
        });
      } else {
        const idx = results.findIndex(_result => _result.event_id === eventId);
        const timeEnd = results[idx].event_time_end;
        if (timeEnd > this.todayTimeStamp) {
          this.yetSessions = results;
        } else {
          this.completeSessions = results;
        }
      }
    });
  }
  toggle(id) {
    let params = new HttpParams();
    params = params.set('event_id', id);
    this.getEventInfo(params);
  }
}
