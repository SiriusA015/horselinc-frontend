import { Component, HostBinding, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { PaymentProviderService } from 'app/main/payment/payment-provider/payment-provider.service';
import { HLInvoiceModel } from 'app/model/invoices';
import { AppService } from 'app/service/app.service';

@Component({
  selector: 'payment-provider-list-item',
  templateUrl: './payment-provider-list-item.component.html',
  styleUrls: ['./payment-provider-list-item.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class PaymentProviderListItemComponent implements OnInit, OnDestroy
{

    @Input() paid: boolean;
    @Input()
    invoice: HLInvoiceModel;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {PaymentService} _providerService
     * @param {ActivatedRoute} _activatedRoute
     */
    constructor(
        private _providerService: PaymentProviderService,
        private _appService: AppService
    ){
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    ngOnInit(): void {
    }

    getSubTotal(list): number{
        let total = 0;
        list.forEach(element => {
            total += element.rate * element.quantity;
        });
        return this.getAmountWithApplicationFee(total);
    }

    detectLast(length: number, idx: number): boolean{
        if ((length - 1) == idx){
            return true;
        } 
        else {
            return false;
        }
    }

    getAmountWithApplicationFee(amount: number): number {
        return this._appService.getAmountWithApplicationFee(amount);
    }

    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
}
