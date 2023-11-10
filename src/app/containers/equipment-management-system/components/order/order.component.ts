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
  prodSerialArray: string[];
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
        if (orderDetail.error) {
          alert(orderDetail.description);
          window.history.back(); //返回上一頁
        } else {
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
    this.prodSerialArray = this.orderProds?.map((product) => product.serial_no);
    // console.log(this.prodSerialArray);
    // this.findLatestTime();
  }

  findLatestTime() {
    let latestTime = new Date(0);
    let latestProduct;
    for (const product of this.orderProds) {
      const createTime = product.create_time ? new Date(product.create_time) : null;
      const modifyTime = product.modify_time ? new Date(product.modify_time) : null;
      const productTime = createTime && createTime > modifyTime ? createTime : modifyTime;
      if (productTime && productTime > latestTime) {
        latestTime = productTime;
        latestProduct = product;
      }
    }
    // console.log("Latest Product Information:", latestProduct);
  }

  setOrderFixReq() {
    this.orderFixReq = cloneDeep(this.orderDetail.repair?.reverse());
    // console.log('orderFixReq:', this.orderFixReq);
  }

  getSerialNoArray(serial_no: string) {
    const serialNoArray = serial_no.split(',');
    return serialNoArray;
  }

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
            this.router.navigate(['/equipment-management/news']);
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
