import { Component, OnInit } from '@angular/core';
import { UserProfileService } from '../../services/user-profile.service';
import { HttpParams } from '@angular/common/http';
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
    let params = new HttpParams();
    params = params.set('userId', this.userId);
    this.userProfileService.getUserProfile(params).subscribe(res => {
      const response: any = res;
      this.userName = response.userName;
      this.userImg =
        response.userIcon
          ? this.utils.buildBase64ImgString(response.userIcon)
          : '/assets/images/user.png';
    });
  }
}
