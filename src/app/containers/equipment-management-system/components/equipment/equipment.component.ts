import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { Chart, ChartOptions, CoreInteractionOptions } from 'chart.js/auto';
import dayjs from 'dayjs';
import { Subject, takeUntil } from 'rxjs';
import { Domain, WebIp } from '../../../../core/enums/common';
import { UserService } from '../../../../core/services';
import { productListParameters } from '../../models/order-api.model';
import { EquipmentManagementService } from '../../services/equipment-management.service';
import { EditMaintenanceRequirementComponent } from '../maintenance-requirement/edit-maintenance-requirement/edit-maintenance-requirement.component';
import { EditEquipmentComponent } from './edit-equipment/edit-equipment.component';

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
  selector: 'app-equipment',
  templateUrl: './equipment.component.html',
  styleUrls: ['./equipment.component.scss'],
  standalone: true,
  imports: [
    EditEquipmentComponent,
    EditMaintenanceRequirementComponent,
    NgFor,
    NgIf,
    RouterLink,
    CommonModule,
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
export class EquipmentComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();

  productParameters: productListParameters;
  productDetail: any;

  productOrderRecord: any; // 產品訂單紀錄
  targetProdInfo: any; // 銷貨單連結後之產品基本資料(online)
  prodOfflineInfo: any; // 銷貨單連結後之產品基本資料(offline)
  productRepairs: any; // 產品維修保養紀錄

  /**
   * 裝置紀錄圖表 (里程、時間、次數)
   */
  equipRecord: any;

  originProdInfo: any;
  prodInfo: any;

  installTypeList = ['新裝', '換裝'];
  returnExchangeList: string[] = ['退貨', '換貨']; //退換貨狀態
  repairTypeList: string[] = ['維修', '保養']; //維修/保養狀態
  fileNames: string[] = [];

  isNewForm: boolean;
  editProd: boolean; // 產品_基本資料
  editFixReq: boolean; // 產品_叫修

  /**
   * 裝置紀錄/日誌日期範圍
   */
  logDate = {
    start_date: dayjs().subtract(6, 'month').format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
  };

  /**
   * 裝置日誌內容
   */
  equipmentLog: any;

  /**
   *日期快速選單
   */
  dateOptions = {
    previousMonth: '上個月',
    past3Months: '近三月',
    last6Months: '近半年',
    thisYear: '今年',
    custom: '自訂',
  };

  /**
   * ui 會用到的 flag
   */
  uiFlag = {
    isDateSelect: false,
    dateOption: this.dateOptions.last6Months,
  };

  showSalesChannelDropdown = false;
  showInstallTypeDropdown = { isOpen: false, selectedIndex: null };
  showReturnExchangeDropdown = { isOpen: false, selectedIndex: null };
  showRepairTypeDropdown = { isOpen: false, selectedIndex: null };

  readonly imgPath = `https://${
    location.hostname.includes(WebIp.develop) ? Domain.uat : location.hostname
  }/img/`;

  readonly modelImgPath = `https://${
    location.hostname.includes(WebIp.develop) ? Domain.uat : location.hostname
  }/app/public_html/products`;

  constructor(
    private userService: UserService,
    private equipmentManagementService: EquipmentManagementService
  ) {}

  ngOnInit(): void {
    this.getProductParameters();
  }

  /**
   * 開啟/關閉快速日期選單
   */
  dateSelect() {
    this.uiFlag.isDateSelect = !this.uiFlag.isDateSelect;
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  /**
   * 選擇快速日期
   * @param */
  dateOption(dateOption: string) {
    this.uiFlag.isDateSelect = false;
    this.uiFlag.dateOption = this.dateOptions[dateOption];
    switch (dateOption) {
      case 'previousMonth':
        this.changeOptionTime(
          dayjs().subtract(1, 'month').startOf('week').day(1).toDate(),
          dayjs().toDate()
        );
        break;
      case 'past3Months':
        this.changeOptionTime(
          dayjs().subtract(3, 'month').startOf('week').day(1).toDate(),
          dayjs().toDate()
        );
        break;
      case 'last6Months':
        this.changeOptionTime(
          dayjs().subtract(6, 'month').startOf('week').day(1).toDate(),
          dayjs().toDate()
        );
        break;
      case 'thisYear':
        this.changeOptionTime(
          dayjs().startOf('year').startOf('week').day(1).toDate(),
          dayjs().toDate()
        );
        break;
      default:
        break;
    }
  }

  /**
   *快速日期區間選單
   */
  changeOptionTime(optionStartTime: Date, optionEndTime: Date) {
    this.logDate.start_date = dayjs(optionStartTime).format('YYYY-MM-DD');
    this.logDate.end_date = dayjs(optionEndTime).format('YYYY-MM-DD');
    this.prefetchAPI();
  }

  /**
   * custom更改起始日
   */
  changeStartTime(start_date: Date) {
    this.uiFlag.dateOption = this.dateOptions.custom;
    this.logDate.start_date = dayjs(start_date).format('YYYY-MM-DD');
    this.prefetchAPI();
  }

  /**
   * custom更改結束日
   */
  changeEndTime(end_date: Date) {
    this.uiFlag.dateOption = this.dateOptions.custom;
    this.logDate.end_date = dayjs(end_date).format('YYYY-MM-DD');
    this.prefetchAPI();
  }

  prefetchAPI() {
    this.productParameters.start_date = this.logDate.start_date;
    this.productParameters.end_date = this.logDate.end_date;
    this.fetchOrderList();
  }

  /**
   * 根據sn碼取得出廠日期timestamp
   * @param sn {string}-裝置序號
   */
  getManufactureTimestamp(sn: string) {
    const baseYear = 1952;
    const manufactureYear = sn.charCodeAt(0) + baseYear;
    const manufactureWeek = +sn.slice(1, 3);
    const manufactureTimestamp =
      dayjs(`${manufactureYear}`, 'YYYY').valueOf() + manufactureWeek * 7 * 86400 * 1000;
    return dayjs(manufactureTimestamp).format('YYYY-MM');
  }

  calculateRound(value) {
    return Math.round(value * 10) / 10;
  }

  openImage(imageUrl: string) {
    window.open(imageUrl, '_blank');
  }

  toggleDropdown(type: string, i: number) {
    switch (type) {
      case 'return_exchange':
        this.showInstallTypeDropdown.isOpen = false;
        this.showRepairTypeDropdown.isOpen = false;
        if (this.showReturnExchangeDropdown.selectedIndex === i) {
          this.showReturnExchangeDropdown.isOpen = !this.showReturnExchangeDropdown.isOpen;
        } else {
          this.showReturnExchangeDropdown.isOpen = true;
        }
        this.showReturnExchangeDropdown.selectedIndex = i;
        break;

      case 'installType':
        this.showReturnExchangeDropdown.isOpen = false;
        this.showRepairTypeDropdown.isOpen = false;
        if (this.showInstallTypeDropdown.selectedIndex === i) {
          this.showInstallTypeDropdown.isOpen = !this.showInstallTypeDropdown.isOpen;
        } else {
          this.showInstallTypeDropdown.isOpen = true;
        }
        this.showInstallTypeDropdown.selectedIndex = i;
        break;

      case 'repairType':
        this.showInstallTypeDropdown.isOpen = false;
        this.showReturnExchangeDropdown.isOpen = false;
        if (this.showRepairTypeDropdown.selectedIndex === i) {
          this.showRepairTypeDropdown.isOpen = !this.showRepairTypeDropdown.isOpen;
        } else {
          this.showRepairTypeDropdown.isOpen = true;
        }
        this.showRepairTypeDropdown.selectedIndex = i;
        break;
    }
  }

  // selectType(type: string, selected: string, i: number) {
  //   this.closeAllDropdown();
  //   switch (type) {
  //     case 'return_exchange':
  //       this.productOrderRecord[i].return_exchange = selected;

  //       // this.updateOrderRecord(i); // ++寫入資料庫

  //       console.log(
  //         'this.orderProds[i]',
  //         this.productOrderRecord[i],
  //         this.productOrderRecord[i].return_exchange
  //       );
  //       break;

  //     case 'installType':
  //       this.productOrderRecord[i].install_type = selected;

  //       // this.updateOrderRecord(i); // ++寫入資料庫

  //       console.log(
  //         'this.orderProds[i]',
  //         this.productOrderRecord[i],
  //         this.productOrderRecord[i].install_type
  //       );
  //       break;

  //     case 'repairType':
  //       this.productRepairs[i].repair_type = selected;

  //       // this.updateOrderRecord(i); // ++寫入資料庫

  //       console.log(
  //         'this.orderProds[i]',
  //         this.productRepairs[i],
  //         this.productRepairs[i].repair_type
  //       );
  //       break;
  //   }
  // }

  editForm(type: string) {
    this.closeAllDropdown();
    switch (type) {
      case 'targetProdInfo':
        this.editProd = true;
        this.isNewForm = false;
        break;

      case 'fixReq':
        this.editFixReq = true;
        this.isNewForm = true;
        break;

      default:
        break;
    }
  }

  closeAllDropdown() {
    this.showInstallTypeDropdown.isOpen = false;
    this.showReturnExchangeDropdown.isOpen = false;
    this.showRepairTypeDropdown.isOpen = false;
  }

  /**
   * 呼叫API，並回傳所需資料
   */
  fetchOrderList() {
    this.equipmentManagementService
      .getProdDetailApi(this.productParameters)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((_productDetail) => {
        // 回傳基本資料
        this.equipmentManagementService.setProdDetail(_productDetail); //set OrderDetail
        this.productDetail = _productDetail;
        if (this.productDetail) {
          this.setProdInfo();
          // this.productOrderRecord = this.productDetail.order;
          // this.productRepairs = this.productDetail.repair;
          // this.equipRecord = this.productDetail.equipment;
          // if (this.productOrderRecord && this.equipRecord) {
          //   this.setTargetProdInfo();
          //   this.chartInit();
          // }
          // this.setOrderProd();
          // if (this.serialNo) {
          //   this.getProdLastModify();
          // }
        }
      });
  }

  setProdInfo() {
    this.productOrderRecord = this.productDetail.order;
    this.productRepairs = this.productDetail.repair?.reverse();
    this.equipRecord = this.productDetail.equipment;
    this.equipmentLog = this.productDetail.error_code;
    // console.log(this.productOrderRecord);
    // console.log('productRepairs:', this.productRepairs);
    // console.log('equipRecord:', this.equipRecord);
    // console.log('total_use_time_second:', this.equipRecord.total_use_time_second);
    if (this.productOrderRecord) {
      this.setTargetProdInfo();
    }
    if (this.equipRecord) {
      setTimeout(() => {
        this.equipRecordChart();
      }, 100);
    }
  }

  setFileArray() {
    if (this.targetProdInfo.attach_file) {
      if (this.targetProdInfo.attach_file === 'None') {
        this.fileNames = [];
        this.targetProdInfo.attach_file = '';
      } else {
        this.fileNames = this.targetProdInfo.attach_file.split(',');
      }
    } else {
      this.fileNames = [];
    }
  }

  /**
   * 取得銷貨單連結產品後之產品基本資料
   */
  setTargetProdInfo() {
    const targetOrderIndex = this.productOrderRecord.findIndex(
      (order) => order.status === 'online'
    );
    this.targetProdInfo = this.productOrderRecord[targetOrderIndex];
    this.equipmentManagementService.setTargetProdInfo(this.targetProdInfo);
    // console.log('targetProdInfo:', this.targetProdInfo);
    if (this.targetProdInfo) {
      this.setFileArray();
      this.getRegisterNickname();
    } else {
      this.setProdOfflineInfo();
    }
  }

  getRegisterNickname() {
    // 使用userService來獲取nickname
    this.userService
      .getTargetUserInfo(this.targetProdInfo.register_id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        // console.log(res);
        const nickname = res.nickname;
        this.targetProdInfo.registerName = nickname; // 將獲取的nickname添加到對象中
      });
  }

  setProdOfflineInfo() {
    const { create_name, create_time, serial_no, product_type, modify_name, modify_time } =
      this.productOrderRecord[0];
    this.prodOfflineInfo = {
      create_name,
      create_time,
      modify_name,
      modify_time,
      serial_no,
      product_type,
      status: 'offline',
    };
    // console.log('prodOfflineInfo:', this.prodOfflineInfo);
  }

  /**
   * 取得目前銷貨單order_no
   */
  getProductParameters() {
    this.equipmentManagementService.productParameters$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((_productParameters) => {
        // console.log(_productParameters);
        this.productParameters = _productParameters;
        if (this.productParameters) {
          this.fetchOrderList();
        }
      });
  }

  equipRecordChart() {
    let total_use_time_second: number[] | null;
    let total_use_meter: number[] | null;
    let total_number_of_enable: number[] | null;
    let update_time: number[] | null;

    if (this.equipRecord) {
      total_use_time_second =
        this.equipRecord?.total_use_time_second.map(
          (value) => Math.round((value / 3600) * 10) / 10
        ) ?? [];
      total_use_meter = this.equipRecord?.total_use_meter ?? [];
      total_number_of_enable = this.equipRecord?.total_number_of_enable ?? [];
      update_time = this.equipRecord.update_time ?? [];
      // console.log(update_time);
    }
    const data = {
      labels: update_time,
      datasets: [
        {
          label: '里程',
          pointStyle: 'circle',
          data: total_use_meter,
          borderColor: '#FF712E',
          backgroundColor: '#FF712E',
          borderWidth: 1,
          yAxisID: 'ymeter',
        },
        {
          label: '時數',
          pointStyle: 'circle',
          data: total_use_time_second,
          borderColor: '#6ACB7A',
          backgroundColor: '#6ACB7A',
          borderWidth: 1,
          yAxisID: 'ytime',
        },
        {
          label: '次數',
          pointStyle: 'circle',
          data: total_number_of_enable,
          borderColor: '#6AA2CB',
          backgroundColor: '#6AA2CB',
          borderWidth: 1,
          yAxisID: 'ynumber',
        },
      ],
    };

    const interaction: CoreInteractionOptions = {
      mode: 'nearest',
      intersect: false,
      axis: 'x',
      includeInvisible: false,
    };

    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: interaction,
      plugins: {
        legend: {
          display: true,
          align: 'center',
          onClick: null,
          labels: {
            usePointStyle: true,
          },
        },
        tooltip: {
          usePointStyle: true,
        },
      },

      scales: {
        ymeter: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true, // y轴从0开始
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            //   // callback: (value: number) => `${value}%`, // 刻度百分比符號
            count: 5,
            color: '#FF712E',
          },
        },
        ytime: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true, // y轴从0开始
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            callback: (value: number) => `${value}`,
            count: 5,
            color: '#6ACB7A',
          },
        },
        ynumber: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true, // y轴从0开始
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            callback: (value: number) => `${value}`,
            count: 5,
            color: '#6AA2CB',
          },
        },
        x: {
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            // display: false,
            maxTicksLimit: 5, // 指定要顯示的最大標籤數量
          },
        },
        // x: {
        //   type: 'time', // Use time scale for the x-axis
        //   grid: {
        //     drawOnChartArea: false,
        //   },
        //   time: {
        //     unit: 'month', // Display data by month
        //     parser: 'YYYY-MM', // 解析日期格式
        //     tooltipFormat: 'YYYY-MM', // 提示工具提示格式
        //     displayFormats: {
        //       month: 'YYYY-MM', // Format for displaying months (e.g., "Jan 2023")
        //     },
        //   },
        // }
      },
    };

    const oldChart = Chart.getChart('deviceChart');
    if (oldChart) {
      oldChart.destroy();
    }

    new Chart('deviceChart', {
      type: 'line',
      data: data,
      options: options,
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}
