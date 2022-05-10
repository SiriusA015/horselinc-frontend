import { Component, OnDestroy, OnInit, ViewEncapsulation, Inject,} from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { MatDialog } from '@angular/material';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ProviderServiceComponent } from './provider-service/provider-service.component';
import { HLServiceShowModel } from 'app/model/service-requests';
import { ScheduleService } from '../schedule.service';
import { HLServiceProviderModel } from 'app/model/users';
import { HLServiceProviderServiceModel } from 'app/model/users';
import { HLServiceRequestModel} from 'app/model/service-requests';
import { HLHorseModel } from 'app/model/horses';
import * as _moment from 'moment';
import { COLLECTION_SERVICE_PROVIDER_SERVICES } from 'app/model/constants';
import { AppService } from 'app/service/app.service';

@Component({
    selector     : 'schedule-assign',
    templateUrl  : './schedule-assign.component.html',
    styleUrls    : ['./schedule-assign.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ScheduleAssignComponent implements OnInit, OnDestroy
{
    toggle: boolean;
    request: HLServiceRequestModel;
    assignProvider: HLServiceProviderModel;
    originProvider: HLServiceProviderModel;
    providerServices: HLServiceProviderServiceModel[] = [];
    serviceTrue: HLServiceProviderServiceModel[] = [];
    serviceFalse: HLServiceProviderServiceModel[] = [];
    currentServiceRequest: HLServiceRequestModel;
    requestHorse: HLHorseModel;
    serviceRequestForm: FormGroup;
    showName: string;
    requestDate: any;
    competitionClass: string;
    providerNote: string;
    show: HLServiceShowModel;
    serviceRequestMethod: string;
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * 
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {FuseTranslationLoaderService} _fuseTranslationLoaderService
     */
    constructor(
        private db: AngularFirestore,
        private _dialog: MatDialog, 
        private _fuseSidebarService: FuseSidebarService,
        private _formBuilder: FormBuilder,
        private _fuseConfigService: FuseConfigService,
        private _scheduleService: ScheduleService,
        private _appService: AppService
    ) {
        this.assignProvider = null;
        this.showName = '';
        this._unsubscribeAll = new Subject();   
    }

    ngOnInit(): void
    {
        this.toggle = true;
        this._scheduleService.onCurrentServiceProvider
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(provider => {
            if (provider && provider != false){ 
                this.assignProvider = provider;
                this.getServiceProviderService();
            }
        });
        this._scheduleService.onCurrentShowsChange
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(show => {        
            if (show !== false && show){
                this.show = show;
                this.showName = '';
            }
        });
        this._scheduleService.onCurrentServiceRequestChange
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(currentServiceRequest => {
            this.show = null;
            this.serviceTrue = [];
            this.serviceFalse = [];
            if (currentServiceRequest && currentServiceRequest != false){
                this.serviceRequestMethod = 'edit';
                this.currentServiceRequest = currentServiceRequest;
                if (this.currentServiceRequest.serviceProvider){
                    this.originProvider = this.currentServiceRequest.serviceProvider;
                }
                if (this.currentServiceRequest.assigner) {
                    this.assignProvider = this.currentServiceRequest.assigner;
                    this.getServiceProviderService();
                }
                if (this.currentServiceRequest.show){
                    this.show = this.currentServiceRequest.show;    
                }
                if (currentServiceRequest.services && currentServiceRequest.services != false){
                    this.serviceTrue = [];
                    this.serviceFalse = [];
                }
            }
            else {
                this.serviceRequestMethod = 'new';
                this.currentServiceRequest = new HLServiceRequestModel(null, {});
                this.serviceFalse = [];
                this.serviceTrue = [];
                this.originProvider = null;
            }
            this.serviceRequestForm = this.createRequestForm();
        });
    }
  
    ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    openDialog(): void {
        if (!this.assignProvider) {
            this._appService.showSnackBar('Please select a service provider', 'OK');
            return;
        }
        if (!this.serviceFalse || this.serviceFalse.length < 1) {
            this._appService.showSnackBar('You have selected all services', 'OK');
            return;
        }
        
        const dialogRef = this._dialog.open(ProviderServiceComponent, {
          data: this.serviceFalse
        });
    
        dialogRef.afterClosed().subscribe(result => {
            if (!result) {return; }
            this.serviceTrue = [];
            this.serviceFalse = [];

            this.providerServices.map(providerService => {
                
                if (result[providerService.uid] === false){
                    this.serviceFalse.push(providerService);
                }
                else{
                    this.serviceTrue.push(providerService);
                }
            });
        });
    }

    ScheduleCancel(): void
    {
        this.assignProvider = null;
        this.originProvider = null;
        this.serviceFalse = [];
        this.serviceTrue = [];
        this.show = null;
        this._fuseSidebarService.getSidebar('schedule-assign-panel').toggleOpen();
    }

    showSearch(): void{
        this._scheduleService.onSearchOpen.next('show');
        this._fuseSidebarService.getSidebar('horse-show-search-panel').toggleOpen();
    }  

    ScheduleNext(): void
    {
        if (!this.serviceTrue || this.serviceTrue.length < 1) {
            this._appService.showSnackBar('Please select service', 'OK');
            return;
        }
        const data = this.serviceRequestForm.getRawValue();

        if (this.assignProvider && this.serviceTrue.length>0){

            if (!this.show) {
                let tempdata: any;
                if (this.showName != ''){
                    this._scheduleService.validateShow(this.showName)
                    .then((valid) => {
                        if (valid) {
                            this._appService.showSnackBar('Please enter other show name.', 'OK');
                        } else {
                            this._scheduleService.saveNewShow(this.showName)
                            .then((show) => {
                                tempdata = this.addHorseInfo(data);
                                tempdata.show = show;
                                tempdata.showId = show.uid;
                                this._scheduleService.onAddRequest.next(tempdata);
                                this._fuseSidebarService.getSidebar('schedule-assign-panel').toggleOpen();
                                this._fuseSidebarService.getSidebar('assign-confirm-panel').toggleOpen();
                            });
                        }
                    });
                } else {
                    tempdata = this.addHorseInfo(data);
                    tempdata.show = null;
                    tempdata.showId = '';
                    this._scheduleService.onAddRequest.next(tempdata);
                    this._fuseSidebarService.getSidebar('schedule-assign-panel').toggleOpen();
                    this._fuseSidebarService.getSidebar('assign-confirm-panel').toggleOpen();
                }
            } else {
                this._scheduleService.onAddRequest.next(this.addHorseInfo(data));
                this._fuseSidebarService.getSidebar('schedule-assign-panel').toggleOpen();
                this._fuseSidebarService.getSidebar('assign-confirm-panel').toggleOpen();
            }
        }
        else
        {
            this._appService.showSnackBar('Please select service provider', 'OK');
        }
    }

    searchProvider(): void
    {
        this._fuseSidebarService.getSidebar('schedule-assign-panel').toggleOpen();
        this._fuseSidebarService.getSidebar('horse-search-service-panel').toggleOpen();
    }    
    serviceCancel(service: HLServiceProviderServiceModel): void{
        let index: number;
        this.serviceFalse.push(service);
        index = this.serviceTrue.indexOf(service);
        this.serviceTrue.splice(index, 1);
    }
    createRequestForm(): FormGroup
    {
        return this._formBuilder.group({
            uid:                [this.currentServiceRequest.uid],
            requestDate:        _moment(this.currentServiceRequest.requestDate, 'MM/DD/YYYY'),
            competitionClass:   [this.currentServiceRequest.competitionClass],
            horseBarnName:      [this.currentServiceRequest.horseBarnName], 
            horseDisplayName:   [this.currentServiceRequest.horseDisplayName],
            horseId:            [this.currentServiceRequest.horseId],
            showId:             [this.currentServiceRequest.showId],            
            instruction:        [this.currentServiceRequest.instruction],            
            providerNote:       [this.currentServiceRequest.providerNote],            
            isCustomRequest:    [this.currentServiceRequest.isCustomRequest.toString()],
            dismissedBy:        [this.currentServiceRequest.dismissedBy],
            status:             [this.currentServiceRequest.status],
            creatorId:          [this.currentServiceRequest.creatorId],
            serviceProviderId:  [this.currentServiceRequest.serviceProviderId],            
            assignerId:         [this.currentServiceRequest.uid],
            updatedAt:          [this.currentServiceRequest.updatedAt],
            createdAt:          [this.currentServiceRequest.createdAt],
            services:           [this.currentServiceRequest.services], 
            show:               [this.currentServiceRequest.show],
            showName:           [''],
            serviceProvider:    [this.currentServiceRequest.serviceProvider],
        });
    }

    addHorseInfo(data): any {
        if (!this.originProvider) {
            return;
        }
        data.uid = this.currentServiceRequest.uid;
        data.horseBarnName = this.currentServiceRequest.horseBarnName;
        data.horseDisplayName = this.currentServiceRequest.horseDisplayName;  
        data.horseId = this.currentServiceRequest.horseId;  
        data.showId = this.show ? this.show.uid : null;
        data.status = 'pending';
        data.creatorId = this.currentServiceRequest.serviceProviderId;
        data.serviceProviderId = this.originProvider.userId;
        data.assignerId = this.assignProvider.userId;
        data.assigner = this.assignProvider;
        data.services = Object.assign(this.serviceTrue.map(value => value.toJSON()));
        data.show = this.show;
        data.serviceProvider = this.originProvider;
        data.isCustomRequest = true;
        return data;
    }

    getServiceProviderService(): Promise<any> {
        if (!this.assignProvider) {return; }
        this.providerServices = [];
        return new Promise(async (resolve, reject) => {
            const queryRef = await this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES, ref => ref.where('userId', '==', this.assignProvider.userId)).get();
            await queryRef.subscribe((snapshot) => {
                snapshot.forEach((doc) => {
                    const service = {
                        ...doc.data()
                    };
                    this.providerServices.push(new HLServiceProviderServiceModel(doc.id, service))
                    this.serviceFalse = [];
                    this.providerServices.forEach(item => {
                        if (this.serviceTrue.find(u => u.uid == item.uid)){
                            
                        } else {
                            this.serviceFalse.push(item);
                        }
                    });
                });
                resolve(this.serviceFalse);                    
            }, reject);
        });
     }

    onInputShow(event): void {
        this.show = null;
    }
}
