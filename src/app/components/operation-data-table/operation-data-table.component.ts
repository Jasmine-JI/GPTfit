import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OperationTableOption } from '../../core/models/compo';
import { OperationDataType } from '../../core/enums/compo';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-operation-data-table',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './operation-data-table.component.html',
  styleUrls: ['./operation-data-table.component.scss'],
})
export class OperationDataTableComponent implements OnInit, OnChanges {
  @Input() tableData: { option: OperationTableOption; data: Array<unknown> };
  @Output() showIndex: EventEmitter<number> = new EventEmitter();

  readonly OperationDataType = OperationDataType;

  ngOnInit(): void {}

  ngOnChanges(e: SimpleChanges): void {}

  /**
   * 展開或收合指定的列數據
   * @param rowIndex {number}-欲展開或收合的數據清單列序列
   */
  showFullTableData(rowIndex: number) {
    this.showIndex.emit(rowIndex);
  }
}
