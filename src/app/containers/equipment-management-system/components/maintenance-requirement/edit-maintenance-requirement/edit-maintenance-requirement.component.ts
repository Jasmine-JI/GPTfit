import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule, NgIf } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import dayjs from 'dayjs';
import _, { cloneDeep } from 'lodash';
import { Subject, takeUntil } from 'rxjs';
import { Domain, WebIp } from '../../../../../core/enums/common';
import { UserService } from '../../../../../core/services';
import { orderListParameters } from '../../../models/order-api.model';
import { EquipmentManagementService } from '../../../services/equipment-management.service';

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
  selector: 'app-edit-maintenance-requirement',
  templateUrl: './edit-maintenance-requirement.component.html',
  styleUrls: ['./edit-maintenance-requirement.component.scss'],
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
export class EditMaintenanceRequirementComponent implements OnInit, OnChanges, OnDestroy {
  @Input() editing: boolean;
  @Input() isNewForm: boolean;
  @Input() NewFixReq: boolean;
  @Input() repair_id: number;
  @Input() prodSerialArray: string[]; //銷貨單之產品序號list
  @Input() autocomplete: string;
  @Output() editingChange = new EventEmitter();
  @Output() infoChange = new EventEmitter();
  private ngUnsubscribe = new Subject();

  modifyCteateName = this.userService.getUser().nickname;
  targetOrderInfo: any;
  fixReqDetail: any;

  fixReqForm = this.formBuilder.group({
    order_no: ['', Validators.required],
    request_date: [null, Validators.required],
    user_name: ['', Validators.required],
    phone: ['', Validators.required],
    address: ['', Validators.required],
    e_mail: ['', Validators.email],
  });

  fixReqSerialArray: string[] = []; // 叫修單之產品序號list
  lastOrder = '';

  fixReqInfo: any = {
    repair_id: '',
    user_name: '',
    e_mail: '',
    phone: '',
    address: '',
    serial_no: '',
    description: '', //問題描述
    status: '', //處理狀態
    order_no: '',
    request_date: null, //叫修日期
    attach_file: '', //附件 /可空值
  };

  originFixReqInfo: any = {
    repair_id: '',
    user_name: '',
    e_mail: '',
    phone: '',
    address: '',
    serial_no: '',
    description: '', //問題描述
    status: '', //處理狀態
    order_no: '',
    request_date: null, //叫修日期
    attach_file: '', //附件 /可空值
  };

  tagText = '';
  isListVisible = false;
  filteredSerialNo: any;
  textLength: number;
  filesMaxLength = 260;
  filesMax = false;
  fileNames: string[] = [];
  readonly imgPath = `https://${
    location.hostname.includes(WebIp.develop) ? Domain.uat : location.hostname
  }/img/`;

  constructor(
    private userService: UserService,
    private equipmentManagementService: EquipmentManagementService,
    private formBuilder: FormBuilder
  ) {}

  repairStatusList: string[] = ['done', 'undone']; //安裝狀態清單
  showRepairStatusDropdown = false;

