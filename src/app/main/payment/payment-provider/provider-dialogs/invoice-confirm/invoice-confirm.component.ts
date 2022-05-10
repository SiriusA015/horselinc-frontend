import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { PaymentProviderService } from '../../payment-provider.service';
import { HLHorseModel } from 'app/model/horses';
import { AppService } from 'app/service/app.service';
import { HLPhoneContactModel } from 'app/model/phoneContact';
import * as _moment from 'moment';

@Component({
  selector: 'invoice-confirm',
  templateUrl: './invoice-confirm.component.html',
  styleUrls: ['./invoice-confirm.component.scss']
})

export class InvoiceConfirmComponent implements OnInit 
{
    data: any;
    horse: HLHorseModel;
    selectedContact: HLPhoneContactModel;
    invoiceTotal: number;
    serviceNum: number;
    isLogging: boolean;
    isLogging1: boolean;

    private _unsubscribeAll: Subject<any>;

    constructor(
        private _fuseSidebarService: FuseSidebarService,
        private _fuseConfigService: FuseConfigService,
        private _paymentProviderService: PaymentProviderService,
        private _appService: AppService
    )
    {
        this.horse = null;
        this.selectedContact = null;
        this.isLogging = false;
        this.isLogging1 = false;
        this._unsubscribeAll = new Subject();
    }

    ngOnInit(): void
    {
        this.horse = null;
        this.selectedContact = null;
        this.isLogging = false;
        this.isLogging1 = false;

        this._paymentProviderService.onInvoiceConfirm
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(data => {

            this.horse = null;
            this.selectedContact = null;
            this.invoiceTotal = 0;
            this.isLogging = false;
            this.isLogging1 = false;

            if (data.data !== false && data.data && data.horse){
                this.data = data.data;
                this.horse = data.horse;
                this.data.services.map(service => {
                    this.invoiceTotal = this.invoiceTotal + service.rate * service.quantity;
                });
                this.serviceNum = this.data.services.length;
            }
            if (data.contact) {
                this.selectedContact = data.contact;
            }
        });
    }

    confirmSubmit(): void
    {
        if (this.isLogging || this.isLogging1) {
            return;
        }
        if (!this._paymentProviderService.checkPaymentMethodValid()) {
            this._appService.showSnackBar('You have to add a payment method before create an invoice', 'OK');                    
            return;
        }

        this.isLogging = true;
        this._paymentProviderService.createRequest(this.data, this.selectedContact)
        .then((requestId) => {
                this.data.requestIds = [requestId];
                this.data.horseId = this.horse.uid;
                this._paymentProviderService.createInvoiceById(this.data, this.selectedContact)
                .then((uid) => {
                    this._fuseSidebarService.getSidebar('invoice-confirm-panel').toggleOpen();
                })
                .catch(() => {
                    this.isLogging = false;
                    this._fuseSidebarService.getSidebar('invoice-confirm-panel').toggleOpen();
                });
        });  
    }
    confirmSave(): void
    {
        if (this.isLogging1 || this.isLogging) {
            return;
        }
        this.isLogging1 = true;
        this._paymentProviderService.createRequest(this.data, this.selectedContact)
            .then((requestId) => {
                this._paymentProviderService.getServiceRequestById(requestId)
                .then(() => {
                        this._paymentProviderService.onCurrentPaymentFlagChanged.next(false);
                        // this.isLogging1 = false;
                        this._appService.showSnackBar('Successfully submitted.', 'OK');
                        this._fuseSidebarService.getSidebar('invoice-confirm-panel').toggleOpen();
                    })
                    .catch(() => {
                        // this.isLogging1 = false;
                        this._fuseSidebarService.getSidebar('invoice-confirm-panel').toggleOpen();
                    });
            })
            .catch(() => {
                this.isLogging1 = false;
                this._appService.showSnackBar('Submit failed', 'OK');
                this._fuseSidebarService.getSidebar('invoice-confirm-panel').toggleOpen();
            });
    }

    confirmCancel(): void
    {
        this._fuseSidebarService.getSidebar('invoice-confirm-panel').toggleOpen();
        this._fuseSidebarService.getSidebar('payment-provider-create-panel').toggleOpen();
    }
}   
