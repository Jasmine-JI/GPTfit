import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { PortalRoutingModule } from './portal-routing.module';
import { PortalComponent } from './portal.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { SexPipe } from '@shared/pipes/sex.pipe';
import { TimePipe } from '@shared/pipes/time.pipe';
import { MapInfoComponent } from './components/map-info/map-info.component';
import { MapService } from '@shared/services/map.service';
import { RankFormService } from './services/rank-form.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { GlobalEventsManager } from '@shared/global-events-manager';
import { PasswordComponent } from './components/password/password.component';
import { ResetPasswordService } from './services/reset-password.service';
import { BrowserXhr } from '@angular/http';

@NgModule({
  imports: [
    CommonModule,
    PortalRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    MapService,
    RankFormService,
    GlobalEventsManager,
    ResetPasswordService,
  ],
  declarations: [
    PortalComponent,
    NavbarComponent,
    LeaderboardComponent,
    SexPipe,
    TimePipe,
    MapInfoComponent,
    LoadingComponent,
    PaginationComponent,
    PasswordComponent
  ]
})
export class PortalModule {}
