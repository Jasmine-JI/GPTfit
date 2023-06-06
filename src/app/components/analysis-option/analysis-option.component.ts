import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AnalysisOneOption } from '../../shared/classes/analysis-one-option';
import { BrandType, GroupLevel } from '../../core/enums/professional';
import { AnalysisSportsColumn, MuscleAnalysisColumn, SportType } from '../../core/enums/sports';

@Component({
  selector: 'app-analysis-option',
  templateUrl: './analysis-option.component.html',
  styleUrls: ['./analysis-option.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule],
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
   */
  changeLayerSelectedStatus(layer: AnalysisOneOption) {
    layer.toggleSelected();
    this.optionChange.emit(this.analysisOption);
  }

  /**
   * 變更單一欄位項目選擇狀態
   * @param column {AnalysisOneOption}-單一欄位選項
   */
  changeColumnSelectedStatus(column: AnalysisOneOption) {
    column.toggleSelected();
    this.analysisOption.checkOverLimit();
    this.optionChange.emit(this.analysisOption);
  }

  ngOnDestroy(): void {}
}
