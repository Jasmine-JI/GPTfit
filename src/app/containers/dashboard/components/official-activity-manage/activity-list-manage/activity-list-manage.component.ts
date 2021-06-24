import { Router } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import moment from 'moment';
import { HashIdService } from '../../../../../shared/services/hash-id.service';
import { OfficialActivityService } from '../../../../../shared/services/official-activity.service';
import { UtilsService } from '../../../../../shared/services/utils.service';
import { UserProfileService } from '../../../../../shared/services/user-profile.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-activity-list-manage',
  templateUrl: './activity-list-manage.component.html',
  styleUrls: ['./activity-list-manage.component.scss']
})
export class ActivityListManageComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  uiFlag = {
    showRowBtn: null
  };

  activityList = [];

  currentTimeStamp = moment().valueOf();

  constructor(
    private router: Router,
    private hashIdService: HashIdService,
    private officialActivityService: OfficialActivityService,
    private utils: UtilsService,
    private userProfileService: UserProfileService
  ) { }

  ngOnInit(): void {
    this.getActivityList();
    this.getEventRangeDate();
  }

  /**
   * 取得所有活動列表
   * @author kidin-1090903
   */
  getActivityList() {
    const body = {
      token: this.utils.getToken() || ''
    };

    this.officialActivityService.getAllOfficialActivity(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.error(`Error: ${res.resultMessage}`);
      } else {
        this.activityList = res.activityList.sort((a, b) => b.finalTimeStamp - a.finalTimeStamp);
        this.getEventRangeDate();
      }

    });

  }

  /**
   * 取得各賽事舉行期間
   * @author kidin-1090825
   */
  getEventRangeDate(): void {
    this.activityList.map(_list => {
      Object.assign(_list, {'range': `${this.formatEventDate(_list.startTimeStamp)} 到 ${this.formatEventDate(_list.finalTimeStamp)}`});
      return _list;
    });

  }

  /**
   * 由timestamp轉換成賽事日期
   * @format YY-MM-DD
   * @author kidin-1090825
   */
  formatEventDate(timeStamp: number): string {
    return moment(timeStamp).format('YY-MM-DD');
  }

  /**
   * 點擊列表後展開或收合該列表
   * @event click
   * @param index {number}
   * @author kidin-1090826
   */
  handleExpandRow(index: number): void {
    if (this.uiFlag.showRowBtn === null || this.uiFlag.showRowBtn !== index) {
      this.uiFlag.showRowBtn = index;
    } else {
      this.uiFlag.showRowBtn = null;
    }

  }

  /**
   * 轉導指定頁面
   * @param page {string}
   * @param id {number}
   * @author kidin-1090826
   */
  handleNavigatePage(page: string, id: number = null) {
    switch (page) {
      case 'create':
        this.createActivity();
        break;
      case 'edit':
        this.router.navigateByUrl(`/dashboard/system/event-management/edit?file=${this.activityList[id].fileName}`);
        break;
      case 'member':
        this.router.navigateByUrl(`/dashboard/system/event-management/participants?file=${this.activityList[id].fileName}`);
        break;
      case 'official':
        this.router.navigateByUrl(`/official-activity?file=${this.activityList[id].fileName}`);
        break;
    }

  }

  /**
   * 手動更新排行榜
   * @param index {number}
   * @author kidin-1090826
   */
  updateRanking(index: number) {
    const body = {
      token: this.utils.getToken() || '',
      fileName: this.activityList[index].fileName
    };

    this.officialActivityService.updateRank(body).subscribe(res => {
      if (res.resultCode !== 200) {
        console.error('Error:', res);
      }

    });

  }

  /**
   * 複製活動
   * @param index {number}
   * @author kidin-1091005
   */
  copyActivity(index: number) {
    const currentTimestamp = moment().valueOf(),
          hashTimeStamp = this.hashIdService.handleUserIdEncode(currentTimestamp.toString()), // 將創建時間（timestamp）hash過後當作檔名
          body = {
            token: this.utils.getToken(),
            newFileName: hashTimeStamp,
            targetFile: this.activityList[index].fileName
          };

    this.officialActivityService.copyOfficialActivity(body).subscribe(res => {

      if (res.resultCode !== 200) {
        console.error('Error', 'Copy activity failed');
      } else {
        this.router.navigateByUrl(`/dashboard/system/event-management/edit?file=${res.fileName}`);
      }
    
    });

  }

  /**
   * 創建新賽事
   * @author kidin-1090902
   */
  createActivity() {
    this.userProfileService.getRxUserProfile().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.writeFile(res.userId);
    });

  }

  /**
   * 使用預設值創鍵官方活動檔案
   * @param userId {number}
   * @author kidin-1090907
   */
  writeFile(userId: number) {
    const currentTimestamp = moment().valueOf(),
          hashTimeStamp = this.hashIdService.handleUserIdEncode(currentTimestamp.toString()), // 將創建時間（timestamp）hash過後當作檔名
          body = {
            token: this.utils.getToken() || '',
            file: {
              fileName: hashTimeStamp,
              name: '活動名稱',
              mapId: 1,
              mapDistance: 1450,
              eventStatus: 'private',
              canApply: true,
              startTimeStamp: moment().subtract(-1, 'month').startOf('month').valueOf(),  // 預設下個月1日
              endTimeStamp: moment().subtract(-1, 'month').endOf('month').valueOf(), // 預設下個月月底
              eventImage: '',
              mainColor: '#3d83f3',
              backgroundColor: '#ffffff',
              createTimeStamp: currentTimestamp,
              createUserId: userId,
              editTimeStamp: currentTimestamp,
              editUserId: null,
              card: [
                {
                  cardId: 0,
                  title: '主旨',
                  content: '內容',
                  bgColor: '#ff6565',
                  textAlign: 'start',
                  fontSize: '16',
                  color: '#000000',
                  img: ''
                },
                {
                  cardId: 1,
                  title: '報名與收費方式',
                  content: '內容',
                  bgColor: '#3db387',
                  textAlign: 'start',
                  fontSize: '16',
                  color: '#000000',
                  img: ''
                },
                {
                  cardId: 2,
                  title: '活動時間',
                  content: '內容',
                  bgColor: '#43425d',
                  textAlign: 'center',
                  fontSize: '16',
                  color: '#000000',
                  img: ''
                },
                {
                  cardId: 3,
                  title: '參加資格',
                  content: `內容`,
                  bgColor: '#ffffff',
                  textAlign: 'start',
                  fontSize: '16',
                  color: '#000000',
                  img: ''
                },
                {
                  cardId: 4,
                  title: '分組',
                  content: '不分組',
                  bgColor: '#ffffff',
                  textAlign: 'start',
                  fontSize: '16',
                  color: '#000000',
                  img: ''
                },
                {
                  cardId: 5,
                  title: '路線',
                  content: '內容',
                  bgColor: '#ffffff',
                  textAlign: 'start',
                  fontSize: '16',
                  color: '#000000',
                  img: ''
                },
                {
                  cardId: 6,
                  title: '注意事項',
                  content: '內容',
                  bgColor: '#ffffff',
                  textAlign: 'start',
                  fontSize: '16',
                  color: '#000000',
                  img: ''
                }
              ],
              group: [
                {
                  groupName: '不分組',
                  member: [],
                  rank: []
                }
              ],
              team: [],
              product: [],
              discount: [],
              delMember: []
            }
          };

    this.officialActivityService.createOfficialActivity(body).subscribe(res => {

        if (res.resultCode !== 200) {
          console.error('Error', 'Create activity failed');
        } else {
          this.router.navigateByUrl(`/dashboard/system/event-management/edit?file=${res.fileName}`);
        }

    });

  }

  /**
   * 取消訂閱
   * @author kidin-20200710
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
