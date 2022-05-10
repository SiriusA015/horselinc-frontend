import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { PaymentProviderService } from 'app/main/payment/payment-provider/payment-provider.service';
import { HLInvoiceModel } from 'app/model/invoices';
import { fuseAnimations } from '@fuse/animations';

import { takeUntil } from 'rxjs/operators';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';

@Component({
  selector: 'payment-provider-list',
  templateUrl: './payment-provider-list.component.html',
  styleUrls: ['./payment-provider-list.component.scss'],
  animations   : fuseAnimations
})
export class PaymentProviderListComponent implements OnInit, OnDestroy {

    paid: boolean;
    isLoadMore = false;
    currentTab = 0;
    submittedInvoices: HLInvoiceModel[];
    paidInvoices: HLInvoiceModel[];
    draftInvoices: HLInvoiceModel[];
    currentInvoice: HLInvoiceModel;
    onPaymentInfoLoading = false;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {ActivatedRoute} _activatedRoute
     * @param {PaymentProviderService} _providerService
     * @param {Location} _location
     */

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _location: Location,
        private _providerService: PaymentProviderService,
        private _fuseSidebarService: FuseSidebarService,
    ) {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
        this.paid = true;
        this.draftInvoices = [];
        this.submittedInvoices = [];
        this.paidInvoices = [];
    }

    ngOnInit(): void {
        this.draftInvoices = [];
        this.submittedInvoices = [];
        this.paidInvoices = [];

        this._providerService.onItemLoading
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(isLoading => {
                if (isLoading == true) {
                    this.onPaymentInfoLoading = true;
                } else {
                    this.onPaymentInfoLoading = false;
                }
            });

        this._providerService.onDraftInvoicesChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(invoices => {
                this.draftInvoices = [];
                this.draftInvoices = invoices;
            });

        this._providerService.onLoadingFirst
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((isFirst) => {
                if (isFirst) {
                    this.onTabChanged(0);
                }
            });

        this._providerService.onSubmittedInvoicesChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(invoices => {
                this.submittedInvoices = [];
                this.submittedInvoices = invoices;
            });

        this._providerService.onPaidInvoicesChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(invoices => {
                this.paidInvoices = [];
                this.paidInvoices = invoices;
            });

        this._providerService.onCurrentInvoiceChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(currentInvoice => {
                if (!currentInvoice){
                    this.currentInvoice = null;
                    this._location.go('provider/payments');
                }
                else {
                    this.currentInvoice = currentInvoice;
                }
            });
    }

    readInvoice(providerId): void {
        if ( this.onPaymentInfoLoading ){
            return;
        }
        this._providerService.setCurrentInvoice(providerId, 'DRAFT');
        this._providerService.onCurrentPaymentFlagChanged.next(true);
    }
    readSubmitted(submittedId): void {
        if ( this.onPaymentInfoLoading ){
            return;
        }
        this._providerService.setCurrentInvoice(submittedId, 'SUBMITTED');
        this._providerService.onCurrentPaymentFlagChanged.next(true);
    }
    readPaid(paidId): void {
        if ( this.onPaymentInfoLoading ){
            return;
        }
        this._providerService.setCurrentInvoice(paidId, 'PAID');
        this._providerService.onCurrentPaymentFlagChanged.next(true);
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        this.draftInvoices = [];
        this.submittedInvoices = [];
        this.paidInvoices = [];
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
    onShowCreateDialog(): void
    {
        this._providerService.onCreateDlgInitEv.next(true);
        this._fuseSidebarService.getSidebar('payment-provider-create-panel').toggleOpen();
    }

    onExportInovice(): void{
        this._providerService.onExportPaymentHistoryInit.next(true);
        this._fuseSidebarService.getSidebar('payment-provider-export-invoice').toggleOpen();
    }

    onTabChange(event): void {
        if ( this.onPaymentInfoLoading ){
            return;
        }
        this.currentTab = event.index;
        this._providerService.onTagsChanged.next(event.index);
        this.onTabChanged(event.index);
    }

    onTabChanged(curTab: number): void {
        this.isLoadMore = true;
        if (curTab == 0) {
            if (this.draftInvoices.length > 0){
                this._providerService.setCurrentInvoice(this.draftInvoices[0].uid, 'DRAFT');
            } else {
                this._providerService.setCurrentInvoice(null, 'DRAFT');
            }
            this._providerService.getDraftInvoices(true)
            .then(() => {
                if (this.draftInvoices.length > 0){
                    this._providerService.setCurrentInvoice(this.draftInvoices[0].uid, 'DRAFT');
                }
                this.isLoadMore = false;
            });
        } else if (curTab == 1) {
            if (this.submittedInvoices.length > 0){
                this._providerService.setCurrentInvoice(this.submittedInvoices[0].uid, 'SUBMITTED');
            } else {
                this._providerService.setCurrentInvoice(null, 'SUBMITTED');
            }
            this._providerService.getInvoices('submitted', true)
            .then(() => {
                if (this.submittedInvoices.length > 0){
                    this._providerService.setCurrentInvoice(this.submittedInvoices[0].uid, 'SUBMITTED');
                }
                this.isLoadMore = false;
            });
        } else {
            if (this.paidInvoices.length > 0){
                this._providerService.setCurrentInvoice(this.paidInvoices[0].uid, 'PAID');
            } else {
                this._providerService.setCurrentInvoice(null, 'PAID');
            }
            this._providerService.getInvoices('paid', true)
            .then(() => {
                if (this.paidInvoices.length > 0){
                    this._providerService.setCurrentInvoice(this.paidInvoices[0].uid, 'PAID');
                }
                this.isLoadMore = false;
            });
        }
    }

    onScroll(): void{
        this.isLoadMore = true;
        if (this.currentTab == 0 && this._providerService.shouldDraftLoadMore){
            this._providerService.getDraftInvoices().then(() => {
                this.isLoadMore = false;
            }).catch(() => {
                this.isLoadMore = false;
            });
        } else if (this.currentTab == 1 && this._providerService.shouldSubmittedLoadMore){
            this._providerService.getInvoices('submitted').then(() => {
                this.isLoadMore = false;
            }).catch(() => {
                this.isLoadMore = false;
            });
        } else if (this.currentTab == 2 && this._providerService.shouldPaidLoadMore){
            this._providerService.getInvoices('paid').then(() => {
                this.isLoadMore = false;
            }).catch(() => {
                this.isLoadMore = false;
            });
        } else {
            this.isLoadMore = false;
        }
    }
}
