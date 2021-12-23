import { Component, OnInit, OnDestroy } from '@angular/core';
import { EditMode } from '../../models/personal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UtilsService } from '../../../../shared/services/utils.service';
import { UserProfileService } from '../../../../shared/services/user-profile.service';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss', '../personal-child-page.scss']
})
export class InfoComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  /**
   * ui 會用到的flag
   */
  uiFlag = {
    editMode: <EditMode>'close'
  }

  userInfo: any;
  inputDescription: string;

  constructor(
    private utils: UtilsService,
    private userProfileService: UserProfileService,
    private dashboardService: DashboardService
  ) { }

  ngOnInit(): void {
    this.getRxUserProfile();
  }

  /**
   * 從rxjs取得userProfile
   * @author kidin-1100813
   */
  getRxUserProfile() {
    this.userProfileService.getRxTargetUserInfo().pipe(
      takeUntil(this.ngUnsubscribe)
    ).subscribe(res => {
      this.userInfo = res;
    });

  }

  /**
   * 開啟編輯模式
   * @author kidin-1100813
   */
  openEditMode() {
    this.uiFlag.editMode = 'edit';
    this.inputDescription = this.userInfo.description;
    this.dashboardService.setRxEditMode('edit');
  }

  /**
   * 取消編輯
   * @author kidin-1100813
   */
  cancelEdit() {
    this.uiFlag.editMode = 'close';
    // this.dashboardService.setRxEditMode('close');
  }

  /**
   * 完成編輯
   * @author kidin-1100813
   */
  editComplete() {
    this.uiFlag.editMode = 'close';
    if (this.inputDescription) {
      this.updateUserProfile();
    }

  }

  /**
   * 更新自我介紹
   * @author kidin-1100816
   */
  updateUserProfile() {
    const token = this.utils.getToken(),
          body = {
            token,
            userProfile: {
              description: this.inputDescription
            }
          };

    this.userProfileService.updateUserProfile(body).subscribe(res => {
      const { processResult, apiCode, resultCode, resultMessage } = res;
      if (!processResult) {
        this.utils.handleError(resultCode, apiCode, resultMessage);
      } else {
        const { apiCode, resultCode, resultMessage } = processResult;
        if (resultCode !== 200) {
          this.utils.handleError(resultCode, apiCode, resultMessage);
        } else {
          this.inputDescription = undefined;
          this.dashboardService.setRxEditMode('complete');
        }

      }

    });

  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
