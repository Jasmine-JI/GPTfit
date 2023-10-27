import { NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../../core/services';
import { EquipmentManagementService } from '../../services/equipment-management.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
})
export class SearchComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  constructor(
    private equipmentManagementService: EquipmentManagementService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  uiFlag = {
    orderList: null,
    fixReqList: null,
    searchType: '',
  };

  ngOnInit() {
    if (!this.uiFlag.searchType) {
      this.getSearchPage();
    }
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
            console.log('銷貨單搜尋結果', res);
            this.uiFlag.orderList = res?.order;
          });
        break;

      case 'repair_form':
        this.equipmentManagementService
          .getFliteredRepairForm()
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((res) => {
            console.log('叫修單搜尋結果', res);
            this.uiFlag.fixReqList = res?.repair_form;
          });
        break;

      default:
        break;
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
