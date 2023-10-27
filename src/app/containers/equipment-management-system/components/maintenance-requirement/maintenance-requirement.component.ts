import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { fixReqListParameters } from '../../models/order-api.model';
import { EquipmentManagementService } from '../../services/equipment-management.service';
import { EditRepairComponent } from '../repair/edit-repair/edit-repair.component';
import { EditMaintenanceRequirementComponent } from './edit-maintenance-requirement/edit-maintenance-requirement.component';

@Component({
  selector: 'app-maintenance-requirement',
  standalone: true,
  imports: [
    CommonModule,
    EditMaintenanceRequirementComponent,
    NgFor,
    NgIf,
    RouterLink,
    EditRepairComponent,
  ],
  templateUrl: './maintenance-requirement.component.html',
  styleUrls: ['./maintenance-requirement.component.scss'],
})
export class MaintenanceRequirementComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  fixReqInfo: any;
  repairForm: any;
  fixReqSerialArray: string[] = []; //叫修單之產品序號list
  repairInfos: any;
  fixReqParameters: fixReqListParameters;

  editFixReq: boolean;
  isNewForm: boolean;
  editRepair: boolean;

  constructor(private equipmentManagementService: EquipmentManagementService) {}

  ngOnInit(): void {
    this.getFixReqParameters();
  }

  /**
   * 取得目前叫修單repair_id
   */
  getFixReqParameters() {
    this.equipmentManagementService.fixReqParameters$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((_fixReqParameters) => {
        // console.log(_fixReqParameters);
        this.fixReqParameters = _fixReqParameters;
        if (this.fixReqParameters) {
          this.fetchFixReqList();
        }
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
        // console.log('fixReqInfo:',this.fixReqInfo);
        if (this.fixReqInfo) {
          this.setRepairFormInfo();
          this.setRepairInfo();
        }
      });
  }

  setRepairFormInfo() {
    this.repairForm = this.fixReqInfo.repair_form[0];
    this.fixReqSerialArray = this.repairForm.serial_no?.split(',');
    // console.log('repairForm:',this.repairForm);
  }

  setRepairInfo() {
    this.repairInfos = this.fixReqInfo.repair_info?.reverse();
  }

  editForm(type: string) {
    this.closeAllDropdown();
    this.closeAllEdit();
    switch (type) {
      case 'repair':
        this.editRepair = true;
        this.isNewForm = true;
        break;

      case 'fixReq':
        this.editFixReq = true;
        this.isNewForm = false;
        break;

      default:
        break;
    }
  }

  closeAllEdit() {
    this.editRepair = false;
    this.editFixReq = false;
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
