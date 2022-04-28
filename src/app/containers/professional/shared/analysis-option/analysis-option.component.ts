import { Component, OnInit, OnChanges, OnDestroy, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { AnalysisOptionService } from '../../services/analysis-option.service';
import { AnalysisOption, OneOption } from '../../classes/analysis-option';
import { SportType } from '../../../../shared/enum/sports';
import { BrandType, GroupLevel } from '../../../../shared/enum/professional';
import { AnalysisSportsColumn } from '../../enum/report-analysis';


@Component({
  selector: 'app-analysis-option',
  templateUrl: './analysis-option.component.html',
  styleUrls: ['./analysis-option.component.scss']
})
export class AnalysisOptionComponent implements OnInit, OnChanges, OnDestroy {

  @Input('analysisOption') analysisOption: AnalysisOption;

  /**
   * 
   */
  @Output('optionChange') optionChange = new EventEmitter();

  readonly SportType = SportType;
  readonly GroupLevel = GroupLevel;
  readonly BrandType = BrandType;
  readonly AnalysisSportsColumn = AnalysisSportsColumn;

  constructor() { }

  ngOnInit(): void {
  }

  /**
   * 
   * @param e {SimpleChanges}
   */
  ngOnChanges(e: SimpleChanges): void {}

  /**
   * 變更單一階層項目選擇狀態
   * @param layer {OneOption}-單一階層選項
   * @author kidin-1110331
   */
  changeLayerSelectedStatus(layer: OneOption) {
    layer.toggleSelected();
    this.optionChange.emit(this.analysisOption);
  }

  /**
   * 變更單一欄位項目選擇狀態
   * @param column {OneOption}-單一欄位選項
   * @author kidin-1110331
   */
  changeColumnSelectedStatus(column: OneOption) {
    column.toggleSelected();
    this.analysisOption.checkOverLimit();
    this.optionChange.emit(this.analysisOption);
  }

  ngOnDestroy(): void {}

}


