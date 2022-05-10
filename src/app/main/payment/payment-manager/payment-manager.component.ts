import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { PaymentManager } from 'app/main/payment/payment-manager/payment-manager.model';
import { PaymentManagerService } from 'app/main/payment/payment-manager/payment-manager.service';

@Component({
    selector     : 'payment-manager',
    templateUrl  : './payment-manager.component.html',
    styleUrls    : ['./payment-manager.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class PaymentManagerComponent implements OnInit, OnDestroy
{
    currentPayment: PaymentManager;
    currentPaymentFlag: boolean;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {PaymentManagerService} _paymentService
     */
    constructor(
        private _fuseSidebarService: FuseSidebarService,
        private _paymentService: PaymentManagerService,
        private _fuseConfigService: FuseConfigService,

    )
    {
        this.currentPaymentFlag = false;
        // Set the private defaults
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

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        
        this._paymentService.onCurrentPaymentChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(currentPayment => {
                if ( !currentPayment ){
                    this.currentPayment = null;
                }
                else{
                    this.currentPayment = currentPayment;
                }
            });

        this._paymentService.onCurrentPaymentFlagChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(flag => {
                this.currentPaymentFlag = flag;
            });
    }

    deselectCurrentPayment(): void
    {
        this._paymentService.onCurrentPaymentChanged.next(null);

        this.currentPaymentFlag = false;
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
}
