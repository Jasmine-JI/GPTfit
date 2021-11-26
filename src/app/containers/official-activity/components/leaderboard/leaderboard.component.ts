import { Component, OnInit } from '@angular/core';
import { OfficialActivityService } from '../../services/official-activity.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {

  constructor(
    private officialActivityService: OfficialActivityService
  ) { }

  ngOnInit(): void {
    
  }

}
