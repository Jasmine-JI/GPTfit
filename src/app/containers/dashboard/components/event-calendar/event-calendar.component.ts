import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Router } from '@angular/router';

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
  constructor(private router: Router) {}

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
    if (this.days.length > 0) {
      console.log('this.days: ', this.days);
      this.days.forEach(item => {
        const notes = [];
        const event_id = 1;
        const event_seesion = event_id + '-' + this.session_id;
        if (
          moment(item.datetime).unix() >= 1515513600 &&
          moment(item.datetime).unix() <= 1518105600
        ) {
          if (item.week !== 0) {
            if (item.week !== 0 && item.week !== 1 && item.week !== 6) {
              notes.push({
                type: 2,
                subject: '第一屆英達高空夜跑賽(17:00-19:00)',
                event_seesion
              });
            }
            if (
              item.week === 6 &&
              moment(item.datetime).unix() >= 1515772800 &&
              moment(item.datetime).unix() <= 1516982400
            ) {
              notes.push({
                type: 2,
                subject: '第一屆英達高空夜跑賽(09:00-11:00)',
                event_seesion
              });
              // this.session_id++;
            }
          }
        }
        item.notes = notes;
      });
    }
  }
  goEnrollFrom(event_seesion) {
    console.log('event_seesion: ', event_seesion);
    const event_id = event_seesion.split('-')[0];
    console.log('!!!!', event_id);
    this.router.navigateByUrl('/dashboardalaala/enroll/' + `${event_id}`);
  }
}
