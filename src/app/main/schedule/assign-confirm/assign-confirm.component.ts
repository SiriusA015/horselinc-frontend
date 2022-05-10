import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { MatSnackBar, MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseTranslationLoaderService } from '@fuse/services/translation-loader.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { ScheduleService } from '../schedule.service';
import { HLServiceRequestModel} from 'app/model/service-requests';
import { HLServiceProviderModel } from 'app/model/users';
import { HLServiceShowModel } from 'app/model/service-requests';
import { AppService } from 'app/service/app.service';
@Component({
    selector     : 'assign-confirm',
    templateUrl  : './assign-confirm.component.html',
    styleUrls    : ['./assign-confirm.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AssignConfirmComponent implements OnInit, OnDestroy
{
    addRequest: HLServiceRequestModel;
    provider: HLServiceProviderModel;
    show: HLServiceShowModel;
    
    servicesFlag: boolean;
    serviceRequestMethod: string;
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     * 
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {FuseTranslationLoaderService} _fuseTranslationLoaderService
     */
    constructor(
     
        private _fuseSidebarService: FuseSidebarService,
        private _scheduleService: ScheduleService,
        // private _matSnackBar: MatSnackBar,
        private _appService: AppService
    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();    
        this.servicesFlag = false;
    }

 
    ngOnInit(): void
    {
        this._scheduleService.onAddRequest
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(request => {
               
                if (request != false && request) {
                    this.addRequest = request;
                }
            });
    }

    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    confirmCancel(): void
    {
        this._fuseSidebarService.getSidebar('assign-confirm-panel').toggleOpen();
        this._fuseSidebarService.getSidebar('schedule-assign-panel').toggleOpen();
    }   

    confirmSave(): void{
        this._scheduleService.updateRequest(this.addRequest)
        .then((request) => {
            this._fuseSidebarService.getSidebar('assign-confirm-panel').toggleOpen();                  
        });
    }
}
