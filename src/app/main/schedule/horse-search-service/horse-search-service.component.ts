import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { HLServiceProviderModel } from 'app/model/users';
import { ScheduleService } from '../schedule.service';
import { AppService } from 'app/service/app.service';
@Component({
  selector: 'horse-search-service',
  templateUrl: './horse-search-service.component.html',
  styleUrls: ['./horse-search-service.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HorseSearchServiceComponent implements OnInit {
   
    serviceType = 'All Payments';
    isLogging: boolean;
    userQuestionUpdate = new Subject<string>();
    public userQuestion: string;
    serviceProviders: HLServiceProviderModel[];
    item: string;
    title = 'Service Provider';
    findErr = false;
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _fuseSidebarService: FuseSidebarService,
        private _scheduleService: ScheduleService,
        private _AppService: AppService
    ) 
    {
        this._unsubscribeAll = new Subject();
        this.serviceProviders = [];
    }

    ngOnInit(): void {

        this._scheduleService.onSearchServiceProviders
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(serviceProviders => {
            this.isLogging = false;
            if (serviceProviders && serviceProviders.length > 0)
                {this.findErr = true; }
            this.serviceProviders = serviceProviders;
        });

        this.userQuestionUpdate.pipe(
            debounceTime(200),
            distinctUntilChanged())
            .subscribe(value => {
                if (value !== '' && value.length >= 3){
                    this.isLogging = true;
                    this.searchCurrent(value);
                }
            });
    }
    
    searchCurrent(query): void{
        this._scheduleService.searchServiceProviders(query);
    }

    selectServiceProvider(uid: string): void{
        let currentProvider: HLServiceProviderModel;
        currentProvider = this.serviceProviders.find(provider => {
            return(provider.userId === uid);
        });
        this._scheduleService.onCurrentServiceProvider.next(currentProvider);
        this.closePanel();
    }

    closePanel(): void{
        this.userQuestion = '';
        this.findErr = false;
        this.serviceProviders = [];
        this._fuseSidebarService.getSidebar('horse-search-service-panel').toggleOpen();
        this._fuseSidebarService.getSidebar('schedule-assign-panel').toggleOpen();
    }

    getInviteHorseLinc(): string{
        return this._AppService.inviteHorseLinc();
    }
}
