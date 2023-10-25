import { KeyValuePipe, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  orderListParameters,
  orderListResponse,
  updateOrderInfoBody,
} from '../../models/order-api.model';
import { EquipmentManagementService } from '../../services/equipment-management.service';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, UserService } from '../../../../core/services';
import _ from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import { EditOrderComponent } from './edit-order/edit-order.component';
import { EditEquipmentComponent } from '../equipment/edit-equipment/edit-equipment.component';
import { EditMaintenanceRequirementComponent } from '../maintenance-requirement/edit-maintenance-requirement/edit-maintenance-requirement.component';
import { Domain, WebIp } from '../../../../core/enums/common';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss'],
  standalone: true,
  imports: [
    EditOrderComponent,
    EditEquipmentComponent,
    EditMaintenanceRequirementComponent,
    NgFor,
    NgIf,
    KeyValuePipe,
    RouterLink,
  ],
})
export class OrderComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  orderParameters: orderListParameters;
  orderDetail: orderListResponse;

  installTypeList = ['新裝', '換裝'];

  originOrderInfo: orderListResponse['order'][0] = {
    order_no: null,
    user_name: '',
    phone: '',
    address: '',
    sales_channel: '',
    memo: '',
    create_name: '',
    create_time: '',
    modify_name: '',
    modify_time: '',
    attach_file: '',
  };

  orderInfo: orderListResponse['order'][0] = {
    order_no: null,
    user_name: '',
    phone: '',
    address: '',
    sales_channel: '',
    memo: '',
    create_name: '',
    create_time: '',
    modify_name: '',
    modify_time: '',
    attach_file: '',
  };

  modify_name = this.userService.getUser().nickname;
  originOrderProds: orderListResponse['product'] = [];
  orderProds: orderListResponse['product'] = [];
  orderFixReq: orderListResponse['repair'] = [];
  serialNo = null;
  ProdLastModify = {
    //要篩選更新時間或新增時間最新的一筆
    modify_name: '',
    modify_time: '',
  };

  salesChannelList: string[] = [];
  // showSalesChannelDropdown = false;
  // showInstallTypeDropdown = { isOpen: false, selectedIndex: null };
  fileNames: string[] = [];
  isNewForm: boolean;
  editing: boolean; // 銷貨單_基本資料
  editProd: boolean; // 銷貨單_產品
  editFixReq: boolean; // 銷貨單_叫修

  readonly imgPath = `https://${
    location.hostname.includes(WebIp.develop) ? Domain.uat : location.hostname
  }/img/`;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private auth: AuthService,
    private userService: UserService,
    private equipmentManagementService: EquipmentManagementService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchOrderList();
  }

  changeProdModify(serialNo: string) {
    // console.log(serialNo);
    this.serialNo = serialNo;
  }

  editForm(type: string) {
    // this.closeAllDropdown();
    this.closeAllEdit();
    switch (type) {
      case 'info':
        this.editing = true;
        this.isNewForm = false;
        break;
      case 'product':
        this.editProd = true;
        this.isNewForm = true;
        break;

      case 'fixReq':
        this.editFixReq = true;
        this.isNewForm = true;
        break;

      default:
        break;
    }
  }

  closeAllEdit() {
    this.editing = false;
    this.editProd = false;
    this.editFixReq = false;
    this.isNewForm = false;
  }

  // closeAllDropdown() {
  //   this.showInstallTypeDropdown.isOpen = false;
  //   this.showSalesChannelDropdown = false;
  // }

  openImage(imageUrl: string) {
    window.open(imageUrl, '_blank');
  }

  /**
   * 呼叫API，並回傳所需資料
   */
  fetchOrderList() {
    this.getOrderParameters();
    this.equipmentManagementService
      .getOrderListApi(this.orderParameters)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((orderDetail) => {
        // 回傳基本資料
        this.equipmentManagementService.setOrderDetail(orderDetail); //set OrderDetail
        this.orderDetail = orderDetail;
        if (this.orderDetail) {
          this.setOrderInfo();
          this.setOrderProd();
          this.setOrderFixReq();
          if (this.serialNo) {
            this.getProdLastModify();
          }
        }
      });
  }

  getProdLastModify() {
    const matchingOrderProd = Object.values(this.orderProds).find(
      (orderProd) => orderProd.serial_no === this.serialNo
    );
    this.ProdLastModify.modify_name = matchingOrderProd.create_name;
    this.ProdLastModify.modify_time = matchingOrderProd.create_time;
  }

  /**
   * 取得目前銷貨單order_no
   */
  getOrderParameters() {
    this.equipmentManagementService.orderParameters$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((_orderParameters) => {
        this.orderParameters = _orderParameters;
      });
  }

  setOrderInfo() {
    this.originOrderInfo = this.orderDetail.order[0];
    this.orderInfo = { ...this.orderDetail.order[0] };
    if (this.orderInfo.attach_file) {
      if (this.orderInfo.attach_file === 'None') {
        this.fileNames = [];
        this.orderInfo.attach_file = '';
      } else {
        this.fileNames = this.orderInfo.attach_file.split(',');
      }
    } else {
      this.fileNames = [];
    }
  }

  setOrderProd() {
    this.originOrderProds = cloneDeep(this.orderDetail.product);
    this.orderProds = cloneDeep(this.orderDetail.product?.reverse());
    // console.log('orderProds:', this.orderProds);
  }

  setOrderFixReq() {
    this.orderFixReq = cloneDeep(this.orderDetail.repair?.reverse());
    // console.log('orderFixReq:', this.orderFixReq);
  }

  // toggleDropdown(type: string, i: number) {
  //   switch (type) {
  //     case 'salesChannel':
  //       this.showInstallTypeDropdown.isOpen = false;
  //       this.showSalesChannelDropdown = !this.showSalesChannelDropdown;
  //       break;
  //     case 'installType':
  //       this.showSalesChannelDropdown = false;
  //       if (this.showInstallTypeDropdown.selectedIndex === i) {
  //         this.showInstallTypeDropdown.isOpen = !this.showInstallTypeDropdown.isOpen;
  //       } else {
  //         this.showInstallTypeDropdown.isOpen = true;
  //       }
  //       this.showInstallTypeDropdown.selectedIndex = i;
  //       break;

  //     default:
  //       break;
  //   }
  // }

  // selectChannel(salesChannel: string) {
  //   // console.log('Selected Channel:', salesChannel);
  //   this.orderInfo.sales_channel = salesChannel;
  //   this.showSalesChannelDropdown = false;
  //   this.updateOrderInfo(); // 寫入資料庫
  // }

  // /**
  //  * 更新銷貨單資本資料
  //  */
  // updateOrderInfo() {
  //   const { order_no, user_name, phone, address, sales_channel, memo, attach_file } =
  //     this.orderInfo;

  //   const updateData: updateOrderInfoBody = {
  //     order_no,
  //     user_name,
  //     phone,
  //     address,
  //     sales_channel,
  //     memo,
  //     modify_name: this.modify_name,
  //     attach_file,
  //   };

  //   // console.log('內容是否相同:', _.isEqual(this.orderInfo, this.originOrderInfo));

  //   if (!_.isEqual(this.orderInfo, this.originOrderInfo)) {
  //     // 有改變
  //     this.equipmentManagementService
  //       .updateOrderInfoApi(updateData)
  //       .pipe(takeUntil(this.ngUnsubscribe))
  //       .subscribe((response) => {
  //         // console.log(response);
  //         if (!response.error) {
  //           // alert('編輯成功')
  //           this.fetchOrderList();
  //         }
  //       });
  //   }
  // }

  //   /**
  //  * 更新銷貨單資本資料
  //  */
  // updateOrderProd(i: number) {
  //   const {
  //     index_id,
  //     product_type,
  //     serial_no,
  //     install_date,
  //     install_type,
  //     status,
  //     return_exchange,
  //     warranty_start,
  //     warranty_end,
  //     attach_file,
  //     memo,
  //   } = this.orderProds[i];
  //   // console.log(this.orderProds[i]);
  //   // console.log(this.originOrderProds[i]);

  //   const updateData = {
  //     index_id,
  //     product_type,
  //     serial_no,
  //     install_date,
  //     install_type,
  //     status,
  //     return_exchange,
  //     warranty_start,
  //     warranty_end,
  //     attach_file,
  //     memo,
  //     modify_name: this.modify_name,
  //   };

  //   // console.log(
  //   //   'this.orderProds[i]:',
  //   //   this.orderProds[i],
  //   //   'this.originOrderProds[i]:',
  //   //   this.originOrderProds[i]
  //   // );
  //   // console.log('內容是否相同:', _.isEqual(this.orderProds[i], this.originOrderProds[i]));

  //   if (!_.isEqual(this.orderProds[i], this.originOrderProds[i])) {
  //     // 有改變
  //     this.equipmentManagementService
  //       .updateOrderProdApi(updateData)
  //       .pipe(takeUntil(this.ngUnsubscribe))
  //       .subscribe((response) => {
  //         console.log(response);
  //         if (!response.error) {
  //           // alert('編輯成功')
  //           this.fetchOrderList();
  //         }
  //       });
  //   }
  // }

  deleteOrder() {
    if (confirm(`確定刪除銷貨單${this.orderInfo.order_no}?`) == true) {
      this.equipmentManagementService
        .deleteOrderApi(this.orderInfo.order_no)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((res) => {
          if (res.error) {
            alert(res.description);
          } else {
            alert(`成功刪除銷貨單${this.orderInfo.order_no}`);
            this.router.navigate(['/equipment-management/search']);
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
