import { Component, OnInit, OnDestroy } from '@angular/core';
import { GroupDetailInfo, UserSimpleInfo, MemberInfo } from '../../../models/group-detail';
import { CalenderDay } from '../../../models/report';
import { GroupService } from '../../../services/group.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import moment from 'moment';
import { ActivityService } from '../../../../../shared/services/activity.service';

const errMsg = `Error.<br />Please try again later.`;

@Component({
  selector: 'app-class-analysis',
  templateUrl: './class-analysis.component.html',
  styleUrls: ['./class-analysis.component.scss', '../group-info.component.scss']
})
export class ClassAnalysisComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  /**
   * UI會用到的各個flag
   */
  uiFlag = {
    preFocus: [null, null]
  };

  /**
   * 此群組相關資料
   */
  groupInfo = <GroupDetailInfo>{};

  /**
   * 使用者個人資訊（含權限）
   */
  userSimpleInfo: UserSimpleInfo;


  memberList: Array<MemberInfo> = [];

  /**
   * 行事曆所需變數
   */
  calender = {
    currentTimestamp: moment().endOf('day').valueOf(),
    startTimestamp: moment(moment().subtract(1, 'weeks')).startOf('week').valueOf(),
    endTimestamp: moment().endOf('week').valueOf(),
    weekOne: <Array<CalenderDay>>[],
    weekTwo: <Array<CalenderDay>>[]
  }

  constructor(
    private groupService: GroupService,
    private utils: UtilsService,
    private activityService: ActivityService
  ) { }

  ngOnInit(): void {
    this.initPage();
    this.createCalender();
  }

  /**
   * 取得已儲存的群組詳細資訊、階層群組資訊、使用者資訊
   * @author kidin-1091020
   */
  initPage() {
    combineLatest([
      this.groupService.getRxGroupDetail(),
      this.groupService.getRxCommerceInfo(),
      this.groupService.getUserSimpleInfo()
    ]).pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(resArr => {
      this.groupInfo = resArr[0];
      Object.assign(resArr[0], {groupLevel: this.utils.displayGroupLevel(resArr[0].groupId)});
      Object.assign(resArr[0], {expired: resArr[1].expired});
      Object.assign(resArr[0], {commerceStatus: resArr[1].commerceStatus});
      this.userSimpleInfo = resArr[2];
    })

  }

  /**
   * 取得成員名單
   * @author kidin-1091111
   */
  getMemberList() {
    this.groupService.getClassMemberList().pipe(

    )
    const body = {
      token: this.userSimpleInfo.token,
      groupId: this.groupInfo.groupId,
      groupLevel: this.utils.displayGroupLevel(this.groupInfo.groupId),
      infoType: 3,
      avatarType: 3
    }

    this.groupService.fetchGroupMemberList(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.log(`${res.resultCode}: Api ${res.apiCode} ${res.resultMessage}`);
      } else {
        console.log('res', res);
        this.sortMember(res.info.groupMemberInfo);
      }
      
    });

  }

  /**
   * 將成員依加入狀態分類
   * @param memArr {Array<MemberInfo>}-api 1103回應的groupMemberInfo內容
   * @author kidin-1091111
   */
  sortMember(memArr: Array<MemberInfo>) {
    this.memberList.length = 0;
    memArr.forEach(_mem => {
      if (_mem.joinStatus === 2) {
        this.memberList.push(_mem);
      }

    });

    this.groupService.setClassMemberList(this.memberList);
  }

  /**
   * 產生行事曆
   * @author kidin-1091113
   */
  createCalender() {
    this.calender.weekOne.length = 0;
    this.calender.weekTwo.length = 0;
    for (let i = 0; i < 14; i++) {
      
      if (i < 7) {
        this.calender.weekOne.push({
          day: +moment(this.calender.startTimestamp).add(i, 'days').format('DD'),
          timestamp: moment(this.calender.startTimestamp).add(i, 'days').endOf('day').valueOf(),
          haveDate: false,
          focus: false
        })
      } else {
        this.calender.weekTwo.push({
          day: +moment(this.calender.startTimestamp).add(i, 'days').format('DD'),
          timestamp: moment(this.calender.startTimestamp).add(i, 'days').endOf('day').valueOf(),
          haveDate: false,
          focus: false
        })

      }

    }

    console.log('calender', this.calender);
    this.getClassList();
  }

  /**
   * 取得兩週課程列表
   */
  getClassList() {
    const body = {
      token: this.utils.getToken() || '',
      searchTime: {
        type: '1',
        fuzzyTime: '',
        filterStartTime: moment(this.calender.startTimestamp).format('YYYY-MM-DDThh:mm:ss'),
        filterEndTime: moment(this.calender.endTimestamp).format('YYYY-MM-DDThh:mm:ss'),
        filterSameTime: '2'
      },
      searchRule: {
        activity: '99',
        targetUser: [],
        fileInfo: {
          author: '',
          dispName: '',
          equipmentSN: '',
          class: '',
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
      console.log('analysis', res);
    });

  }

  /**
   * 往前或往後切換日曆
   * @param action {'pre' | 'next'}-切換日曆的動作
   * @author kidin-1091113
   */
  switchCalender(action: 'pre' | 'next') {
    if (action === 'pre') {
      this.calender.startTimestamp = moment(this.calender.startTimestamp).subtract( 14, 'days').valueOf();
      this.calender.endTimestamp = moment(this.calender.endTimestamp).subtract(14, 'days').valueOf();
    } else {
      this.calender.startTimestamp = moment(this.calender.startTimestamp).add(14, 'days').valueOf();
      this.calender.endTimestamp = moment(this.calender.endTimestamp).add(14, 'days').valueOf();
    }

    this.createCalender();
  }

  /**
   * 使用者點擊行事曆的日期後顯示當天已舉行的課程
   * @param weekIdx {'weekOne' | 'weekTwo'}-行事曆的第一列還是第二列
   * @param dayIdx {number}-該列第幾個
   * @author kidin-1091113
   */
  focusOneDay(week: 'weekOne' | 'weekTwo', dayIdx: number) {
    this.calender[week][dayIdx].focus = true;
    if (this.uiFlag.preFocus[0] !== null) {
      this.calender[this.uiFlag.preFocus[0]][this.uiFlag.preFocus[1]].focus = false;
    
    }
    
    this.uiFlag.preFocus = [week, dayIdx];
  }

  /**
   * 取消rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
