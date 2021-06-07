import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-sports-reports',
  templateUrl: './sports-report.component.html',
  styleUrls: ['./sports-report.component.scss']
})
export class SportsReportComponent implements OnInit, OnDestroy {

  private ngUnsubscribe = new Subject();

  /**
   * UI會用到的各個flag
   */
  uiFlag = {
    isPreviewMode: false,
    isLoading: false
  }

  /**
   * 處理圖表顯示與否
   */
  chartStatus = {
    initialChartComplated: false,
    showHRZoneChartTarget: false
  }

  /**
   * 處理分析列表的選單
   */
  showTableMenu = {
    group: {},
    person: {}
  }


  reportCategory: any;
  brandName: any;
  branchName: any;
  groupImg: any;
  groupData: any;
  passPrivacyNum: any;
  categoryActivityLength: any;
  totalTime: any;
  avgTime: any;
  totalCalories: any;
  avgPersonCalories: any;
  totalDistance: any;
  totalWeight: any;
  perTypeLength: any;
  selectType: any;
  dataDateRange: any;
  typeHrZone: any;
  hrZoneRange: any;
  perHrZoneData: any;
  perSpeedData: any;
  bestSpeed: any;
  avgSpeed: any;
  bestPace: any;
  avgPace: any;
  perPaceData: any;
  bestPower: any;
  avgPower: any;
  perPowerData: any;
  perCadenceData: any;
  bestCadence: any;
  avgCadence: any;
  bestSwolf: any;
  avgSwolf: any;
  perSwolfData: any;
  bestCalories: any;
  avgCalories: any;
  perCalories: any;
  groupLevel: any;
  groupTableTypeList = {
    filter: [],
    column: []
  };
  tableTypeListOpt = {
    tableCheckedNum: {
      group: {
        filter: null,
        column: null
      }
    },
    max: null
  };
  diffDay: any;
  tableData = {
    display: {
      group: {
        data: null
      }
    }
  };
  sortCategory = {
    group: null,
    person: null
  };
  groupPage = {
    memberList: null
  };
  personalPage = {
    belongGroup: null,
    info: null,
    report: null
  }

  constructor(

  ) { }

  ngOnInit(): void {
  }

  /**
   * 列印
   * @author kidin-1091119
   */
  print() {
    window.print();
  }

  /**
   * 取消rxjs訂閱
   * @author kidin-1091118
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
