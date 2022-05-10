import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HLInvoiceModel } from 'app/model/invoices';
import { fuseAnimations } from '@fuse/animations';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { PaymentProviderService } from 'app/main/payment/payment-provider/payment-provider.service';

@Component({
    selector     : 'provider',
    templateUrl  : './payment-provider.component.html',
    styleUrls    : ['./payment-provider.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class PaymentProviderComponent implements OnInit, OnDestroy
{
    currentTab: number;
    currentInvoice: HLInvoiceModel;
    currentPaymentFlag = false;
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {PaymentProviderService} _providerService
     */
    constructor(
        private _fuseSidebarService: FuseSidebarService,
        private _providerService: PaymentProviderService,
        private _fuseConfigService: FuseConfigService,
    )
    {
        this.currentTab = 0;
        this._unsubscribeAll = new Subject();

        // Configure the layout
        this._fuseConfigService.config = {
            layout: {
                navbar   : {
                    hidden: false
                },
                toolbar  : {
                    hidden: false
                },
                footer   : {
                    hidden: true
                },
                sidepanel: {
                    hidden: true
                }
            }
        };
        
    }

    /**
     * On init
     */
    ngOnInit(): void
    {
        this._providerService.onTagsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(tab => {
                this.currentInvoice = null;
                this.currentTab = tab;
        });

        this._providerService.onCurrentInvoiceChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(currentProvider => {
                if ( !currentProvider || !currentProvider.uid){
                    this.currentInvoice = null;
                }
                else{
                    this.currentInvoice = currentProvider;
                }
        });

        this._providerService.onCurrentPaymentFlagChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(flag => {
                this.currentPaymentFlag = flag;
        });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    deselectCurrentInvoice(): void
    {
        this._providerService.onCurrentInvoiceChanged.next(null);
        this.currentPaymentFlag = false;
    }
    /**
     * Toggle the sidebar
     *
     * @param name
     */
    toggleSidebar(name): void
    {
        this._fuseSidebarService.getSidebar(name).toggleOpen();
    }
}
