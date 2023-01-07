import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StationDataList } from '../../core/models/compo';
import { TranslateModule } from '@ngx-translate/core';
import { SmallHrzoneChartComponent } from '../small-hrzone-chart/small-hrzone-chart.component';
import { MatIconModule } from '@angular/material/icon';
import { SortDirection, ComplexSportSortType, DataUnitType } from '../../core/enums/common';
import { SportType } from '../../core/enums/sports';
import { UserService } from '../../core/services';
import { DataTypeUnitPipe, DataTypeTranslatePipe, SportPaceSibsPipe } from '../../core/pipes';

@Component({
  selector: 'app-station-analysis-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    SmallHrzoneChartComponent,
    MatIconModule,
    DataTypeUnitPipe,
    DataTypeTranslatePipe,
    SportPaceSibsPipe,
  ],
  templateUrl: './station-analysis-list.component.html',
  styleUrls: ['./station-analysis-list.component.scss'],
})
export class StationAnalysisListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() stationList: StationDataList;

  /**
   * 使用者使用單位
   */
  userUnit = DataUnitType.metric;

  /**
   * 目前捲動位置
   */
  currentScrollLeft = 0;

  readonly SortDirection = SortDirection;
  readonly ComplexSportSortType = ComplexSportSortType;
  readonly SportType = SportType;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userUnit = this.userService.getUser().unit;
  }

  ngOnChanges(e: SimpleChanges) {}

  /**
   * 處理同步水平捲動
   * @param e {any}
   */
  handleScrollingSynchronous(e: any) {
    const { scrollLeft } = e.target;
    if (scrollLeft === this.currentScrollLeft) return;
    this.currentScrollLeft = scrollLeft;
    const scrollElementList = document.querySelectorAll('.station__content__container');
    scrollElementList.forEach((_element) => {
      _element.scroll({ left: scrollLeft });
    });
  }

  /**
   * 根據使用者點選內容進行排序
   * @param sortCode {ComplexSportSortType}-排序類別代號
   * @param isHrZone {boolean}-是否為心率區間類別
   */
  handleSorting(sortCode: ComplexSportSortType, isHrZone = false) {
    if (isHrZone) return; // 心率區間無法排序
    const { sortDirection, sortType } = this.stationList;
    if (sortCode === sortType) {
      this.stationList.sortDirection =
        sortDirection === SortDirection.asc ? SortDirection.desc : SortDirection.asc;
    } else {
      this.stationList.sortType = sortCode;
    }

    this.sortAllData();
  }

  /**
   * 將數據進行排序
   */
  sortAllData() {
    const { sortDirection, sortType, summary, station } = this.stationList;
    const summarySortInfo = { sortType, sortDirection, sportType: SportType.all };
    this.stationList = {
      sortDirection,
      sortType,
      summary: this.sortData(summary, summarySortInfo),
      station: this.sortStationData(station, sortType, sortDirection),
    };
  }

  /**
   * 將所有station資訊進行排序
   * @param station {Array<any>}-station所有資訊
   * @param sortType {ComplexSportSortType}-排序類別
   * @param sortDirection {SortDirection}-排序方向
   */
  sortStationData(
    station: Array<any>,
    sortType: ComplexSportSortType,
    sortDirection: SortDirection
  ) {
    return station.map((_station) => {
      const { memberList, type } = _station;
      const sortInfo = { sortType, sortDirection, sportType: type };
      _station.memberList = this.sortData(memberList, sortInfo);
      return _station;
    });
  }

  /**
   * 將依特定數據類別將成員排序
   * @param list {Array<any>}-成員數據列表
   * @param sortType {ComplexSportSortType}-排序類別
   * @param sortDirection {SortDirection}-排序方向
   */
  sortData(list: Array<any>, info: any) {
    const { sortType, sortDirection, sportType } = info;
    const isAscending = sortDirection === SortDirection.asc;
    const sortKey = this.getSortKey(sortType, sportType);
    return list.sort((_a, _b) => {
      const _aValue = _a[sortKey];
      const _bValue = _b[sortKey];
      if (_bValue === undefined) return -1;
      if (typeof _aValue === 'string') {
        if (isAscending) return _aValue <= _bValue ? -1 : 1;
        return _aValue >= _bValue ? -1 : 1;
      }

      return isAscending ? _aValue - _bValue : _bValue - _aValue;
    });
  }

  /**
   * 根據sortCode取得排序依據的鍵名
   * @param sortType {ComplexSportSortType}-排序類別
   * @param sportType {SportType}-運動類別
   */
  getSortKey(sortType: ComplexSportSortType, sportType: SportType) {
    switch (sortType) {
      case ComplexSportSortType.avgHeartRateBpm:
        return 'avgHeartRateBpm';
      case ComplexSportSortType.calories:
        return 'calories';
      case ComplexSportSortType.totalDistanceMeters:
        return 'totalDistanceMeters';
      case ComplexSportSortType.avgSpeed:
        return 'avgSpeed';
      case ComplexSportSortType.cadence:
        switch (sportType) {
          case SportType.cycle:
            return 'cycleAvgCadence';
          case SportType.row:
            return 'rowingAvgCadence';
          default:
            return 'runAvgCadence';
        }
      case ComplexSportSortType.power:
        switch (sportType) {
          case SportType.row:
            return 'rowingAvgWatt';
          default:
            return 'cycleAvgWatt';
        }
      default:
        return 'nickname';
    }
  }

  ngOnDestroy(): void {}
}
