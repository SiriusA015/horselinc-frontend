import {HLServiceRequestModel} from './service-requests';
import {HLInvoiceStatus} from './enumerations';
import {HLHorseManagerModel, HLHorseManagerPaymentApproverModel, HLListenerUserModel, HLBaseUserModel} from './users';
import * as moment from 'moment';
import { HLPaymentModel } from './payments';
import { AppService } from 'app/service/app.service';

export class HLInvoiceModel {
    uid: number;
    name: string;
    requestIds: string[];
    requests?: HLServiceRequestModel[]; // no need to upload
    payers?: HLHorseManagerModel[]; // no need to upload
    paymentApprovers?: HLHorseManagerPaymentApproverModel[]; // no need to upload
    amount: number; // no need to upload
    payments: HLPaymentModel[];
    status: HLInvoiceStatus;
    listenerUsers?: HLListenerUserModel[];
    shareInfo: HLInvoiceShareInfo;
    paidAt?: string;
    createdAt: string;
    updatedAt: string;
    paidPayment: HLPaymentModel;
    isPaymentRequesting: boolean;

    constructor(uid: number, data: any) {
        this.uid = uid;
        this.name = data.name || '';
        this.requestIds = data.requestIds || [];
        this.requests = data.requests || [];
        this.payers = data.payers || [];
        this.amount = data.amount || 0;
        this.status = data.status || null;
        this.payments = data.payments || [];
        this.paymentApprovers = data.paymentApprovers || [];
        this.paidPayment = data.paidPayment || null;
        this.listenerUsers = data.listenerUsers;
        this.shareInfo = data.shareInfo || null;
        this.isPaymentRequesting = false;

        if (data.updatedAt) {
            this.updatedAt = moment(new Date(data.updatedAt)).format('MM/DD/YYYY h:mm A');
        } else {
            this.updatedAt = moment(new Date()).format('MM/DD/YYYY h:mm A');
        }
        if (data.createdAt) {
            this.createdAt = moment(new Date(data.createdAt)).format('MM/DD/YYYY h:mm A');
        } else {
            this.createdAt = moment(new Date()).format('MM/DD/YYYY h:mm A');
        }
        if (data.paidAt) {
            this.paidAt = moment(new Date(data.paidAt)).format('MM/DD/YYYY');
        } else {
            this.paidAt = moment(new Date()).format('MM/DD/YYYY');
        }
    }

    toJSON(): any {
        const dicObject = Object.assign({}, this, {
            requests: this.requests ? this.requests.map(value => value.toJSON()) : undefined,
            payers: this.payers ? this.payers.map(value => value.toJSON()) : undefined,
            paymentApprovers: this.paymentApprovers ? this.paymentApprovers.map(value => value.toJSON()) : undefined,
            paidAt: this.paidAt ? moment(this.paidAt).get('second') : undefined,
            createdAt: moment(this.createdAt).get('second')
        });
        return JSON.parse(JSON.stringify(dicObject));
    }

    getPayerAmount(payer: HLHorseManagerModel): number {
        return this.amount * payer.percentage / 100;
    }

    getPaymentOf(payer: HLHorseManagerModel): HLPaymentModel {
        if (this.payments == null) {
            return null;
        }
        if (this.payments){
            let i = 0;
            for (i = 0; i < this.payments.length; i++){
                if (this.payments[i].payerId === payer.userId) {
                    this.paidPayment = this.payments[i];
                    return this.payments[i];
                }
            }
        }
        return null;
    }

    isPaymentApprover(userId: string): boolean {
        if (this.paymentApprovers && this.paymentApprovers.length > 0){
            let approver: any = null;
            approver = this.paymentApprovers.find((item) => {
                return item.userId === userId;
            });

            if (approver){
                return true;
            }
        }
        return false;
    }

    isPayableBehalfOf(payer: HLHorseManagerModel, userId: string): boolean {
        const managerId: string = userId;
        if (this.paymentApprovers == null || this.paymentApprovers.length < 1 || managerId == null) {
            return false;
        }

        let approver: any = null;
        if (this.paymentApprovers) {

            approver = this.paymentApprovers.find((item) => {
                return item.userId === userId && item.creatorId === payer.userId;
            });
        }

        if (!approver){
            return false;
        }

        const amount = approver.amount;

        if (!amount){
            return true;
        } 
        
        if (this.getPayerAmount(payer) <= amount){
            return true;
        } else {
            return false;
        }
    }

    getApprovalAmountFor(payer: HLHorseManagerModel, userId: string): number {
        const managerId = userId;
        if (this.paymentApprovers == null && managerId == null) {
            return null;
        }
        let paymentApprover: any = null;
        if (this.paymentApprovers) {
            paymentApprover = this.paymentApprovers.find((item) => {
                // return item.userId === userId && item.creatorId === payer.userId;
                return item.creatorId === payer.userId;
            });
        }
        if ( !paymentApprover ){
            return null;
        } 

        return paymentApprover.amount ? paymentApprover.amount : 0;
    }

    isPayer(payerId: string, userId: string): boolean {
        if (userId != null){
            return userId === payerId;
        }
        else{
            return false;
        } 
    }

    hasPaidBy(payer: HLHorseManagerModel): boolean{

        this.paidPayment = this.getPaymentOf(payer);

        if (this.paidPayment) {
            return true;
        } else {
            return false;
        }
    }

    amountTotalTip(): number{
        let totalTip = 0;
        if (this.payments && this.payments.length > 0){
            let i = 0;
            for (i = 0; i < this.payments.length; i++){
                totalTip += this.payments[i].tip;
            }
        }
        return totalTip;
    }
}

export class HLInvoiceShareInfo {
    name: string;
    phone: string;
    email: string;

    constructor(data: any) {
        this.name = data.name || null;
        this.phone = data.phone || null;
        this.email = data.email || null;
    }

    toJSON(): {} {
        const dicObject = Object.assign({}, this);
        return JSON.parse(JSON.stringify(dicObject));
    }
}
