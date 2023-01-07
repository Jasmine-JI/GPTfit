import { SportType } from '../../enums/sports';
import { SortDirection, ComplexSportSortType } from '../../enums/common';

/**
 * 用於課程分析複合式運動各站個人分析列表
 */
export interface StationDataList {
  summary: Array<ClassTrainingData>;
  sortType: ComplexSportSortType;
  sortDirection: SortDirection;
  station: Array<{
    stationId: number;
    dispName: string;
    type: SportType;
    memberList: Array<ClassTrainingData>;
  }>;
}

export interface ClassTrainingData {
  nickname: string;
  avgHeartRateBpm: number;
  calories: number;
  hrZone: Array<number>;
  avgSpeed?: number;
  totalDistanceMeters?: number;
  runAvgCadence?: number;
  cycleAvgWatt?: number;
  cycleAvgCadence?: number;
  rowingAvgCadence?: number;
  rowingAvgWatt?: number;
}
