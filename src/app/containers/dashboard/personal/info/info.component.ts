import { Component, OnInit, OnDestroy } from '@angular/core';
import { EditMode } from '../../models/personal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserService, HashIdService, AuthService } from '../../../../core/services';
import { DashboardService } from '../../services/dashboard.service';
import { checkResponse } from '../../../../core/utils';
import { appPath } from '../../../../app-path.const';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss', '../personal-child-page.scss'],
  standalone: true,
  imports: [NgIf, FormsModule, TranslateModule],
})
export class InfoComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  /**
   * ui 會用到的flag
   */
  uiFlag = {
    editMode: <EditMode>'close',
    isPageOwner: false,
  };

  inputDescription: string;

  /**
   * 頁面持有者 userProfile
   */
  pageOwnerUserProfile: any;

  constructor(
    private userService: UserService,
    private dashboardService: DashboardService,
    private hashIdService: HashIdService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getPageOwnerProfile();
  }

  /**
   * 取得頁面擁有者之個人資訊
   */
  getPageOwnerProfile() {
    const [, firstPath, secondPath] = location.pathname.split('/');
    const pageOwnerId =
      firstPath === appPath.personal.home
        ? +this.hashIdService.handleUserIdDecode(secondPath)
        : this.userService.getUser().userId;

    this.userService
      .getTargetUserInfo(pageOwnerId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.pageOwnerUserProfile = res;
        this.uiFlag.isPageOwner = this.authService.isLogin.value && pageOwnerId === res.userId;
      });
  }

  /**
   * 開啟編輯模式
   * @author kidin-1100813
   */
  openEditMode() {
    this.uiFlag.editMode = 'edit';
    this.inputDescription = this.userService.getUser().userProfile.description as string;
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
    const updateContent = { description: this.inputDescription };
    this.userService.updateUserProfile(updateContent).subscribe((res) => {
      if (checkResponse(res)) {
        this.inputDescription = undefined;
        this.dashboardService.setRxEditMode('complete');
      }
    });
  }

  /**
   * 取消訂閱rxjs
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
