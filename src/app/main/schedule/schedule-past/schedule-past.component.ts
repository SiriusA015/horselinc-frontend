import { Component, OnInit, Input } from '@angular/core';
import { HLServiceRequestModel } from 'app/model/service-requests';

@Component({
  selector: 'schedule-past',
  templateUrl: './schedule-past.component.html',
  styleUrls: ['./schedule-past.component.scss']
})
export class SchedulePastComponent implements OnInit {

  @Input() request: HLServiceRequestModel;
  creatorAvatarUrl = '';
  constructor() {
      this.request = new HLServiceRequestModel('', {});
      this.creatorAvatarUrl = 'assets/icons/horselinc/ic-profile.svg';
  }

  ngOnInit(): void {
      if (this.request && this.request.creator){
        (this.request.creator.avatarUrl == '') ? this.creatorAvatarUrl = 'assets/icons/horselinc/ic-profile.svg' : this.creatorAvatarUrl = this.request.creator.avatarUrl;
      }
  }
}
