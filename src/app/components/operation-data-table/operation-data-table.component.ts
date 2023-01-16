import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
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
  @Input() tableData: any;

  readonly OperationDataType = OperationDataType;

  ngOnInit(): void {}

  ngOnChanges(e: SimpleChanges): void {
    console.log('tableChange', e);
  }
}
