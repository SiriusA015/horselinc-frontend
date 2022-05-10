import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfigService } from '@fuse/services/config.service';
import { HLServiceRequestModel } from 'app/model/service-requests';
import { HLServiceRequestStatus } from 'app/model/enumerations';
import { ScheduleService } from 'app/main/schedule/schedule.service';
import * as moment from 'moment';

interface SortedRequest {
    date: string;
    displayDate: string;
    displayOpt: string;
    requestList: HLServiceRequestModel[];
}

@Component({
  selector: 'schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations   : fuseAnimations
})

export class ScheduleComponent implements OnInit {

    requestList: HLServiceRequestModel[] = [];
    currentRequestList: SortedRequest[] = [];
    pastRequestList: SortedRequest[] = [];
    curRequestListLastUpdate = '';
    pastRequestListLastUpdate = '';
    whichTab = true;
    isLoadingCurrent = false;
    isLoadingPast = false;
    isCurrentRefresh = false;
    isPastRefresh = false;
    currentRequestsLastId: string;
    pastRequestsLastId: string;
    // Private
    private _unsubscribeAll: Subject<any>;
    
    constructor(
        private _scheduleService: ScheduleService,
        private _fuseConfigService: FuseConfigService,
    ) {
        this.currentRequestList = [];
        this.pastRequestList = [];
        // Set the private defaults
        this._unsubscribeAll = new Subject();
        // Configure the layout
        this._fuseConfigService.config = {
            layout: {
                navbar   : {
                    hidden: false
                },
                toolbar  : {          
                    hidden: false
                },
                footer   : {
                    hidden: true
                },
                sidepanel: {
                    hidden: true
                }
            }
        };
     }

    ngOnInit(): void {
        const today = moment(new Date()).format('MM/DD/YYYY');
        this.currentRequestList = [];

        this._scheduleService.onCurrentRequestListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(requestList => {
                this.requestList = requestList.list;
                
                this.isCurrentRefresh = requestList.isRefresh;
                if (this.isCurrentRefresh){
                    this.currentRequestList = [];
                }
                if (!this.requestList) {return; }
                this.requestList.forEach(request => {
                    if (request.status == HLServiceRequestStatus.pending ||
                            request.status == HLServiceRequestStatus.accepted ||
                            request.status == HLServiceRequestStatus.completed){
                        if (this.curRequestListLastUpdate == ''){
                            this.curRequestListLastUpdate = request.updatedAt;
                        }
                        if (this.curRequestListLastUpdate < request.updatedAt){
                            this.curRequestListLastUpdate = request.updatedAt;
                        }
                        this.pushNewRequest(request, this.currentRequestList, true);
                    }
                });
            });

        this._scheduleService.onPastRequestListChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(requestList => {
            this.requestList = requestList.list;
            
            this.isPastRefresh = requestList.isRefresh;
            if (this.isPastRefresh){
                this.pastRequestList = [];
            }
            if (!this.requestList) {return; }
            this.requestList.forEach(request => {
                if (request.requestDate < today) {
                    if (this.pastRequestListLastUpdate == ''){
                        this.pastRequestListLastUpdate = request.updatedAt;
                    }
                    if (this.pastRequestListLastUpdate < request.updatedAt){
                        this.pastRequestListLastUpdate = request.updatedAt;
                    }
                    this.pushNewRequest(request, this.pastRequestList, false);                        
                }
            });
        });
        
        this._scheduleService.onLoadingPast
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(isLoading => {
            this.isLoadingPast = isLoading;
        });
        this._scheduleService.onLoadingCurrent
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(isLoading => {
            this.isLoadingCurrent = isLoading;
        });
    }

    pushNewRequest(request: HLServiceRequestModel, RequestList: SortedRequest[], isCurrent: boolean): void {
        if (!request) {return; }
        if (isCurrent) {this.currentRequestsLastId = request.uid;}
        else {
            this.pastRequestsLastId = request.uid;
        }
        const date = request.requestDate;
        const today = moment(new Date()).format('MM/DD/YYYY');
        let temp: SortedRequest = {
            date: null,
            displayDate: null,
            displayOpt: null,
            requestList: [] 
        };

        if (RequestList.length > 0){
            let flag = false;
            RequestList.forEach(doc => {
                if (doc.date == date){
                    doc.requestList.push(request);
                    flag = true;
                }
            });
            if (!flag) {
                if (isCurrent){
                    (date == today) ? temp.displayDate = 'Today' : temp.displayDate = this.getDisplayDate(date);
                    (date == today) ? temp.displayOpt = null : temp.displayOpt = 'Upcoming';
                } else {
                    temp.displayDate = this.getDisplayDate(date);
                    temp.displayOpt = 'past';
                }
                temp.date = date;
                temp.requestList.push(request);
                RequestList.push(temp);
            }
        } else {
            if (isCurrent){
                (date == today) ? temp.displayDate = 'Today' : temp.displayDate = this.getDisplayDate(date);
                (date == today) ? temp.displayOpt = null : temp.displayOpt = 'Upcoming';
            } else {
                temp.displayDate = this.getDisplayDate(date);
                temp.displayOpt = 'past';
            }
            temp.date = date;   
            temp.requestList.push(request);
            RequestList.push(temp);
        }
    }

    getDisplayDate(date: string): string {
        const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        
        const d = new Date(date);
        const day = days[ d.getDay() ];
        const month = months[ d.getMonth() ];
        const dt = d.getDate().toString();
        const year = d.getFullYear().toString();

        let retVal: string;
        retVal = '';
        retVal = day + ', ' + month + ' ' + dt + ', ' + year;
        return retVal;
    }

    selectTab(event): void {
        if (event.index == 0){
            this.whichTab = true;
            this._scheduleService.getCurrentRequestList(null, true)
            .catch(() => {
                this._scheduleService.onLoadingCurrent.next(false);
                this._scheduleService.isLoadingCurrent = false;
            });
            
        } else {
            this.whichTab = false;
            this._scheduleService.getPastRequestList(null, true)
            .catch(() => {
                this._scheduleService.onLoadingPast.next(false);
                this._scheduleService.isLoadingPast = false;
            });
        }
        this._scheduleService.setSelectedTab(event.index);
    }

    loadMorePastSchedule(): void {
        this._scheduleService.getPastRequestList(this.pastRequestsLastId, false);
    }

    loadMoreCurrentSchedule(): void {
        this._scheduleService.getCurrentRequestList(this.currentRequestsLastId, false);
    }

    onScroll(): void{
        if (this.whichTab){
            this.loadMoreCurrentSchedule();
        } else {
            this.loadMorePastSchedule();
        }
    }
}
