import { UserService } from './../../core/services/user.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CompletionRateDoughnutChartComponent } from './components/completion-rate-doughnut-chart/completion-rate-doughnut-chart.component';
import { ExerciseHabitsTrendChartComponent } from './components/exercise-habits-trend-chart/exercise-habits-trend-chart.component';
import { ExerciseHabitsDetailComponent } from './components/exercise-habits-detail/exercise-habits-detail.component';
import { TranslateModule } from '@ngx-translate/core';
import {
  Api531Post,
  Api531Response,
  ExerciseHabitsService,
} from './service/exercise-habits.service';
import { AuthService, HashIdService } from '../../core/services';
import { Subscription, filter, takeUntil } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { appPath } from '../../../app/app-path.const';
import { ProfessionalService } from '../professional/services/professional.service';
import dayjs from 'dayjs';
import { LoadingBarComponent, LoadingMaskComponent } from '../../components';

@Component({
  selector: 'app-exercise-habits',
  templateUrl: './exercise-habits.component.html',
  styleUrls: ['./exercise-habits.component.scss'],
  standalone: true,
  imports: [
    CompletionRateDoughnutChartComponent,
    ExerciseHabitsTrendChartComponent,
    ExerciseHabitsDetailComponent,
    TranslateModule,
    LoadingBarComponent,
    LoadingMaskComponent,
  ],
})
export class ExerciseHabitsComponent implements OnInit, OnDestroy {
  private exerciseHabitsSubscription: Subscription;

  /**
   * ui上會用到的各個flag
   */
  uiFlag = {
    calculateType: '531',
    isNoData: false,
  };

  /**
   * 頁面載入進度
   */
  progress = 100;

  /**
   * fetchAPI 所需條件
   * @type {Api531Post}
   */
  body: Api531Post = {
    filterStartTime: dayjs()
      .subtract(3, 'month')
      .startOf('week')
      .day(1)
      .format('YYYY-MM-DDT00:00:00.000+08:00'), //'2023-05-01T00:00:00.000+08:00',
    filterEndTime: dayjs().format('YYYY-MM-DDT23:59:59.999+08:00'), //'2023-8-20T23:59:59.999+08:00',
    group_id: '',
    targetUserId: [],
    token: this.authService.token,
    select_type: 0,
    calculateType: this.uiFlag.calculateType, // 531 333 w150(150min/週)
  };

  constructor(
    private exerciseHabitsService: ExerciseHabitsService,
    private authService: AuthService,
    private professionalService: ProfessionalService,
    private userService: UserService,
    private hashIdService: HashIdService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.getGroupId();
    this.progress = 30;
  }

  // 切換頁面531/333/w150
  onCalculateTypeChange(newCalculateType: string) {
    this.uiFlag.calculateType = newCalculateType;
    this.exerciseHabitsService.updateCalculateType(newCalculateType);
    this.body.calculateType = newCalculateType;
    this.fetchAPI();
  }

  /**
   * 判斷頁面是否於群組頁，並取得當前頁面的群組ID
   */
  getGroupId() {
    this.progress = 40;
    this.body.group_id = '';
    const CurrentGroupInfo = this.professionalService.getCurrentGroupInfo();
    const [, , GroupPage] = location.pathname.split('/');
    const isGroupPage = GroupPage === appPath.professional.groupDetail.home;

    if (isGroupPage) {
      //群組
      this.body.group_id = CurrentGroupInfo.groupDetail.groupId;
      this.fetchAPI();
    } else {
      //個人
      this.body.group_id = '';
      this.checkPageOwner();
    }
  }

  /**
   * 確認頁面擁有者是否為登入者，取得targetUserId
   */
  checkPageOwner() {
    const [, firstPath, secondPath] = location.pathname.split('/');
    const isOtherOwner = firstPath === appPath.personal.home;
    this.body.targetUserId = isOtherOwner
      ? [+this.hashIdService.handleUserIdDecode(secondPath)]
      : [this.userService.getUser().userId];
    this.fetchAPI();
    this.progress = 50;
  }

  fetchAPI() {
    this.exerciseHabitsSubscription = this.exerciseHabitsService
      .fetchExerciseHabits(this.body)
      .subscribe((response: Api531Response) => {
        if (response.week_group === null) {
          //無資料
          this.exerciseHabitsService.setIfNoData(true);
          this.progress = 100;
        } else {
          this.exerciseHabitsService.set531Response(response);
          this.exerciseHabitsService.setIfNoData(false);
          this.progress = 100;
        }
      });
  }

  ngOnDestroy(): void {
    // 取消訂閱取得531API事件
    if (this.exerciseHabitsSubscription) {
      this.exerciseHabitsSubscription.unsubscribe();
    }
  }
}
