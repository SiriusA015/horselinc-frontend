import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { fuseAnimations } from '@fuse/animations';
import { HLInvoiceModel } from 'app/model/invoices';
import { HLPaymentModel } from 'app/model/payments';
import { PaymentProviderService } from 'app/main/payment/payment-provider/payment-provider.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { ConfirmDlgComponent } from 'app/main/@shared/confirm-dlg/confirm-dlg.component';
import { AngularFirestore } from '@angular/fire/firestore';
import { COLLECTION_PAYMENTS } from 'app/model/constants';
import { AppService } from 'app/service/app.service';

interface BalanceInfo {
    BalancePaid: number;
    OutstandingBalance: number;
}

interface PaymentInfo {
    payerName: string;
    paidAt: string;
    amount: number;
    tip: number;
    isTipAdded: boolean;
}

@Component({
  selector: 'payment-provider-details',
  templateUrl: './payment-provider-details.component.html',
  styleUrls: ['./payment-provider-details.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations   : fuseAnimations
})

export class PaymentProviderDetailsComponent implements OnInit, OnDestroy
{
    invoice: HLInvoiceModel;
    addTip: string;
    currentTab: number;
    balanceInfo: BalanceInfo = null;
    paymentInfos: PaymentInfo[];
    isPayable: boolean;
    isLogging: boolean;
    isReminder: boolean;
    isPaymentInfoLoading = false;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {Payment} _providerService
     * @param {FormBuilder} _formBuilder
     */

    constructor(
        private _providerService: PaymentProviderService,
        private _matDialog: MatDialog, 
        private _formBuilder: FormBuilder,
        private _fuseSidebarService: FuseSidebarService,
        private db: AngularFirestore,
        private _appService: AppService
    ) {
        this.addTip = '0';
        this.currentTab = 0;
        this.isLogging = false;
        this.isReminder = false;
        this.balanceInfo = null;
        this.paymentInfos = [];
        // Set the private defaults
        this._unsubscribeAll = new Subject();
        this.invoice = null;
    }

    ngOnInit(): void {
        this.isPayable = false;
        this.invoice = null;
        this._providerService.onTagsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(tab => {
                this.invoice = null;
                this.currentTab = tab;
            });

        this._providerService.onCurrentInvoiceChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(invoice => {
                this.invoice = null;
                this.isLogging = false;
                if (invoice) {
                    if (invoice != false){
                        this.invoice = invoice;
                        if (this.currentTab !== 0){
                            this.getPaymentDatas(this.invoice);
                        }
                    }
                }
            });
    }

    getPaymentDatas(invoice: HLInvoiceModel): void {
        if (!invoice.uid){
            return;
        }
        this.isPayable = this._providerService.checkPaymentMethodValid();
        this.balanceInfo = null;
        this.paymentInfos = [];
        const payments = [];
        this.isPaymentInfoLoading = true;
        this._providerService.onItemLoading.next(true);
        const queryRef =  this.db.collection(COLLECTION_PAYMENTS, ref => ref.where('invoiceId', '==', invoice.uid)).get();
        queryRef.subscribe((snapshot) => {
            snapshot.forEach((doc) => {
                const payment = doc.data();
                payments.push(new HLPaymentModel(payment.uid, payment));
            });

            let displayInfo: BalanceInfo = {
                BalancePaid: 0,
                OutstandingBalance: 0
            };

            let paymentInfo: PaymentInfo = {
                payerName: '',
                paidAt: '',
                amount: 0,
                tip: 0,
                isTipAdded: false
            };

            if (payments.length > 0) {
                let balancePaid = 0;
                let outstandingBalance = 0;
                invoice.payments = payments;
                invoice.payments.forEach((item) => {
                    balancePaid += item.amount;

                    const payer = invoice.payers.find((u) => u.userId == item.payerId);
                    if (payer) {
                        paymentInfo = {
                            payerName: payer.name,
                            paidAt: item.createdAt,
                            amount: item.amount,
                            tip: item.tip,
                            isTipAdded: this.isAddedTip(payer)
                        };
                        this.paymentInfos.push(paymentInfo);
                    }
                });
                outstandingBalance = this.getAmountWithApplicationFee(invoice.amount) - balancePaid;
                displayInfo = {
                    BalancePaid: balancePaid,
                    OutstandingBalance: outstandingBalance
                };
                this.balanceInfo = displayInfo;
            }
            this.isPaymentInfoLoading = false;
            this._providerService.onItemLoading.next(false);
        });
    }

    onShowEditDialog(): void {
        if (this.isLogging || this.balanceInfo) {
            return;
        }
        this._providerService.onSelectedInvoiceChanged.next(this.invoice);
        this._fuseSidebarService.getSidebar('payment-provider-edit-panel').toggleOpen();
    }
    onSubmitInvoice(): void {
        if (this.isLogging){
            return;
        }
        if (!this._providerService.checkPaymentMethodValid()) {
            this._appService.showSnackBar('You have to add a payment method before create an invoice', 'OK');                    
            return;
        }
        const event = {
            title: 'Submit Invoice?',
            msg: 'Are you sure you want to submit this invoice for payment?',
            btn1Name: 'CANCEL',
            btn2Name: 'OK'
        };
        const dialogRef = this._matDialog.open(ConfirmDlgComponent, {
            disableClose: true,
            panelClass: 'confirmDlg',
            data: {event: event}
        });

        dialogRef.afterClosed().subscribe((action: any) => {
            if (action === event.btn2Name) {
                this.isLogging = true;
                this._providerService.createInvoice(this.invoice)
                .then((uid) => {
                    this._providerService.popupInvoiceDraft(this.invoice);
                    // this._providerService.getInvoiceById(uid).then((res) => {
                    //     this._providerService.pushInvoice(res, false);
                    // });
                })
                .catch(() => {
                    this.isLogging = false;
                });
            }
        });
    }
    onShowMarkPaid(): void {
        if (this.isLogging){
            return;
        }
        const event = {
            title: 'Mark Invoice As Paid?',
            msg: 'This means you have received payment outside the app and the horse owner(s) will no longer be able to submit payment through the app.',
            btn1Name: 'CANCEL',
            btn2Name: 'OK'
        };
        const dialogRef = this._matDialog.open(ConfirmDlgComponent, {
            disableClose: true,
            panelClass: 'confirmDlg',
            data: {event: event}
        });

        dialogRef.afterClosed().subscribe((action: any) => {
            if (action === event.btn2Name) {
                this.isLogging = true;
                this._providerService.markInvoiceAsPaid((this.invoice.uid).toString())
                .then(() => {
                    this.isLogging = false;
                })
                .catch(() => {
                    this.isLogging = false;
                });
            }
        });
    }

    onSendReminder(): void {
        if (this.isReminder || this.isLogging){
            return;
        }
        const event = {
            title: 'Request Payment?',
            msg: 'Are you sure you want to request payment for these services? A notification will be sent to the horse trainer(s).',
            btn1Name: 'CANCEL',
            btn2Name: 'OK'
        };
        const dialogRef = this._matDialog.open(ConfirmDlgComponent, {
            disableClose: true,
            panelClass: 'confirmDlg',
            data: {event: event}
        });

        dialogRef.afterClosed().subscribe((action: any) => {
            if (action === event.btn2Name) {
                this.isReminder = true;
                if (!this.invoice.requests[0].horse.trainer && this.invoice.shareInfo) {
                    const userId = this._appService.getCurUser().uid;
                    const horseId = this.invoice.requests[0].horse ? this.invoice.requests[0].horse.uid : '';
                    this._providerService.shareInvoice(userId, horseId, this.invoice.uid.toString(), this.invoice.shareInfo.phone, this.invoice.shareInfo.email)
                    .then(() => {
                        this._appService.showSnackBar('Payment has been requested.', 'OK');
                        this.isReminder = false;
                    })
                    .catch((err) => {
                        this._appService.showSnackBar(err.error.error.message, 'OK');
                        this.isReminder = false;
                    });
                } else {
                    this._providerService.requestPayment(this.invoice.uid)
                    .then((res) => {
                        this._appService.showSnackBar(res.result.message , 'OK');
                        this.isReminder = false;
                    })
                    .catch((err) => {
                        this._appService.showSnackBar(err.error.error.message, 'OK');
                        this.isReminder = false;
                    });
                }
            }
        });
    }

    getAmountWithApplicationFee(amount: number): number {
        return this._appService.getAmountWithApplicationFee(amount);
    }

    isAddedTip(payer): boolean{
        if (!payer || !this.invoice){
            return false;
        }
        if (this.invoice.getPaymentOf(payer)){
            const tip = this.invoice.getPaymentOf(payer).tip;
            if (tip && tip > 0) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        this.invoice = null;
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
}
