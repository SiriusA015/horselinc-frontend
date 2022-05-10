import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { HLInvoiceModel } from 'app/model/invoices';
import { AppService } from 'app/service/app.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { COLLECTION_USERS} from 'app/model/constants';
import { HLServiceRequestModel } from 'app/model/service-requests';
import { HLServiceProviderModel, HLStripeCustomerModel } from 'app/model/users';
import { HLHorseModel } from 'app/model/horses';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class PaymentManagerService implements Resolve<any>
{
    userId: string;
    baseUrl: string;
    shouldOutstandLoadMore = false;
    shouldCompletedLoadMore = false;
    paidInvoices: HLInvoiceModel[];
    payments: HLInvoiceModel[];
    lastInvoiceId: any;
    currentPayment: HLInvoiceModel;
    routeParams: any;
    serviceProviders: HLServiceProviderModel[];
    horses: HLHorseModel[];
    onPaymentsChanged: BehaviorSubject<any>;
    onCurrentPaymentChanged: BehaviorSubject<any>;
    onTagsChanged: BehaviorSubject<any>;
    onNewPaymentClicked: Subject<any>;
    onSearchServiceProviders: Subject<any>;
    onSearchHorses: Subject<any>;
    onSearchServiceProvider: Subject<any>;
    onSearchHorse: Subject<any>;
    onSearchType: Subject<any>;
    onPaidInvoicesChanged: BehaviorSubject<any>;
    onProviderIdChanged: BehaviorSubject<any>;
    onExportPaymentHistoryInit: BehaviorSubject<any>;
    onCurrentPaymentFlagChanged: BehaviorSubject<any>;
    onLoading: BehaviorSubject<any>;
    onItemLoading: BehaviorSubject<any>;
    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     * @param {Location} _location
     */
    constructor(
        private _httpClient: HttpClient,
        private _location: Location,
        private _appService: AppService,
        private db: AngularFirestore,
        private _progressBarService: FuseProgressBarService,
    )
    {
        this.paidInvoices = [];
        this.payments = [];
        this.serviceProviders = [];
        this.onPaymentsChanged = new BehaviorSubject([]);
        this.onCurrentPaymentChanged = new BehaviorSubject([]);
        this.onTagsChanged = new BehaviorSubject([]);
        this.onPaidInvoicesChanged = new BehaviorSubject([]);
        this.onNewPaymentClicked = new Subject();
        this.onSearchServiceProviders = new Subject();
        this.onSearchServiceProvider = new Subject();
        this.onSearchHorses = new Subject();
        this.onSearchHorse = new Subject();
        this.onSearchType = new Subject();
        this.onProviderIdChanged = new BehaviorSubject([]);
        this.onExportPaymentHistoryInit = new BehaviorSubject([]);
        this.onCurrentPaymentFlagChanged = new BehaviorSubject([]);
        this.onLoading = new BehaviorSubject([]);
        this.onItemLoading = new BehaviorSubject([]);
        this.userId = this._appService.getCurUser().uid;
        this.baseUrl = this._appService.getApiUri();
    }

    /**
     * Resolver
     *
     * @param {ActivatedRouteSnapshot} route
     * @param {RouterStateSnapshot} state
     * @returns {Observable<any> | Promise<any> | any}
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any
    {
        this.routeParams = route.params;
        this.payments = [];
        this.paidInvoices = [];
        this.lastInvoiceId = null;
        this.setCurrentPayment(null, 'OUTSTANDING');
        this.onPaymentsChanged.next(null);
        this.onPaidInvoicesChanged.next(null);
        this.onLoading.next(true);
        this.getInvoices('outstand').then(() => {
            this.onLoading.next(false);
            if (this.payments.length > 0){
                if ( this.routeParams.deeplink && this.routeParams.invoiceId){
                    this.setCurrentPayment(this.routeParams.invoiceId, 'OUTSTANDING', true);
                }
                else {
                    this.setCurrentPayment(this.payments[0].uid, 'OUTSTANDING');
                }
            }
            if (!this.routeParams.deeplink){
                this.onCurrentPaymentFlagChanged.next(false);
            }
        });
        
        return new Promise((resolve, reject) => {
            Promise.all([
            ]).then(
                () => {
                    this.onCurrentPaymentFlagChanged.next(false);
                    resolve();
                },
                reject
            );
        });
    }

    async getInvoices(status: string, isFirst?: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!status) {return; }

            const userId = this._appService.getCurUser().uid;
            let statusList: string[] = [];
            const limit = 10;
            if (status === 'outstand') {
                const len = this.payments.length - 1;
                if (len > -1 && this.lastInvoiceId == this.payments[len].uid) {
                    return;
                }
                if (len > -1) {
                    this.lastInvoiceId = this.payments[len].uid;
                } else {
                    this.lastInvoiceId = null;
                }
                statusList = ['submitted', 'paid'];
            } else if (status === 'completed'){
                const len = this.paidInvoices.length - 1;
                if (len > -1 && this.lastInvoiceId == this.paidInvoices[len].uid) {
                    return;
                }
                if (len > -1) {
                    this.lastInvoiceId = this.paidInvoices[len].uid;
                } else {
                    this.lastInvoiceId = null;
                }
                statusList = ['fullPaid'];
            }
            if (isFirst) {
                this.lastInvoiceId = null;
            }
            const datas = {
                data: {
                    userId: userId,
                    statuses: statusList,
                    limit: limit,
                    lastInvoiceId: this.lastInvoiceId
                }
            };
            this._httpClient.post(this.baseUrl + '/searchInvoices', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    const invoiceList = response.result ? response.result : [];
                    let invoice: any;
                    if (isFirst) {
                        if (status == 'outstand') {
                            this.payments = [];
                        } else {
                            this.paidInvoices = [];
                        }
                    }
                    invoiceList.forEach(doc => {
                        const requests: HLServiceRequestModel[] = [];
                        if (doc.status == 'submitted' || doc.status == 'paid') {
                            doc.requests.forEach(item => {
                                requests.push(new HLServiceRequestModel(item.uid, item));
                            });
                            invoice = {
                                ...doc,
                                requests: requests
                            };
                            const invoiceCard = new HLInvoiceModel(doc.uid, invoice);

                            if (invoiceCard.payers) {
                                invoiceCard.payers.forEach((payer) => {
                                    if (!payer.customer){
                                        this.getCardInfo(payer.userId)
                                        .then((res) => {
                                            if (res) {
                                                payer.customer = new HLStripeCustomerModel(res);
                                            }
                                        });
                                    }
                                });
                            }
                            this.payments.push(invoiceCard);
                        } else {
                            doc.requests.forEach(item => {
                                requests.push(new HLServiceRequestModel(item.uid, item));
                            });
                            invoice = {
                                ...doc,
                                requests: requests
                            };
                            this.paidInvoices.push(new HLInvoiceModel(doc.uid, invoice));
                        }
                    });
                    if (status == 'outstand') {
                        (invoiceList.length < limit) ? this.shouldOutstandLoadMore = false : this.shouldOutstandLoadMore = true;
                        this.onPaymentsChanged.next(this.payments);
                        this.onCurrentPaymentFlagChanged.next(false);
                    } else if (status == 'completed'){
                        (invoiceList.length < limit) ? this.shouldCompletedLoadMore = false : this.shouldCompletedLoadMore = true;
                        this.onPaidInvoicesChanged.next(this.paidInvoices);
                        this.onCurrentPaymentFlagChanged.next(false);
                    }
                    resolve();
                }, reject);
        });
    }

    /**
     * Set current payment by id
     *
     * @param id
     */
    setCurrentPayment(uid, type, isDeepLink?): void
    {
        let invoices: any;

        if (type == 'OUTSTANDING') {
            invoices = this.payments;
        }
        else {
            invoices = this.paidInvoices;
        }

        if (uid){
            this.currentPayment = invoices.find(payment => {
                return payment.uid == uid;
            });
        } else {
            this.currentPayment = null;
        }

        this.onCurrentPaymentChanged.next(this.currentPayment);
        if (isDeepLink) {
            this.onCurrentPaymentFlagChanged.next(true);
        }
        
        this._location.go('manager/payments/' + uid);
    }

    async submitPayment(datas): Promise<any> {
        const body = {
            data: {
                invoiceId: datas.invoiceId,
                payerId: datas.payerId,
                paymentApproverId: datas.paymentApproverId,
                payerPaymentSourceId: datas.payerPaymentSourceId,
                tip: datas.addTip
            }
        };

        this._progressBarService.beginLoading2();
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/submitInvoicePayment', JSON.stringify(body), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    resolve(response);
                    this._progressBarService.endLoading2();
                }, reject);
        });
    }

    async requestApproval(data): Promise<any> {
        const datas = {
            data: {
                userId: data.approverId,
                ownerId: data.ownerId,
                amount: data.amount
            }
        };
        
        this._progressBarService.beginLoading2();
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/requestPaymentApproval', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    resolve(response);
                    this._progressBarService.endLoading2();
                }, reject);
        });
    }

    async exportInvoicePayment(data): Promise<any> {
        this.userId = this._appService.getCurUser().uid;
        const datas = {
            data: {
                userId: this.userId,
                startDate: data.startDate,
                endDate: data.endDate,
                status: data.status,
                horseIds: data.horseIds,
                serviceProviderIds: data.serviceProviderIds
            }
        };

        this._progressBarService.beginLoading2();

        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/exportInvoices', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    resolve(response);

                    this._progressBarService.endLoading2();
                }, reject);
        });
    }

    // functions related to add service provider
    async searchServiceProviders(query): Promise<any>{

        const datas = {
            data: {
                query: query,
                limit: '',      
                excludeIds: []
            }
        };

        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchServiceProviders', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    this.serviceProviders = response.result ?  response.result : [];
                    this.onSearchServiceProviders.next(this.serviceProviders);
                    resolve(this.serviceProviders);
                }, reject);
        });
    }

    // functions related to add horse
    async searchHorses(query, providerId): Promise<any>{

        const datas = {
            data: {
                userId: providerId,
                query: query,
                limit: 20,
                lastHorseId: ''
            }
        };
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchHorses', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    this.horses = response.result ?  response.result : [];
                    this.onSearchHorses.next(this.horses);
                    resolve(this.horses);
                }, reject);
        });
    }

    setSearchServiceProvider(serviceProvider: any): void {
        if (serviceProvider) {
            this.onSearchServiceProvider.next(serviceProvider);
        }
    }

    setSearchHorse(horse: any): void {
        if (horse) {
            this.onSearchHorse.next(horse);
        }
    }

    setSearchType(filter: string): void {
        if (filter) {
            this.onSearchType.next(filter);
        } 
    }

    getCardInfo(uid: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const queryRef = this.db.collection(COLLECTION_USERS, ref => ref.where('uid', '==', uid)).get();
            queryRef.subscribe((snapshot) => {
                let customer: any;
                snapshot.forEach((doc) => {
                    if (doc.data().horseManager) {
                        customer = doc.data().horseManager.customer;
                    }
                });
                // this.onSearchHorses.next(this.horses);
                resolve(customer);
            }, reject);
        });
    }

    getInvoiceById(uid): Promise<any> {
        if (!uid) {return; }

        const datas = {
            data: {
                invoiceIds : [uid]
            }
        };
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/getInvoices', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    const invoices = response.result ?  response.result : [];
                    const invoiceId = invoices[0].uid;
                    const data = new HLInvoiceModel(invoiceId, invoices[0]);
                    resolve(data);
                }, reject);
            });
    }

    pushPaidInvoice(invoice: HLInvoiceModel): void {
        if (invoice) {
            this.paidInvoices.unshift(invoice);
            this.onPaidInvoicesChanged.next(this.paidInvoices);
        }
    }

    pushPayment(invoice: HLInvoiceModel): void {
        if (invoice) {
            this.payments.unshift(invoice);
            this.onPaymentsChanged.next(this.payments);
        }
    }

    paymentSubmitSuccess(invoiceId): void {
        if (!invoiceId) {
            return;
        }
        const idx = this.payments.findIndex(payment => payment.uid == invoiceId);
        if (idx > -1) {
            this.getInvoiceById(invoiceId).then((res) => {
                this.payments.splice(idx, 1);
                if (res && res.status != 'fullPaid'){
                    this.pushPayment(res);
                }
                if (this.payments && this.payments.length > 0) {
                    this.setCurrentPayment(this.payments[0].uid, 'OUTSTANDING');
                    this.onCurrentPaymentFlagChanged.next(false);
                } else {
                    this.setCurrentPayment(null, 'OUTSTANDING');
                    this.onCurrentPaymentFlagChanged.next(false);
                }
            }).catch(() => {
                
            });
        }
    }

    async requestPayment(invoiceId: number): Promise<any> {
        if (invoiceId < 0){
            return;
        }
        const datas = {
            data: {
                invoiceId: invoiceId.toString()
            }
        };
        this._progressBarService.beginLoading2();
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/requestPayment', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    resolve(response);
                    this._progressBarService.endLoading2();
                }, reject);
        });
    }
}
