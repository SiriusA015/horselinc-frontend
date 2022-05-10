import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar} from '@angular/material';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { AppService } from 'app/service/app.service';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { HLServiceProviderModel } from 'app/model/users';
import { HLServiceShowModel } from 'app/model/service-requests';

@Component({
    selector     : 'horse-manager-confirm',
    templateUrl  : './horse-manager-confirm.component.html',
    styleUrls    : ['./horse-manager-confirm.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HorseManagerConfirmComponent implements OnInit, OnDestroy
{
    addRequest: any = [];
    provider: HLServiceProviderModel;
    show: HLServiceShowModel;
    request: any;
    servicesFlag: boolean;
    serviceRequestMethod: string;
    disShow: string;
    isLogging: boolean;
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
        private _horseManagerService: HorseManagerService,
        private _matSnackBar: MatSnackBar,  
        private _appService: AppService,
    )     
    {
        this._unsubscribeAll = new Subject();    
        this.servicesFlag = false;
    }

    ngOnInit(): void
    {
        this._horseManagerService.onAddRequest
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(request => {
            this.request = request;
            this.isLogging = false;  
            if (request.data != false && request.data) {
                this.disShow = '';
                this.addRequest = request.data;
                this.serviceRequestMethod = request.method; 
                if (this.addRequest.showName != ''){
                    this.disShow = this.addRequest.showName;
                }
                else{
                    if (this.addRequest.show != null){
                        this.disShow = this.addRequest.show.name;
                    }else
                    {
                        this.disShow = '';
                    }
                }
            }  
        });
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    confirmCancel(): void
    {
        this.isLogging = false;  
        this._fuseSidebarService.getSidebar('horse-manager-confirm-panel').toggleOpen();
        this._fuseSidebarService.getSidebar('horse-manager-schedule-panel').toggleOpen();
    }   
    getAmountWithApplicationFee(amount: number): number{
        return this._appService.getAmountWithApplicationFee(amount);
    }
    confirmSave(): void{
        this.isLogging = true;
        if (this.serviceRequestMethod === 'new'){
            if (this.addRequest.showName == ''){
                this._horseManagerService.createRequest(this.addRequest)
                    .then((request) => {
                        this._appService.showSnackBar('Request data added successfully', 'OK');   
                        
                        this._horseManagerService.setCurrentHorseSchedule(this._horseManagerService.selectHorse.uid); 
                    
                        this._fuseSidebarService.getSidebar('horse-manager-confirm-panel').toggleOpen();      
                        this.isLogging = false;      
                });
            }
            else{
                this._horseManagerService.createShow(this.addRequest)
                    .then((show) => { 
                    if (!show){ return; }
                    this.addRequest.showId = show.uid; 
                    this._horseManagerService.createRequest(this.addRequest)
                    .then((request) => {
                        this._appService.showSnackBar('Request data added successfully', 'OK');   
                        
                        this._horseManagerService.setCurrentHorseSchedule(this._horseManagerService.selectHorse.uid); 
                    
                        this._fuseSidebarService.getSidebar('horse-manager-confirm-panel').toggleOpen();   
                        this.isLogging = false;          
                    });

                });
            }
        }

        if (this.serviceRequestMethod === 'edit'){
            if (this.addRequest.showName == ''){
                this._horseManagerService.updateRequest(this.addRequest)
                    .then((request) => {
                        this._appService.showSnackBar('Request data saved successfully', 'OK');   
                        
                        this._horseManagerService.setCurrentHorseSchedule(this._horseManagerService.selectHorse.uid); 
                    
                        this._fuseSidebarService.getSidebar('horse-manager-confirm-panel').toggleOpen();   
                        this.isLogging = false;          
                });
            }
            else{
                this._horseManagerService.createShow(this.addRequest)
                    .then((show) => { 
                    if (!show){ return; }
                    this.addRequest.showId = show.uid; 
                    this._horseManagerService.updateRequest(this.addRequest)
                    .then((request) => {
                        this._appService.showSnackBar('Request data saved successfully', 'OK');   
                        
                        this._horseManagerService.setCurrentHorseSchedule(this._horseManagerService.selectHorse.uid); 
                    
                        this._fuseSidebarService.getSidebar('horse-manager-confirm-panel').toggleOpen();    
                        this.isLogging = false;         
                    });

                });
            
            }
        }
      
    }
}