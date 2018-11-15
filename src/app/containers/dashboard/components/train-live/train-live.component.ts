import { Component, OnInit } from '@angular/core';
import { CoachService } from '../../services/coach.service';
import { UtilsService } from '@shared/services/utils.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-train-live',
  templateUrl: './train-live.component.html',
  styleUrls: ['./train-live.component.css']
})
export class TrainLiveComponent implements OnInit {
  classLists: any;
  constructor(
    private coachService: CoachService,
    private utils: UtilsService,
    private router: Router
  ) {}

  ngOnInit() {
    const body = {
      token: this.utils.getToken(),
      classType: '7'
    };
    this.coachService
      .fetchClassRoomList(body)
      .subscribe(res => this.classLists = res.info.classList);
  }
  goToClass(id, type) {
    this.router.navigateByUrl(`/dashboard/coach-dashboard/${id}?type=${type}`);
  }
}
