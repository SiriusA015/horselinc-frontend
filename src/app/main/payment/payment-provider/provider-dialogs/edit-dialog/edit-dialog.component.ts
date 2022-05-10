import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { HLServiceProviderServiceModel } from 'app/model/users';
import { ServicesModalComponent } from '../services-modal/services-modal.component';
import { PaymentProviderService } from '../../payment-provider.service';
import { takeUntil } from 'rxjs/operators';
import { HLServiceRequestModel } from 'app/model/service-requests';
import { MatDialog } from '@angular/material';
import { HLInvoiceModel } from 'app/model/invoices';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { ConfirmDlgComponent } from 'app/main/@shared/confirm-dlg/confirm-dlg.component';
import { AppService } from 'app/service/app.service';

import * as _moment from 'moment';

@Component({
  selector: 'edit-dialog',
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditDialogComponent implements OnInit, OnDestroy {

  providerServices: HLServiceProviderServiceModel[] = [];
  invoiceDraft: HLInvoiceModel;
  serviceRequests: HLServiceRequestModel[];
  newServicesList: HLServiceProviderServiceModel[][];
  customNum: number[];
  isLogging = false;
  isLogging1 = false;
  requestServices: HLServiceProviderServiceModel[][];
  requestDates: any[];
  newRequestDates: any[];
  private _unsubscribeAll: Subject<any>;

  constructor(
    private _fuseSidebarService: FuseSidebarService,
    private _matDialog: MatDialog, 
    private _paymentProviderService: PaymentProviderService,
    private _progressBarService: FuseProgressBarService,
    private _appService: AppService
  ) { 
    this.customNum = [0];
    this.newServicesList = [];
    this.newRequestDates = [new Date()];
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.customNum = [0];
    this.serviceRequests = [];
    this.requestServices = [];
    this.newServicesList = [];
    this._paymentProviderService.onServiceProviderServices
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(providerServices => {
          this.providerServices = [];
          this.providerServices = providerServices.slice();
      });

    this._paymentProviderService.onSelectedInvoiceChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(invoice => {
        if (invoice && invoice != false) {
          this.serviceRequests = [];
          this.requestDates = [];
          this.newRequestDates = [];
          this.newServicesList = [];

          this.invoiceDraft = invoice;

          if (this.invoiceDraft.requests){
              this.invoiceDraft.requests.map(item => {
                this.serviceRequests.push( new HLServiceRequestModel(item.uid, item));
              });
          }
          this.requestServices = new Array();
          this.serviceRequests.forEach(doc => {
              this.requestDates.push(new FormControl(new Date(doc.requestDate)));
              this.newRequestDates.push(new FormControl(new Date(doc.requestDate)));
              this.requestServices.push(new Array());
              this.requestServices[this.requestServices.length - 1] = doc.services.slice();
          });
        }
      });
  }

  onCloseDlg(): void {
    this._fuseSidebarService.getSidebar('payment-provider-edit-panel').close();
  }

  deleteService(i, k): void {
      this.requestServices[i].splice(k, 1);
  }

  openServiceListModal(i): any {

      let leftServices: any;
      leftServices = new Array();
      this.providerServices.map(service => {
        const left = this.requestServices[i].find(item =>  item.uid == service.uid);
        if (!left) {
            leftServices.push(service);
        }
      });

      if (!leftServices || leftServices.length < 1) {
          this._appService.showSnackBar('You have selected all services', 'OK');
          return;
      }

      const dialogRef = this._matDialog.open(ServicesModalComponent, {
        disableClose: true,
          panelClass: 'services-modal',
          data: leftServices
      });
      
      dialogRef.afterClosed().subscribe(result => {

        if (!result) {
          return;
        }
        this.providerServices.map(providerService => {

          if (result[providerService.uid] == true){
            providerService.quantity = 1;
            this.requestServices[i].push(providerService);
          }
      });
    });
  }

  saveToDraft(): void {
      if (this.isLogging || this.isLogging1) {
          return;
      }
      let flag = false;
      if (this.newServicesList.length > 0) {
        this.newServicesList.forEach(services => {
            services.forEach(item => {
                if (item.service == '' || item.quantity == 0 || item.rate < 0) {
                    flag = true;
                    this._appService.showSnackBar('Please enter valid service!', 'OK');
                }
            });
        });
      }
      
      if (flag) {
          return;
      }
      if (this.serviceRequests) {
          this.serviceRequests.forEach( (item, index) => {
              if (this.newServicesList[index]){
                  this.newServicesList[index].forEach((service) => {
                    item.uid = '';
                    this.requestServices[index].push(service);
                  });
              }

              this.newServicesList = [];
              
              const updatedData = {
                  uid: item.uid,
                  requestDate: new Date(this.newRequestDates[index]).getTime(),
                  services: Object.assign(this.requestServices[index].map(value => value.toJSON()))
              };
              this.isLogging = true;
              this._progressBarService.beginLoading2();

              this._paymentProviderService.updateInvoice(updatedData)
                  .then((request) => {
                      this.successMessage();
                      this.isLogging = false;
                      this._progressBarService.endLoading2();
                  })
                  .catch(() => {
                      this.isLogging = false;
                      this._progressBarService.endLoading2();
                  });
          });
      }
  }

  successMessage(): void {
      let amount = 0;
      this.invoiceDraft.requests.forEach((request, index) => {
          request.services = [];
          this.requestServices[index].forEach((item) => {
              amount = amount + (item.rate * item.quantity);
              request.services.push(item);
          });
      });

      this.invoiceDraft.amount = amount;
      this._paymentProviderService.onCurrentInvoiceChanged.next(this.invoiceDraft);
      this.onCloseDlg();
  }

  deleteInvoiceDraft(): void {
    if (!this.invoiceDraft) {
      return;
    }
    if (this.isLogging || this.isLogging1) {
        return;
    }

    const event = {
        title: 'HorseLinc',
        msg: 'Are you sure you want to delete this invoice? All requests on this invoice will also be deleted.',
        btn1Name: 'CANCEL',
        btn2Name: 'OK'
    };
    const dialogRef = this._matDialog.open(ConfirmDlgComponent, {
        disableClose: true,
        panelClass: 'confirmDlg',
        data: {event: event}
    });

    dialogRef.afterClosed().subscribe((action: any) => {
        if (action == event.btn2Name) {
            this.isLogging1 = true;
            this.invoiceDraft.requestIds.forEach((element, index) => {
                this._paymentProviderService.deleteInvoiceDraft(element)
                .then(() => {
                      if (index == this.invoiceDraft.requestIds.length - 1){
                          this._paymentProviderService.popupInvoiceDraft(this.invoiceDraft);
                          this._paymentProviderService.onCurrentInvoiceChanged.next(null);
                          this._paymentProviderService.onCurrentPaymentFlagChanged.next(false);
                          this.isLogging1 = false;
                          this._fuseSidebarService.getSidebar('payment-provider-edit-panel').close();
                      }
                });
            });

            this._paymentProviderService.deleteInvoice((this.invoiceDraft.uid).toString())
            .then(() => {
                  this._paymentProviderService.popupInvoice(this.invoiceDraft);
                  this._paymentProviderService.onCurrentInvoiceChanged.next(null);
                  this._paymentProviderService.onCurrentPaymentFlagChanged.next(false);
                  this._fuseSidebarService.getSidebar('payment-provider-edit-panel').close();
            })
            .catch(() => {
                  this._fuseSidebarService.getSidebar('payment-provider-edit-panel').close();
            });
        }
    });
  }

  AddService(idx): void
  {
      const data = {
          uid: String(this.customNum[idx]),
          userId: this._paymentProviderService.userId,
          service: '',
          rate: 0,
          quantity: 1
      };
      if (!this.newServicesList[idx]){
        this.newServicesList[idx] = [];
      }
      
      this.newServicesList[idx].push(new HLServiceProviderServiceModel(data.uid, data));
      this.customNum[idx]++;
  }

  customServiceCancel(service: HLServiceProviderServiceModel, id: number): void {
      const idx = this.newServicesList[id].indexOf(service);
      this.newServicesList[id].splice(idx, 1);
      this.customNum[id] = this.customNum[id] - 1;
  }
  changeCustomServiceQuantity(quantity, uid, listId): void{
      this.newServicesList[listId].map(service => {
          if (service.uid === uid){
              service.quantity = quantity;
          }
      });
  }

  changeCustomServiceService(servicename, newService): void{
   
      newService.service = servicename;
   
  }

  changeCustomServiceRate(rate, uid, listId): void{
      this.newServicesList[listId].map(service => {
          if (service.uid === uid){
              service.rate = rate;
          }
      });
  }

  Quantitysearch(evt, newService): boolean{
    const charCode = (evt.which) ? evt.which : evt.keyCode;
  
    if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)){
        window.event.returnValue = false;
        return false;
    }
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

  ngOnDestroy(): void
  {
      this._unsubscribeAll.next();
      this._unsubscribeAll.complete();
  }
}
