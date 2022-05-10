import { Component, OnInit, Input } from '@angular/core';

import { HLServiceRequestModel } from 'app/model/service-requests';

interface Card {
  desc: string;
  type: string;
}

@Component({
  selector: 'schedule-current',
  templateUrl: './schedule-current.component.html',
  styleUrls: ['./schedule-current.component.scss']
})

export class ScheduleCurrentComponent implements OnInit {

    @Input() request: HLServiceRequestModel;
    @Input() reservation: string;
  
    constructor() {

    }

    ngOnInit(): void {

    }

}
