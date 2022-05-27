import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { AnalysisOneOption } from '../../classes/analysis-one-option';
import { SportType } from '../../enum/sports';
import { BrandType, GroupLevel } from '../../enum/professional';
import { AnalysisSportsColumn } from '../../../containers/professional/enum/report-analysis';
import { MuscleAnalysisColumn } from '../../enum/weight-train';


@Component({
  selector: 'app-analysis-option',
  templateUrl: './analysis-option.component.html',
  styleUrls: ['./analysis-option.component.scss']
})
export class AnalysisOptionComponent implements OnInit, OnDestroy {

  @Input('analysisOption') analysisOption: any;
  @Output('optionChange') optionChange = new EventEmitter();

  readonly SportType = SportType;
  readonly GroupLevel = GroupLevel;
  readonly BrandType = BrandType;
  readonly AnalysisSportsColumn = AnalysisSportsColumn;
  readonly MuscleAnalysisColumn = MuscleAnalysisColumn;

  constructor() { }

  ngOnInit(): void {
  }

  /**
   * 變更單一階層項目選擇狀態
   * @param layer {AnalysisOneOption}-單一階層選項
   * @author kidin-1110331
   */
  changeLayerSelectedStatus(layer: AnalysisOneOption) {
    layer.toggleSelected();
    this.optionChange.emit(this.analysisOption);
  }

  /**
   * 變更單一欄位項目選擇狀態
   * @param column {AnalysisOneOption}-單一欄位選項
   * @author kidin-1110331
   */
  changeColumnSelectedStatus(column: AnalysisOneOption) {
    column.toggleSelected();
    this.analysisOption.checkOverLimit();
    this.optionChange.emit(this.analysisOption);
  }

  ngOnDestroy(): void {}

}


