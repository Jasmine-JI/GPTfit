import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, UserService } from '../../core/services';
import { EquipmentManagementBreadcrumbComponent } from './components/equipment-management-breadcrumb/equipment-management-breadcrumb.component';
import { SearchBarComponent } from './components/search/search-bar/search-bar.component';
import { EquipmentManagementService } from './services/equipment-management.service';

@Component({
  selector: 'app-equipment-management',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SearchBarComponent, EquipmentManagementBreadcrumbComponent],
  templateUrl: './equipment-management.component.html',
  styleUrls: ['./equipment-management.component.scss'],
})
export class EquipmentManagementComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  private _routerSubscription: any;
  token = this.auth.token;
  avatarUrl: string;
  isLogin: boolean;
  constructor(
    private auth: AuthService,
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private equipmentManagementService: EquipmentManagementService
  ) {}

  ngOnInit(): void {
    this.token = this.auth.token;
    this.auth.isLogin.pipe(takeUntil(this.ngUnsubscribe)).subscribe((ifLogin) => {
      this.isLogin = ifLogin;
    });

    if (this.isLogin) {
      const id = this.userService.getUser().userId;
      this.userService
        .getTargetUserInfo(id)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((user) => {
          this.avatarUrl = user.avatarUrl;
        });
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
    this._routerSubscription.unsubscribe();
  }
}
