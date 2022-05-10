import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { HLInvoiceModel, HLInvoiceShareInfo } from 'app/model/invoices';
import { AppService } from 'app/service/app.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { HLServiceRequestStatus } from 'app/model/enumerations';
import { COLLECTION_SERVICE_REQUESTS, COLLECTION_INVOICES} from 'app/model/constants';
import { HLServiceRequestModel, HLServiceShowModel } from 'app/model/service-requests';
import { HLHorseManagerModel } from 'app/model/users';
import { HLServiceProviderServiceModel } from 'app/model/users';
import { HLHorseModel } from 'app/model/horses';
import { COLLECTION_SERVICE_PROVIDER_SERVICES, COLLECTION_SERVICE_SHOWS } from 'app/model/constants';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { HLInvoiceStatus, HLUserType, HLPlatformType } from 'app/model/enumerations';
import { HLPhoneContactModel } from 'app/model/phoneContact';

@Injectable()
export class PaymentProviderService implements Resolve<any>{

    userId: string;

    submittedInvoices: HLInvoiceModel[];
    paidInvoices: HLInvoiceModel[];
    draftInvoices: HLInvoiceModel[];

    requestList: HLServiceRequestModel[] = [];
    baseUrl = '';
    lastRequestId: any;
    lastInvoiceId: any;
    shouldDraftLoadMore = false;
    shouldSubmittedLoadMore = false;
    shouldPaidLoadMore = false;

    currentInvoice: HLInvoiceModel;
    routeParams: any;
    tags: any[];
    horseManagers: HLHorseManagerModel[];
    horses: HLHorseModel[];

    onServiceProviderServices: BehaviorSubject<any>;
    onDraftInvoicesChanged: BehaviorSubject<any>;
    onSubmittedInvoicesChanged: BehaviorSubject<any>;
    onPaidInvoicesChanged: BehaviorSubject<any>;
    onCurrentInvoiceChanged: BehaviorSubject<any>;
    onTagsChanged: BehaviorSubject<any>;
    onSelectedInvoiceChanged: BehaviorSubject<any>;
    onCurrentShowsChange: BehaviorSubject<any>;
    onCreateDlgInitEv: BehaviorSubject<any>;
    onSearchServiceProvider: Subject<any>;
    onSearchHorse: Subject<any>;
    onExportPaymentHistoryInit: BehaviorSubject<any>;
    onProviderIdChanged: BehaviorSubject<any>;
    onSearchType: Subject<any>;
    onSearchServiceProviders: Subject<any>;
    onSearchHorses: Subject<any>;
    onInvoiceConfirm: BehaviorSubject<any>;
    onCurrentPaymentFlagChanged: BehaviorSubject<any>;
    onItemLoading: BehaviorSubject<any>;
    onLoadingFirst: BehaviorSubject<any>;
    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     * @param {Location} _location
     */

