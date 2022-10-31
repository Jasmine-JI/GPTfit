import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  NgModule,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AnalysisOneOption } from '../../shared/classes/analysis-one-option';
import { SportType } from '../../shared/enum/sports';
import { BrandType, GroupLevel } from '../../shared/enum/professional';
import { AnalysisSportsColumn } from '../../shared/enum/report-analysis';
import { MuscleAnalysisColumn } from '../../shared/enum/weight-train';

@Component({
  selector: 'app-analysis-option',
  templateUrl: './analysis-option.component.html',
  styleUrls: ['./analysis-option.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalysisOptionComponent implements OnInit, OnChanges, OnDestroy {
  @Input() analysisOption: any;
  @Output() optionChange = new EventEmitter();

  readonly SportType = SportType;
  readonly GroupLevel = GroupLevel;
  readonly BrandType = BrandType;
  readonly AnalysisSportsColumn = AnalysisSportsColumn;
  readonly MuscleAnalysisColumn = MuscleAnalysisColumn;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges() {}

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
@NgModule({
  declarations: [AnalysisOptionComponent],
  exports: [AnalysisOptionComponent],
  imports: [CommonModule, TranslateModule],
})
export class AnalysisOptionModule {}
