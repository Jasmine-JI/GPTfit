import { Component, OnInit } from '@angular/core';
import {
  Api531Response,
  ExerciseHabitsService,
  latest_two_month_response,
  latest_two_weeks_days,
  subData,
} from '../../service/exercise-habits.service';
import { CommonModule, NgFor } from '@angular/common';
import { ProfessionalService } from '../../../professional/services/professional.service';
import { Router } from '@angular/router';
import { appPath } from '../../../../app-path.const';
import { HashIdService } from '../../../../core/services';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-exercise-habits-detail',
  templateUrl: './exercise-habits-detail.component.html',
  styleUrls: ['./exercise-habits-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, NgFor, TranslateModule],
})
export class ExerciseHabitsDetailComponent implements OnInit {
  // post Response
  api531Response: Api531Response;
  ifNoData: boolean;
  subData: subData[];
  // 個人detail所需
  latest_two_month_response: latest_two_month_response[];
  latest_two_weeks_days: latest_two_weeks_days[];
  lastWeekValues: any;
  thisWeekValues: any;
  dayOfWeekName: string[] = ['Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.', 'Sun.'];
  lastMonthValues: any;
  thisMonthValues: any;
  WeekOfMonthName: string[] = ['Week1', 'Week2', 'Week3', 'Week4', 'Week5'];

  //是否降冪排列
  descendingOrder: { [sortDataOption: string]: boolean } = {
    last_week: null,
    this_week: null,
    name: null,
    this_month: null,
    last_month: null,
  };

  ngOnInit() {
    this.get531Response();
  }

  constructor(
    private exerciseHabitsService: ExerciseHabitsService,
    private professionalService: ProfessionalService,
    private router: Router,
    private hashIdService: HashIdService
  ) {}

  /**
   * 取回已儲存的 531API response
   */
  get531Response() {
    this.exerciseHabitsService.getIfNoDataObservable().subscribe((value) => {
      this.ifNoData = value;
    });
    if (this.ifNoData === false) {
      //有運動資料
      this.exerciseHabitsService.get531Response().subscribe((response: Api531Response) => {
        this.api531Response = response;
        this.getData(response);
      });
    }
  }

  /**
   * 取得頁面所需資料
   * @param response
   */
  getData(response: Api531Response) {
    if (this.api531Response) {
      this.subData = response.sub_data;
      //個人detail所需
      this.latest_two_month_response = response.latest_two_month_response;
      this.latest_two_weeks_days = response.latest_two_weeks_days;
      this.weeksValue();
      this.monthsValue();
      // 重置排序狀態
      Object.keys(this.descendingOrder).forEach((column) => {
        this.descendingOrder[column] = null;
      });
    }
  }

  /**
   * 依完成度填入背景顏色透明度
   */
  getBackgroundColor(opacity: number): string {
    return `rgba(102, 255, 163, ${opacity})`;
    // return `rgba(46, 196, 182, ${opacity})`;
  }

  roundToInteger(value: number): number {
    return Math.round(value * 100);
  }

  isToday(day: string) {
    const thisWeek = [...new Set(this.latest_two_weeks_days.map((item) => item.year_week_num))][1];
    const indexOfToday =
      this.latest_two_weeks_days.filter(
        (item) => item.year_week_num === thisWeek && item.day_of_week !== 'empty'
      ).length - 1;
    const indexOfEveryDay = this.dayOfWeekName.indexOf(day);
    return indexOfToday === indexOfEveryDay ? true : false;
  }

  isthisWeek(week: string) {
    const thisMonth = [
      ...new Set(this.latest_two_month_response.map((item) => item.year_month)),
    ][1];
    const numberOfWeek = this.latest_two_month_response.filter(
      (item) => item.year_month === thisMonth && item.year_week_num !== 'empty'
    ).length;
    const numberOfEeeryWeek = `Week${numberOfWeek}`;
    return week === numberOfEeeryWeek ? true : false;
  }

  weeksValue() {
    const twoWeeks = [...new Set(this.latest_two_weeks_days.map((item) => item.year_week_num))];
    const lastWeek = twoWeeks[0]; //上周週數
    const thisWeek = twoWeeks[1]; //本周週數

    this.lastWeekValues = this.getWeekValues(lastWeek);
    this.thisWeekValues = this.getWeekValues(thisWeek);
  }

  // 篩選符合週數的達成率資料
  getWeekValues(weekNum: string) {
    return this.latest_two_weeks_days
      .filter((item) => item.year_week_num === weekNum && item.day_of_week !== 'empty')
      .map((item) => item.avg_effect_value);
  }

  monthsValue() {
    const twoMonths = [...new Set(this.latest_two_month_response.map((item) => item.year_month))];
    const lastMonth = twoMonths[0]; //上月週數
    const thisMonth = twoMonths[1]; //本月週數

    this.lastMonthValues = this.getMonthValues(lastMonth);
    this.thisMonthValues = this.getMonthValues(thisMonth);
  }

  // 篩選符合月數的達成率資料
  getMonthValues(weekNum: string) {
    return this.latest_two_month_response
      .filter((item) => item.year_month === weekNum && item.year_week_num !== 'empty')
      .map((item) => item.effect_value);
  }

  /**
   * 依上周/本周/名稱/本月/上月排序
   */
  sortSubData(sortDataOption: string) {
    // 重置其他列的排序狀態
    Object.keys(this.descendingOrder).forEach((column) => {
      if (column !== sortDataOption) {
        this.descendingOrder[column] = null;
      }
    });
    const descendingOrder = this.descendingOrder[sortDataOption];
    const sortedData = this.subData.slice();
    switch (sortDataOption) {
      case 'last_week':
        sortedData.sort((a, b) =>
          descendingOrder ? a.last_week - b.last_week : b.last_week - a.last_week
        );
        break;
      case 'this_week':
        sortedData.sort((a, b) =>
          descendingOrder ? a.this_week - b.this_week : b.this_week - a.this_week
        );
        break;
      case 'name':
        sortedData.sort((a, b) =>
          descendingOrder ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        );
        break;
      case 'this_month':
        sortedData.sort((a, b) =>
          descendingOrder ? a.this_month - b.this_month : b.this_month - a.this_month
        );
        break;
      case 'last_month':
        sortedData.sort((a, b) =>
          descendingOrder ? a.last_month - b.last_month : b.last_month - a.last_month
        );
        break;
      default:
        break;
    }
    // 切換昇冪/降冪
    this.descendingOrder[sortDataOption] = !descendingOrder;
    this.subData = sortedData;
  }

  /**
   * 前往子群組或個人531頁面
   * @param id
   */
  routerDetailPage(id: string) {
    const targetGroupLevel = this.professionalService.getCurrentGroupInfo().groupLevel;
    console.log(targetGroupLevel);
    const { dashboard, personal, professional } = appPath;
    if (targetGroupLevel === 60) {
      //前往個人頁
      const hashUserId = this.hashIdService.handleUserIdEncode(id);
      const url = `/${appPath.personal.home}/${hashUserId}/${personal.exerciseHabits}`;
      window.open(url, '_blank');
    } else {
      //前往子群組
      const hashGroupId = this.hashIdService.handleGroupIdEncode(id);
      const url = `/${dashboard.home}/${professional.groupDetail.home}/${hashGroupId}/${professional.groupDetail.exerciseHabits}`;
      window.open(url, '_blank');
    }
  }
}
