import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../../services/group.service';
import { UtilsService } from '@shared/services/utils.service';

@Component({
  selector: 'app-group-info',
  templateUrl: './group-info.component.html',
  styleUrls: ['./group-info.component.css']
})
export class GroupInfoComponent implements OnInit {
  groupId: string;
  token: string;
  groupInfo: any;
  groupImg: string;
  group_id: string;
  groupLevel: string;
  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('groupId');
    this.token = this.utils.getToken();
    const body = {
      token: this.token,
      groupId: this.groupId
    };
    this.groupService.fetchGroupListDetail(body).subscribe(res => {
      this.groupInfo = res.info;
      const { groupIcon, groupId } = this.groupInfo;
      this.groupImg = this.utils.buildBase64ImgString(groupIcon);
      this.group_id = this.utils.displayGroupId(groupId);
      this.groupLevel = this.utils.displayGroupLevel(groupId);
    });
  }
}