  ngOnInit(): void {
    // console.log('prodSerialArray:', this.prodSerialArray);
    // this.getOrderListDetail();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.isNewForm || changes.editing) {
      this.judgeEdmitMode();
      this.textLength = this.fixReqInfo.description?.length;
      this.fixReqSerialArray = this.fixReqInfo.serial_no
        ? this.fixReqInfo.serial_no.split(',')
        : [];
    }
  }

  openImage(imageUrl: string) {
    window.open(imageUrl, '_blank');
  }

  deleteImg(fileName: string) {
    const index = this.fileNames.indexOf(fileName);
    if (index !== -1) {
      this.fileNames.splice(index, 1);
      this.fixReqInfo.attach_file = this.fileNames.join(',');
      this.filesMax = this.fixReqInfo.attach_file.length > this.filesMaxLength ? true : false;
    }
  }

  previewImg(fileInput: HTMLInputElement) {
    const file = fileInput.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      this.uploadImage(formData);
      fileInput.value = '';
    }
  }

  uploadImage(formData: any) {
    const dataType = 'form';
    this.equipmentManagementService.uploadImageApi(formData, dataType).subscribe((res) => {
      if (res.error) {
        //上傳失敗(非圖片檔)
        alert(res.description);
      } else {
        //上傳成功
        if (this.fixReqInfo.attach_file) {
          //原字串有 attach_file
          if (
            this.fixReqInfo.attach_file === 'None' ||
            this.fixReqInfo.attach_file === null ||
            this.fixReqInfo.attach_file.length < 10
          ) {
            this.fixReqInfo.attach_file = '';
            this.fixReqInfo.attach_file = res.imgUrl;
          } else {
            this.fixReqInfo.attach_file += ',' + res.imgUrl;
          }
        } else {
          //原字串沒有 attach_file
          this.fixReqInfo.attach_file = '';
          this.fixReqInfo.attach_file = res.imgUrl;
        }
        this.setFileArray();
        // console.log(this.fileNames);
      }
    });
  }

  setFileArray() {
    if (this.fixReqInfo && this.fixReqInfo.attach_file) {
      if (
        this.fixReqInfo.attach_file === 'None' ||
        this.fixReqInfo.attach_file === null ||
        this.fixReqInfo.attach_file === ''
      ) {
        this.fileNames = [];
        this.fixReqInfo.attach_file = '';
      } else {
        this.filesMax = this.fixReqInfo.attach_file.length > this.filesMaxLength ? true : false;
        this.fileNames = this.fixReqInfo.attach_file.split(',');
      }
    } else {
      this.fileNames = [];
    }
  }

  onInput(event: any): void {
    event.target.value = event.target.value.replace(/[^0-9]/g, '');
    this.fixReqInfo.phone = event.target.value;
  }

  /**
   * 輸入產品序號欄位鍵盤操作
   * @param event
   */
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab' || event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    } else if (event.key === 'Backspace') {
      this.deleteTag();
    }
  }

  /**
   * 叫修日期
   */
  changeDate(type: string, date: Date) {
    switch (type) {
      case 'request_date':
        this.fixReqInfo.request_date = dayjs(date).format('YYYY-MM-DD');
        break;
      default:
        break;
    }
  }

  /**
   * 篩選產品序號列表
   */
  filterSerialNo() {
    if (this.tagText === '') {
      this.filteredSerialNo = this.prodSerialArray?.filter((tag) => tag !== '');
    } else {
      this.filteredSerialNo = this.prodSerialArray?.filter((tag) =>
        tag.toLowerCase().includes(this.tagText.toLowerCase())
      );
    }
    this.filteredSerialNo = this.filteredSerialNo?.filter(
      (tag) => !this.fixReqSerialArray.includes(tag)
    ); //過濾掉已經在 serialNoArray 中的元素
    this.filteredSerialNo = Array.from(new Set(this.filteredSerialNo)); // 使用 Set 來去除重複的元素
    this.isListVisible = this.filteredSerialNo.length !== 0 ? true : false;
    // console.log('filteredSerialNo', this.filteredSerialNo);
  }

  addTag(serialNo?: string) {
    this.tagText = serialNo ? serialNo : this.tagText;
    if (this.tagText.trim() !== '') {
      this.fixReqSerialArray.push(this.tagText);
      this.fixReqInfo.serial_no = this.fixReqSerialArray.join(',');
      this.tagText = '';
    }
  }

  addSerialNo(serialNo?: string) {
    this.tagText = serialNo;
    if (this.tagText.trim() !== '') {
      this.fixReqSerialArray.push(this.tagText);
      this.fixReqInfo.serial_no = this.fixReqSerialArray.join(',');
      this.tagText = '';
      this.isListVisible = false;
      // console.log('fixReqSerialArray', this.fixReqSerialArray);
      // console.log(this.fixReqInfo);
    }
  }

  deleteTag() {
    if (this.fixReqSerialArray.length > 0 && this.tagText === '') {
      this.fixReqSerialArray.pop();
      this.fixReqInfo.serial_no = this.fixReqSerialArray.join(',');
    }
  }

  deleteSerial(serialIndex: number) {
    if (serialIndex !== -1) {
      // console.log(serialIndex);
      this.fixReqSerialArray.splice(serialIndex, 1);
      this.fixReqInfo.serial_no = this.fixReqSerialArray.join(',');
      // console.log('serialNoArray', this.fixReqSerialArray);
      // console.log(this.fixReqInfo);
    }
  }

  /**
   * 判斷是否已經有產品序號列表或銷貨單號是否修改
   */
  ifProdSerialArray() {
    if (
      this.prodSerialArray?.length == 0 ||
      !this.prodSerialArray ||
      this.lastOrder !== this.fixReqInfo.order_no
    ) {
      this.fetchOrderProdList();
    } else {
      //
      this.filterSerialNo();
    }
  }

  /**
   * 取得銷貨單中所有的產品序號
   */
  fetchOrderProdList() {
    if (
      this.lastOrder && this.fixReqInfo.order_no
        ? this.lastOrder !== this.fixReqInfo.order_no
        : this.fixReqInfo.order_no !== ''
    ) {
      this.lastOrder = this.fixReqInfo.order_no;
      const body: orderListParameters = { order_no: this.fixReqInfo.order_no };
      // console.log(body);
      this.equipmentManagementService
        .getOrderListApi(body)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((_orderDetail) => {
          if (_orderDetail) {
            // console.log(_orderDetail);
            this.prodSerialArray = _orderDetail?.product?.map((product) => product.serial_no);
            this.filterSerialNo();
          }
        });
    }
  }

  countTextLength(text: string) {
    this.textLength = text.length;
  }

  toggleDropdown(type: string) {
    switch (type) {
      case 'repairStatus':
        this.showRepairStatusDropdown = !this.showRepairStatusDropdown;
        // if (this.showRepairStatusDropdown) {

        // }
        break;
      default:
        break;
    }
  }

  selectStatus(option: string | null) {
    this.fixReqInfo.status = option;
    // console.log(this.fixReqInfo.status);
    this.showRepairStatusDropdown = !this.showRepairStatusDropdown;
  }

  /**
   * 判斷視窗為新增或修改
   */
  judgeEdmitMode() {
    if (this.editing) {
      if (this.isNewForm) {
        //新增視窗
        // console.log('新增叫修單');
        if (this.NewFixReq) {
          this.fixReqInfo = cloneDeep(this.originFixReqInfo);
        } else {
          this.getOrderList();
        }
      } else {
        //修改視窗
        // console.log('修改叫修單');
        this.getFixReqList();
      }
    }
  }

  getOrderList() {
    this.equipmentManagementService
      .getOrderDetail()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        const orderDetail = res;
        if (orderDetail) {
          // console.log('orderDetail:', orderDetail.order[0]);
          this.targetOrderInfo = orderDetail.order[0];
          const { order_no, user_name, phone, address } = this.targetOrderInfo;
          this.originFixReqInfo = {
            order_no: order_no,
            user_name: user_name,
            phone: phone,
            address: address,
            description: this.fixReqInfo.description,
          };
          this.fixReqInfo = cloneDeep(this.originFixReqInfo);
          // console.log('fixReqInfo:', this.fixReqInfo);
        }
      });
  }

  getFixReqList() {
    this.equipmentManagementService
      .getFixReqDetail()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.fixReqDetail = res;
        if (this.fixReqDetail) {
          // console.log('fixReqInfo:', this.fixReqDetail.repair_form[0]);
          const targetOrderInfo = this.fixReqDetail.repair_form[0];
          this.fixReqInfo = cloneDeep(targetOrderInfo);
          this.setFileArray();
          this.originFixReqInfo = cloneDeep(this.fixReqInfo);
        }
      });
  }

  /**
   * 判斷按下儲存或x關閉按鈕
   * @param btn
   */
  checkInfoChange(btn: string) {
    if (btn == 'save' && this.isNewForm && !this.NewFixReq) {
      //直接在銷貨單新增叫修單
      this.checkoutContent();
    } else if (!_.isEqual(this.fixReqInfo, this.originFixReqInfo)) {
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

  /**
   * 提示框_是否儲存變更內容
   */
  alertInfoChanged() {
    if (confirm('是否儲存已變更內容?') == true) {
      this.clickSaveBtn();
    } else {
      this.closeEdit();
      this.fixReqInfo = cloneDeep(this.originFixReqInfo);
      this.fileNames = this.fixReqInfo.attach_file.split(',');
    }
  }

  checkoutContent() {
    const { order_no, request_date, user_name, phone, address, e_mail } = this.fixReqInfo;
    this.fixReqForm.patchValue({
      order_no: order_no,
      request_date: request_date,
      user_name: user_name,
      phone: phone,
      address: address,
      e_mail: e_mail,
    });
    if (this.fixReqForm.valid) {
      if (this.isNewForm) {
        this.addFixReqInfo();
      } else {
        this.updateFixReqInfo();
      }
    } else {
      alert('請檢查填寫欄位');
    }
  }

  /**
   * 新增叫修單 - 儲存內容
   */
  addFixReqInfo() {
    const {
      order_no,
      request_date,
      user_name,
      e_mail,
      phone,
      address,
      serial_no,
      description,
      attach_file,
    } = this.fixReqInfo;
    const updateData: any = {
      order_no,
      request_date,
      user_name,
      e_mail,
      phone,
      address,
      serial_no,
      description,
      status: 'undone',
      attach_file,
      create_name: this.modifyCteateName,
    };

    this.equipmentManagementService
      .addFixReqfoApi(updateData)
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
   * 修改叫修單 - 儲存內容
   */
  updateFixReqInfo() {
    const {
      order_no,
      request_date,
      user_name,
      e_mail,
      phone,
      address,
      serial_no,
      description,
      status,
      attach_file,
    } = this.fixReqInfo;
    const updateData: any = {
      repair_id: this.repair_id,
      order_no,
      request_date,
      user_name,
      e_mail,
      phone,
      address,
      serial_no,
      description,
      status,
      attach_file,
      modify_name: this.userService.getUser().nickname,
    };

    this.equipmentManagementService
      .updateFixReqApi(updateData)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((response) => {
        // console.log(response);
        if (!response.error) {
          alert('編輯成功');
          // console.log(updateData);
          // console.log(this.fixReqInfo);

          this.closeEdit();
          this.infoChange.emit();
        }
      });
  }

  /**
   * 點擊儲存按鈕
   */
  clickSaveBtn() {
    this.checkInfoChange('save');
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
    this.setFileArray();
    this.editing = false;
    this.editingChange.emit(this.editing);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
