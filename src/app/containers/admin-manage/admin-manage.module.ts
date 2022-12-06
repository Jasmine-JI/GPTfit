import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemOperationReportComponent } from './system-operation-report/system-operation-report.component';
import { GroupOperationListComponent } from './group-operation-list/group-operation-list.component';

@NgModule({
  declarations: [SystemOperationReportComponent, GroupOperationListComponent],
  imports: [CommonModule],
})
export class AdminManageModule {}