    constructor(
        private db: AngularFirestore,
        private _httpClient: HttpClient,
        private _location: Location,
        private _appService: AppService,
        private _progressBarService: FuseProgressBarService,
    ) {
        // Set the defaults
        this.draftInvoices = [];
        this.submittedInvoices = [];
        this.paidInvoices = [];
        this.horseManagers = [];
        this.horses = [];

        this.onDraftInvoicesChanged = new BehaviorSubject([]);
        this.onSubmittedInvoicesChanged = new BehaviorSubject([]);
        this.onPaidInvoicesChanged = new BehaviorSubject([]);
        this.onCurrentInvoiceChanged = new BehaviorSubject([]);
        this.onTagsChanged = new BehaviorSubject([]);
        this.onServiceProviderServices = new BehaviorSubject([]);
        this.onSelectedInvoiceChanged = new BehaviorSubject([]);
        this.onCurrentShowsChange = new BehaviorSubject([]);
        this.onCreateDlgInitEv = new BehaviorSubject([]);
        this.onSearchServiceProvider = new Subject();
        this.onSearchHorse = new Subject();
        this.onExportPaymentHistoryInit = new BehaviorSubject([]);
        this.onProviderIdChanged = new BehaviorSubject([]);
        this.onSearchType = new Subject();
        this.onSearchServiceProviders = new Subject();
        this.onSearchHorses = new Subject();
        this.onInvoiceConfirm = new BehaviorSubject([]);
        this.onCurrentPaymentFlagChanged = new BehaviorSubject([]);
        this.onItemLoading = new BehaviorSubject([]);
        this.onLoadingFirst = new BehaviorSubject([]);
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
        this.draftInvoices = [];
        this.submittedInvoices = [];
        this.paidInvoices = [];
        this.requestList = [];
        this.onCurrentInvoiceChanged.next(null);
        this.onDraftInvoicesChanged.next([]);
        this.onSubmittedInvoicesChanged.next([]);
        this.onPaidInvoicesChanged.next([]);
        
        this.getServiceProviderService();
        this.onLoadingFirst.next(true);
        
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

            if (status == 'submitted'){
                const len = this.submittedInvoices.length - 1;
                if (len > -1 && this.lastInvoiceId == this.submittedInvoices[len].uid) {
                    return;
                }
                if (len > -1) {
                    this.lastInvoiceId = this.submittedInvoices[len].uid;
                } else {
                    this.lastInvoiceId = null;
                }
                statusList = ['submitted', 'paid'];
            } else if (status == 'paid'){
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
            this.userId = this._appService.getCurUser().uid;
            const datas = {
                data: {
                    userId: this.userId,
                    statuses: statusList,
                    limit: limit,
                    lastInvoiceId: this.lastInvoiceId
                }
            };

            this._httpClient.post(this.baseUrl + '/searchInvoices', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    const invoiceList = response.result;
                    let invoice: any;
                    if (isFirst) {
                        if (status == 'submitted') {
                            this.submittedInvoices = [];
                        } else {
                            this.paidInvoices = [];
                        }
                    }
                    invoiceList.forEach(doc => {
                        let requests: HLServiceRequestModel[];
                        requests = [];
                        let shareInfo: HLInvoiceShareInfo = null;
                        if (doc.status == 'submitted' || doc.status == 'paid') {
                            doc.requests.forEach(item => {
                                requests.push(new HLServiceRequestModel(item.uid, item));
                            });
                            invoice = {
                                ...doc,
                                requests: requests
                            };
                            if (doc.shareInfo){
                                shareInfo = new HLInvoiceShareInfo(doc.shareInfo);
                                invoice = {
                                    ...invoice,
                                    shareInfo: shareInfo
                                };
                            }
                            
                            this.submittedInvoices.push(new HLInvoiceModel(doc.uid, invoice));
                        } else {
                            doc.requests.forEach(item => {
                                requests.push(new HLServiceRequestModel(item.uid, item));
                            });
                            invoice = {
                                ...doc,
                                requests: requests
                            };
                            if (doc.shareInfo){
                                shareInfo = new HLInvoiceShareInfo(doc.shareInfo);
                                invoice = {
                                    ...invoice,
                                    shareInfo: shareInfo
                                };
                            }
                            this.paidInvoices.push(new HLInvoiceModel(doc.uid, invoice));
                        }
                    });
                    if (status == 'submitted'){
                        (invoiceList.length < limit) ? this.shouldSubmittedLoadMore = false : this.shouldSubmittedLoadMore = true;
                        this.onSubmittedInvoicesChanged.next(this.submittedInvoices);
                    } else if (status == 'paid'){
                        (invoiceList.length < limit) ? this.shouldPaidLoadMore = false : this.shouldPaidLoadMore = true;
                        this.onPaidInvoicesChanged.next(this.paidInvoices);
                    }
                    resolve();
                }, reject);
        });
    }

    /**
     * Get providers by params
     *
     * @param handle
     * @returns {Promise<Provider[]>}
     */
    getDraftInvoices(isFirst?: boolean): Promise<HLInvoiceModel[]>
    {
        this.userId = this._appService.getCurUser().uid;
        const limit = 10;
        return new Promise((resolve, reject) => {
            const len = this.requestList.length - 1;
            if (len < 0) {
                this.lastRequestId = null;
            } else {
                if (this.requestList[len].uid == this.lastRequestId){
                    return;
                }
                this.lastRequestId = this.requestList[len].uid;
            }
            if (isFirst) {
                this.lastRequestId = null;
            }
            const datas = {
                data: {
                    serviceProviderId: this.userId,
                    statuses: ['completed'],
                    limit: limit,
                    lastRequestId: this.lastRequestId
                }
            };

            this._httpClient.post(this.baseUrl + '/searchServiceRequests', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    const requestList = response.result ?  response.result : [];
                    if (isFirst) {
                        this.draftInvoices = [];
                    }
                    requestList.forEach(doc => {
                        const draftRequest = new HLServiceRequestModel(doc.uid, doc);
                        this.requestList.push(draftRequest);
                        this.makeInvoiceDraft(draftRequest);
                    });
                    (requestList.length < limit) ? this.shouldDraftLoadMore = false : this.shouldDraftLoadMore = true;
                    this.getAmountOfInvoiceDrafts();
                    this.onDraftInvoicesChanged.next(this.draftInvoices);
                    resolve(this.draftInvoices);
                }, reject);
        });
    }

    makeInvoiceDraft( request: HLServiceRequestModel, isInsert?: boolean ): void {
        const uid = 0;
        let invoice: any;

        let payer = null;
        if (request.payer) {
            payer = request.payer;
        }

        let name = '';
        // if (request.shareInfo){
        //     name = request.horseBarnName ? request.horseBarnName : '' ;
        // } else {
        name = request.serviceProvider ? request.serviceProvider.name : '' ;
        // }
        
        if (this.draftInvoices.length < 1){
            invoice = {
                name: name,
                createdAt : request.createdAt,
                requestIds: [request.uid],
                amount: 0.0,
                payers: [payer],
                requests: [request],
                shareInfo: request.shareInfo ? request.shareInfo : null
            };
            const inv = new HLInvoiceModel(uid, invoice);
            if (isInsert){
                this.draftInvoices.unshift(inv);
            } else {
                this.draftInvoices.push(inv);
            }
            
        } else {
            let flag = false;
            this.draftInvoices.forEach(doc => {
                if (doc.payers != null && doc.payers[0] != null && request.payer != null && doc.payers.length > 0) {
                    if (doc.payers[0].userId == request.payer.userId){
                        doc.requests.push(request);
                        doc.requestIds.push(request.uid);
                        if (doc.createdAt < request.createdAt){
                            doc.createdAt = request.createdAt;
                        }
                        flag = true;
                    }
                }
            });
            if (!flag) {
                invoice = {
                    name: name,
                    createdAt : request.createdAt, // moment(new Date()).format('MM/DD/YYYY'),
                    requestIds: [request.uid],
                    payers: [payer],
                    amount: 0.0,
                    requests: [request],
                    shareInfo: request.shareInfo ? request.shareInfo : null
                };
                const inv = new HLInvoiceModel(this.draftInvoices.length, invoice);
                if (isInsert){
                    this.draftInvoices.unshift(inv);
                } else {
                    this.draftInvoices.push(inv);
                }
            }
        }
    }

    getAmountOfInvoiceDrafts(): void {
        this.draftInvoices.forEach(doc => {
            let totalAmount = 0;
            if (doc.requestIds && doc.requestIds.length > 0) {
                for (const request of doc.requests) {
                    let amount = 0;
                    request.services.forEach(service => {
                        amount += service.quantity * service.rate;
                    });
                    totalAmount += amount;
                }
            }
            doc.amount = totalAmount;
        });
    }

    getServiceProviderService(): Promise<any>{
        this.userId = this._appService.getCurUser().uid;
        let serviceProviderServices;
        serviceProviderServices = [];
        return new Promise(async (resolve, reject) => {
            if (this.userId != null && this.userId !== '') {                
                const queryRef =  this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES, ref => ref.where('userId', '==', this.userId)).get();
                queryRef.subscribe((snapshot) => {
                    snapshot.forEach((doc) => {
                        const service = {
                            ...doc.data()
                        };                                 
                        serviceProviderServices.push(new HLServiceProviderServiceModel(doc.id, service));
                    });    
                    this.onServiceProviderServices.next(serviceProviderServices);
                    resolve(serviceProviderServices);                    
                }, reject);                
            } 
        });

    }

    /**
     * Set current provider by id
     *
     * @param id
     */
    setCurrentInvoice(uid, type): void
    {
        let invoices;
        
        if (type == 'DRAFT'){
            invoices = this.draftInvoices;
        } 
        else if (type == 'SUBMITTED') {
            invoices = this.submittedInvoices;
        }
        else {
            invoices = this.paidInvoices;
        }

        this.currentInvoice = invoices.find(provider => {
            return provider.uid == uid;
        });
        this.onCurrentInvoiceChanged.next(this.currentInvoice);
        
        this._location.go('provider/payments/' + uid);
    }

    async getHosreList(searchTxt): Promise<any> {
        this.userId = this._appService.getCurUser().uid;
        const datas = {
            data: {
                userId: this.userId,
                query: searchTxt,
                lastHorseId: '',
                limit: 20
            }
        };

        let searchResult: HLHorseModel[];
        searchResult = [];
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchHorses', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    const HosreList = response.result;
                    HosreList.forEach(doc => {
                        searchResult.push(new HLHorseModel(doc.uid, doc));
                    });
                    resolve(searchResult);
                }, reject);
        });
    }

    /**
     * Create request
     *
     * @param requestForm
     * @returns {Promise<any>}
     */
    async createRequest(requestForm, selectedContact): Promise<any> {
        let shareInfo: HLInvoiceShareInfo = null;
        if (selectedContact) {
            const data = {
                name: selectedContact.name,
                phone: selectedContact.phoneNumbers ? selectedContact.phoneNumbers[0] : null,
                email: selectedContact.emails ? selectedContact.emails[0] : null
            };
            shareInfo = new HLInvoiceShareInfo(data);
        }

        const newRequest = {
            shareInfo: shareInfo ? shareInfo.toJSON() : null,
            requestDate: new Date(requestForm.requestDate).getTime(),
            competitionClass: requestForm.competitionClass,
            horseBarnName: requestForm.horseBarnName,
            horseDisplayName: requestForm.horseDisplayName,
            horseId: requestForm.horseId,
            showId: requestForm.showId,
            instruction: requestForm.instruction,            
            providerNote: requestForm.providerNote,            
            isCustomRequest: requestForm.isCustomRequest == true ? true : false,
            isDeletedFromInvoice: requestForm.isDeletedFromInvoice == 'true' ? true : false,
            dismissedBy: requestForm.dismissedBy,
            status: requestForm.status,
            creatorId: requestForm.creatorId,
            serviceProviderId: requestForm.serviceProviderId,            
            assignerId: requestForm.assignerId,
            services: requestForm.services,
            updatedAt: Date.now(),
            createdAt : Date.now()
        };
        this._progressBarService.beginLoading2();
        
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_SERVICE_REQUESTS);
            collectionRef
                .add(newRequest)
                .then(docRef => {
                    const invRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(docRef.id);
                    invRef.set({uid: docRef.id}, {merge: true});
                    resolve(docRef.id);
                    this._progressBarService.endLoading2();
                })
                .catch( error => {
                    reject();
                });
        });
    }

    async submitInvoiceDraft(request): Promise<any> {

        if (!request){
            return;
        }

        this._progressBarService.beginLoading2();

        return new Promise((resolve, reject) => {
                const collectionRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(request.uid);
                collectionRef
                .set({ status: HLServiceRequestStatus.invoiced}, {merge: true})
                .then(() => {
                    request.status = HLServiceRequestStatus.invoiced;
                    resolve(request);
                    this._progressBarService.endLoading2();
                })
                .catch( error => {
                });
            });
    }

    createInvoice(invoice: HLInvoiceModel): Promise<any> {    
        this.userId = this._appService.getCurUser().uid;
        
        const newInvoice = {                    
            // uid: invoiceForm.uid,
            shareInfo: invoice.shareInfo ? invoice.shareInfo : null,
            name:   invoice.name,
            requestIds: invoice.requestIds,
            status: HLInvoiceStatus.submitted,
            paidAt: new Date(invoice.paidAt).getTime(),
            updatedAt: Date.now(),
            createdAt : Date.now()
        };

        this._progressBarService.beginLoading2();

        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_INVOICES);
            collectionRef
                .add(newInvoice)
                .then(docRef => {
                    // added uid field
                    const invRef = this.db.collection(COLLECTION_INVOICES).doc(docRef.id);
                    invRef.set({uid: docRef.id}, {merge: true})
                    .then(() =>  {
                        if (!invoice.requests[0].horse.trainer && invoice.shareInfo){
                            const email = (invoice.shareInfo.email && invoice.shareInfo.email != '') ? invoice.shareInfo.email : null;
                            const phone = (invoice.shareInfo.phone && invoice.shareInfo.phone != '') ? invoice.shareInfo.phone : null;
                            const horseId = (invoice.requests[0] && invoice.requests[0].horseId && invoice.requests[0].horseId != '') ? invoice.requests[0].horseId : null;
                            this.shareInvoice(this.userId, horseId, docRef.id, phone, email).then(() => {
                                this._appService.showSnackBar('Invoice submitted', 'OK');
                            })
                            .catch((err) => {
                                this._appService.showSnackBar(err.error.error.message, 'OK');
                            });
                            resolve(docRef.id);
                        }else {
                            this._appService.showSnackBar('Invoice submitted', 'OK');
                            this._progressBarService.endLoading2();
                            resolve(docRef.id);
                        }
                    });
                })
                .catch( error => {
                    reject();
                });
        });
    }

    createInvoiceById(invoiceForm, selectedContact: HLPhoneContactModel): Promise<any> {
        let shareInfo: HLInvoiceShareInfo = null;
        if (selectedContact) {
            const data = {
                name: selectedContact.name,
                phone: selectedContact.phoneNumbers ? selectedContact.phoneNumbers[0] : null,
                email: selectedContact.emails ? selectedContact.emails[0] : null
            };
            shareInfo = new HLInvoiceShareInfo(data);
        }

        const newInvoice = {
            shareInfo: shareInfo ? shareInfo.toJSON() : null,
            name:   invoiceForm.horseBarnName,
            requestIds: invoiceForm.requestIds,
            status: HLInvoiceStatus.submitted,
            paidAt: Date.now(),
            updatedAt: Date.now(),
            createdAt : Date.now(),
        };

        this._progressBarService.beginLoading2();

        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_INVOICES);
            collectionRef
                .add(newInvoice)
                .then(docRef => {
                    // added uid field
                    const invRef = this.db.collection(COLLECTION_INVOICES).doc(docRef.id);
                    invRef.set({uid: docRef.id}, {merge: true})
                    .then(() =>  {
                        if (shareInfo){
                            const email = (shareInfo.email && shareInfo.email != '') ? shareInfo.email : null;
                            const phone = (shareInfo.phone && shareInfo.phone != '') ? shareInfo.phone : null;
                            const horseId = (invoiceForm.horseId && invoiceForm.horseId != '') ? invoiceForm.horseId : null;
                            this.shareInvoice(this.userId, horseId, docRef.id, phone, email).then(() => {
                                this._appService.showSnackBar('Invoice submitted', 'OK');
                            })
                            .catch((err) => {
                                this._appService.showSnackBar(err.error.error.message, 'OK');
                            });
                        }else {
                            this._appService.showSnackBar('Invoice submitted', 'OK');
                        }
                        resolve(docRef.id);
                        this._progressBarService.endLoading2();
                    });
                })
                .catch( error => {
                    reject();
                });
        });
    }

    updateInvoice(updatedData): Promise<any> {
        if (!updatedData) {
            return;
        }

        this._progressBarService.beginLoading2();
        return new Promise((resolve, reject) => {            
            const docRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(updatedData.uid);
            docRef.set({
                requestDate: updatedData.requestDate,
                services: updatedData.services
            }, {
                merge: true
            })
            .then(() =>  {
                resolve(docRef);
                this._progressBarService.endLoading2();

            }).catch( error => {
                reject();
            });
        });
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

    async requestPaymentSubmission(invoice: HLInvoiceModel): Promise<any> {
        this.userId = this._appService.getCurUser().uid;
        // return;
        const datas = {
            data: {
                assignerId:  this.userId,
                serviceProviderId: invoice.payers[0].userId,  
                requestIds: invoice.requestIds
            }
        };

        this._progressBarService.beginLoading2();
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/requestPaymentSubmission', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    resolve(response);
                    this._progressBarService.endLoading2();
                }, reject);
        });
    }

    async markInvoiceAsPaid(invoiceId: string): Promise<any> {
        this.userId = this._appService.getCurUser().uid;
        const datas = {
            data: {
                serviceProviderId: this.userId,
                invoiceId: invoiceId
            }
        };

        this._progressBarService.beginLoading2();
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/markInvoiceAsPaid', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    this.getInvoiceById(invoiceId).then((res) => {
                        this.pushInvoice(res, true);
                        this._appService.showSnackBar('Your invoice has been marked as paid', 'OK');
                        resolve();
                        this._progressBarService.endLoading2();
                    });
                }, reject);
        });
    }

    async deleteInvoice(id: string): Promise<any> {        
        if (!id) {
            return;
        }
        this._progressBarService.beginLoading2();
        return new Promise((resolve, reject) => {
                const collectionRef = this.db.collection(COLLECTION_INVOICES).doc(id);
                collectionRef
                .delete()
                .then(docRef => {
                    resolve();
                    this._progressBarService.endLoading2();
                })
                .catch( error => {
                    reject();
                });
            });
    }

    async deleteInvoiceDraft(id: string): Promise<any> {        
        if (!id) {
            return;
        }
        this._progressBarService.beginLoading2();
        return new Promise((resolve, reject) => {
                const collectionRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(id);
                collectionRef
                .update({
                    status: HLServiceRequestStatus.deleted,
                    updatedAt: new Date().getTime()
                })
                .then(docRef => {
                    resolve();
                    this._progressBarService.endLoading2();
                })
                .catch( error => {
                    reject();
                });
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
                horseManagerIds: data.horseManagerIds
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

    setSearchType(filter: string): void {
        if (filter) {
            this.onSearchType.next(filter);
        } 
    }

    setSearchServiceProvider(serviceProvider: any): void {
        if (serviceProvider) {
            this.onSearchServiceProvider.next(serviceProvider);
        }
    }

    setSearchHorse(horse: any): void {
        if (horse){
            this.onSearchHorse.next(horse);
        }
    }

    async searchServiceProviders(query): Promise<any>{

        const datas = {
            data: {
                query: query,
                limit: '20',      
                excludeIds: []
            }
        };

        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchHorseManagers', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    this.horseManagers = response.result ?  response.result : [];
                    // this.serviceProviders = response.result ?  response.result : [];
                    this.onSearchServiceProviders.next(this.horseManagers);
                    resolve(this.horseManagers);
                }, reject);
        });
    }

    async searchHorses(query, managerId): Promise<any>{

        const datas = {
            data: {
                userId: managerId,
                query: query,      
                limit: 20,
                lastHorseId: ''
            }
        };

        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchHorses', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    const horses = response.result ?  response.result : [];
                    this.onSearchHorses.next(horses);
                    resolve(horses);
                }, reject);
        });
    }

    async saveNewShow(showName: string): Promise<any>{
        if (!showName || showName == '') {return; }
        this.userId = this._appService.getCurUser().uid;

        return new Promise((resolve, reject) => {
            // const collectionRef = this.db.collection(COLLECTION_SERVICE_SHOWS);
            const newId = this.db.createId();
            const collectionRef = this.db.collection(COLLECTION_SERVICE_SHOWS).doc(newId);
            const newShow = {                    
                uid: newId,
                name:   showName, 
                createdAt : Date.now(),
            };
            collectionRef
                .set(newShow, {merge: true})
                .then(docRef => {
                    let show: HLServiceShowModel;
                    show = new HLServiceShowModel(newId, newShow);
                    resolve(show);
                })
                .catch( error => {
                    console.error('Error adding invoice: ', error);
                    reject();
                });
                
        });
    }

    async validateShow(showName: string): Promise<any>{
        if (!showName || showName == '') {return; }

        return new Promise((resolve, reject) => {
            const queryRef = this.db.collection(COLLECTION_SERVICE_SHOWS, ref => ref.where('name', '==', showName)).get();
            queryRef.subscribe((snapshot) => {
                resolve(snapshot.size);
            });
        });
    }

    popupInvoiceDraft(invoice: HLInvoiceModel): void {
        const idx = this.draftInvoices.indexOf(invoice);
        this.draftInvoices.splice(idx, 1);
        this.draftInvoices.forEach((item, index) => {
            item.uid = index;
        });
        this.onCurrentInvoiceChanged.next(this.draftInvoices);
        this.onCurrentPaymentFlagChanged.next(false);
    }

    popupInvoice(invoice: HLInvoiceModel): void {
        const idx = this.submittedInvoices.indexOf(invoice);
        this.submittedInvoices.splice(idx, 1);

    }

    pushInvoice(invoice: HLInvoiceModel, isFullPaid: boolean): void {
        if (invoice) {
            if (isFullPaid) {
                // this.paidInvoices.unshift(invoice);
                const idx = this.submittedInvoices.findIndex((item) => item.uid == invoice.uid);
                this.submittedInvoices.splice(idx, 1);
                this.onSubmittedInvoicesChanged.next(this.submittedInvoices);
                this.onCurrentInvoiceChanged.next(null);
            } else {
                this.submittedInvoices.unshift(invoice);
                // this.onSubmittedInvoicesChanged.next(this.submittedInvoices);
                this.onCurrentInvoiceChanged.next(null);
            }
        }
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

    getServiceRequestById(uid): Promise<any> {
        const datas = {
            data: {
                serviceRequestIds : [uid]
            }
        };

        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/getServiceRequests', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    const requests = response.result ?  response.result : [];
                    const requestId = requests[0].uid;
                    const newRequest = new HLServiceRequestModel(requestId, requests[0]);
                    this.makeInvoiceDraft(newRequest, true);
                    this.getAmountOfInvoiceDrafts();
                    resolve();
                }, reject);
        });
    }

    checkPaymentMethodValid(): boolean {
        const user = this._appService.getCurUser();
        if ( !user.type ) { return false; }

        if ( user.type == HLUserType.manager) {
            if ( user.horseManager.customer ) {
                if (user.horseManager.customer.id) {
                    return true;
                } else {
                    return false;
                }
            } else {return false; }
            
        } else {
            if (user.serviceProvider.account) {
                if (user.serviceProvider.account.id) {
                    return true;
                } else {
                    return false;
                }
            } else {return false; }
        }        
    }
    /**
     *  Share Invoice Handler
     */
    async shareInvoice(userId: string, horseId: string, invoiceId: string, phone?: string, email?: string): Promise<any> {
        let datas: any;
        if (phone){
            datas = {
                data: {
                    userId: userId ,
                    userPlatform: HLPlatformType.WEB,
                    horseId: horseId,
                    invoiceId: invoiceId,
                    phone: phone
                }
            };
        }
        if (email) {
            datas = {
                data: {
                    userId: userId ,
                    userPlatform: HLPlatformType.WEB,
                    horseId: horseId,
                    invoiceId: invoiceId,
                    email: email
                }
            };
        }
        return new Promise((resolve, reject) => {
        this._httpClient.post(this.baseUrl + '/shareInvoice', JSON.stringify(datas), this._appService.getHttpOptions())
            .subscribe((response: any) => {
                this._progressBarService.endLoading2();
                resolve();
            }, reject);
        });
    }
}
