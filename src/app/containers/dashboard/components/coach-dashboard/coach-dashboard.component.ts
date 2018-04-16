import { Component, OnInit } from '@angular/core';
import { CoachService } from '../../services/coach.service';
import { DragulaService } from 'ng2-dragula/ng2-dragula';
import { mapImages } from '@shared/mapImages';
import { Router } from '@angular/router';
import { mapInfos } from './coach';

@Component({
  selector: 'app-coach-dashboard',
  templateUrl: './coach-dashboard.component.html',
  styleUrls: ['./coach-dashboard.component.css']
})
export class CoachDashboardComponent implements OnInit {
  raceList = [];
  mapImages = mapImages;
  mapInfos = mapInfos;
  tabIdx = 1;
  mapIdx = 1;
  constructor(
    private coachService: CoachService,
    private dragula: DragulaService,
    private router: Router
  ) {
    const bag: any = this.dragula.find('bag-items');
    if (bag !== undefined) {
      this.dragula.destroy('bag-items');
    }
  }

  ngOnInit() {
    const body = {
      token: 'e467bdfefeb831bcd4af56d12d1ce988',
      serialNumber: '79ACE0A2-BAAB-45C1-BC40-A4149570130F',
      sportMode: '0',
      trainingType: '0',
      page: '0',
      pageCounts: '1000'
    };
    this.coachService.fetchRaceList(body).subscribe(res => {
      const { info: { raceList } } = res;
      this.raceList = raceList;
    });
  }
  createTestRoom() {
    const body = {
      token: 'e467bdfefeb831bcd4af56d12d1ce988',
      raceRoom: '1',
      raceMan: '5'
    };
    const body1 = {
      token: 'e467bdfefeb831bcd4af56d12d1ce988',
      serialNumber: '79ACE0A2-BAAB-45C1-BC40-A4149570130F',
      sportMode: '0',
      trainingType: '0',
      page: '0',
      pageCounts: '1000'
    };
    this.coachService.postRaceTest(body).subscribe(res => {
      this.coachService.fetchRaceList(body1).subscribe(_res => {
        const { info: { raceList } } = _res;
        this.raceList = raceList;
      });
    });
  }

  goViewRace(raceId) {
    this.router.navigateByUrl('/dashboardalaala/test/' + raceId + '?ipm=s');
  }
  choose(idx) {
    this.tabIdx = idx;
  }
  chooseMap(index) {
    this.mapIdx = index;
  }
}
