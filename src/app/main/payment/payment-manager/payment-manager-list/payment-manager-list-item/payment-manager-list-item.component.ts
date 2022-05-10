import { Component, HostBinding, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { HLInvoiceModel } from 'app/model/invoices';
import { PaymentManagerService } from 'app/main/payment/payment-manager/payment-manager.service';
import * as moment from 'moment';
import { AppService } from 'app/service/app.service';

@Component({
    selector     : 'payment-manager-list-item',
    templateUrl  : './payment-manager-list-item.component.html',
    styleUrls    : ['./payment-manager-list-item.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PaymentManagerListItemComponent implements OnInit, OnDestroy
{
    @Input()
    payment: HLInvoiceModel;
    @Input() completed: boolean;
    
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {PaymentManagerService} _paymentService
     * @param {ActivatedRoute} _activatedRoute
     */
    constructor(
        private _paymentService: PaymentManagerService,
        private _activatedRoute: ActivatedRoute,
        private _appService: AppService
    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    /**
     * On init
     */
    ngOnInit(): void {
    }

    compare(ud, cd): boolean{
        const a = moment(new Date(cd)).format('MM/DD/YYYY');
        const b = moment(new Date(ud)).format('MM/DD/YYYY');
        if (b > a){   
            return true;
        }else {
            return false;
        }
    }

    getSubTotal(list): number{
        let total = 0;
        list.forEach(element => {
            total += element.rate * element.quantity;
        });
        return this.getAmountWithApplicationFee(total);
    }
    
    getAmountWithApplicationFee(amount: number): number {
        return this._appService.getAmountWithApplicationFee(amount);
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        this.payment = null;
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
}
