import { CommonModule, NgIf, NgFor } from '@angular/common';
import { Component, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import {
  ActivatedRoute,
  Route,
  Router,
  RouterState,
  RouterStateSnapshot,
  RouterLink,
} from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { fixReqListParameters } from '../../models/order-api.model';
import { EquipmentManagementService } from '../../services/equipment-management.service';
import { EditRepairComponent } from './edit-repair/edit-repair.component';

@Component({
  selector: 'app-repair',
  standalone: true,
  imports: [CommonModule, EditRepairComponent, NgIf, NgFor, RouterLink],
  templateUrl: './repair.component.html',
  styleUrls: ['./repair.component.scss'],
})
export class RepairComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  fixReqInfo: any;
  repairForm: any;
  repairInfo: any;
  fixReqParameters: fixReqListParameters;

  id: number; //維修單id
  editFixReq: boolean;
  isNewForm: boolean;
  editRepair: boolean;

  partList: any;

  constructor(
    private route: ActivatedRoute,
    private equipmentManagementService: EquipmentManagementService
  ) {}

  ngOnInit(): void {
    this.getFixReqParameters();
  }

  /**
   * 取得目前叫修單repair_id
   */
  getFixReqParameters() {
    this.route.queryParams.pipe(takeUntil(this.ngUnsubscribe)).subscribe((params) => {
      const repairId = params['repair_id'];
      this.id = +params['id'];
      this.fixReqParameters = { repair_id: repairId };
      this.fetchFixReqList();
    });
  }

  /**
   * 呼叫API，並回傳所需資料
   */
  fetchFixReqList() {
    this.equipmentManagementService
      .getFixReqListApi(this.fixReqParameters)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((_fixReqInfo) => {
        // 回傳基本資料
        this.equipmentManagementService.setFixReqDetail(_fixReqInfo); //set OrderDetail
        this.fixReqInfo = _fixReqInfo;
        // console.log('fixReqInfo:', this.fixReqInfo);
        if (this.fixReqInfo) {
          this.setRepairFormInfo();
          this.setRepairInfo();
        }
      });
  }

  setRepairFormInfo() {
    this.repairForm = this.fixReqInfo.repair_form[0];
    // console.log('repairForm:', this.repairForm);
  }

  setRepairInfo() {
    // console.log('id:', this.id);
    this.repairInfo = this.fixReqInfo?.repair_info?.find((info) => info.id === this.id);

    if (this.repairInfo.parts_replacement == 0) {
      //沒有換零件
      // console.log('parts_replacement=0');
      this.repairInfo.parts_replace_item = [];
    } else {
      // console.log('parts_replacement=1');
      this.getSavedPartsList();
    }

    // console.log('repair_info:', this.fixReqInfo.repair_info);
    // console.log('repairInfo:', this.repairInfo);
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

  getPartName(part_no: string): string {
    const part = this.partList.find((item) => item.part_no === part_no);
    return part ? part.part_name : part_no;
  }

  editForm(type: string) {
    this.closeAllDropdown();
    this.closeAllEdit();
    switch (type) {
      case 'repair':
        this.editRepair = true;
        this.isNewForm = false;
        break;
      default:
        break;
    }
  }

  closeAllEdit() {
    this.editRepair = false;
    this.isNewForm = false;
  }

  closeAllDropdown() {
    // this.showInstallTypeDropdown.isOpen = false;
    // this.showSalesChannelDropdown = false;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
