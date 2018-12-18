import { Component, OnInit } from '@angular/core';
import { UserProfileService } from '@shared/services/user-profile.service';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '@shared/services/utils.service';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  userImg: string;
  userId: string;
  fileId: string;
  userName: string;
  description: string;
  chooseIdx = 1;
  constructor(
    private userProfileService: UserProfileService,
    private route: ActivatedRoute,
    private utils: UtilsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('userId');
    if (this.userId) {
      this.utils.setSessionStorageObject('visitedId', this.userId);
    }

    this.fileId = this.route.snapshot.paramMap.get('fileId');
    this.detectUrlChange(location.pathname);
    this.router.events.subscribe((val: NavigationEnd) => {
      if (val instanceof NavigationEnd && val.url) {
        this.detectUrlChange(val.url);
      }
    });
    this.fetchUserProfile();
  }
  handleProfileItem(idx) {
    this.chooseIdx = idx;
    if (!this.userId) {
      this.userId = this.utils.getSessionStorageObject('visitedId');
    }
    let url = '';
    switch (this.chooseIdx) {
      case 2:
        url = `/user-profile/${this.userId}/activity-list`;
        break;
      case 3:
        url = `/user-profile/${this.userId}/sport-report`;
        break;
      // case 4:
      //   url = `/activity/${this.fileId}`;
      //   break;
      default:
        url = `/user-profile/${this.userId}`;
    }
    this.router.navigateByUrl(url);
    this.fetchUserProfile();
  }
  fetchUserProfile() {
    const body = {
      token: this.utils.getToken(),
      targetUserId: this.userId || ''
    };
    this.userProfileService.getUserProfile(body).subscribe(res => {
      const response: any = res;
      const { name, nameIcon, description } = response.info;
      this.description = description;
      this.userName = name;
      this.userImg = nameIcon
        ? this.utils.buildBase64ImgString(nameIcon)
        : '/assets/images/user.png';
    });
  }
  detectUrlChange(url) {
    if (url.indexOf(`/user-profile/${this.userId}`) > -1) {
      this.chooseIdx = 1;
    }
    if (url.indexOf(`/user-profile/${this.userId}/activity`) > -1) {
      this.chooseIdx = 2;
    }
    if (url.indexOf(`/user-profile/${this.userId}/sport-report`) > -1) {
      this.chooseIdx = 3;
    }
    // if (url.indexOf(`/activity/${this.fileId}`) > -1) {
    //   this.chooseIdx = 4;
    // }
  }
}
