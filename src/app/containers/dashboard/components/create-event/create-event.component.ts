import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent implements OnInit {
  formData = {
    event_name: '',
    launch_user_name: '',
    description: '',
    event_timer_start: '14:30',
    event_timer_end: '14:30'
  };
  startDateOptions: IMyDpOptions = {
    height: '30px',
    width: '200px',
    selectorWidth: '200px',
    dateFormat: 'yyyy-mm-dd',
    disableUntil: { year: 2017, month: 12, day: 4 },
    disableSince: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getUTCDate() + 1
    }
  };
  endDateOptions: IMyDpOptions = {
    height: '30px',
    width: '200px',
    selectorWidth: '200px',
    dateFormat: 'yyyy-mm-dd',
    disableUntil: { year: 2017, month: 12, day: 4 },
    disableSince: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getUTCDate() + 1
    }
  };
  startDay: any = {
    date: {
      year: 2017,
      month: 12,
      day: 5
    }
  };
  finalDay: any = {
    date: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getUTCDate()
    }
  };
  startDate: string;
  endDate: string;
  sessionDatas = [];
  constructor() {}

  ngOnInit() {}
  submit({ value }) {
    console.log('value: ', value);
  }
  createSessions() {
    const data = {
      session_name: '',
      session_start_date: '',
      session_start_time: '',
      session_end_date: '',
      session_end_time: ''
    };
    this.sessionDatas.push(data);
  }
  removeItems(e, idx) {
    e.preventDefault();
    this.sessionDatas.splice(idx, 1);
  }
}
