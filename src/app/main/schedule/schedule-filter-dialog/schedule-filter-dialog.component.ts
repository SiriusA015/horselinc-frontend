import { Component, OnInit } from '@angular/core';
import { ScheduleService } from '../schedule.service';
import { HLScheduleFilterModel } from 'app/model/filter';

interface Sortby {
    value: string;
    viewValue: string;
}

@Component({
  selector: 'schedule-filter-dialog',
  templateUrl: './schedule-filter-dialog.component.html',
  styleUrls: ['./schedule-filter-dialog.component.scss']
})
export class ScheduleFilterDialogComponent implements OnInit {
    toggle: boolean;    
    sortBy: string[] = ['None', 'Horse Barn Name (ascending)', 'Horse Barn Name (descending)', 'Horse Show Name (ascending)', 'Horse Show Name (descending)'];
    sortType = '';
    startDate: any;
    endDate: any;
    isFiltering: boolean;

    constructor(
        private _scheduleService: ScheduleService,
    ) {
        this.isFiltering = false;
        this.startDate = null;
        this.endDate = null;
    }

    ngOnInit(): void {
        this.isFiltering = false;
        this.toggle = true;
    }

    toggleFilter(): void {
        this.toggle = !this.toggle;
    }
    onApply(): void{
        let sDate: number;
        let eDate: number;
        sDate = new Date(this.startDate).getTime();
        eDate = new Date(this.endDate).getTime();
        this._scheduleService.filter = new HLScheduleFilterModel({sortType : this.sortType, startDate : sDate, endDate : eDate});
        this.isFiltering = true;
        this._scheduleService.getPastRequestList(null, true)
        .then(() => {
            
        })
        .catch((err) => {
            this._scheduleService.onLoadingPast.next(false);
            this._scheduleService.isLoadingPast = false;
        });
        this.toggle = !this.toggle;
    }
    onClear(): void{
        this._scheduleService.filter = null;
        this.isFiltering = false;
        // this._scheduleService.getPastRequestList(null, true);
        // this.toggle = !this.toggle;
        this.startDate = null;
        this.endDate = null;
        this.sortType = '';
    }
}
