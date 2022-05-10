import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { fuseAnimations } from '@fuse/animations';
import { COLLECTION_PAYMENTS } from 'app/model/constants';
import { HLInvoiceModel } from 'app/model/invoices';
import { PaymentManagerService } from 'app/main/payment/payment-manager/payment-manager.service';
import { MatDialog } from '@angular/material';
import { ConfirmDlgComponent } from 'app/main/@shared/confirm-dlg/confirm-dlg.component';
import { HLHorseManagerModel, HLStripeCustomerModel, HLStripeCardModel, HLHorseManagerPaymentApproverModel } from 'app/model/users';
import { CardsModalComponent } from '../cards-modal/cards-modal.component';
import { AppService } from 'app/service/app.service';
import { HLPaymentModel } from 'app/model/payments';

interface PaymentInfo {
    payerName: string;
    amountToPay: number;
    paidAt: string;
    text: string;
    status: number;
    payer: HLHorseManagerModel;
    paymentApprover: HLHorseManagerPaymentApproverModel;
    customer: HLStripeCustomerModel;
    isPaymentRequesting: boolean;
}

@Component({
    selector     : 'payment-manager-details',
    templateUrl  : './payment-manager-details.component.html',
    styleUrls    : ['./payment-manager-details.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class PaymentManagerDetailsComponent implements OnInit, OnDestroy
{
    payment: HLInvoiceModel;
    currentTab: number;
    addTip: number;
    selectedCard: HLStripeCardModel;
    userId: string;
    isLogging: boolean;
    invoicePaymentInfos: PaymentInfo[] = [];
    
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {Payment} _paymentService
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        private _paymentService: PaymentManagerService,
        private _formBuilder: FormBuilder,
        private _matDialog: MatDialog, 
        private db: AngularFirestore,
        private _appService: AppService,
        private _managerService: PaymentManagerService
    )
    {
        // this.isLoading = true;
        this.isLogging = false;
        this.currentTab = 0;
        this.userId = '';
        this._unsubscribeAll = new Subject();
        this.payment = null;
    }

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.payment = null;
        this.currentTab = 0;
        this.addTip = 0;
        this.invoicePaymentInfos = [];

        this._paymentService.onTagsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(tab => {
                // this.payment = null;
                this.currentTab = tab;
            });
            
        this._paymentService.onCurrentPaymentChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(payment => {
                this.payment = null;
                this.addTip = 0;
                this.isLogging = false;
                this.invoicePaymentInfos = [];
                if (payment) {
                    if (payment != false) {
                        this.payment = payment;
                        this.setDatas(this.payment);
                    }
                }
            });
    }

    onSubmitPayment( info: PaymentInfo): void{
        if (this.isLogging){
            return;
        }

        this.userId = this._appService.getCurUser().uid;
        const event = {
            title: 'Submit Payment?',
            msg: 'Are you sure you want to submit payment for this invoice?',
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
                let datas;
                if (this.payment.payers && this.payment.payers.length > 0) {
                    if (this.payment.isPaymentApprover(this.userId)){
                        datas = {
                            invoiceId: this.payment.uid,
                            payerId: info.payer ? info.payer.userId : '',
                            paymentApproverId: this.userId,
                            payerPaymentSourceId: info.payer.customer ? info.payer.customer.defaultSource : null,
                            addTip: this.addTip
                        };
                    } else {
                        datas = {
                            invoiceId: this.payment.uid,
                            payerId: info.payer ? info.payer.userId : '',
                            paymentApproverId: null,
                            payerPaymentSourceId: null,
                            addTip: this.addTip
                        };
                    }
                } else {
                    return;
                }
                this.isLogging = true;
                this._paymentService.submitPayment(datas)
                .then((res) => {
                    this._paymentService.paymentSubmitSuccess(datas.invoiceId);
                    this._appService.showSnackBar('Submitted payment successfully' , 'OK');
                    // this.isLogging = false;
                })
                .catch((err) => {
                    this._appService.showSnackBar(err.error.error.message, 'OK');
                    this.isLogging = false;
                });
            }
        });
    }

    onRequestApproval(info: PaymentInfo): void{
        if (!info.isPaymentRequesting) {
            return;
        }
        this.userId = this._appService.getCurUser().uid;
        if (info.status == 2){
            this.payment.isPaymentRequesting = false;
            info.isPaymentRequesting = false;
            this._paymentService.requestPayment(this.payment.uid)
            .then((res) => {
                this.payment.isPaymentRequesting = true;
                info.isPaymentRequesting = true;
                // Show the success message
                this._appService.showSnackBar('Payment has been requested!', 'OK');
            })
            .catch((err) => {
                this.payment.isPaymentRequesting = true;
                info.isPaymentRequesting = true;
                this._appService.showSnackBar('Cannot request the payment', 'OK');
            });
        } else {
            const approverAmount = this.payment.getApprovalAmountFor(info.payer, this.userId);
            if (approverAmount == null) {
                // this._appService.showSnackBar('TypeError: Can not read property "email" of undefined', 'OK');
                return;
            }
            const data = {
                approverId: this.userId, 
                ownerId: info.payer.userId,
                amount: approverAmount
            };
    
            this.payment.isPaymentRequesting = false;
            info.isPaymentRequesting = false;
    
            this._paymentService.requestApproval(data)
            .then((res) => {
                this.payment.isPaymentRequesting = true;
                info.isPaymentRequesting = true;
                // Show the success message
                this._appService.showSnackBar('Payment has been requested!', 'OK');
            })
            .catch((err) => {
                this.payment.isPaymentRequesting = true;
                info.isPaymentRequesting = true;
                this._appService.showSnackBar('Cannot request the payment', 'OK');
            });
        }
    }

    onTipChange(): void{
    }

    setDatas(invoice: HLInvoiceModel): void{
        if (!invoice){
            return;
        }
        this.invoicePaymentInfos = [];
        let payments: HLPaymentModel[];
        payments = [];

        if (this.currentTab == 0 || this.currentTab == 1) {
            this._paymentService.onItemLoading.next(true);
            const queryRef =  this.db.collection(COLLECTION_PAYMENTS, ref => ref.where('invoiceId', '==', invoice.uid)).get();
            queryRef.subscribe((snapshot) => {
                snapshot.forEach((doc) => {
                    const payment = doc.data();
                    payments.push(new HLPaymentModel(payment.uid, payment));
                });

                if (payments.length > 0) {
                    invoice.payments = payments;
                }

                if (invoice.payers) {
                    invoice.payers.forEach((item) => {
                        this.setData(item, this.payment);
                    });
                }
                this._paymentService.onItemLoading.next(false);
            });
        }
    }

    setData(payer: HLHorseManagerModel, invoice: HLInvoiceModel): void{
        if (!invoice) {
            return;
        }
        this.userId = this._appService.getCurUser().uid;
        const payerName = payer.name;
        
        if (this.currentTab == 1 && this.payment.getPaymentOf(payer)) {
            const amountToPay: number = this.payment.getPaymentOf(payer).amount;
            const paidAt = this.payment.getPaymentOf(payer).createdAt;
            const paymentinfo: PaymentInfo = {
                payerName: payerName,
                amountToPay: amountToPay,
                paidAt: paidAt,
                text: '',
                status: 0,
                payer: payer,
                paymentApprover: null,
                customer: null,
                isPaymentRequesting: false
            };
            paymentinfo.status = 0;
            this.invoicePaymentInfos.push(paymentinfo);
        } else if (this.currentTab == 0){
            let amountToPay = this.getAmountWithApplicationFee(invoice.getPayerAmount(payer));
            let paidAt: string;
            paidAt = invoice.paidAt;
            if (invoice.status == 'paid' && invoice.getPaymentOf(payer)) {
                amountToPay = invoice.getPaymentOf(payer).amount;
                paidAt = invoice.getPaymentOf(payer).createdAt;
            }
            let paymentinfo: PaymentInfo = {
                payerName: payerName,
                amountToPay: amountToPay,
                paidAt: paidAt,
                text: '',
                status: 0,
                payer: payer,
                paymentApprover: null,
                customer: null,
                isPaymentRequesting: true
            };
            const dispName: string = (payer.name != '') ? payer.name : 'userName';
            if (invoice.hasPaidBy(payer)){
                paymentinfo.text = '';
                paymentinfo.status = 3;
                paymentinfo.isPaymentRequesting = false;
                if (paymentinfo.customer) {
                    this.selectedCard = paymentinfo.customer.cards[0];
                }
                this.invoicePaymentInfos.push(paymentinfo);
            } else {
                if (invoice.isPaymentApprover(this.userId)){

                    if (invoice.isPayableBehalfOf(payer, this.userId)) {
                        if (invoice.payers && invoice.payers.length > 0) {
                            paymentinfo.text = 'You are approving a portion of this payment on behalf of ' + dispName;
                        } else {
                            paymentinfo.text = 'You are approving this payment on behalf of ' + dispName;
                        }
                    
                        if (payer.customer) {
                            if (payer.customer.cards) {
                                paymentinfo.customer = payer.customer;
                            }
                        }
                        paymentinfo.status = 1;
                    } else {
                        let approverAmount = invoice.getApprovalAmountFor(payer, this.userId);     //  Balance
                        if (!approverAmount) {
                            approverAmount  = 0;
                        }
                        const userName = payer.name;

                        if (approverAmount != null && userName != '') {
                            let text = 'This invoice is ';
                            text = text + '$ ' + (amountToPay - approverAmount).toFixed(2) + 
                            ' more than the maximum amount you are authorized to pay on behalf of ' + dispName;

                            paymentinfo.text = text;
                        }
                        if (invoice.isPaymentRequesting) {
                            paymentinfo.isPaymentRequesting = true;
                        } else {
                            paymentinfo.isPaymentRequesting = false;
                        }
                        paymentinfo.status = 2;
                    }

                } else if (!(invoice.isPaymentApprover(this.userId) || invoice.isPayer(payer.userId, this.userId))) {
                    paymentinfo.text = 'You do not have the correct authorization to approve this payment on behalf of ' + dispName;
                    paymentinfo.status = 2;  
                    paymentinfo.isPaymentRequesting = true;
                }
                else {
                    if (invoice.hasPaidBy(payer)) {
                        paymentinfo.text = '';
                        paymentinfo.status = 3;
                    } else {
                        if (payer.customer) {
                            if (payer.customer.cards) {
                                paymentinfo.customer = payer.customer;
                            }
                        }
                        paymentinfo.text = '';
                        paymentinfo.status = 1;
                    }
                }
                if (paymentinfo.customer) {
                    this.selectedCard = paymentinfo.customer.cards[0];
                }
                this.invoicePaymentInfos.push(paymentinfo);

            }
        }
    }

    getAmountWithApplicationFee(amount: number): number {
        return this._appService.getAmountWithApplicationFee(amount);
    }

    onOpenCardListDlg(info): void {
        if (this.isLogging) {
            return;
        }
        const dialogRef = this._matDialog.open(CardsModalComponent, {
            disableClose: true,
            panelClass: 'services-modal',
            data: info.customer.cards
        });
        
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.selectedCard = result;
                if (info.payer.customer) {
                    info.payer.customer.defaultSource = this.selectedCard.id;
                }
            }
        });
    }

    isPaymentApprover(): boolean {
        this.userId = this._appService.getCurUser().uid;
        return this.payment.isPaymentApprover(this.userId);
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        this.payment = null;
        this.currentTab = 0;
        this.addTip = 0;
        this.invoicePaymentInfos = [];
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    isPayment(): boolean {
        this.userId = this._appService.getCurUser().uid;
        let payment = null;
        if (this.payment && this.payment.payments && this.payment.payments.length > 0) {
            if (this.payment.isPaymentApprover(this.userId)) {
                payment = this.payment.payments.find((item) => item.paymentApproverId == this.userId);
            } else {
                payment = this.payment.payments.find((item) => item.payerId == this.userId);
            }
        }
        if (payment) {
            return true;
        }
        return false;
    }

    isAddedTip(payer): boolean{
        if (!payer || !this.payment){
            return false;
        }
        if (this.payment.getPaymentOf(payer)){
            const tip = this.payment.getPaymentOf(payer).tip;
            if (tip && tip > 0) {
                return true;
            }
        }
        return false;
    }
}
