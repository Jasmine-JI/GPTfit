import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule  } from '@angular/common/http';

import { PortalRoutingModule } from './portal-routing.module';
import { PortalComponent } from './portal.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';

@NgModule({
  imports: [
    CommonModule,
    PortalRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  declarations: [PortalComponent, NavbarComponent, LeaderboardComponent, PaginationComponent]
})
export class PortalModule { }
