import { NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { EquipmentManagementService } from '../../services/equipment-management.service';
import { repairStatus } from '../../models/repair-status.enum';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
})
export class SearchComponent implements OnInit, OnDestroy {
  @ViewChild('fixReqStatus') fixReqStatus: ElementRef;

  private ngUnsubscribe = new Subject();
  constructor(
    private equipmentManagementService: EquipmentManagementService,
    private route: ActivatedRoute
  ) {}

  uiFlag = {
    orderList: null,
    fixReqList: null,
    searchType: '',
  };

  readonly repairStatus: repairStatus;

  repairStatusList: string[] = [repairStatus.all, repairStatus.done, repairStatus.undone]; //安裝狀態清單

  repairOpt = {
    showRepairStatusDropdown: false,
    repairStatus: this.repairStatusList[0],
    filterFixReqList: null,
  };

  ngOnInit() {
    if (!this.uiFlag.searchType) {
      this.getSearchPage();
    }
  }

  @HostListener('window:click', ['$event'])
  onDocumentClick(event: Event): void {
    const clickedElement = event.target as HTMLElement;
    if (clickedElement.contains(this.fixReqStatus.nativeElement)) {
      this.repairOpt.showRepairStatusDropdown = false;
    }
  }

  @HostListener('window:wheel', ['$event'])
  onWindowWheel(event: WheelEvent): void {
    this.repairOpt.showRepairStatusDropdown = false;
  }

  toggleDropdown(type: string) {
    switch (type) {
      case 'repairStatus':
        this.repairOpt.showRepairStatusDropdown = !this.repairOpt.showRepairStatusDropdown;
        break;
      default:
        break;
    }
  }

  selectStatus(option: string | null) {
    this.repairOpt.repairStatus = option;
    // console.log(this.fixReqInfo.status);
    this.repairOpt.showRepairStatusDropdown = !this.repairOpt.showRepairStatusDropdown;
    if (option === '全部') {
      this.repairOpt.filterFixReqList = this.uiFlag.fixReqList;
    } else {
      this.repairOpt.filterFixReqList = this.uiFlag.fixReqList.filter((li) => {
        return repairStatus[li.status] === option;
      });
    }
    console.log(this.repairOpt.filterFixReqList);
  }

  getSearchPage() {
    this.route.queryParams.subscribe((params) => {
      this.uiFlag.searchType = params['searchType'];
      this.getfilterdItem();
    });
  }

  getfilterdItem() {
    switch (this.uiFlag.searchType) {
      case 'order':
        this.equipmentManagementService
          .getFliteredOrder()
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((res) => {
            // console.log('銷貨單搜尋結果', res);
            this.uiFlag.orderList = res?.order;
          });
        break;

      case 'repair_form':
        this.equipmentManagementService
          .getFliteredRepairForm()
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((res) => {
            // console.log('叫修單搜尋結果', res);
            this.initOpt();
            this.uiFlag.fixReqList = res?.repair_form;
            this.repairOpt.filterFixReqList = this.uiFlag.fixReqList;
          });
        break;

      default:
        break;
    }
  }

  initOpt() {
    this.repairOpt = {
      showRepairStatusDropdown: false,
      repairStatus: this.repairStatusList[0],
      filterFixReqList: null,
    };
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
