import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { IMyDpOptions } from 'mydatepicker';
import { EventInfoService } from '../../services/event-info.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl
} from '@angular/forms';
import { Router } from '@angular/router';
import { MsgDialogComponent } from '../msg-dialog/msg-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent implements OnInit {
  get sessionDatas() {
    return <FormArray>this.complexForm.get('sessionDatas');
  }
  complexForm: FormGroup;
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
  mapOptions: any;
  constructor(
    private eventInfoService: EventInfoService,
    private fb: FormBuilder,
    private router: Router,
    public dialog: MatDialog
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
    this.eventInfoService
      .fetchMapDatas()
      .subscribe(res => (this.mapOptions = res));
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
      event_name,
      event_time_start,
      event_time_end,
      launch_user_name,
      description,
      sessions: []
    };
    if (sessionDatas.length > 0) {
      const sessionResults = sessionDatas.map(_data => {
        if (!_data.isSpecificMap) {
          _data.chooseMaps = ['0'];
        }
        return {
          isRealTime: _data.isRealTime,
          isShowPortal: _data.isShowPortal,
          session_name: _data.session_name,
          session_start_date:
            _data.session_start_date.formatted + ' ' + _data.session_start_time,
          session_end_date:
            _data.session_end_date.formatted + ' ' + _data.session_end_time,
          isSpecificMap: _data.isSpecificMap,
          chooseMaps: _data.chooseMaps.join()
        };
      });
      data.sessions = sessionResults;
    }

    if (valid) {
      this.eventInfoService
        .createEvent(data)
        .subscribe(results => {
          if (results === 'duplicate eventId') {
            return this.dialog.open(MsgDialogComponent, {
              hasBackdrop: true,
              data: {
                title: 'Message',
                body: '此eventId已重複'
              }
            });
          }
          this.router.navigateByUrl('/dashboardalaala/event');
        });
    }
  }
  initSessions(): FormGroup {
    return this.fb.group({
      isShowPortal: [false],
      isRealTime: [false],
      session_name: ['', Validators.required],
      session_start_date: ['', Validators.required],
      session_start_time: ['', Validators.required],
      session_end_date: ['', Validators.required],
      session_end_time: ['', Validators.required],
      isSpecificMap: [false, Validators.required],
      chooseMaps: ''
    });
  }
  addItem(): void {
    const control = <FormArray>this.complexForm.controls['sessionDatas'];
    control.push(this.initSessions());
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
  checkBack() {
    this.dialog.open(MsgDialogComponent, {
      hasBackdrop: true,
      data: {
        title: 'Message',
        body: '是否確定返回',
        href: '/dashboardalaala/event'
      }
    });
  }
}
