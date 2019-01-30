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
  isDemoMode = true;
  demoClassDesc = `
  High-low impact aerobics classes consist of a traditional dance-inspired routine. With low-impact aerobics,
  you always have one foot on the floor. you don't do any jumping or hopping. High-impact aerobics moves at a slower pace,
  but you jump around a lot. High-low combines the two types of routines.`;
  constructor(
    private coachService: CoachService,
    private utils: UtilsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.demoClassDesc = this.handleClassInfo(this.demoClassDesc);
    const body = {
      token: this.utils.getToken(),
      classType: '7'
    };
    this.coachService.fetchClassRoomList(body).subscribe(res => {
      this.classLists = res.info.classList;
      this.classLists = this.classLists.map(_list => {
        _list.coachAvatar =
          _list.coachAvatar && _list.coachAvatar.length > 0
            ? this.utils.buildBase64ImgString(_list.coachAvatar)
            : '/assets/images/user.png';
        _list.groupDesc = this.handleClassInfo(_list.groupDesc);
        return _list;
      });
    });
  }
  goToClass(id, type) {
    this.router.navigateByUrl(`/dashboard/coach-dashboard/${id}?type=${type}`);
  }
  handleClassInfo(str) {
    let classInfo = str.replace(/\r\n|\n/g, '').trim();
    if (classInfo.length > 105) {
      classInfo = classInfo.substring(0, 105) + '  ...';
    }
    return classInfo;
  }
}
