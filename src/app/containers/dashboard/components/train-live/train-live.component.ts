import { Component, OnInit } from '@angular/core';
import { CoachService } from '../../services/coach.service';
import { UtilsService } from '@shared/services/utils.service';

@Component({
  selector: 'app-train-live',
  templateUrl: './train-live.component.html',
  styleUrls: ['./train-live.component.css']
})
export class TrainLiveComponent implements OnInit {
  classLists: any;
  constructor(
    private coachService: CoachService,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    const body = {
      token: this.utils.getToken(),
      classType: '1'
    };
    this.coachService
      .fetchClassRoomList(body)
      .subscribe(res => this.classLists = res.info.classList);
  }
}
