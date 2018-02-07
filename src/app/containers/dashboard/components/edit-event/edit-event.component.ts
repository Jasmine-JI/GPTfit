import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventInfoService } from '../../services/event-info.service';
import { HttpParams } from '@angular/common/http';
import { IMyDpOptions } from 'mydatepicker';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import * as moment from 'moment';

@Component({
  selector: 'app-edit-event',
  templateUrl: './edit-event.component.html',
  styleUrls: ['./edit-event.component.css']
})
export class EditEventComponent implements OnInit {
  complexForm: FormGroup;
  event_id: string;
  events: any;
  startDateOptions: IMyDpOptions = {
    height: '30px',
    width: '200px',
    selectorWidth: '200px',
    dateFormat: 'yyyy-mm-dd',
    disableUntil: { year: 2017, month: 12, day: 4 }
  };
  endDateOptions: IMyDpOptions = {
    height: '30px',
    width: '200px',
    selectorWidth: '200px',
    dateFormat: 'yyyy-mm-dd',
    disableUntil: { year: 2017, month: 12, day: 4 }
  };
  startDay: any = {
    date: {
      year: 2017,
      month: 12,
      day: 20
    }
  };
  finalDay: any = {
    date: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getUTCDate()
    }
  };
  sessionStartDay: any = {
    date: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getUTCDate()
    }
  };
  sessionFinalDay: any = {
    date: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getUTCDate()
    }
  };
  startDate: string;
  endDate: string;

  constructor(
    private route: ActivatedRoute,
    private eventInfoService: EventInfoService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.complexForm = this.fb.group({
      // 定義表格的預設值
      event_name: ['', Validators.required],
      selectedStartDate: [this.startDay, Validators.required],
      selectedEndDate: [this.finalDay, Validators.required],
      event_timer_start: ['12:30', Validators.required],
      event_timer_end: ['02:30', Validators.required],
      launch_user_name: ['', Validators.required],
      description: '',
      sessionDatas: this.fb.array([])
    });
  }

  ngOnInit() {
    this.event_id = this.route.snapshot.paramMap.get('id');
    let params = new HttpParams();
    params = params.set('event_id', this.event_id);
    this.eventInfoService.fetchEventInfo(params).subscribe(_results => {
      const sessions = _results.filter(_data => {
        if (_data.session_id !== null) {
          return {
            session_id: _data.session_id,
            session_name: _data.session_name,
            start_date: _data.start_date,
            end_data: _data.end_date,
            time_stamp_start: _data.time_stamp_start,
            time_stamp_end: _data.time_stamp_end
          };
        }
      });
      const {
        description,
        event_name,
        event_time_end,
        event_time_name,
        event_time_start,
        launch_user_name
      } = _results[0];
      const data = {
        description,
        event_name,
        event_time_end,
        event_time_name,
        event_time_start,
        launch_user_name,
        sessions
      };
      this.events = data;
      const selectedStartDate = this.convertDateFormat(
        moment(event_time_start * 1000).format('YYYY-M-D')
      );
      const selectedEndDate = this.convertDateFormat(
        moment(event_time_end * 1000).format('YYYY-M-D')
      );
      const event_timer_start = moment(event_time_start * 1000).format('hh:mm');
      const event_timer_end = moment(event_time_end * 1000).format('hh:mm');
      const sessionArray = [];
      if (sessions) {
        sessions.forEach(session => {
          const {
            session_name,
            time_stamp_end,
            time_stamp_start,
            is_real_time,
            is_show_portal
          } = session;
          const isShowPortal = this.convertDBBoolean(is_show_portal);
          const isRealTime = this.convertDBBoolean(is_real_time);
          const session_start_date = this.convertDateFormat(
            moment(time_stamp_start * 1000).format('YYYY-M-D')
          );
          const session_end_date = this.convertDateFormat(
            moment(time_stamp_end * 1000).format('YYYY-M-D')
          );
          const session_start_time = moment(time_stamp_start * 1000).format(
            'hh:mm'
          );
          const session_end_time = moment(time_stamp_end * 1000).format(
            'hh:mm'
          );
          const sessionData = {
            isShowPortal,
            isRealTime,
            session_name,
            session_start_date,
            session_end_date,
            session_start_time,
            session_end_time
          };
          sessionArray.push(sessionData);
        });
        this.addItem(sessionArray);
      }

      this.complexForm.patchValue({
        description,
        event_name,
        selectedStartDate,
        selectedEndDate,
        event_timer_start,
        event_timer_end,
        launch_user_name
      });
    });
  }
  createForm(events) {
    const { event_name, description } = events;
    this.complexForm = this.fb.group({
      // 定義表格的預設值
      event_name: [event_name, Validators.required],
      selectedStartDate: [this.startDay, Validators.required],
      selectedEndDate: [this.finalDay, Validators.required],
      event_timer_start: ['12:30', Validators.required],
      event_timer_end: ['02:30', Validators.required],
      launch_user_name: ['', Validators.required],
      description,
      sessionDatas: this.fb.array(events)
    });
  }
  initSessions(): FormGroup {
    return this.fb.group({
      isShowPortal: [false],
      isRealTime: [false],
      session_name: ['', Validators.required],
      session_start_date: ['', Validators.required],
      session_start_time: ['', Validators.required],
      session_end_date: ['', Validators.required],
      session_end_time: ['', Validators.required]
    });
  }
  createSessions(data): FormGroup {
    const {
      session_name,
      session_start_date,
      session_start_time,
      session_end_date,
      session_end_time,
      isRealTime,
      isShowPortal
    } = data;
    return this.fb.group({
      isShowPortal: [isShowPortal],
      isRealTime: [isRealTime],
      session_name: [session_name, Validators.required],
      session_start_date: [session_start_date, Validators.required],
      session_start_time: [session_start_time, Validators.required],
      session_end_date: [session_end_date, Validators.required],
      session_end_time: [session_end_time, Validators.required]
    });
  }
  addItem(array): void {
    const control = <FormArray>this.complexForm.controls['sessionDatas'];
    if (array) {
      array.forEach(_data => {
        control.push(this.createSessions(_data));
      });
    } else {
      control.push(this.initSessions());
    }
  }
  removeItems(e, idx) {
    e.preventDefault();
    const control = <FormArray>this.complexForm.controls['sessionDatas'];
    control.removeAt(idx);
  }
  convertDateString(_date) {
    if (_date) {
      const { date: { day, month, year } } = _date;
      return year.toString() + '-' + month.toString() + '-' + day.toString();
    }
    return (
      new Date().getFullYear() +
      '-' +
      new Date().getMonth() +
      1 +
      '-' +
      new Date().getUTCDate()
    );
  }
  convertDateFormat(_date) {
    const dateArrs = _date.split('-');
    const data = {
      date: {
        year: dateArrs[0],
        month: dateArrs[1],
        day: dateArrs[2]
      }
    };
    return data;
  }
  submit({ value, valid }) {
    const {
      selectedEndDate,
      selectedStartDate,
      description,
      event_name,
      event_timer_end,
      event_timer_start,
      launch_user_name,
      sessionDatas
    } = value;

    const event_time_start =
      this.convertDateString(selectedStartDate) + ' ' + event_timer_start;
    const event_time_end =
      this.convertDateString(selectedEndDate) + ' ' + event_timer_end;
    const data = {
      event_id: this.event_id,
      event_name,
      event_time_start,
      event_time_end,
      launch_user_name,
      description,
      sessions: []
    };
    if (sessionDatas.length > 0) {
      const sessionResults = sessionDatas.map(_data => {
        const session_start_date =
          this.convertDateString(_data.session_start_date) +
          ' ' +
          _data.session_start_time;
        const session_end_date =
          this.convertDateString(_data.session_end_date) +
          ' ' +
          _data.session_end_time;
        return {
          isRealTime: _data.isRealTime,
          isShowPortal: _data.isShowPortal,
          session_name: _data.session_name,
          session_start_date,
          session_end_date,
          session_id: moment(session_start_date, 'YMDH').format('YMDH')
        };
      });
      data.sessions = sessionResults;
    }

    if (valid) {
      this.eventInfoService
        .updateEvent(data)
        .subscribe(results =>
          this.router.navigateByUrl('/dashboardalaala/event')
        );
    }
  }
  convertDBBoolean(value) {
    if (value === 0) {
      return false;
    }
    return true;
  }
}
