import { Component, OnInit } from '@angular/core';
import { UserProfileService } from '@shared/services/user-profile.service';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '@shared/services/utils.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  userImg: string;
  userId: string;
  userName: string;
  constructor(
    private userProfileService: UserProfileService,
    private route: ActivatedRoute,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('userId');
    const body = {
      token: this.utils.getToken(),
      targetUserId: this.userId || ''
    };
    this.userProfileService.getUserProfile(body).subscribe(res => {
      const response: any = res;
      const { name, nameIcon } = response.info;
      this.userName = name;
      this.userImg =
        nameIcon
          ? this.utils.buildBase64ImgString(nameIcon)
          : '/assets/images/user.png';
    });
  }
}
