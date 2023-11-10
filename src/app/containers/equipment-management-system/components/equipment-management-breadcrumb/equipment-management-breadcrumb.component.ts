import { EquipmentManagementService } from './../../services/equipment-management.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { Observable, Subject, distinctUntilChanged, filter, map, takeUntil } from 'rxjs';

@Component({
  selector: 'app-equipment-management-breadcrumb',
  templateUrl: './equipment-management-breadcrumb.component.html',
  styleUrls: ['./equipment-management-breadcrumb.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, NgIf, NgFor],
})
export class EquipmentManagementBreadcrumbComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  breadcrumbs: Array<any> = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private equipmentManagementService: EquipmentManagementService
  ) {}

  ngOnInit() {
    this.equipmentManagementService
      .getBreadcrumbs()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((_breadcrumbs) => {
        // console.log(_breadcrumbs);
        this.breadcrumbs = _breadcrumbs;
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }

  routerTo(url?: string) {
    // console.log(url);
    this.router.navigateByUrl(url);
  }
}
