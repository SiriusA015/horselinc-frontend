import { Component, Inject, ViewEncapsulation, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { takeUntil } from 'rxjs/operators';
import { Subject, ReplaySubject } from 'rxjs';

// StripeCardDocument
import {Element as StripeElement, StripeService, ElementOptions, ElementsOptions, CardDataOptions, TokenResult } from '@nomadreservations/ngx-stripe';

import { HLServiceProviderServiceModel, HLBaseUserModel, HLStripeCardModel, HLUserModel } from 'app/model/users';
import { HLStripeCardBrand } from 'app/model/enumerations';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector     : 'user-payment-card',
    templateUrl  : './payment-card.component.html',
    styleUrls    : ['./payment-card.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class UserPaymentCardComponent implements OnInit
{
    paymentUser: HLUserModel;
    action: any;
    paymentCardForm: FormGroup;

    stripeKey = 'pk_test_SCjKq9ThYF4VfqNSDwwGtE2X';
    error: any;
    complete = false;
    element: StripeElement;
    token: TokenResult;
    customer: any;

    isProcessing: boolean;

    cardOptions: ElementOptions = {
      style: {
        base: {
            iconColor: '#276fd3',
            color: '#31325F',
            lineHeight: '40px',
            fontWeight: 300,
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSize: '18px',
            '::placeholder': {
            color: '#CFD7E0'
            }
        }
      },
      hidePostalCode: true,
      hideIcon: false,
      iconStyle: 'default',
    };
    elementsOptions: ElementsOptions = {
        locale: 'en'
      };

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {MatDialogRef<UserPaymentCardComponent>} matDialogRef
     * @param _data
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public _matDialogRef: MatDialogRef<UserPaymentCardComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _formBuilder: FormBuilder,
        private _stripe: StripeService,
        private _horseManagerService: UserHorseManagerService,
        private _userAuthService: UserAuthService
    )
    {
        // Set the defaults
        // this.action = _data.action;
        this._unsubscribeAll = new Subject();
        this.createPaymentCardForm();
        this.isProcessing = false;
    }

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.paymentUser = new HLUserModel(this._data.data.uid, this._data.data);
        this.stripeKey = environment.stripeConfig.apiKey;
        // console.log(this.stripeKey);
        this._stripe.changeKey(this.stripeKey);

        this._horseManagerService.createCustomer(this.paymentUser.horseManager.userId)
        .then((customer) => {
            // console.log('customer:', customer);
                this.customer = customer;
        });

    }
    cardUpdated(result): void{
        this.element = result.element;
        this.complete = result.completed;
        this.error = undefined;
      }
    getCardToken(): void{
    this._stripe
        .createToken(this.element, {
            // name: 'tested_ca',
            // address_line1: '123 A Place',
            // address_line2: 'Suite 100',
            // address_city: 'Irving',
            // address_state: 'BC',
            // address_zip: 'VOE 1H0',
            // address_country: 'CA'
        })
        .subscribe(result => {
            this.token = result;
        });
    }
      
    createPaymentCardForm(): void{
    }

    onAdd(): void{
        this._stripe
        .createToken(this.element, {
            // name: 'tested_ca',
            // address_line1: '123 A Place',
            // address_line2: 'Suite 100',
            // address_city: 'Irving',
            // address_state: 'BC',
            // address_zip: 'VOE 1H0',
            // address_country: 'CA'
        })
        .subscribe(result => {
            this.token = result;
            // console.log('token:', this.token); 
            this.addCard();
        });
    }
    
    addCard(): void{
        this.isProcessing = true;
        this._horseManagerService.addCardToCustomer(this.customer.id, this.token.token.id, this.paymentUser.horseManager.userId)
        .then(() => {
            this.isProcessing = false;
            this.onClose('');
         });
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    onClose(retParam: any): void{
        this._matDialogRef.close(retParam);
    }
}
