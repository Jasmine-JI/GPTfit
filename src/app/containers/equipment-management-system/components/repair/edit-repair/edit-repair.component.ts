import { CommonModule, NgFor, NgIf } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { MatIconModule } from '@angular/material/icon';
import { Observable, Subject, combineLatest, map, startWith, takeUntil } from 'rxjs';
import { Domain, WebIp } from '../../../../../core/enums/common';
import { UserService } from '../../../../../core/services';
import { EquipmentManagementService } from '../../../services/equipment-management.service';
import { LayoutModule } from '@angular/cdk/layout';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import dayjs from 'dayjs';
import { cloneDeep } from 'lodash';
import _ from 'lodash';

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
  selector: 'app-edit-repair',
  templateUrl: './edit-repair.component.html',
  styleUrls: ['./edit-repair.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
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
export class EditRepairComponent implements OnInit, OnChanges, OnDestroy {
  @Input() targetRepairInfo: any;
  @Input() editing: boolean;
  @Input() isNewForm: boolean;
  @Input() repair_id: number; //叫修單號
  @Input() id: number; //維修單id
  @Output() editingChange = new EventEmitter();
  @Output() infoChange = new EventEmitter();

  @ViewChild('quantity') quantityInput: ElementRef;

  filteredPartList: any;
  partInput = {
    part_no: '',
    part_name: '',
    specifications: '',
    description: '',
  };

  private ngUnsubscribe = new Subject();

  modifyCteateName = this.userService.getUser().nickname;
  repairDetail: any;
  partList: any;

  repairInfo: any = {
    // repair_id: null,//叫修單號
    serial_no: '', //產品序號
    repair_type: '維修', //維修或保養
    repair_date: '', //維修日期
    member: '', //維修人員
    machine_status: '', //機台狀態
    root_causes: '', //異常原因
    detail: '', //詳細說明 /可空值
    // parts_replacement: null,//料件更換程式判斷/不用給 0: False 1:True
    parts_replace_item: [
      // {
      //   part_no: '',
      //   quantity: null
      // },
    ], // 料件更換項目 List[PartsReplaceItem]
    total_meter: null, //總使用里程
    total_use_time: null, //總使用時間
    memo: '', //備忘錄 /可空值
    attach_file: '', //附件 /可空值
    // create_name: '',//建單人員
  };

  originRepairInfo: any = {
    // repair_id: null,//叫修單號
    serial_no: '', //產品序號
    repair_type: '維修', //維修或保養
    repair_date: '', //維修日期
    member: '', //維修人員
    machine_status: '', //機台狀態
    root_causes: '', //異常原因
    detail: '', //詳細說明 /可空值
    // parts_replacement: null,//料件更換程式判斷/不用給 0: False 1:True
    parts_replace_item: [], // 料件更換項目 List[PartsReplaceItem]
    total_meter: null, //總使用里程
    total_use_time: null, //總使用時間
    memo: '', //備忘錄 /可空值
    attach_file: '', //附件 /可空值
    // create_name: '',//建單人員
  };

  today = new Date();
  causesTextLength: number;
  detailTextLength: number;
  memoTextLength: number;
  filesMaxLength = 260;
  filesMax = false;
  fileNames: string[] = [];
  repairTypeList: string[] = ['維修', '保養']; //維修保養類型清單
  showRepairTypeDropdown = false;
  /**
   *維修頁開啟/關閉料件列表
   */
  editParts = false;
  /**
   *管理料件頁
   */
  editPartList = false;
  /**
   *管理料件頁-修改某料件
   */
  editPartListItem = false;

  readonly imgPath = `https://${
    location.hostname.includes(WebIp.develop) ? Domain.uat : location.hostname
  }/img/`;

  constructor(
    private userService: UserService,
    private equipmentManagementService: EquipmentManagementService
  ) {}

  ngOnInit(): void {
    // this.getOrderListDetail();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.editing) {
      this.judgeEdmitMode();
      this.causesTextLength = this.repairInfo.root_causes?.length;
      this.detailTextLength = this.repairInfo.detail?.length;
      this.memoTextLength = this.repairInfo.memo?.length;
    }
  }

  /**
   * 判斷視窗為新增或修改
   */
  judgeEdmitMode() {
    if (this.editing) {
      if (this.isNewForm) {
        // console.log('新增維修單');
        // console.log('this.repair_id:', this.repair_id);
        // this.repairInfo.repair_id = this.repair_id ? this.repair_id : null;
        this.originRepairInfo = cloneDeep(this.repairInfo);
      } else {
        // console.log('修改維修單');
        if (this.targetRepairInfo.parts_replacement == 0) {
          //沒有換零件
          // console.log('parts_replacement=0');
          this.targetRepairInfo.parts_replace_item = [];
          this.repairInfo = cloneDeep(this.targetRepairInfo);
          this.originRepairInfo = cloneDeep(this.targetRepairInfo);
        } else {
          // console.log('parts_replacement=1');
          this.getSavedPartsList();
          this.originRepairInfo = cloneDeep(this.targetRepairInfo);
          this.repairInfo = cloneDeep(this.targetRepairInfo);
        }
      }
    }
  }

  getPartName(part_no: string): string {
    const part = this.partList.find((item) => item.part_no === part_no);
    return part ? part.part_name : part_no;
  }

  getQuantity(part_no: string) {
    const part = this.repairInfo.parts_replace_item?.find((item) => item.part_no === part_no);
    return part ? part.quantity : null;
  }

  filterPartsList() {
    if (!this.editPartListItem && !this.editPartList) {
      const partNoRegex = new RegExp(this.partInput.part_no);
      const partNameRegex = new RegExp(this.partInput.part_name);
      const specificationsRegex = new RegExp(this.partInput.specifications);

      this.filteredPartList = this.partList.filter((item) => {
        const matchPartNo = this.partInput.part_no === '' || partNoRegex.test(item.part_no);
        const matchPartName = this.partInput.part_name === '' || partNameRegex.test(item.part_name);
        const matchSpecifications =
          this.partInput.specifications === '' || specificationsRegex.test(item.specifications);
        return matchPartNo && matchPartName && matchSpecifications;
      });
      // console.log('filteredPartList', this.filteredPartList);
    }
  }

  selectPart(item: any) {
    this.editPartListItem = false;
    this.cleanInput();

    // console.log(item);
    // console.log(this.partInput);
    this.partInput.part_no = item.part_no;
    this.partInput.part_name = item.part_name;
    this.partInput.specifications = item.specifications;
    this.partInput.description = item.description;
    if (this.quantityInput) {
      this.quantityInput.nativeElement.value = this.getQuantity(item.part_no);
    }
  }

  /**
   * 新增/修改維修單中之料件及料件數料
   * @param part_no
   * @param quantity
   */
  updatePartsReplaceItem(part_no: any) {
    const quantity = this.quantityInput?.nativeElement.value;
    if (part_no && quantity) {
      // console.log('updatePartsReplaceItem()');
      const partsReplaceItem = { part_no, quantity };
      const part = this.repairInfo.parts_replace_item?.find((item) => item.part_no === part_no);
      if (part) {
        //已有新增過此料件，則僅更新數量
        if (quantity >= 1) {
          part.quantity = quantity;
        } else {
          this.deletePartsReplaceItem(part_no);
        }
      } else {
        //新增維修單中之料件及料件數料
        this.repairInfo.parts_replace_item.push(partsReplaceItem);
      }
      // console.log(this.repairInfo);
    }
    this.cleanInput();
    this.filteredPartList = null;
  }

  /**
   * 刪除維修單中之料件及料件數料
   * @param part_no
   * @param event
   */
  deletePartsReplaceItem(part_no: any) {
    // console.log('deletePartsReplaceItem()');
    if (part_no) {
      const index = this.repairInfo.parts_replace_item?.findIndex(
        (item) => item.part_no === part_no
      );
      if (index !== -1) {
        this.repairInfo.parts_replace_item.splice(index, 1);
      }
    }
    // console.log(this.repairInfo);
  }

  cleanInput() {
    this.partInput = {
      part_no: '',
      part_name: '',
      specifications: '',
      description: '',
    };
    if (this.quantityInput) {
      this.quantityInput.nativeElement.value = null;
    }
  }

  /**
   * 更改日期
   */
  changeDate(type: string, date: Date) {
    switch (type) {
      case 'repair_date':
        this.repairInfo.repair_date = dayjs(date).format('YYYY-MM-DD');
        break;
      default:
        break;
    }
  }

  toggleDropdown(type: string) {
    switch (type) {
      case 'repair_type':
        this.showRepairTypeDropdown = !this.showRepairTypeDropdown;
        if (this.showRepairTypeDropdown) {
          // this.showReturnExchangeDropdown = false;
          // this.showInstallTypeDropdown = false;
        }
        break;
      default:
        break;
    }
  }

  selectStatus(type: string, option: string | null) {
    switch (type) {
      case 'repair_type':
        this.repairInfo.repair_type = option;
        this.showRepairTypeDropdown = !this.showRepairTypeDropdown;
        break;
      default:
        break;
    }
  }

  editForm(type: string) {
    this.closeAllDropdown();
    this.closeAllEdit();
    switch (type) {
      case 'parts_replacement':
        this.editParts = true;
        this.getSavedPartsList();
        break;

      default:
        break;
    }
  }

  getSavedPartsList() {
    this.equipmentManagementService
      .getSavedpartListst()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((_partLists) => {
        // console.log('_partLists',_partLists);
        if (_partLists == null) {
          this.fetchPartsList();
        } else {
          // console.log('成功取得SavedpartLists');
          this.partList = _partLists;
          // console.log('partList:', this.partList);
        }
      });
  }

  fetchPartsList() {
    // console.log('post getpartListstApi');
    this.equipmentManagementService
      .getpartListstApi()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        if (!res.error) {
          this.equipmentManagementService.setpartListst(res.parts);
        }
      });
  }

  editList() {
    this.editPartList = true;
    this.cleanInput();
    this.filteredPartList = null;
  }

  /**
   * 點擊修改料件ListItem
   */
  clickUpdatePartListItem(item: any) {
    this.editPartListItem = true;
    this.partInput.part_no = item.part_no;
    this.partInput.part_name = item.part_name;
    this.partInput.specifications = item.specifications;
  }

  /**
   * 新增料件ListItem
   */
  addPartListItem(partInput: any) {
    if (this.checkPartInput(partInput)) {
      this.equipmentManagementService
        .addNewPartsApi(partInput)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((response) => {
          if (response.error) {
            alert('新增失敗\n原因:' + response.description);
          } else if (!response.error) {
            alert('新增成功');
            this.fetchPartsList();
            // console.log('addNewPartsApi:', response);
          }
        });
    }
  }

  /**
   * 修改料件ListItem
   */
  updatePartListItem(partInput: any) {
    if (this.checkPartInput(partInput)) {
      this.equipmentManagementService
        .updatePartsListApi(partInput)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((response) => {
          if (response.error) {
            alert('修改失敗\n原因:' + response.description);
          } else if (!response.error) {
            alert('修改成功');
            this.fetchPartsList();
            // console.log('updatePartsListApi:', response);
          }
        });
    }
  }

  checkPartInput(partInput) {
    if (!partInput.part_no) {
      alert('請輸入品號');
    } else if (!partInput.part_name) {
      alert('請輸入品名');
    } else if (!partInput.specifications) {
      alert('請輸入規格');
    } else {
      return true;
    }
  }

  completeEditList() {
    this.editPartList = false;
    this.editPartListItem = false;
    this.cleanInput();
  }

  closeAllEdit() {
    this.editParts = false;
  }

  closeAllDropdown() {
    this.showRepairTypeDropdown = false;
  }

  countTextLength(target: string, text: string) {
    // this.textLength = this.repairInfo.memo.length
    this[target] = text.length;
  }

  /**
   * 判斷是否已有變更過的內容，無變更內容則退出視窗
   * @param btn
   */
  checkInfoChange(btn: string) {
    if (!_.isEqual(this.repairInfo, this.originRepairInfo)) {
      //物件內容深層比較，有變更
      // console.log('repairInfo:', this.repairInfo);
      // console.log('originRepairInfo:', this.originRepairInfo);

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
    const {
      serial_no,
      repair_date,
      member,
      machine_status,
      root_causes,
      total_meter,
      total_use_time,
    } = this.repairInfo;

    if (serial_no.length === 0) {
      alert('請輸入產品序號');
    } else if (repair_date === '') {
      alert('請輸入維修日期');
    } else if (member === '') {
      alert('請輸入維修人員');
    } else if (machine_status === '') {
      alert('請輸入機台狀態');
    } else if (root_causes === '') {
      alert('請輸入異常原因');
    } else if (total_meter === null) {
      alert('請輸入總使用里程');
    } else if (total_use_time === null) {
      alert('請輸入總使用時間');
    } else {
      if (this.isNewForm) {
        this.addRepairInfo();
      } else {
        this.updateRepairInfo();
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
      this.repairInfo = cloneDeep(this.originRepairInfo);
    }
  }

  /**
   * 新增 - 儲存內容
   */
  addRepairInfo() {
    const {
      serial_no,
      repair_date,
      member,
      machine_status,
      root_causes,
      detail,
      total_meter,
      total_use_time,
      attach_file,
      repair_type,
      memo,
      parts_replace_item,
    } = this.repairInfo;

    const addRepairData = {
      repair_id: this.repair_id,
      serial_no,
      repair_date,
      member,
      machine_status,
      root_causes,
      detail,
      total_meter,
      total_use_time,
      attach_file,
      repair_type,
      memo,
      parts_replace_item,
      create_name: this.modifyCteateName,
    };

    // console.log('addRepairInfodApi addRepairData:', addRepairData);

    this.equipmentManagementService
      .addRepairInfodApi(addRepairData)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((response) => {
        if (response.error) {
          alert('新增失敗\n原因:' + response.description);
        } else if (!response.error) {
          alert('新增成功');
          // console.log('addRepairInfodApi:', response);

          this.closeEdit();
          this.infoChange.emit();
        }
      });
  }

  /**
   * 修改產品 - 儲存內容
   */
  updateRepairInfo() {
    const {
      serial_no,
      repair_date,
      member,
      machine_status,
      root_causes,
      detail,
      total_meter,
      total_use_time,
      attach_file,
      repair_type,
      memo,
      parts_replace_item,
    } = this.repairInfo;

    // console.log(this.repairInfo);
    // console.log(this.originRepairInfo);

    const updateRepairData = {
      id: this.id,
      serial_no,
      repair_date,
      member,
      machine_status,
      root_causes,
      detail,
      total_meter,
      total_use_time,
      attach_file,
      repair_type,
      memo,
      parts_replace_item,
      modify_name: this.modifyCteateName,
    };

    this.equipmentManagementService
      .updateRepairInfoApi(updateRepairData)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((response) => {
        if (response.error) {
          alert('修改失敗\n原因:' + response.description);
        } else if (!response.error) {
          alert('修改成功');
          // console.log('updateRepairInfoApi:', response);
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
   * 退出零件編輯視窗
   */
  closeEditParts() {
    this.closeAllDropdown();
    this.cleanInput();
    this.filteredPartList = null;
    this.editParts = false;
    this.editPartList = false;
  }

  /**
   * 退出編輯視窗
   */
  closeEdit() {
    this.closeAllDropdown();
    this.editing = false;
    this.editParts = false;
    this.editingChange.emit(this.editing);
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
