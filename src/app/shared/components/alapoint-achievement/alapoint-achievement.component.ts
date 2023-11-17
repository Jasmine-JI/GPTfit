import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, Api10xxService } from '../../../core/services';
import { Router } from '@angular/router';

@Component({
  selector: 'app-alapoint-achievement',
  templateUrl: './alapoint-achievement.component.html',
  styleUrls: ['./alapoint-achievement.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class AlapointAchievementComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  @Input() isPageOwner: boolean;
  alaPoint: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private api10xxService: Api10xxService
  ) {}

  ngOnInit() {
    this.getAlaZonePoint();
  }

  /**
   * 取得個人AlaPoint資料
   */
  getAlaZonePoint() {
    if (this.authService.token) {
      const body = { token: this.authService.token };
      this.api10xxService
        .fetchAlaZonePoint(body)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((_res) => {
          // console.log(_res);
          if (_res.data) {
            // console.log(_res.data[0]);
            this.alaPoint = _res.data[0];
          }
        });
    }
  }

  /**
   * 解除rxjs訂閱
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
