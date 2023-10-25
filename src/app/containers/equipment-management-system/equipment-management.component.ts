import { UserProfile } from './../../core/models/api/api-10xx/api-10xx-common.model';
import { RouterOutlet } from '@angular/router';
import { Component, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from './components/search/search-bar/search-bar.component';
import { AuthService, UserService } from '../../core/services';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-equipment-management',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SearchBarComponent],
  templateUrl: './equipment-management.component.html',
  styleUrls: ['./equipment-management.component.scss'],
})
export class EquipmentManagementComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  token = this.auth.token;
  avatarUrl: string;
  isLogin: boolean;
  constructor(private auth: AuthService, private userService: UserService) {}

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
  }
}
