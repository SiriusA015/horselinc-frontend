import { Component, OnDestroy, OnInit, ViewEncapsulation, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { HorseProviderService } from 'app/service/horse-provider.service';
import { MatSnackBar, MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { HorseServiceDialogComponent } from './horse-service-dialog/horse-service-dialog.component';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { HLServiceProviderModel } from 'app/model/users';
import { HLServiceProviderServiceModel } from 'app/model/users';
import { HLServiceRequestModel} from 'app/model/service-requests';
import { HLHorseModel } from 'app/model/horses';
import { COLLECTION_SERVICE_PROVIDER_SERVICES } from 'app/model/constants';
import { AppService } from 'app/service/app.service';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { FuseUtils } from '@fuse/utils';
import { AngularFirestore } from '@angular/fire/firestore';
import { HLUserModel } from 'app/model/users';
import { HLHorseManagerModel } from 'app/model/users';
import { COLLECTION_SERVICE_REQUESTS, COLLECTION_USERS, COLLECTION_SERVICE_SHOWS, COLLECTION_HORSES, COLLECTION_INVOICES } from 'app/model/constants';
import { UserAuthService } from 'app/service/user-auth.service';
import { HLServiceShowModel } from 'app/model/service-requests';
import { HLPhoneContactModel } from 'app/model/phoneContact';
import { HLInvoiceMethodType } from 'app/model/enumerations';

import * as _moment from 'moment';

import {UserProviderServicesService} from 'app/service/user-provider-services.service';


@Component({
    selector     : 'horse-provider-invoice',
    templateUrl  : './horse-provider-invoice.component.html',
    styleUrls    : ['./horse-provider-invoice.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HorseProviderInvoiceComponent implements OnInit, OnDestroy
{
    providerHorse: HLHorseModel;
    providerCurrentHorse: HLHorseModel;
    currentHorse: HLHorseModel;
    serviceTrue: HLServiceProviderServiceModel[] = [];
    serviceFalse: HLServiceProviderServiceModel[] = [];
    providerServices: HLServiceProviderServiceModel[] = [];
    shows: HLServiceShowModel;
    newServices: HLServiceProviderServiceModel[] = [];
    selectedContact: HLPhoneContactModel;
    invoiceMethodType: HLInvoiceMethodType;
    baseUrl: string;
    httpOptions: any;
    user: any;
    userId: string;
    newServiceName: string;
    providerInvoiceForm: FormGroup;
    isLogging: boolean;
    toggle: boolean;
    requestDate: any;
    showName: string;
    customNum: number = 0;
   
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * 
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {FuseTranslationLoaderService} _fuseTranslationLoaderService
     */
    constructor(
        private _fuseSidebarService: FuseSidebarService,
        private _horseProviderService: HorseProviderService,
        private _dialog: MatDialog,
        private _formBuilder: FormBuilder,
        private _matSnackBar: MatSnackBar,   
        private _fuseConfigService: FuseConfigService,
        private db: AngularFirestore,
        private _userAuthService: UserAuthService,
        private _httpClient: HttpClient,
        private _appService: AppService,
        private _providerService: UserProviderServicesService,
    )
    {
        this._unsubscribeAll = new Subject();
    }

    ngOnInit(): void
    {
        this.baseUrl = this._appService.apiUrl;
        this.httpOptions = this._appService.httpOptions;
        this.user = this._appService.getCurUser();
        this.userId = this.user.uid;
        this.toggle = true;
        this.requestDate = new Date();
        this.serviceTrue = [];
        this.newServices = [];
        this.shows = null;
        this.customNum = 0;
        this.showName = '';

        this._horseProviderService.onGetProviderHorse
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(horse => {
            if  (horse && horse != false){
                this.providerHorse = horse;
            }
            this.serviceTrue = [];
            this.newServices = [];
            this.shows = null;
            this.customNum = 0;
            this.showName = '';
            this.providerInvoiceForm = this.createInvoiceDraftForm();
        });

        this._horseProviderService.onCurrentProviderHorse
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(currentHorse => {
            if  (currentHorse && currentHorse != false){

                this.providerHorse = currentHorse;
            }
            this.serviceTrue = [];
            this.newServices = [];
            this.shows = null;
            this.customNum = 0;
            this.showName = '';
        });

        this._horseProviderService.onCurrentShowsChange
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(show => {        
            if (show != false && show){
                this.shows = show;
                this.showName = '';
            }
        });  

        this._horseProviderService.onInvoiceCreateHorse
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(data => {        
                if (data.horse){
                    
                    const contact = {
                        emails: data.email ? [data.email] : null,
                        phoneNumbers: data.sms ? [data.sms] : null
                    };
                    this.selectedContact = new HLPhoneContactModel(contact);
                    this.currentHorse = data.horse;
                    this.providerHorse = data.horse;
                }
                this.serviceTrue = [];
                this.newServices = [];
                this.shows = null;
                this.customNum = 0;
                this.showName = '';    
        });  
    }
    ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
//    Custom Service Create 
    AddService(): void
    {   
        const data = {
            uid: String(this.customNum),
            userId: this.userId,
            service: '',
            rate: 0,
            quantity: 1
        };
        this.newServices.push(new HLServiceProviderServiceModel(data.uid, data));
        this.customNum++;
    }
    customServiceCancel(service: HLServiceProviderServiceModel): void {
        const idx = this.newServices.indexOf(service);
        this.newServices.splice(idx, 1);
        this.customNum = this.customNum - 1;
    }
    changeServiceQuantity(quantity, uid): void{
        this.serviceTrue.map(service => {
            if (service.uid === uid){
                service.quantity = quantity;
            }
        });
    }
    changeCustomServiceQuantity(quantity, uid): void{
        this.newServices.map(service => {
            if (service.uid === uid){
                service.quantity = quantity;
            }
        });
    }
    changeCustomServiceService(servicename, uid): void{
        this.newServices.map(service => {
            if (service.uid === uid){
                service.service = servicename;
            }
        });
    }
    changeCustomServiceRate(rate, uid): void{
        this.newServices.map(service => {
            if (service.uid === uid){
                service.rate = rate;
            }
        });
    }
    setHorseSearch(): void{
        this._horseProviderService.onSearchOpen.next('horse');
        this._fuseSidebarService.getSidebar('horse-provider-search-panel').toggleOpen();
    }

    getServiceProviderServices(): void{
        let flag: boolean = false;
        this._providerService.userId = this.userId;
        this._providerService.getProviderServices().then(services => { 
            this.providerServices = services; 
            if ( this.providerServices.length > 0){
              
                this.serviceFalse = [];
                if (this.serviceTrue.length > 0){
                    this.providerServices.forEach(service => {
                        this.serviceTrue.forEach(trueService => {    
                                if (service.service === trueService.service){
                                        flag = true;
                                }
                            });   
                            if (!flag){ this.serviceFalse.push(service);}
                            flag = false;
                    });
                }
                else{
                    this.serviceFalse = this.providerServices;
                    }
            }
            this.openDialog(this.serviceFalse);
        });
    }

    psearch(evt, newService): boolean{
        let charCode = (evt.which) ? evt.which : evt.keyCode;		
        if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)){
            window.event.returnValue = false;
            return false;
        }
        let _value = newService.rate;    
        let _pattern0 = /^\d*[.]\d*$/;
        if (_pattern0.test(_value)) {
            if (charCode == 46) {
                window.event.returnValue = false;
                return false;
            }
        }
        let _pattern2 = /^\d*[.]\d{2}$/;
        if (_pattern2.test(_value)) {
            window.event.returnValue = false;
            return false;
        }
        window.event.returnValue = true;
        return true;
    }

    psearch1(evt, newService): boolean{
        let charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)){
            window.event.returnValue = false;
            return false;
        }
        let _value = newService.quantity;    
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

    openDialog(services): void {
   
        if (this.serviceFalse && this.serviceFalse.length > 0){
        
            const dialogRef = this._dialog.open(HorseServiceDialogComponent, {
                disableClose: true,
                data: services
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result && result != false){ 
                    this.serviceTrue = [];
                    this.serviceFalse = [];
                    this.providerServices.map(providerService => {
                        
                        if (result[providerService.uid] === false){

                            this.serviceFalse.push(providerService);
                        }
                        else
                        {
                            this.serviceTrue.push(providerService);
                        }             
                    });
                }    
            });
        }
        else
        {
            this._appService.showSnackBar( "You've selected all services.", 'OK');   
        }
    }
 
    serviceCancel(service: HLServiceProviderServiceModel): void{
        let index: number;
        this.serviceFalse.push(service);   
        index = this.serviceTrue.indexOf(service);
        this.serviceTrue.splice(index, 1);
    }
    
    searchShow(): void{
        this._horseProviderService.onSearchOpen.next('show');
        this._fuseSidebarService.getSidebar('horse-provider-search-panel').toggleOpen();   
    }  

    setShowName(): void{
        this.shows = null;
    }
    
    createInvoiceDraftForm(): FormGroup
    {
        return this._formBuilder.group({
          uid:                [''],
          invoiceId:          [''],
          competitionClass:   [''],
          horseBarnName:      [''], // hidden field
          horseDisplayName:   [''], // hidden field
          horseId:            [''],
          showId:             [null],
          instruction:        [''],
          providerNote:       [''],
          isCustomRequest:    [true],
          // isDeletedFromInvoice:  [this.request.isDeletedFromInvoice.toString()],
          dismissedBy:        [null],
          status:             [''],
          tip:                [''],
          creatorId:          [''],
          serviceProviderId:  [''],            
          assignerId:         [null],
          updatedAt:          [''],
          createdAt:          [''],
          isDeletedFromInvoice: [false],
          show:               [[]],
          services:            [],
          service:             [],
          rate:                [],
          newServices:         [],
          trueServices:        [], 
          showName:            [],
          
      });
    }

    InvoiceCancel(): void
    {
        this._fuseSidebarService.getSidebar('horse-provider-invoice-panel').toggleOpen();
    }

    InvoiceSave(): void
    {   
        let email: string = null;
        let phone: string = null;
        let customServiceFlag: boolean = false;
        if (this.currentHorse && !this.currentHorse.creatorId) {
            if (this.selectedContact.emails) {
                email = this.selectedContact.emails[0];
                this.invoiceMethodType == HLInvoiceMethodType.EMAIL;
            }
            if (this.selectedContact.phoneNumbers) {
                phone = this.selectedContact.phoneNumbers[0];
                this.invoiceMethodType == HLInvoiceMethodType.SMS;
            }
        }
        this.newServices.forEach(service => {
            if (service.rate < 1 || service.quantity == 0 || service.service == ''){
                this._matSnackBar.open('All Services must have a valid name, rate of at least $1.00 and whole number quantity greater than 0-numeric characters only.', 'OK', {
                    verticalPosition: 'top',
                    duration        : 3000
                });
                customServiceFlag = true;
            }   
        });
        if (customServiceFlag) { customServiceFlag = false; return; }
        const data = this.addHorseInfo(this.providerInvoiceForm.getRawValue());
        if ( this.serviceTrue.length > 0 || this.newServices.length > 0 ){
            this._horseProviderService.onInvoiceConfirm.next({'data': data, 'providerHorse': this.providerHorse, 'contact': this.selectedContact});
            this._fuseSidebarService.getSidebar('horse-provider-confirm-panel').toggleOpen();
        }
        else
        {
            this._matSnackBar.open('Please select service', 'OK', {
                verticalPosition: 'top',
                duration        : 3000
            });  
        }
    }    
   
    addHorseInfo(data): any {
        data.horseBarnName = this.providerHorse.barnName;
        data.horseDisplayName = this.providerHorse.displayName;
        data.serviceProviderId = this.userId;
        data.isCustomRequest = true;
        data.requestDate = this.requestDate;
        data.showId = '';
        data.showName = '';
        if (this.shows){
            data.showId = this.shows.uid;
            data.show = this.shows;
        }else{
            data.showId = '';
            data.showName = this.showName;
        }
        data.paidAt =  this.requestDate;
        data.tip = 0;
        data.creatorId = this.userId;
        data.newServices = this.newServices;
        data.trueServices = this.serviceTrue;
        data.isCustomRequest = true;
        data.horseId = this.providerHorse.uid;
        return data;
    }
}


