import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import Calendar from 'tui-calendar';
import * as moment from 'moment';
import { ActivatedRoute } from '@angular/router';

import { ActivityService } from '../../services/activity.service';
import { UtilsService } from '@shared/services/utils.service';
import { HashIdService } from '@shared/services/hash-id.service';

@Component({
  selector: 'app-tui-calender',
  templateUrl: './tui-calender.component.html',
  styleUrls: ['./tui-calender.component.scss']
})
export class TuiCalenderComponent implements OnInit, OnChanges {

  @Output() classTime: EventEmitter<any> = new EventEmitter();

  // UI用變數-kidin-1090319
  isLoading = false;
  calendarType = 'week';

  // 資料儲存用變數-kidin-1090319
  groupId: string;
  calendar: Calendar;
  calendarRange: string;
  startTime: any;
  endTime: any;

  constructor(
    private activityService: ActivityService,
    private utils: UtilsService,
    private hashIdService: HashIdService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    const hashGroupId = this.route.snapshot.paramMap.get('groupId');
    this.groupId = this.hashIdService.handleGroupIdDecode(hashGroupId);

    this.calendar = new Calendar('#calendar', {
      defaultView: 'week',  // 預設以週做顯示-kidin-1090318
      taskView: false,
      isReadOnly: true,
      month: {
        isAlways6Week: false
      },
      week: {
        hourStart: 6,
        hourEnd: 23
      },
      template: {
        timegridDisplayPrimaryTime: function(time) {
          return `${time.hour}:00`;
        }
      }
    });

    this.getClassTime();

    this.calendar.on('clickSchedule', this.emitClassTime.bind(this));
  }

  ngOnChanges () {}

  // 取得日曆現在顯示的範圍日期-kidin-1090318
  getCalendarDate () {
    const calendarStartTime = this.calendar.getDateRangeStart().getTime(),
          calendarEndTime = this.calendar.getDateRangeEnd().getTime();

    this.calendarRange = `${moment(calendarStartTime).format('YYYY/MM/DD')} ~ ${moment(calendarEndTime).format('YYYY/MM/DD')}`;
    this.startTime = this.getFuzzyTime(calendarStartTime, 'startTime');
    this.endTime = this.getFuzzyTime(calendarEndTime, 'endTime');
  }

  // 切換日曆-kidin-1090318
  switchCalendar (act: string) {
    switch (act) {
      case 'today':
        this.calendar.today();
        break;
      case 'prev':
        this.calendar.prev();
        break;
      case 'next':
        this.calendar.next();
        break;
      case 'week':
        this.calendarType = act;
        this.calendar.changeView('week', true);
        break;
      case 'month':
        this.calendarType = act;
        this.calendar.changeView('month', true);
        break;
    }

    this.getClassTime();
  }

  // 取得當地時區並加以處理-kidin-1081210
  getFuzzyTime (time, type) {
    const date = moment(time).format('YYYY-MM-DD'),
          timeZoneMinite = new Date(),
          timeZone = -(timeZoneMinite.getTimezoneOffset() / 60);
    let timeZoneStr = '';
    if (timeZone < 10 && timeZone >= 0) {
      timeZoneStr = `+0${timeZone}`;
    } else if (timeZone > 10) {
      timeZoneStr = `+${timeZone}`;
    } else if (timeZone > -10 && timeZone < 0) {
      timeZoneStr = `-0${timeZone}`;
    } else {
      timeZoneStr = `-${timeZone}`;
    }

    // 取得使用者選擇的時間後，換算成24小時-kidin-1081220
    if (type === 'startTime') {
      return `${date}T00:00:00.000${timeZoneStr}:00`;
    } else {
      return `${date}T23:59:59.000${timeZoneStr}:00`;
    }
  }

  // 取得課程時間-kidin-1090318
  getClassTime () {
    this.isLoading = true;
    this.getCalendarDate();

    const body = {
      token: this.utils.getToken() || '',
      searchTime: {
        type: '1',
        fuzzyTime: '',
        filterStartTime: this.startTime,
        filterEndTime: this.endTime,
        filterSameTime: '2'
      },
      searchRule: {
        activity: '99',
        targetUser: '2',
        fileInfo: {
          author: '',
          dispName: '',
          equipmentSN: '',
          class: this.groupId,
          teacher: '',
          tag: ''
        }
      },
      display: {
        activityLapLayerDisplay: '3',
        activityLapLayerDataField: [],
        activityPointLayerDisplay: '3',
        activityPointLayerDataField: []
      },
      page: '0',
      pageCounts: '1000'
    };

    this.activityService.fetchMultiActivityData(body).subscribe(res => {
      const activities = res.info.activities;

      const schedule = [];
      let bgColor = '';
      for (let i = 0; i < activities.length; i++) {
        switch (activities[i].activityInfoLayer.type) {
          case '1':
            bgColor = '#ea5757';
            break;
          case '2':
            bgColor = '#ff9a22';
            break;
          case '3':
            bgColor = '#f9cc3d';
            break;
          case '4':
            bgColor = '#cfef4b';
            break;
          case '5':
            bgColor = '#75f25f';
            break;
          case '6':
            bgColor = '#72e8b0';
            break;
        }

        const startTimeStamp = moment(activities[i].fileInfo.creationDate).unix() * 1000,
              endTimeStamp = startTimeStamp + activities[i].activityInfoLayer.totalSecond * 1000;

          schedule.push({
            id: i,
            calendarId: '1',
            title: activities[i].fileInfo.dispName,
            category: 'time',
            dueDateClass: '',
            start: activities[i].fileInfo.creationDate,
            end: moment(endTimeStamp).format(),
            isReadOnly: true,
            borderColor: 'white',
            body: activities[i].activityInfoLayer.type,
            customStyle: `background-color: ${bgColor};`
          });

      }

      this.calendar.clear();
      this.calendar.createSchedules(schedule);
      this.calendar.render();

      this.isLoading = false;
    });
  }

  // 將開課時間發送給父組件-kidin-1090319
  emitClassTime (event) {
    const classInfo = {
      time: event.schedule.start.getTime(),
      type: event.schedule.body
    };

    this.classTime.emit(classInfo);
  }
}
