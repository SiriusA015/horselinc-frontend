import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { HorseProviderService } from 'app/service/horse-provider.service';
import { MatSnackBar } from '@angular/material';
import { HLServiceProviderServiceModel } from 'app/model/users';
import { AppService } from 'app/service/app.service';
import { HLPhoneContactModel } from 'app/model/phoneContact';
import * as _moment from 'moment';
import { HLUserType } from 'app/model/enumerations';

@Component({
  selector: 'horse-provider-confirm',
  templateUrl: './horse-provider-confirm.component.html',
  styleUrls: ['./horse-provider-confirm.component.scss']
})
export class HorseProviderConfirmComponent implements OnInit 
{
    horse: any = null;
    trainerName: string;
    invoiceTotal: number;
    serviceNum: number;
    isLogging1: boolean;
    isLogging: boolean;
    dataServices: HLServiceProviderServiceModel[]=[];
    selectedContact: HLPhoneContactModel;
    providerHorse: any = null;

    private _unsubscribeAll: Subject<any>;

    constructor(
        private _fuseSidebarService: FuseSidebarService,
        private _fuseConfigService: FuseConfigService,
        private _horseProviderService: HorseProviderService,
        private _matSnackBar: MatSnackBar,
        private _appService: AppService
    )
    {
        this._unsubscribeAll = new Subject();
    }

    ngOnInit(): void{
        this._horseProviderService.onInvoiceConfirm
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(horseData => {        
            this.horse = null;
            
            this.invoiceTotal = 0;
            if (horseData.data != false && horseData.data){
                this.horse = horseData.data;
                this.providerHorse = horseData.providerHorse;
                this.dataServices = [];
                this.horse.trueServices.map( service => {
                    service.uid = '';
                    this.dataServices.push(new HLServiceProviderServiceModel(service.uid, service )) ;
                });
                this.horse.newServices.map( service => {
                    service.uid = '';
                    this.dataServices.push(new HLServiceProviderServiceModel(service.uid, service ));
                });
                this.serviceNum = this.dataServices.length;
                this.horse.services = Object.assign(this.dataServices.map(value => value.toJSON()));
                this.horse.services.map(service => {
                    this.invoiceTotal = this.invoiceTotal + Number(service.rate) * Number(service.quantity);
                    
                });
            } 
            if (horseData.contact) {
                this.selectedContact = horseData.contact;
            }   
        });
    }

    ConfirmSubmit(): void
    {
        this.isLogging = true;
        if (!this.checkPaymentMethodValid()) {

            this._appService.showSnackBar('You have to add a payment method before create an invoice', 'OK');                     
            return;
        }
        if (this.horse.showName != ''){
            this._horseProviderService.createRequest(this.horse, this.selectedContact)
            .then((request) => {
                    this.horse.requestIds = [request.id];  
                    this._horseProviderService.createInvoice(this.horse, this.selectedContact)
                    .then((invoice) => {
                        // Show the success message            
                        this._appService.showSnackBar('Successfully submitted.', 'OK');                
                        this.isLogging = false;
                        this._fuseSidebarService.getSidebar('horse-provider-invoice-panel').toggleOpen();
                        this._fuseSidebarService.getSidebar('horse-provider-confirm-panel').toggleOpen();           
                    });
            });    
        }else{
            this._horseProviderService.createShow(this.horse)
            .then((show) => { 
                    if (!show){ this.isLogging1 = false; return;}
                    this.horse.showId = show.uid; 
                    this.horse.show = show; 
                    this._horseProviderService.createRequest(this.horse, this.selectedContact)
                    .then((request) => {
                           
                            this.horse.requestIds = [request.id];  
                            this._horseProviderService.createInvoice(this.horse, this.selectedContact)
                            .then((invoice) => {
                                // Show the success message
                                this._appService.showSnackBar('Successfully submitted.', 'OK');                
                                this.isLogging = false;
                                this._fuseSidebarService.getSidebar('horse-provider-invoice-panel').toggleOpen();
                                this._fuseSidebarService.getSidebar('horse-provider-confirm-panel').toggleOpen();           
                            });
                    });   
            });  
        }
    }
    ConfirmSave(): void
    {
        this.isLogging1 = true;
        if (this.horse.showName != '' ){
            this._horseProviderService.createRequest(this.horse, this.selectedContact)
            .then((request) => {
            // Show the success message
            this._horseProviderService.getServiceRequestById(request.uid)
            this._appService.showSnackBar('Successfully submitted.', 'OK');                
            this._fuseSidebarService.getSidebar('horse-provider-invoice-panel').toggleOpen();
            this._fuseSidebarService.getSidebar('horse-provider-confirm-panel').toggleOpen();
            this.isLogging1 = false;
            }); 
       }else{
            this._horseProviderService.createShow(this.horse)
            .then((show) => { 
                    if (!show){ return; }
                    this.horse.showId = show.uid; 
                    this._horseProviderService.createRequest(this.horse, this.selectedContact)
                    .then((request) => {
                    // Show the success message
                    this._appService.showSnackBar('Successfully submitted.', 'OK');                
                    this._fuseSidebarService.getSidebar('horse-provider-invoice-panel').toggleOpen();
                    this._fuseSidebarService.getSidebar('horse-provider-confirm-panel').toggleOpen();
                    this.isLogging1 = false;
                    }); 
            
            });     
        }   
    }
    ConfirmCancel(): void
    {
        this.isLogging1 = false;
        this._fuseSidebarService.getSidebar('horse-provider-confirm-panel').toggleOpen();
    }  
    checkPaymentMethodValid(): boolean {
        const user = this._appService.getCurUser();
        if ( !user.type ) { return false; }

        if ( user.type == HLUserType.manager) {
            if ( user.horseManager.customer ) {
                if (user.horseManager.customer.id) {
                    return true;
                } else {
                    { return false; }
                }
            } else { return false; }
            
        } else {
            if (user.serviceProvider.account) {
                if (user.serviceProvider.account.id) {
                    return true;
                } else {
                    
                    { return false; }
                }
            } else { return false; }
        }
    }  
}   
