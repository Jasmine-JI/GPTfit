import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { EventInfoService } from '../../services/event-info.service';
import { HttpParams } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Top3DialogComponent } from '../top3-dialog/top3-dialog.component';

@Component({
  selector: 'app-event-calendar',
  templateUrl: './event-calendar.component.html',
  styleUrls: ['./event-calendar.component.css']
})
export class EventCalendarComponent implements OnInit {
  selectedDay: Date;
  selectedMonth = '';
  dayHeaders = ['日', '一', '二', '三', '四', '五', '六'];
  dayColors = ['red', 'black', 'black', 'black', 'black', 'black', 'green'];
  days = [];
  lastMonth_colspan = 0;
  selectedItem: any;
  session_id: number;
  id: number;
  sessionMonth: string;
  events: any;
  todayStamp = Date.now() / 1000;
  isLoading = false;
  constructor(
    private router: Router,
    private eventInfoService: EventInfoService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.getToday();
  }

  getToday() {
    this.selectedDay = new Date();
    this.getDay();
  }

  getDay(addDMonth: number = 0) {
    let year = this.selectedDay.getFullYear();
    let month = this.selectedDay.getMonth() + addDMonth;
    const dt = new Date(year, month, 1);
    year = dt.getFullYear();
    month = dt.getMonth();

    const maxDay = new Date(year, month + 1, 0).getDate();
    const newDay = this.selectedDay.getDate();
    this.selectedDay = new Date(year, month, newDay < maxDay ? newDay : maxDay);
    const dayNumber = this.selectedDay.getDate();
    this.lastMonth_colspan = new Date(year, month, 1).getDay();
    const _days = [];
    for (let day = 1; day <= 31; day++) {
      const time = new Date(year, month, day);
      if (time.getMonth() > month) {
        break;
      }
      const isSelected = time.getDate() === dayNumber;
      const d: any = {
        notes: [],
        isSelected: isSelected,
        datetime: time,
        day: day,
        week: time.getDay()
      };
      if (isSelected) {
        this.selectedItem = d;
      }
      _days.push(d);
    }
    this.days = [..._days];
    month++;
    // month為13時表示隔年的1月。
    if (month === 13) {
      month = 1;
      year++;
    }
    this.selectedMonth = `${year} 年 ${month} 月`;
    this.getNote(month);
  }

  selectdDay(item: any) {
    if (this.selectedItem) {
      this.selectedItem.isSelected = false;
    }
    item.isSelected = true;
    this.selectedItem = item;
    this.selectedDay = item.datetime;
  }

  getNote(month) {
    this.id = 1;
    const params = new HttpParams();
    this.isLoading = true;
    this.eventInfoService.fetchEventInfo(params).subscribe(events => {
      this.isLoading = false;
      this.events = events;
      if (this.days.length > 0) {
        this.events.map(_event => {
          const {
            event_name,
            session_name,
            start_date,
            event_id,
            session_id,
            time_stamp_end,
            specific_map
          } = _event;
          const subject = event_name + session_name;
          const session_startDate = moment(
            moment(start_date).format('YYYY-MM-DDT00:00:00')
          ).unix();
          this.days.forEach(item => {
            const isEventEnd = time_stamp_end < this.todayStamp ? true : false;
            if (moment(item.datetime).unix() === session_startDate) {
              item.notes.push({
                type: 2,
                subject,
                session_id,
                event_id,
                isEventEnd,
                specific_map
              });
              item.notes.sort((a, b) => a.session_id - b.session_id);
            }
          });
        });
      }
    });
  }
  goEnrollFrom(event_id, session_id) {
    this.router.navigateByUrl(
      '/dashboard/enroll/' + `${event_id}` + `?session_id=${session_id}`
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
}
