import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule, NgIf } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MomentDateAdapter,
} from '@angular/material-moment-adapter';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatNativeDateModule,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import _, { cloneDeep } from 'lodash';
import { Subject, takeUntil } from 'rxjs';
import { Domain, WebIp } from '../../../../../core/enums/common';
import { UserService } from '../../../../../core/services';
import { orderListResponse } from '../../../models/order-api.model';
import { EquipmentManagementService } from '../../../services/equipment-management.service';
import dayjs from 'dayjs';

const DATE_FORMAT = {
  parse: {
    dateInput: 'YYYY-MM-DD',
  },
  display: {
    dateInput: 'YYYY-MM-DD',
    monthYearLabel: 'YYYY MMM',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY MMMM',
  },
};

@Component({
  selector: 'app-edit-equipment',
  templateUrl: './edit-equipment.component.html',
  styleUrls: ['./edit-equipment.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: DATE_FORMAT },
  ],
})
export class EditEquipmentComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('fileInput') fileInput: ElementRef;

  @Input() editing: boolean;
  @Input() isNewForm: boolean;
  @Input() rigisterProd: boolean;
  @Input() serial_no: string;
  @Output() editingChange = new EventEmitter();
  // @Output() isNewFormChange = new EventEmitter();
  @Output() infoChange = new EventEmitter();
  @Output() anotherProdAdd = new EventEmitter();

  private ngUnsubscribe = new Subject();
  orderDetail: orderListResponse;
  modifyCteateName = this.userService.getUser().nickname;

  orderProd = {
    index_id: null,
    order_no: null,
    product_type: '',
    serial_no: '',
    install_date: '',
    install_type: '新裝',
    status: '',
    return_exchange: '',
    warranty_start: '',
    warranty_end: '',
    attach_file: '',
    memo: '',
    create_name: this.modifyCteateName,
  };

  originOrderProd = {
    index_id: null,
    order_no: null,
    product_type: '',
    serial_no: '',
    install_date: '',
    install_type: '新裝',
    status: '',
    return_exchange: '',
    warranty_start: '',
    warranty_end: '',
    attach_file: '',
    memo: '',
    create_name: this.modifyCteateName,
  };

  ProdLastModify = {
    modify_name: '',
    modify_time: '',
  };

  filesMaxLength = 260;
  filesMax = false;
  fileNames: string[] = [];
  productTypeList: string[] = ['飛輪', '跑步機', '划船機']; //產品類型清單
  returnExchangeList: string[] = ['退貨', '換貨']; //退換貨狀態
  installTypeList: string[] = ['新裝', '換裝']; //安裝狀態清單

  showProductTypeDropdown = false;
  showReturnExchangeDropdown = false;
  showInstallTypeDropdown = false;

  readonly imgPath = `http://${
    location.hostname.includes(WebIp.develop) ? Domain.uat : location.hostname
  }/img/`;

  constructor(
    private userService: UserService,
    private equipmentManagementService: EquipmentManagementService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    // this.judgeEdmitMode();
    this.fileNames = [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.isNewForm) {
      // 这里执行当 isNewForm 变化时的逻辑
      this.judgeEdmitMode();
    }
  }

  /**
   * 更改安裝日期
   */
  changeDate(type: string, date: Date) {
    switch (type) {
      case 'install_date':
        this.orderProd.install_date = dayjs(date).format('YYYY-MM-DD');
        break;
      case 'warranty_start':
        this.orderProd.warranty_start = dayjs(date).format('YYYY-MM-DD');
        break;
      case 'warranty_end':
        this.orderProd.warranty_end = dayjs(date).format('YYYY-MM-DD');
        break;

      default:
        break;
    }
  }

  openImage(imageUrl: string) {
    window.open(imageUrl, '_blank');
  }

  deleteImg(fileName: string) {
    const index = this.fileNames.indexOf(fileName);
    if (index !== -1) {
      this.fileNames.splice(index, 1);
      this.orderProd.attach_file = this.fileNames.join(',');
      this.filesMax = this.orderProd.attach_file.length > this.filesMaxLength ? true : false;
    }
  }

  previewImg(fileInput: HTMLInputElement) {
    const file = fileInput.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      console.log(formData);

      this.uploadImage(formData);
      fileInput.value = '';
    }
  }

  uploadImage(formData: any) {
    const dataType = 'order';
    this.equipmentManagementService.uploadImageApi(formData, dataType).subscribe((res) => {
      if (res.error) {
        //上傳失敗(非圖片檔)
        alert(res.description);
      } else {
        //上傳成功
        if (this.orderProd.attach_file) {
          //原字串有 attach_file
          if (
            this.orderProd.attach_file === 'None' ||
            this.orderProd.attach_file === null ||
            this.orderProd.attach_file.length < 10
          ) {
            this.orderProd.attach_file = '';
            this.orderProd.attach_file = res.imgUrl;
          } else {
            this.orderProd.attach_file += ',' + res.imgUrl;
          }
        } else {
          //原字串沒有 attach_file
          this.orderProd.attach_file = '';
          this.orderProd.attach_file = res.imgUrl;
        }
        this.setFileArray();
        console.log(this.fileNames);
      }
    });
  }

  toggleDropdown(type: string) {
    switch (type) {
      case 'product_type':
        this.showProductTypeDropdown = !this.showProductTypeDropdown;
        if (this.showProductTypeDropdown) {
          this.showReturnExchangeDropdown = false;
          this.showInstallTypeDropdown = false;
        }
        break;

      case 'return_exchange':
        this.showReturnExchangeDropdown = !this.showReturnExchangeDropdown;
        if (this.showReturnExchangeDropdown) {
          this.showProductTypeDropdown = false;
          this.showInstallTypeDropdown = false;
        }
        break;

      case 'install_type':
        this.showInstallTypeDropdown = !this.showInstallTypeDropdown;
        if (this.showInstallTypeDropdown) {
          this.showProductTypeDropdown = false;
          this.showReturnExchangeDropdown = false;
        }
        break;
      default:
        break;
    }
  }

  selectType(type: string, option: string | null) {
    switch (type) {
      case 'product_type':
        this.orderProd.product_type = option;
        this.showProductTypeDropdown = !this.showProductTypeDropdown;
        break;

      case 'return_exchange':
        this.orderProd.return_exchange = option;
        this.showReturnExchangeDropdown = !this.showReturnExchangeDropdown;
        break;

      case 'install_type':
        this.orderProd.install_type = option;
        this.showInstallTypeDropdown = !this.showInstallTypeDropdown;
        break;

      default:
        break;
    }
  }

  /**
   * 判斷視窗為新增或修改
   */
  judgeEdmitMode() {
    if (this.editing) {
      if (this.isNewForm) {
        //新增視窗
        console.log('新增產品');
        this.getOrderListDetail();
      } else {
        //修改視窗
        console.log('修改產品');
        this.equipmentManagementService.targetProdInfo$.subscribe((_targetProdInfo) => {
          this.orderProd = cloneDeep(_targetProdInfo);
          this.originOrderProd = cloneDeep(_targetProdInfo);
          this.setFileArray();
        });
      }
    }
  }

  getOrderListDetail() {
    this.equipmentManagementService
      .getOrderDetail()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.orderDetail = res;
        if (this.orderDetail) {
          this.orderProd.serial_no = this.serial_no ? this.serial_no : '';
          console.log(this.orderProd.serial_no);

          this.orderProd.order_no = this.orderDetail.order[0].order_no;
          this.setFileArray();
          this.originOrderProd = cloneDeep(this.orderProd);
        }
      });
  }

  setFileArray() {
    if (this.orderProd && this.orderProd.attach_file) {
      if (this.orderProd.attach_file === 'None' || this.orderProd.attach_file === null) {
        this.fileNames = [];
        this.orderProd.attach_file = '';
      } else {
        this.filesMax = this.orderProd.attach_file.length > this.filesMaxLength ? true : false;
        this.fileNames = this.orderProd.attach_file.split(',');
      }
    } else {
      this.fileNames = [];
    }
  }

  /**
   * 判斷是否已有變更過的內容，無變更內容則退出視窗
   * @param btn
   */
  checkInfoChange(btn: string) {
    if (!_.isEqual(this.orderProd, this.originOrderProd)) {
      //物件內容深層比較，有變更
      console.log('orderProd:', this.orderProd);
      console.log('originOrderProd:', this.originOrderProd);

      switch (btn) {
        case 'save':
          this.checkoutContent();
          break;
        case 'close':
          this.alertInfoChanged();
          break;
        default:
          break;
      }
    } else {
      this.closeEdit();
    }
  }

  checkoutContent() {
    const { product_type, serial_no, install_date, return_exchange, warranty_start, warranty_end } =
      this.orderProd;
    this.orderProd.status =
      return_exchange === '' || return_exchange === 'None' ? 'online' : 'offline';
    console.log('lenth:', serial_no.length);

    if (product_type === null || product_type === '') {
      alert('請選擇產品類型');
    } else if (serial_no.length !== 14) {
      console.log(serial_no.length);

      alert('產品序號長度須為14碼');
    } else if (install_date === null || install_date === '') {
      alert('請輸入安裝日期');
    } else if (warranty_start === null || warranty_start === '') {
      alert('請輸入保固開始日期');
    } else if (warranty_end === null || warranty_end === '') {
      alert('請輸入保固結束日期');
    } else {
      if (this.isNewForm) {
        const params = { serial_no: serial_no };
        this.equipmentManagementService
          .getProdDetailApi(params)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((prodsList) => {
            const new_install_type = prodsList.order ? '換裝' : '新裝';
            console.log('new_install_type;', new_install_type);
            if (this.orderProd.install_type !== new_install_type) {
              alert('此產品為換裝設備');
              // this.orderProd.install_type = new_install_type
              // this.addOrderInfo();
            } else {
              this.addOrderInfo();
            }
          });
      } else {
        this.updateOrderInfo();
      }
    }
  }

  /**
   * 提示框_是否儲存變更內容
   */
  alertInfoChanged() {
    if (confirm('是否儲存已變更內容?') == true) {
      this.clickSaveBtn();
    } else {
      this.closeEdit();
      this.orderProd = cloneDeep(this.originOrderProd);
    }
  }

  /**
   * 新增 - 儲存內容
   */
  addOrderInfo() {
    const {
      order_no,
      product_type,
      serial_no,
      install_date,
      install_type,
      status,
      return_exchange,
      warranty_start,
      warranty_end,
      memo,
      attach_file,
    } = this.orderProd;

    const addProdData = {
      order_no,
      product_type,
      serial_no,
      install_date,
      install_type,
      status,
      return_exchange,
      warranty_start,
      warranty_end,
      memo,
      attach_file,
      create_name: this.modifyCteateName,
    };

    console.log('addOrderProdApi addProdData:', addProdData);

    this.equipmentManagementService
      .addOrderProdApi(addProdData)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((response) => {
        if (response.error) {
          alert(response.description);
        } else if (!response.error) {
          alert('新增成功');
          console.log('addOrderProdApi:', response);

          this.closeEdit();
          this.infoChange.emit();
          if (this.orderDetail.product.length > 0) {
            //回傳更新時間-待廢棄
            this.anotherProdAdd.emit(this.orderProd.serial_no);
          }
        }
      });
  }

  /**
   * 修改產品 - 儲存內容
   */
  updateOrderInfo() {
    const {
      index_id,
      product_type,
      serial_no,
      install_date,
      install_type,
      status,
      return_exchange,
      warranty_start,
      warranty_end,
      attach_file,
      memo,
    } = this.orderProd;
    console.log(this.orderProd);
    console.log(this.originOrderProd);

    const updateData = {
      index_id,
      product_type,
      serial_no,
      install_date,
      install_type,
      status,
      return_exchange,
      warranty_start,
      warranty_end,
      attach_file,
      memo,
      modify_name: this.modifyCteateName,
    };

    if (!_.isEqual(this.orderProd, this.originOrderProd)) {
      // 有改變
      this.equipmentManagementService
        .updateOrderProdApi(updateData)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((response) => {
          if (response.error) {
            alert(response.description);
          } else if (!response.error) {
            alert('修改成功');
            console.log('addOrderProdApi:', response);
            this.closeEdit();
            this.infoChange.emit();
          }
        });
    }
  }

  /**
   * 點擊儲存按鈕
   */
  clickSaveBtn() {
    this.checkInfoChange('save');
    // this.closeEdit();
  }

  /**
   * 點擊 x 按鈕
   */
  clickCloseBtn() {
    this.checkInfoChange('close');
  }

  /**
   * 退出編輯視窗
   */
  closeEdit() {
    this.orderProd = cloneDeep(this.originOrderProd);
    this.editing = false;
    this.setFileArray();
    // this.isNewFormChange.emit(this.isNewForm);
    this.editingChange.emit(this.editing);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
