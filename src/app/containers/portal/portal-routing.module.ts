import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PortalComponent } from './portal.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { MapInfoComponent } from './components/map-info/map-info.component';

const routes: Routes = [
  {
    path: '', component: PortalComponent,
    children: [
      {
        path: 'leaderboard', component: LeaderboardComponent,
      },
      {
        path: 'leaderboard/mapInfo', component: MapInfoComponent,
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PortalRoutingModule { }
