import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { HLInvoiceModel } from 'app/model/invoices';
import { PaymentManagerService } from 'app/main/payment/payment-manager/payment-manager.service';
import { takeUntil } from 'rxjs/operators';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';

@Component({
  selector: 'payment-manager-list',
  templateUrl: './payment-manager-list.component.html',
  styleUrls: ['./payment-manager-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations   : fuseAnimations
})
export class PaymentManagerListComponent implements OnInit, OnDestroy {

    payments: HLInvoiceModel[];
    paidInvoices: HLInvoiceModel[];
    currentPayment: HLInvoiceModel;
    currentTab = 0;
    isLoading: boolean;
    isSelectedItmeLoading: boolean;
    isLoadMore: boolean;
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {ActivatedRoute} _activatedRoute
     * @param {PaymentService} _managerService
     * @param {Location} _location
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _managerService: PaymentManagerService,
        private _location: Location,
        private _fuseSidebarService: FuseSidebarService,
    )
    {
        this.isLoadMore = false;
        this.isSelectedItmeLoading = false;
        this.isLoading = true;
        this.payments = [];
        this.paidInvoices = [];
        this._unsubscribeAll = new Subject();
    }

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.payments = [];
        this.paidInvoices = [];
        this._managerService.onPaymentsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(payments => {
                this.payments = [];
                if (payments){
                    this.payments = payments;
                }
            });

        this._managerService.onLoading
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(isLoading => {
                this.isLoadMore = isLoading;
            });

        this._managerService.onItemLoading
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(isLoading => {
                if (isLoading == true){
                    this.isSelectedItmeLoading = true;
                } else if (isLoading == false){
                    this.isSelectedItmeLoading = false;
                }
            });

        this._managerService.onPaidInvoicesChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(invoices => {
                this.paidInvoices = [];
                if (invoices) {
                    this.paidInvoices = invoices;
                } 
            });

        this._managerService.onCurrentPaymentChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(currentPayment => {
                this.currentPayment = null;
                if ( currentPayment && currentPayment != false ){
                    this.currentPayment = currentPayment;
                }
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        this.payments = [];
        this.paidInvoices = [];
        this.isSelectedItmeLoading = false;
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
    /**
     *
     * @param paymentId
     */
    readPayment(paymentId): void
    {
        if (this.isSelectedItmeLoading){
            return;
        }
        this._managerService.setCurrentPayment(paymentId, 'OUTSTANDING');
        this._managerService.onCurrentPaymentFlagChanged.next(true);
    }

    readPaid(completedId): void {
        if (this.isSelectedItmeLoading){
            return;
        }
        this._managerService.setCurrentPayment(completedId, 'COMPLETED');
        this._managerService.onCurrentPaymentFlagChanged.next(true);
    }

    onExportInovice(): void{
        this._managerService.onExportPaymentHistoryInit.next(true);
        this._fuseSidebarService.getSidebar('payment-manager-export-invoice').toggleOpen();
    }

    onTabChange(event): void {
        this.currentTab = event.index;
        this._managerService.onTagsChanged.next(event.index);
        this.onTabChanged(event.index);
    }

    onTabChanged(curTab: number): void {
        this.isLoadMore = true;
        if (curTab == 0) {
            if (this.payments.length > 0){
                this._managerService.setCurrentPayment(this.payments[0].uid, 'OUTSTANDING');
            } else{
                this._managerService.setCurrentPayment(null, 'OUTSTANDING');
            }
            
            this._managerService.getInvoices('outstand', true).then((res) => {
                if (this.payments.length > 0){
                    this._managerService.setCurrentPayment(this.payments[0].uid, 'OUTSTANDING');
                }
                this.isLoadMore = false;
            });
        } else {
            if (this.paidInvoices.length > 0){
                this._managerService.setCurrentPayment(this.paidInvoices[0].uid, 'COMPLETED');
            } else {
                this._managerService.setCurrentPayment(null, 'COMPLETED');
            }
            this._managerService.getInvoices('completed', true).then((res) => {
                if (this.paidInvoices.length > 0){
                    this._managerService.setCurrentPayment(this.paidInvoices[0].uid, 'COMPLETED');
                }
                this.isLoadMore = false;
            });
        }
    }

    onScroll(): void {
        if (this.currentTab == 0 && this._managerService.shouldOutstandLoadMore){
            this.isLoadMore = true;
            this._managerService.getInvoices('outstand').then(() => {
                this.isLoadMore = false;
            });
        } else if (this.currentTab == 1 && this._managerService.shouldCompletedLoadMore){
            this.isLoadMore = true;
            this._managerService.getInvoices('completed').then(() => {
                this.isLoadMore = false;
            });
        }
    }
}
