import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { MatSnackBar, MatDialog } from '@angular/material';
import { FormGroup, FormBuilder } from '@angular/forms';
import { HorseProviderServiceComponent } from './horse-provider-service/horse-provider-service.component';
import { HLServiceShowModel } from 'app/model/service-requests';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { HLServiceProviderModel } from 'app/model/users';
import { HLServiceProviderServiceModel } from 'app/model/users';
import { HLServiceRequestModel} from 'app/model/service-requests';
import { HLHorseManagerProviderModel} from 'app/model/users';
import { AppService } from 'app/service/app.service';
import { UserManagerProvidersService } from 'app/service/user-manager-providers.service';
import { HLHorseModel } from 'app/model/horses';
import * as _moment from 'moment';
import { fuseAnimations } from '@fuse/animations';
@Component({
    selector     : 'horse-manager-schedule',
    templateUrl  : './horse-manager-schedule.component.html',
    styleUrls    : ['./horse-manager-schedule.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations,
    
})
export class HorseManagerScheduleComponent implements OnInit, OnDestroy
{
    request: HLServiceRequestModel;
    currentProvider: HLServiceProviderModel;
    providerServices: HLServiceProviderServiceModel[] = [];
    serviceTrue: HLServiceProviderServiceModel[];
    tempService: HLServiceProviderServiceModel[];
    serviceFalse: HLServiceProviderServiceModel[];
    managerProviders: HLHorseManagerProviderModel[];
    managerProvidersSort = new Map();
    currentServiceRequest: HLServiceRequestModel;
    requestHorse: HLHorseModel;
    serviceRequestForm: FormGroup;
    requestDate: any;
    competitionClass: string;
    providerNote: string;
    show: HLServiceShowModel;
    serviceRequestMethod: string;
    showName: string;
    baseUrl: string;
    httpOptions: any;
    user: any;
    userId: string;
    toggle: boolean;

    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * 
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {FuseTranslationLoaderService} _fuseTranslationLoaderService
     */
    constructor(
        private _dialog: MatDialog, 
        private _fuseSidebarService: FuseSidebarService,
        private _formBuilder: FormBuilder,
        private _matSnackBar: MatSnackBar,   
        private _fuseConfigService: FuseConfigService,
        private _horseManagerService: HorseManagerService,
        private _managerProvidersService: UserManagerProvidersService,
        private _appService: AppService,
    )
    
    {
        this._unsubscribeAll = new Subject();   
        this.requestDate = new Date();
    }

    ngOnInit(): void
    {
        this.baseUrl = this._appService.apiUrl;
        this.httpOptions = this._appService.httpOptions;
        this.user = this._appService.getCurUser();
        this.userId = this.user.uid;
        this.show = null;
        this.toggle = true;

        this._horseManagerService.onCurrentServiceProvider
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(currentProvider => {
            
            if (currentProvider && currentProvider != false){ 
                this.currentProvider = currentProvider;   
            }
            this.serviceTrue = [];
        });

        this._horseManagerService.onCurrentShowsChange
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(show => {        
            if (show !== false && show){
                this.show = show;
                this.showName = '';
            } 
        });

        this._horseManagerService.onCurrentServiceRequestChange
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(currentServiceRequest => {
            this.currentServiceRequest = new HLServiceRequestModel(null, {});
            this.serviceFalse = []; 
            this.serviceTrue = [];
            this.showName = '';
            this.currentProvider = null;
            this.show = null;
            if (currentServiceRequest && currentServiceRequest != false){
                this.serviceRequestMethod = 'edit';
                this.currentServiceRequest = currentServiceRequest;
                this.requestDate = new Date(this.currentServiceRequest.requestDate);
                if (this.currentServiceRequest.serviceProvider){
                    
                    this.currentProvider = this.currentServiceRequest.serviceProvider;    
                }

                if (this.currentServiceRequest.show){
                    
                    this.show = this.currentServiceRequest.show;    
                } 

                if (currentServiceRequest.services.length > 0 ){

                    this.serviceTrue = [];
                    this.serviceTrue = this.currentServiceRequest.services;
                }
                if (currentServiceRequest.serviceProvider && currentServiceRequest.serviceProvider != false){ 
                    this.currentProvider = currentServiceRequest.serviceProvider;  
                }
            }
            else
            {
                this.serviceRequestMethod = 'new';
                this.serviceFalse = this.providerServices;
                
            }
            this.serviceRequestForm = this.createRequestForm();
        });

        this._horseManagerService.onGetServiceHorse
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe( serviceHorse => {
                this.requestHorse = serviceHorse;
        });
    }
  
    ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    getServiceProviderServices(): void{
        let flag: boolean = false;
        if (this.currentProvider){
            this._horseManagerService.getServiceProviderService(this.currentProvider.userId).then(services => { 
                services.forEach(service=>{
                    service.quantity = 1;
                })
                this.providerServices = services; 
                if ( this.providerServices.length > 0){
                    // console.log('this is serviceTrue Type test', this.providerServices);
                    this.serviceFalse = [];
                    if (this.serviceTrue.length > 0){
                        this.providerServices.forEach(service => {
                            
                            this.serviceTrue.forEach(trueService => {    
                                    if (service.service === trueService.service){
                                            flag = true;
                                    }
                                });
                                if ( !flag ){ this.serviceFalse.push(service); }
                                flag = false;    
                        });
                    }
                    else{
                        this.serviceFalse = this.providerServices;
                        }
                }
                this.openDialog( this.serviceFalse );
            });
        }
        else
        {
            this._appService.showSnackBar('Please select a service provider', 'OK');   
        }
    }

    openDialog(services): void {

        let flag: boolean = false;
        if (services.length > 0 && this.serviceFalse){
            const dialogRef = this._dialog.open(HorseProviderServiceComponent, {
            data: services
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result && result != false){ 
                    // this.serviceTrue = [];
                    this.serviceFalse = [];
                    this.providerServices.map(providerService => {
                        if (result[providerService.uid] === false){
                            this.serviceFalse.push(providerService);
                        }
                        else
                        {
                            this.serviceTrue.map(service => {
                                if (service.uid == providerService.uid ){flag = true; }
                            });
                            if (flag == false){this.serviceTrue.push(providerService); }
                            flag = false;
                        }
                    });
                }
            });
        }
        else{
            this._appService.showSnackBar( "You've selected all services", 'OK' );     
        }
    }

    ScheduleCancel(): void
    {
        this._fuseSidebarService.getSidebar('horse-manager-schedule-panel').toggleOpen();
    }

    showSearch(): void{
        this._horseManagerService.onSearchOpen.next('show');
        this._fuseSidebarService.getSidebar('horse-show-search-panel').toggleOpen();
    }  

    psearch1(evt, newService): boolean{
        let charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)){
            window.event.returnValue = false;
            return false;
        }

        // Textbox value    
        let _value = newService.rate;    

        let _pattern0 = /^\d*\d*$/;
        if (_pattern0.test(_value)) {
            if (charCode == 46) {
                window.event.returnValue = false;
                return false;
            }
        }
        
        let _pattern2 = /^\d*\d{2}$/;
        if (_pattern2.test(_value)) {
            window.event.returnValue = false;
            return false;
        }
        window.event.returnValue = true;
        return true;
    }
        
    ScheduleNext(): void
    {   
        if (this.serviceTrue && this.serviceTrue.length > 0 && this.currentProvider.userId){
            const data = this.addHorseInfo(this.serviceRequestForm.getRawValue());
            this._fuseSidebarService.getSidebar('horse-manager-schedule-panel').toggleOpen();
            this._fuseSidebarService.getSidebar('horse-manager-confirm-panel').toggleOpen();
            this._horseManagerService.onAddRequest.next({ 'data' : data, 'method' : this.serviceRequestMethod });
        }
        else
        {
            this._appService.showSnackBar('Please Select Service', 'OK');
        }
    }    
   
    setShowName(): void{
        this.show = null;
    }

    searchServiceProvider(): void
    {
        this._managerProvidersService.userId = this.userId;
        this._managerProvidersService.getManagerProviders();
        let searchItem = 'provider';
        this._horseManagerService.onSearchSelectItem.next(searchItem);
        this._fuseSidebarService.getSidebar('horse-search-service-panel').toggleOpen();
    }    
    serviceCancel(service: HLServiceProviderServiceModel): void{
        let index: number;
        this.serviceFalse.push(service);
        index = this.serviceTrue.indexOf(service);
        this.serviceTrue.splice(index, 1);
    }

    changeServiceQuantity(quantity, uid): void{
        this.serviceTrue.map(service => {
            if (service.uid === uid){
                service.quantity = quantity;
            }
        });
    }

    createRequestForm(): FormGroup{  
        return this._formBuilder.group({
            uid:                [this.currentServiceRequest.uid],
            // requestDate:        _moment(this.currentServiceRequest.requestDate, 'MM/DD/YYYY'), // [this.request.requestDate],
            competitionClass:   [this.currentServiceRequest.competitionClass],
            horseBarnName:      [this.currentServiceRequest.horseBarnName],       // hidden field
            horseDisplayName:   [this.currentServiceRequest.horseDisplayName], // hidden field
            horseId:            [this.currentServiceRequest.horseId],
            showId:             [this.currentServiceRequest.showId],            
            instruction:        [this.currentServiceRequest.instruction],            
            providerNote:       [this.currentServiceRequest.providerNote],            
            isCustomRequest:    [this.currentServiceRequest.isCustomRequest.toString()],
          
            dismissedBy:        [[]],
            status:             [this.currentServiceRequest.status],
            creatorId:          [this.currentServiceRequest.creatorId],
            serviceProviderId:  [this.currentServiceRequest.serviceProviderId],            
            assignerId:         [this.currentServiceRequest.assignerId],
            updatedAt:          [this.currentServiceRequest.updatedAt],
            createdAt:          [this.currentServiceRequest.createdAt],
            services:           [this.currentServiceRequest.services], 
            show:               [], 
            serviceProvider:    [this.currentServiceRequest.serviceProvider],
            
        });
      
    }

    addHorseInfo(data): any {
        data.horseBarnName = this.requestHorse.barnName;
        data.horseDisplayName = this.requestHorse.displayName;  
        data.horseId = this.requestHorse.uid;  
        data.showId = '';
        data.showName = '';
        // console.log('this is showName', this.showName, this.show);
        if (this.show != null){
            data.showId = this.show.uid;
            data.show = this.show;
        }else{
            data.showId = '';
            data.showName = this.showName;
        }
        data.status = 'pending';
        data.creatorId = this._horseManagerService.userId;
        data.serviceProviderId = this.currentProvider.userId;
        data.requestDate = this.requestDate;
        data.services = Object.assign(this.serviceTrue.map(value => value.toJSON())); 
        data.serviceProvider = this.currentProvider;
        data.isCustomRequest = true;
        return data;
      }
}




