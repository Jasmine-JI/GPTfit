import { Component } from '@angular/core';
import { EquipmentManagementService } from '../../../services/equipment-management.service';
import { AuthService } from '../../../../../core/services';
import { Router, RouterLink } from '@angular/router';
import { equipmentManagementLogIn } from '../../../equipment-management-routing.module';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  standalone: true,
  imports: [RouterLink],
})
export class SearchBarComponent {
  constructor(
    private auth: AuthService,
    private equipmentManagementService: EquipmentManagementService,
    private router: Router
  ) {}

  /**
   * 登出
   */
  logout() {
    this.auth.logout();
    this.router.navigateByUrl(equipmentManagementLogIn);
  }
}
