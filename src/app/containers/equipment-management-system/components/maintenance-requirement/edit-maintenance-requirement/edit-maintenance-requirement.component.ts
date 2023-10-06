import { CommonModule, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { AuthService, UserService } from '../../../../../core/services';
import { EquipmentManagementService } from '../../../services/equipment-management.service';

@Component({
  selector: 'app-edit-maintenance-requirement',
  standalone: true,
  imports: [CommonModule, NgIf, FormsModule, MatIconModule],
  templateUrl: './edit-maintenance-requirement.component.html',
  styleUrls: ['./edit-maintenance-requirement.component.scss'],
})
export class EditMaintenanceRequirementComponent implements OnInit, OnDestroy {
  @Input() editing: boolean;
  @Input() isNewForm: boolean;
  @Output() editingChange = new EventEmitter();
  @Output() infoChange = new EventEmitter();
  private ngUnsubscribe = new Subject();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private equipmentManagementService: EquipmentManagementService
  ) {}

  ngOnInit(): void {
    // this.getOrderListDetail();
  }

  /**
   * 判斷按下儲存或x關閉按鈕
   * @param btn
   */
  //  checkInfoChange(btn: string) {
  //   if (!_.isEqual(this.orderInfo, this.originOrderInfo)) {
  //     //物件內容深層比較，有變更
  //     switch (btn) {
  //       case 'save':
  //         this.updateOrderInfo();
  //         break;
  //       case 'close':
  //         this.alertInfoChanged();
  //         break;

  //       default:
  //         break;
  //     }
  //   } else {
  //     this.closeEdit();
  //   }
  // }

  /**
   * 提示框_是否儲存變更內容
   */
  // alertInfoChanged() {
  //   if (confirm('是否儲存已變更內容?') == true) {
  //     this.clickSaveBtn();
  //   } else {
  //     this.closeEdit();
  //     this.orderInfo = { ...this.orderDetail.order[0] };
  //     this.fileNames = this.orderInfo.attach_file.split(',');
  //   }
  // }

  /**
   * 儲存變更內容
   */
  // updateOrderInfo() {
  //   const { order_no, user_name, phone, address, sales_channel, attach_file, memo } =
  //     this.orderInfo;

  //   const updateData: updateOrderInfoBody = {
  //     order_no,
  //     user_name,
  //     phone,
  //     address,
  //     sales_channel,
  //     memo,
  //     attach_file,
  //     modify_name: this.userService.getUser().nickname,
  //   };

  //   this.equipmentManagementService
  //     .updateOrderInfoApi(updateData)
  //     .pipe(takeUntil(this.ngUnsubscribe))
  //     .subscribe((response) => {
  //       console.log(response);
  //       if (!response.error) {
  //         console.log('編輯成功');
  //         console.log(updateData);
  //         console.log(this.orderInfo);

  //         this.closeEdit();
  //         this.infoChange.emit();
  //       }
  //     });
  // }

  /**
   * 點擊儲存按鈕
   */
  clickSaveBtn() {
    this.closeEdit(); //暫時
    // this.checkInfoChange('save');
  }

  /**
   * 點擊 x 按鈕
   */
  clickCloseBtn() {
    this.closeEdit(); //暫時
    // this.checkInfoChange('close');
  }

  /**
   * 退出編輯視窗
   */
  closeEdit() {
    this.editing = false;
    this.editingChange.emit(this.editing);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
