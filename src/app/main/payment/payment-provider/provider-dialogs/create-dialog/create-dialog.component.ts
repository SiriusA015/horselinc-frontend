import { Component, OnInit, ViewEncapsulation, OnDestroy, Input } from '@angular/core';
import { FormBuilder, FormGroup} from '@angular/forms';
import { Subject } from 'rxjs';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { HLHorseModel } from 'app/model/horses';
import { HLServiceProviderServiceModel } from 'app/model/users';
import {HLServiceShowModel} from 'app/model/service-requests';
import { ServicesModalComponent } from '../services-modal/services-modal.component';
import { PaymentProviderService } from '../../payment-provider.service';
import { takeUntil } from 'rxjs/operators';
import * as _moment from 'moment';
import { HLServiceRequestModel } from 'app/model/service-requests';
import { MatDialog } from '@angular/material';
import { AppService } from 'app/service/app.service';
import { HLPhoneContactModel } from 'app/model/phoneContact';
import { HLInvoiceMethodType } from 'app/model/enumerations';
import { HorseProviderService } from 'app/service/horse-provider.service';

@Component({
  selector: 'create-dialog',
  templateUrl: './create-dialog.component.html',
  styleUrls: ['./create-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateDialogComponent implements OnInit, OnDestroy {

    @Input()
    pattern: string | RegExp;

  currentHorse: HLHorseModel;
  serviceTrue: HLServiceProviderServiceModel[] = [];
  serviceFalse: HLServiceProviderServiceModel[] = [];
  providerServices: HLServiceProviderServiceModel[] = [];
  newServices: HLServiceProviderServiceModel[] = [];
  request: HLServiceRequestModel;
  invoiceDraftForm: FormGroup;
  currentShow: HLServiceShowModel = null;
  showName: string;
  requestDate: any;
  newShow: HLServiceShowModel;

  isLogging: boolean;

  selectedContact: HLPhoneContactModel;
  invoiceMethodType: HLInvoiceMethodType;

  private _unsubscribeAll: Subject<any>;

  constructor(
    private _fuseSidebarService: FuseSidebarService,
    private _matDialog: MatDialog, 
    private _paymentProviderService : PaymentProviderService,
    private _formBuilder: FormBuilder,
    private _appService: AppService,
    private _horseProviderService: HorseProviderService
  ) { 

    this.serviceTrue = [];
    this.serviceFalse = [];
    this.currentHorse = null;
    this.currentShow = null;
    this.showName = '';
    this.newShow = null;

    this._unsubscribeAll = new Subject();
  }

    ngOnInit(): void {

      this.selectedContact = null;
      this.invoiceMethodType = HLInvoiceMethodType.NONE;

      this.requestDate = new Date();
      this.currentShow = null;
      this.currentHorse = null;
      this.invoiceDraftForm = this.createInvoiceDraftForm();

      this._paymentProviderService.onServiceProviderServices
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(providerServices => {
            this.providerServices = providerServices;
            this.serviceFalse = this.providerServices;
        });

      this._paymentProviderService.onCurrentShowsChange
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(show => {
            if (show.name != ''){
                this.currentShow = show;
                this.showName = '';
            }
        });

      this._paymentProviderService.onCreateDlgInitEv
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(show => {
            this.onInit();
        });

      this._paymentProviderService.onSearchHorse
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(horse => {
            this.selectedContact = null;
            this.invoiceMethodType = HLInvoiceMethodType.NONE;
            this.currentHorse = horse;
        });

      this._horseProviderService.onInvoiceCreateHorse
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((data) => {
            if (data.horse){
                const contact = {
                    emails: data.email ? [data.email] : null,
                    phoneNumbers: data.sms ? [data.sms] : null,
                    name: data.name ? data.name : null
                };
                this.selectedContact = new HLPhoneContactModel(contact);
                this.currentHorse = data.horse;
            }
        });
    }

    onInit(): void{
        this.providerServices.forEach(element => {
            element.quantity = 1;
        });
        this.invoiceDraftForm = this.createInvoiceDraftForm();
        this.currentHorse = null;
        this.serviceFalse = this.providerServices;
        this.serviceTrue = [];
        if (this.currentShow){
            this.currentShow = null;
        }
        this.newServices = [];
        this.showName = '';
        this.selectedContact = null;
        this.invoiceMethodType = HLInvoiceMethodType.NONE;
    }
    
    onCloseDlg(): void {
        this.providerServices.forEach(element => {
            element.quantity = 1;
        });
        this._fuseSidebarService.getSidebar('payment-provider-create-panel').close();
    }

    deleteService(service: HLServiceProviderServiceModel): void {
        this.serviceFalse.push(service);
        const idx = this.serviceTrue.indexOf(service);
        this.serviceTrue.splice(idx, 1);
    }

    openServiceListModal(): void {
        if (!this.serviceFalse || this.serviceFalse.length < 1) {
            this._appService.showSnackBar('You have selected all services', 'OK');
            return;
        }
        const dialogRef = this._matDialog.open(ServicesModalComponent, {
            disableClose: true,
            panelClass: 'services-modal',
            data: this.serviceFalse
        });
        
        dialogRef.afterClosed().subscribe(result => {

          if (!result){
            return;
          } 
          this.serviceFalse = [];
          this.serviceTrue = [];
          this.providerServices.map(providerService => {

              if (result[providerService.uid] == false){
                this.serviceFalse.push(providerService);
              }
              else
              {
                this.serviceTrue.push(providerService);
              }
          });
        });
    }

    AddService(): void
    {
        const length  = this.newServices.length.toString();
        const data = {
            uid: length,
            userId: this._paymentProviderService.userId,
            service: '',
            rate: 0,
            quantity: 1
        };
        this.newServices.push(new HLServiceProviderServiceModel(data.uid, data));
    }
    customServiceCancel(service: HLServiceProviderServiceModel): void {
        const idx = this.newServices.indexOf(service);
        this.newServices.splice(idx, 1);
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

    createInvoiceDraftForm(): FormGroup
    {
        return this._formBuilder.group({
          uid:                [''],
          competitionClass:   [null],
          horseBarnName:      [''],  
          horseDisplayName:   [null],
          horseId:            [''],
          showId:             [null],
          instruction:        [null],
          providerNote:       [null],
          isCustomRequest:    [true],
          dismissedBy:        [[]],
          status:             [''],
          showName:             [null],
          creatorId:          [''],
          serviceProviderId:  [''],            
          assignerId:         [null],
          updatedAt:          [''],
          createdAt:          [''],
          isDeletedFromInvoice: [false],
          show:                 [null]
      });
    }

    Quantitysearch(evt, newService): boolean{
        const charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)){
            window.event.returnValue = false;
            return false;
        }

        // Textbox value    
        const _value = newService.quantity;    

        const _pattern0 = /^\d*\d*$/;
        if (_pattern0.test(_value)) {
            if (charCode == 46) {
                window.event.returnValue = false;
                return false;
            }
        }
        
        const _pattern2 = /^\d*d{2}$/;
        if (_pattern2.test(_value)) {
            window.event.returnValue = false;
            return false;
        }
        window.event.returnValue = true;
        return true;
    }

    psearch(evt, newService): boolean{
        const charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)){
            window.event.returnValue = false;
            return false;
        }

        // Textbox value    
        const _value = newService.rate;    
        const _pattern0 = /^\d*[.]\d*$/;
        if (_pattern0.test(_value)) {
            if (charCode == 46) {
                window.event.returnValue = false;
                return false;
            }
        }
        
        const _pattern2 = /^\d*[.]\d{2}$/;
        if (_pattern2.test(_value)) {
            window.event.returnValue = false;
            return false;
        }
        window.event.returnValue = true;
        return true;
    }

    onNext(): void {

        if (!this.currentHorse) {
            if (!this.selectedContact) {
                this._appService.showSnackBar('Please set invoice method.', 'OK');
                return;
            }
        }
        if (this.currentHorse && !this.currentHorse.creatorId) {
            if (this.selectedContact.emails && this.selectedContact.emails.length > 0) {
                this.invoiceMethodType = HLInvoiceMethodType.EMAIL;
            }
            if (this.selectedContact.phoneNumbers && this.selectedContact.phoneNumbers.length > 0) {
                this.invoiceMethodType = HLInvoiceMethodType.SMS;
            }
        }

        if (this.serviceTrue.length < 1 && this.newServices.length < 1) {
            // Show the success message
            this._appService.showSnackBar('Please add at least one service.', 'OK');
            return;
        }

        let customServiceFlag = false;
        
        this.newServices.forEach(service => {
            if (service.rate < 1 || service.quantity == 0 || service.service == ''){
                this._appService.showSnackBar(
                    'All Services must have a valid name, rate of at least $1.00 and whole number quantity greater than 0-numeric characters only.', 'OK');
                customServiceFlag = true;
            }
        });

        if (customServiceFlag) { return; }

        let data: any;
        if (!this.currentShow) {
            if (this.showName != ''){
                let validation: any;
                this._paymentProviderService.validateShow(this.showName)
                .then((valid) => {
                    validation = valid;
                    if (validation) {
                        // Show the error message
                        this._appService.showSnackBar('Show is already exists. Please input another show.', 'OK');
                        return;
                    } else {
                        this._paymentProviderService.saveNewShow(this.showName)
                        .then((show) => {
                            data = this.requestInfo(this.invoiceDraftForm.getRawValue());
                            data.show = show;
                            data.showId = show.uid;
                            this._paymentProviderService.onInvoiceConfirm.next({data: data, horse: this.currentHorse, contact: this.selectedContact});
                            this._fuseSidebarService.getSidebar('invoice-confirm-panel').toggleOpen();
                            this._fuseSidebarService.getSidebar('payment-provider-create-panel').toggleOpen();
                        });
                        
                    }
                });
            } else {
                data = this.requestInfo(this.invoiceDraftForm.getRawValue());
                data.show = null;
                data.showId = '';
                this._paymentProviderService.onInvoiceConfirm.next({data: data, horse: this.currentHorse, contact: this.selectedContact});
                this._fuseSidebarService.getSidebar('invoice-confirm-panel').toggleOpen();
                this._fuseSidebarService.getSidebar('payment-provider-create-panel').toggleOpen();
            }
        } else {
            data = this.requestInfo(this.invoiceDraftForm.getRawValue());
            this._paymentProviderService.onInvoiceConfirm.next({data: data, horse: this.currentHorse, contact: this.selectedContact});
            this._fuseSidebarService.getSidebar('invoice-confirm-panel').toggleOpen();
            this._fuseSidebarService.getSidebar('payment-provider-create-panel').toggleOpen();
        }
    }

    requestInfo(data): any {
        data.horseId = this.currentHorse.uid;
        data.horseBarnName = this.currentHorse.barnName;
        data.horseDisplayName = this.currentHorse.displayName;

        data.requestDate = this.requestDate;
        data.serviceProviderId = this._paymentProviderService.userId;
        data.status = 'completed';
        data.creatorId = this._paymentProviderService.userId;

        let serviceList: any[] = [];
        if (this.newServices.length > 0){
            this.newServices.map( service => {
                service.uid = '';
                serviceList.push(service);
            });
        }
        if (this.serviceTrue.length > 0){
            this.serviceTrue.map(service => {
                serviceList.push(service);
            });
        }
        
        data.services = Object.assign(serviceList.map(value => value.toJSON()));
        data.isCustomRequest = true;
        data.showId = this.currentShow ? this.currentShow.uid : '';
        data.show = this.currentShow;
        return data;
    }

    onSearchShow(type: string): void{
        this._paymentProviderService.setSearchType(type);
        this._fuseSidebarService.getSidebar('payment-provider-create-panel').toggleOpen();
        this._fuseSidebarService.getSidebar('payment-provider-showSearch-panel').toggleOpen();
    }

    getFixed(rate): string {
        return rate.toFixed(2);
    }

    onInputShow(event): void {
        this.currentShow = null;
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
}
