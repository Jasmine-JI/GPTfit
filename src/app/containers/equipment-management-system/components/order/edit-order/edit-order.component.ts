import { KeyCode } from './../../../../../core/enums/common/key-code.enum';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import _, { cloneDeep } from 'lodash';
import { Subject, takeUntil } from 'rxjs';
import { Domain, WebIp } from '../../../../../core/enums/common';
import { UserService } from '../../../../../core/services';
import { orderListResponse, updateOrderInfoBody } from '../../../models/order-api.model';
import { EquipmentManagementService } from '../../../services/equipment-management.service';
import { EditSalesChannelComponent } from '../edit-sales-channel/edit-sales-channel.component';

@Component({
  selector: 'app-edit-order',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf, FormsModule, MatIconModule, EditSalesChannelComponent],
  templateUrl: './edit-order.component.html',
  styleUrls: ['./edit-order.component.scss'],
})
export class EditOrderComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('fileInput') fileInput: ElementRef;
  // orderForm: FormGroup;
  @Input() editing: boolean;
  @Input() isNewForm: boolean;
  @Output() editingChange = new EventEmitter();
  @Output() infoChange = new EventEmitter();
  private ngUnsubscribe = new Subject();

  orderDetail: orderListResponse;
  modifyCteateName = this.userService.getUser().nickname;

  orderForm = this.formBuilder.group({
    order_no: ['', Validators.required],
    user_name: ['', Validators.required],
    phone: ['', Validators.required],
    address: ['', Validators.required],
  });

  orderInfo = {
    order_no: '',
    user_name: '',
    phone: '',
    address: '',
    sales_channel: 'MOMO',
    attach_file: '',
    memo: '',
  };

  originOrderInfo = {
    order_no: '',
    user_name: '',
    phone: '',
    address: '',
    sales_channel: 'MOMO',
    attach_file: '',
    memo: '',
  };

  textLength: number;
  filesMaxLength = 260;
  filesMax = false;
  fileNames: string[] = [];
  salesChannelList: string[] = [];
  showSalesChannelDropdown = false;
  editSalesChannel = false;

  readonly imgPath = `https://${
    location.hostname.includes(WebIp.develop) ? Domain.uat : location.hostname
  }/img/`;

  constructor(
    private userService: UserService,
    private equipmentManagementService: EquipmentManagementService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.isNewForm || changes.editing) {
      this.judgeEdmitMode();
      this.textLength = this.orderInfo.memo?.length;
    }
    if (changes.editing) {
      this.closeAllDropdown();
      this.closeAllEdit();
      this.getSavedChannelList();
    }
  }

  countTextLength(text: string) {
    this.textLength = text.length;
  }

  onInput(event: any): void {
    event.target.value = event.target.value.replace(/[^0-9]/g, '');
    this.orderInfo.phone = event.target.value;
  }

  /**
   * 判斷視窗為新增或修改
   */
  judgeEdmitMode() {
    if (this.editing) {
      if (this.isNewForm) {
        //新增視窗
        // console.log('新增銷貨單');
        this.originOrderInfo = cloneDeep(this.orderInfo);
      } else {
        //修改視窗
        // console.log('修改銷貨單');
        this.getOrderListDetail();
      }
    }
  }

  openImage(imageUrl: string) {
    window.open(imageUrl, '_blank');
  }

  deleteImg(fileName: string) {
    const index = this.fileNames.indexOf(fileName);
    if (index !== -1) {
      this.fileNames.splice(index, 1);
      this.orderInfo.attach_file = this.fileNames.join(',');
      this.filesMax = this.orderInfo.attach_file.length > this.filesMaxLength ? true : false;
    }
  }

  previewImg(fileInput: HTMLInputElement) {
    const file = fileInput.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      // console.log(formData);
      // const url = URL.createObjectURL(file);
      // this.imageUrls.push(url);
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
        if (this.orderInfo.attach_file) {
          //原字串有 attach_file
          if (
            this.orderInfo.attach_file === 'None' ||
            this.orderInfo.attach_file === null ||
            this.orderInfo.attach_file.length < 10
          ) {
            this.orderInfo.attach_file = '';
            this.orderInfo.attach_file = res.imgUrl;
          } else {
            this.orderInfo.attach_file += ',' + res.imgUrl;
          }
        } else {
          //原字串沒有 attach_file
          this.orderInfo.attach_file = '';
          this.orderInfo.attach_file = res.imgUrl;
        }
        this.setFileArray();
        // console.log(this.fileNames);
      }
    });
  }

  setFileArray() {
    if (this.orderInfo && this.orderInfo.attach_file) {
      if (
        this.orderInfo.attach_file === 'None' ||
        this.orderInfo.attach_file === null ||
        this.orderInfo.attach_file === ''
      ) {
        this.fileNames = [];
        this.orderInfo.attach_file = '';
      } else {
        this.filesMax = this.orderInfo.attach_file.length > this.filesMaxLength ? true : false;
        this.fileNames = this.orderInfo.attach_file.split(',');
      }
    } else {
      this.fileNames = [];
    }
  }

  /**
   * 取得銷售通路列表
   */
  getSalesChannelsApi() {
    this.equipmentManagementService
      .getSalesChannelsApi()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        if (!res.error && res.data.name) {
          this.equipmentManagementService.setSalesChannels(res.data);
        } else if (res.error) {
          alert(res.description);
        }
      });
  }

  toggleSalesChannelDropdown() {
    this.showSalesChannelDropdown = !this.showSalesChannelDropdown;
    this.getSavedChannelList();
  }

  /**
   * 取得已儲存銷售渠道表
   */
  getSavedChannelList() {
    this.equipmentManagementService
      .getSalesChannels()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        if (!res) {
          // console.log(res);
          this.getSalesChannelsApi();
        } else {
          // console.log(res);
          this.salesChannelList = res.name;
        }
      });
  }

  selectChannel(salesChannel: string) {
    // console.log('Selected Channel:', salesChannel);
    this.orderInfo.sales_channel = salesChannel;
    this.showSalesChannelDropdown = false;
  }

  getOrderListDetail() {
    this.equipmentManagementService
      .getOrderDetail()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.orderDetail = res;
        if (this.orderDetail) {
          // console.log('orderDetail:', this.orderDetail.order[0]);
          // const targetOrderInfo = this.orderDetail.order[0];
          this.orderInfo = cloneDeep(this.orderDetail.order[0]);
          this.setFileArray();
          this.originOrderInfo = cloneDeep(this.orderDetail.order[0]);
        }
      });
  }

  /**
   * 判斷按下儲存或x關閉按鈕
   * @param btn
   */
  checkInfoChange(btn: string) {
    if (!_.isEqual(this.orderInfo, this.originOrderInfo)) {
      //物件內容深層比較，有變更
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
    const { order_no, user_name, phone, address } = this.orderInfo;
    this.orderForm.patchValue({
      order_no: order_no,
      user_name: user_name,
      phone: phone,
      address: address,
    });
    // if (order_no === null) {
    //   alert('請輸入銷貨單號');
    // } else if (user_name === '') {
    //   alert('請輸入名稱');
    // } else if (phone === null) {
    //   alert('請輸入電話');
    // } else if (address === '') {
    //   alert('請輸入地址');
    // } else {
    if (this.orderForm.valid) {
      if (this.isNewForm) {
        this.addOrderInfo();
      } else {
        this.updateOrderInfo();
      }
    } else {
      alert('請檢查填寫欄位');
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
      this.orderInfo = cloneDeep(this.originOrderInfo);
      this.fileNames = this.orderInfo.attach_file.split(',');
    }
  }

  /**
   * 新增銷貨單 - 儲存內容
   */
  addOrderInfo() {
    const { order_no, user_name, phone, address, sales_channel, attach_file, memo } =
      this.orderInfo;

    const updateData: updateOrderInfoBody = {
      order_no,
      user_name,
      phone,
      address,
      sales_channel,
      memo,
      attach_file,
      create_name: this.modifyCteateName,
    };

    this.equipmentManagementService
      .addOrderInfoApi(updateData)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((response) => {
        // console.log(response);
        if (response.error) {
          alert(response.description);
        } else if (!response.error) {
          alert('新增成功');
          // console.log(updateData);
          // console.log(response);

          this.closeEdit();
          this.infoChange.emit();
        }
      });
  }

  /**
   * 修改銷貨單 - 儲存內容
   */
  updateOrderInfo() {
    const { order_no, user_name, phone, address, sales_channel, attach_file, memo } =
      this.orderInfo;

    const updateData: updateOrderInfoBody = {
      order_no,
      user_name,
      phone,
      address,
      sales_channel,
      memo,
      attach_file,
      modify_name: this.modifyCteateName,
    };

    this.equipmentManagementService
      .updateOrderInfoApi(updateData)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((response) => {
        // console.log(response);
        if (response.error) {
          alert(response.description);
        } else if (!response.error) {
          alert('修改成功');
          // console.log('修改成功');
          // console.log(updateData);
          // console.log(this.orderInfo);

          this.closeEdit();
          this.infoChange.emit();
        }
      });
  }

  editForm(type: string) {
    this.closeAllDropdown();
    this.closeAllEdit();
    switch (type) {
      case 'salesChannel':
        this.editSalesChannel = true;
        break;

      default:
        break;
    }
  }

  closeAllEdit() {
    this.editSalesChannel = false;
  }

  closeAllDropdown() {
    this.showSalesChannelDropdown = false;
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
    this.orderInfo = cloneDeep(this.originOrderInfo);
    this.editing = false;
    this.closeAllDropdown();
    this.closeAllEdit();
    this.setFileArray();
    this.editingChange.emit(this.editing);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
