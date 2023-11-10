import { NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, HostListener, Input, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import dayjs from 'dayjs';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../../core/services';
import { equipmentManagementLogIn } from '../../../equipment-management-routing.module';
import { EquipmentManagementService } from '../../../services/equipment-management.service';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  standalone: true,
  imports: [
    RouterLink,
    NgIf,
    NgFor,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
  ],
})
export class SearchBarComponent implements OnDestroy {
  private ngUnsubscribe = new Subject();
  constructor(
    private auth: AuthService,
    private equipmentManagementService: EquipmentManagementService,
    private router: Router
  ) {}
  @ViewChild('searchBarWrapper') searchBar: ElementRef;
  @ViewChild('searchOption') searchOption: ElementRef;
  @ViewChild('range') calendar: ElementRef;

  @Input() avatarUrl: string;

  uiFlag = {
    searchTypeBox: false,
    searchKeywordBox: false,
    searchDateBox: false,
    selectDateBox: false,
    searchType: '銷貨單',
    dateOption: '全部',
  };

  fliterParameters = {
    user_name: '',
    phone: '',
    address: '',
    e_mail: '',
    sales_channel: '',
    start_date: '',
    end_date: '',
    serial_no: '',
  };

  searchTypeList = ['銷貨單', '叫修單', '產品'];
  dateList = ['全部', '30日', '6個月'];

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: Event): void {
    if (this.searchBar && this.searchOption) {
      if (
        !this.searchBar?.nativeElement.contains(event.target) &&
        !this.searchOption?.nativeElement.contains(event.target) &&
        !this.uiFlag.selectDateBox
      ) {
        this.uiFlag.searchDateBox = !this.uiFlag.searchDateBox;
        this.closeAllBox();
      }
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    event.stopPropagation();
  }

  /**
   * 登出
   */
  logout() {
    this.auth.logout();
    this.router.navigateByUrl(equipmentManagementLogIn);
  }

  onInput(event: any): void {
    event.target.value = event.target.value.replace(/[^0-9]/g, '');
    this.fliterParameters.phone = event.target.value;
  }

  openBox(type: string) {
    this.closeAllBox();
    switch (type) {
      case 'searchTypeBox':
        this.uiFlag.searchTypeBox = true;
        break;

      case 'searchKeywordBox':
        this.uiFlag.searchKeywordBox = true;
        break;
      case 'searchDateBox':
        this.uiFlag.searchDateBox = true;
        break;

      default:
        break;
    }
  }

  /**
   * 點擊 x 按鈕
   */
  clickCloseBtn(type: string) {
    switch (type) {
      case 'searchTypeBox':
        this.uiFlag.searchTypeBox = false;
        break;
      case 'searchKeywordBox':
        this.uiFlag.searchKeywordBox = false;
        break;
      case 'searchDateBox':
        this.uiFlag.searchDateBox = false;
        break;

      default:
        break;
    }
  }

  nextStep(type: string) {
    this.closeAllBox();
    switch (type) {
      case 'searchTypeBox':
        this.uiFlag.searchTypeBox = true;
        break;
      case 'searchKeywordBox':
        this.uiFlag.searchKeywordBox = true;
        break;
      case 'searchDateBox':
        this.uiFlag.searchDateBox = true;
        break;

      default:
        break;
    }
  }

  selectSearchType(type: string) {
    this.uiFlag.searchType = type;
    this.nextStep('searchKeywordBox');
    this.initFliter();
  }

  initFliter() {
    this.uiFlag.dateOption = '全部';
    this.fliterParameters = {
      user_name: '',
      phone: '',
      address: '',
      e_mail: '',
      sales_channel: '',
      start_date: '',
      end_date: '',
      serial_no: '',
    };
  }

  /**
   * 選擇快速日期
   * @param */
  dateOption(dateOption: string) {
    this.uiFlag.dateOption = dateOption;
    this.uiFlag.selectDateBox = false;
    switch (dateOption) {
      case '全部':
        this.fliterParameters.start_date = '';
        this.fliterParameters.end_date = '';
        break;
      case '30日':
        this.changeOptionTime(
          dayjs().startOf('day').subtract(29, 'day').toDate(),
          dayjs().endOf('day').toDate()
        );
        break;
      case '6個月':
        this.changeOptionTime(
          dayjs().subtract(6, 'month').add(1, 'day').toDate(),
          dayjs().endOf('day').toDate()
        );
        break;
      case '範圍':
        this.uiFlag.selectDateBox = true;
        break;
      // case 'thisMonth':
      //   this.changeOptionTime(dayjs().startOf('month').toDate(), dayjs().endOf('day').toDate());
      //   break;
      // case 'today':
      //   this.changeOptionTime(dayjs().startOf('day').toDate(), dayjs().endOf('day').toDate());
      //   break;
      // case 'thisWeek':
      //   this.changeOptionTime(dayjs().startOf('week').toDate(), dayjs().endOf('day').toDate());
      //   break;
      // case 'thisYear':
      //   this.changeOptionTime(dayjs().startOf('year').toDate(), dayjs().endOf('day').toDate());
      //   break;
      default:
        break;
    }
  }

  /**
   *快速日期區間選單
   */
  changeOptionTime(optionStartTime: Date, optionEndTime: Date) {
    this.fliterParameters.start_date = dayjs(optionStartTime).format('YYYY-MM-DD');
    this.fliterParameters.end_date = dayjs(optionEndTime).format('YYYY-MM-DD');
  }

  /**
   * custom更改起始日
   */
  changeStartTime(start_date: Date) {
    this.fliterParameters.start_date = dayjs(start_date).format('YYYY-MM-DD');
    // this.prefetchAPI();
  }

  /**
   * custom更改結束日
   */
  changeEndTime(end_date: Date) {
    this.fliterParameters.end_date = end_date
      ? dayjs(end_date).format('YYYY-MM-DD')
      : this.fliterParameters.start_date;
    // console.log(end_date);
  }

  closeAllBox() {
    this.uiFlag.searchTypeBox = false;
    this.uiFlag.searchKeywordBox = false;
    this.uiFlag.searchDateBox = false;
    this.uiFlag.selectDateBox = false;
  }

  fliterOrder(type?: string) {
    this.closeAllBox();
    switch (type) {
      case '銷貨單':
        // console.log('銷貨單搜尋');
        this.equipmentManagementService
          .fliterOrderApi(this.fliterParameters)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((_res) => {
            // console.log(_res);
            this.equipmentManagementService.setFliteredOrder(_res);
            if (this.router.url !== '/equipment-management/search?searchType=order') {
              this.router.navigateByUrl('/equipment-management/search?searchType=order');
            }
          });

        break;

      case '叫修單':
        // console.log('叫修單搜尋');
        this.equipmentManagementService
          .fliterRepairFormApi(this.fliterParameters)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((_res) => {
            // console.log(_res);
            this.equipmentManagementService.setFliteredRepairForm(_res);
            if (this.router.url !== '/equipment-management/search?searchType=repair_form') {
              this.router.navigateByUrl('/equipment-management/search?searchType=repair_form');
            }
          });
        break;
      case '產品':
        // console.log('產品搜尋');
        this.equipmentManagementService
          .getProdDetailApi(this.fliterParameters)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((_res) => {
            // console.log(_res);
            if (_res.order) {
              if (
                this.router.url !==
                `/equipment-management/equipment/${this.fliterParameters.serial_no}`
              ) {
                this.router.navigateByUrl(
                  `/equipment-management/equipment/${this.fliterParameters.serial_no}`
                );
              }
            } else {
              alert('查無此產品');
            }
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
