import { NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../../core/services';
import {
  fixReqListParameters,
  orderListParameters,
  orderListResponse,
  registerListParameters,
} from '../../models/order-api.model';
import { EquipmentManagementService } from '../../services/equipment-management.service';
import { EditEquipmentComponent } from '../equipment/edit-equipment/edit-equipment.component';
import { EditMaintenanceRequirementComponent } from '../maintenance-requirement/edit-maintenance-requirement/edit-maintenance-requirement.component';
import { EditOrderComponent } from '../order/edit-order/edit-order.component';
import { EditRepairComponent } from '../repair/edit-repair/edit-repair.component';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    RouterLink,
    EditOrderComponent,
    EditMaintenanceRequirementComponent,
    EditEquipmentComponent,
    EditRepairComponent,
  ],
})
export class NewsComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  constructor(
    private equipmentManagementService: EquipmentManagementService,
    private userService: UserService,
    private router: Router
  ) {}

  uiFlag = {
    orderList: [],
    registerList: [],
    fixReqList: [],
    selectOption: 'order',
  };

  NewFixReq: boolean; //在首頁新增叫修單
  rigisterProd: boolean;
  serial_no: string;
  isNewForm: boolean;
  editOrder: boolean; // 銷貨單編輯
  editrRepair: boolean; // 維修編輯
  editFixReq: boolean; // 叫修編輯
  editProd: boolean; // 產品編輯
  showAddListDropdown: boolean;
  showRigisterProdDropdown = {
    show: false,
    item: null,
  };

  orderBody: orderListParameters = {
    item_count: 5, //最新銷貨單數量
    // order_no:0,
  };

  fixReqBody: fixReqListParameters = {
    item_count: 5,
    // repair_id:0,
  };

  registerBody: registerListParameters = {
    item_count: null,
    // equipment_sn:0,
  };

  // response data
  OrderListResponse: orderListResponse;
  registerListResponse: any;
  fixReqListResponse: any;

  ngOnInit() {
    this.getOrderList();
    this.getRegisterList();
    this.getFixReqList();
  }

  editForm(type: string, sn?: string) {
    this.closeAllDropdown();
    this.closeAllEdit();
    switch (type) {
      case 'order':
        this.editOrder = true;
        this.isNewForm = true;
        break;

      case 'fixReq': //叫修
        this.editFixReq = true;
        this.isNewForm = true;
        this.NewFixReq = true;
        break;

      case 'repair': //在首頁不新增維修頁
        this.editrRepair = true;
        this.isNewForm = true;
        break;

      case 'product':
        this.editProd = true;
        this.isNewForm = true;
        this.rigisterProd = true;
        this.serial_no = sn;
        break;

      default:
        break;
    }
  }

  closeAllEdit() {
    this.editOrder = false;
    this.editFixReq = false;
    this.editrRepair = false;
    this.editProd = false;
    this.isNewForm = false;
    this.rigisterProd = false;
  }

  closeAllDropdown() {
    this.showAddListDropdown = false;
    this.showRigisterProdDropdown.show = false;
  }

  selectOption(option: string) {
    this.uiFlag.selectOption = option;
  }

  dropDown(e: string, i?: number) {
    switch (e) {
      case 'add_list':
        this.showRigisterProdDropdown.show = false;
        this.showAddListDropdown = !this.showAddListDropdown;
        break;
      case 'rigisterProd':
        this.showAddListDropdown = false;
        if (this.showRigisterProdDropdown.item === i) {
          this.showRigisterProdDropdown.show = !this.showRigisterProdDropdown.show;
        } else {
          this.showRigisterProdDropdown.show = true;
          this.showRigisterProdDropdown.item = i;
        }
        break;
      default:
        break;
    }
  }

  /**
   * 取得銷貨list
   */
  getOrderList() {
    this.equipmentManagementService
      .getOrderListApi(this.orderBody)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.OrderListResponse = res;
        if (this.OrderListResponse) {
          this.uiFlag.orderList = res.order?.reverse();
          if (this.isNewForm) {
            const order_no = this.uiFlag.orderList[0].order_no;
            this.router.navigateByUrl(`/equipment-management/order/${order_no}`);
          }
        }
      });
  }

  /**
   * 取得叫修list
   */
  getFixReqList() {
    this.equipmentManagementService
      .getFixReqListApi(this.fixReqBody)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.fixReqListResponse = res;
        if (this.fixReqListResponse) {
          this.uiFlag.fixReqList = res.repair_form?.reverse();
          if (this.NewFixReq) {
            const repair_id = this.uiFlag.fixReqList[0].repair_id;
            this.router.navigateByUrl(`/equipment-management/maintenance-requirement/${repair_id}`);
          }
        }
      });
  }

  /**
   * 取得註冊待審核商品list
   */
  getRegisterList() {
    this.equipmentManagementService
      .getRegisterListApi(this.registerBody)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.registerListResponse = res;
        if (this.registerListResponse) {
          this.uiFlag.registerList = res.data?.reverse();
          // console.log(this.uiFlag.registerList);
          if (this.uiFlag.registerList) {
            this.getRegisterNickname();
          }
        }
      });
    if (this.rigisterProd) {
      // console.log('進行navigateByUrl');
      this.router.navigateByUrl(`/equipment-management/equipment/${this.serial_no}`);
    }
  }

  getRegisterNickname() {
    this.uiFlag.registerList.forEach((item, index) => {
      const userId = item.user_id;

      // 使用userService來獲取nickname
      this.userService
        .getTargetUserInfo(userId)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((res) => {
          // console.log(res);

          // 假設獲取的nickname存儲在res.nickname中
          const nickname = res.nickname;

          // 更新registerList中對應的對象的值
          this.uiFlag.registerList[index] = {
            ...item,
            user_id: nickname, // 將獲取的nickname添加到對象中
          };
        });
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
