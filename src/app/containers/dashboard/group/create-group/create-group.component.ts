import { Component, OnInit, ViewEncapsulation, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormGroup } from '@angular/forms';
import { HashIdService } from '../../../../core/services';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../../../../shared/components/message-box/message-box.component';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { getUrlQueryStrings } from '../../../../core/utils';
import { appPath } from '../../../../app-path.const';
import { BrandType } from '../../../../core/enums/professional';
import { QueryString } from '../../../../core/enums/common';

/**
 * 新建的群組類別
 */
enum CreateGroupType {
  branch = 1,
  coach,
  normal,
  brand,
  enterprise,
}

@Component({
  selector: 'app-create-group',
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.scss', '../group-style.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CreateGroupComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  groupId: string;
  token: string;
  commercePlan: number;
  form: UntypedFormGroup;
  planName: string;
  createType = CreateGroupType.normal; // 1為新建分店， 2為新建教練課，3為新建群組，4為新建品牌，5為新建企業-kidin-1090114
  title: string;
  brandType = null;

  readonly BrandType = BrandType;

  constructor(
    private router: Router,
    public dialog: MatDialog,
    private translate: TranslateService,
    private hashIdService: HashIdService
  ) {}

  @HostListener('dragover', ['$event'])
  public onDragOver(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  @HostListener('dragleave', ['$event'])
  public onDragLeave(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  @HostListener('drop', ['$event'])
  public onDrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  ngOnInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    const { createType } = queryStrings;
    if (createType) this.createType = +createType;

    // 根據網址判斷欲建立何種群組-kidin-1090114
    const { adminManage } = appPath;
    this.createType =
      location.pathname.indexOf(adminManage.createComGroup) > -1
        ? CreateGroupType.enterprise
        : CreateGroupType.brand;
  }

  showConfirmMsg(type: BrandType) {
    switch (this.commercePlan) {
      case 1:
        this.planName = this.translate.instant('universal_group_experiencePlan');
        break;
      case 2:
        this.planName = this.translate.instant('universal_group_studioPlan');
        break;
      case 3:
        this.planName = this.translate.instant('universal_group_smePlan');
        break;
      default:
        this.planName = this.translate.instant('universal_group_customPlan');
    }

    this.dialog.open(MessageBoxComponent, {
      hasBackdrop: true,
      data: {
        title: 'Message',
        body: this.translate.instant('universal_group_youSelectProgram', {
          projectName: this.planName,
        }),
        confirmText: this.translate.instant('universal_operating_confirm'),
        cancelText: this.translate.instant('universal_operating_cancel'),
        onConfirm: () => {
          const { dashboard, professional } = appPath;
          const hashGroupId = this.hashIdService.handleGroupIdEncode('0-0-0-0-0-0');
          const pathName = `/${dashboard.home}/${professional.groupDetail.home}/${hashGroupId}/${professional.groupDetail.introduction}`;
          const query = `?${QueryString.createType}=brand&plan=${this.commercePlan}&brandType=${type}`;
          this.router.navigateByUrl(pathName + query);
        },
      },
    });
  }

  changePlan(_planIdx) {
    this.commercePlan = _planIdx;
  }

  /**
   * 解除rxjs訂閱
   * @author kidin-1090722
   */
  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
