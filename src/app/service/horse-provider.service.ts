
import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { HLServiceRequestModel, HLServiceShowModel} from 'app/model/service-requests';
import { UserAuthService } from 'app/service/user-auth.service';
import { HLUserModel } from 'app/model/users';
import { HLServiceProviderServiceModel } from 'app/model/users';
import { COLLECTION_SERVICE_PROVIDER_SERVICES } from 'app/model/constants';
import { COLLECTION_SERVICE_REQUESTS, COLLECTION_SERVICE_SHOWS, COLLECTION_INVOICES } from 'app/model/constants';
import { AppService } from 'app/service/app.service';
import { HLProviderHorseModel } from 'app/model/horses';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { MatSnackBar } from '@angular/material';
import { HLPhoneContactModel } from 'app/model/phoneContact';
import { HLInvoiceShareInfo } from 'app/model/invoices';
import { HLInvoiceStatus, HLPlatformType } from 'app/model/enumerations';
@Injectable()

export class HorseProviderService implements Resolve<any>{

    user: HLUserModel;
    userId: string;
    horses: HLProviderHorseModel[];
    routeParams: any;
    baseUrl: string;
    httpOptions: any;
    currentHorseFlag: boolean;
    onProviderHorsesChanged: BehaviorSubject<any>;
    onSetCurrentProviderHorse: BehaviorSubject<any>;
    onGetProviderHorse: BehaviorSubject<any>;
    onCurrentProviderHorse: BehaviorSubject<any>;
    onSearchOpen: BehaviorSubject<any>;
    onCurrentShowsChange: BehaviorSubject<any>;
    onInvoiceConfirm: BehaviorSubject<any>;
    onCurrentHorseFlagChanged: BehaviorSubject<any>;
    onServiceProviderServices: BehaviorSubject<any>;
    onManagerFlag: BehaviorSubject<any>;
    onchangeNotes: BehaviorSubject<any>;
    onNewNotes: BehaviorSubject<any>;
    onInvoiceCreateHorse:  BehaviorSubject<any>;

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
        private _userAuthService: UserAuthService,
        private _progressBarService: FuseProgressBarService,
        private _matSnackBar: MatSnackBar,   
      
    ) {
        // Set the defaults

        this.onProviderHorsesChanged = new BehaviorSubject([]);
        this.onSetCurrentProviderHorse = new BehaviorSubject([]);
        this.onGetProviderHorse = new BehaviorSubject([]);
        this.onCurrentProviderHorse = new BehaviorSubject([]);
        this.onSearchOpen = new BehaviorSubject([]);
        this.onCurrentShowsChange = new BehaviorSubject([]);
        this.onInvoiceConfirm = new BehaviorSubject([]);
        this.onCurrentHorseFlagChanged = new BehaviorSubject([]);
        this.onServiceProviderServices = new BehaviorSubject([]);
        this.onManagerFlag =  new BehaviorSubject([]);
        this.onchangeNotes =  new BehaviorSubject([]);
        this.onNewNotes = new BehaviorSubject([]);      
        this.onInvoiceCreateHorse =  new BehaviorSubject([]);
    }


    /**
     * Resolver
     *
     * @param {ActivatedRouteSnapshot} route
     * @param {RouterStateSnapshot} state
     * @returns {Observable<any> | Promise<any> | any}
     * 
     * 
     */

     
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any
    {   
        this.baseUrl = this._appService.apiUrl;
        this.httpOptions = this._appService.httpOptions;
        this.user = this._appService.getCurUser();
        this.userId = this.user.uid;
        this.routeParams = route.params;
        
        this.getHorsesForProvider();
        
        // return new Promise((resolve, reject ) => {
            
        //     Promise.all([])
        //         .then(() => { 
        //             resolve();
        //             this._progressBarService.endLoading2();
        //         },
        //         reject
        //     );
        // });
    }
    setCurrentHorseFlag(currentHorseFlag: boolean): void
    {
        this.currentHorseFlag = currentHorseFlag; 
       
        this.onCurrentHorseFlagChanged.next(this.currentHorseFlag);
       
    } 

    getHorsesForProvider(): Promise<any> {
        const datas = {
            data: {
                userId: this.userId, 
                // limit: '',
                // lastHorseId: ''
                }
            };
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchHorses', JSON.stringify(datas), this.httpOptions)
                .subscribe((response: any) => {
                    this.horses = [];
                    this.horses = response.result;
                    if (this.horses.length > 0){
                        this.onProviderHorsesChanged.next(this.horses); 
                        this.onCurrentHorseFlagChanged.next(false);
                    }
                    else
                    {
                        this.onProviderHorsesChanged.next(null);
                        this.onCurrentHorseFlagChanged.next(false); 
                    }
                    resolve(this.horses);
                    this._progressBarService.endLoading2();
                }, reject);
        });

        
    }

    createInvoice(invoiceForm, selectedContact: HLPhoneContactModel ): Promise<any> {        
        
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
            tip:    invoiceForm.tip ? invoiceForm.tip : 0, 
            requestIds: invoiceForm.requestIds,
            status: HLInvoiceStatus.submitted,
            paidAt: new Date(invoiceForm.paidAt).getTime(),
            updatedAt: Date.now(),
            createdAt : Date.now(),
           
        };

        // console.log(newInvoice);
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_INVOICES);
            collectionRef
                .add(newInvoice)
                .then(docRef => { 
                    const invRef = this.db.collection(COLLECTION_INVOICES).doc(docRef.id);
                    invRef.update({uid: docRef.id}).then(()=>{
                        if (shareInfo){
                            const email = (shareInfo.email && shareInfo.email != '') ? shareInfo.email : null;
                            const phone = (shareInfo.phone && shareInfo.phone != '') ? shareInfo.phone : null;
                            const horseId = (invoiceForm.horseId && invoiceForm.horseId != '') ? invoiceForm.horseId : null;
                            this.shareInvoice(this.userId, horseId, docRef.id, phone, email);
                        }else {
                            this._appService.showSnackBar('Invoice submitted', 'OK');
                        }
                    });
                    resolve();
                    this._progressBarService.endLoading2();
                })
                .catch( error => {
                    console.error('Error adding invoice: ', error);
                    reject();
                });
        });
    }
    shareInvoice (userId: string, horseId: string, invoiceId: string, phone?: string, email?: string){
        let datas: any;
        if (phone){
            datas = {
                data: {
                    'userId' : userId ,
                    'userPlatform' : HLPlatformType.WEB,
                    'horseId' : horseId,
                    'invoiceId' : invoiceId,
                    'phone' : phone
                }
            };
        }
        if (email) {
            datas = {
                data: {
                    'userId' : userId ,
                    'userPlatform' : HLPlatformType.WEB,
                    'horseId' : horseId,
                    'invoiceId' : invoiceId,
                    'email' : email
                }
            };
        }
        
        this._httpClient.post(this.baseUrl + '/shareInvoice', JSON.stringify(datas), this._appService.getHttpOptions())
            .subscribe((response: any) => {
                this._appService.showSnackBar('Invoice submitted', 'OK');
                this._progressBarService.endLoading2();
            });
    }
    createService(invoiceForm): Promise<any> {        
        this._progressBarService.beginLoading2(); 

        const newInvoice = {                    
            // uid: invoiceForm.uid,
            name:   invoiceForm.horseBarnName,
            userId:  this.userId, 
            service: invoiceForm.service,
            rate: invoiceForm.rate,
            quantity: 1,
           
        };
        // console.log('this is newInvoice', newInvoice);
        return new Promise(async (resolve, reject) => {
            
            const queryRef = await this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES, 
            ref => ref.where('userId', '==', this.userId).where('service', '==', newInvoice.service)).get();
            await queryRef.subscribe((snapshot) => {
                if (snapshot.size) { // if duplicated
                // Show the error message
                    this._matSnackBar.open('Service is already exists. please input another Service.', 'OK', {
                        verticalPosition: 'bottom',
                        duration        : 3000
                    });
                    resolve();
                } else {
                       
                    const collectionRef = this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES);
                    collectionRef
                        .add(newInvoice)
                        .then(docRef => {
                            // console.log('Invoice written with ID: ', docRef);
                            let newService: HLServiceProviderServiceModel;
                            const invRef = this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES).doc(docRef.id);
                            invRef.set({uid: docRef.id}, {merge: true}).then(() => {

                                newService = new HLServiceProviderServiceModel(docRef.id, newInvoice);
                                // console.log( 'newService', newService);
                                resolve(newService);
                            }); 
                           
                            this._progressBarService.endLoading2();
                        })
                        .catch( error => {
                            console.error('Error adding invoice: ', error);
                            reject();
                        });
                       
                    }
                });
            });
        }

    createShow(data): Promise<any> {        
            this._progressBarService.beginLoading2(); 
    
            const addShow = {                    
                // uid: '',
                name:   data.showName, 
                createdAt : Date.now(),
               
            };
            //  console.log('this is newInvoice', addShow);
            return new Promise(async (resolve, reject) => {
                
                const queryRef = await this.db.collection(COLLECTION_SERVICE_SHOWS, 
                ref => ref.where('name', '==', addShow.name)).get();
                await queryRef.subscribe((snapshot) => {
                    if (snapshot.size) { // if duplicated
                    // Show the error message
                        this._matSnackBar.open('Show is already exists. Please input another show.', 'OK', {
                            verticalPosition: 'bottom',
                            duration        : 3000
                        });
                        resolve();
                    } else {
                           
                        const collectionRef = this.db.collection(COLLECTION_SERVICE_SHOWS);
                        const newId = this.db.createId();
                        const newShow = {                    
                            uid: newId,
                            name:   data.showName, 
                            createdAt : Date.now(),
                           
                        };
                        collectionRef
                            .add(newShow)
                            .then(docRef => {
                                let show: HLServiceShowModel;
                                show = new HLServiceShowModel(docRef.id, newShow);
                                resolve(show);
                                this._progressBarService.endLoading2()
                            })
                            .catch( error => {
                                console.error('Error adding invoice: ', error);
                                reject();
                            });
                           
                        }
                    });
                });
            }
       
    createRequest(requestForm, selectedContact): Promise<any> {        
        
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
            // uid: requestForm.uid,
            shareInfo: shareInfo ? shareInfo.toJSON() : null,
            requestDate: new Date(requestForm.requestDate).getTime(),
            competitionClass: requestForm.competitionClass || null,
            horseBarnName: requestForm.horseBarnName,   // hidden field
            horseDisplayName: requestForm.horseDisplayName, // hidden field
            horseId: requestForm.horseId,
            showId: requestForm.showId || null,            
            instruction: requestForm.instruction || null,            
            //providerNote: requestForm.providerNote,            
            isCustomRequest: true,
            isDeletedFromInvoice: requestForm.isDeletedFromInvoice === 'true' ? true : false,
            dismissedBy: requestForm.dismissedBy || [],
            status: 'completed',
            creatorId: requestForm.creatorId,
            // show: requestForm.show,
            serviceProviderId: requestForm.serviceProviderId,    
            //show: requestForm.show,     
            // serviceProvider: requestForm.serviceProvider,  
            services: requestForm.services,
            assignerId: requestForm.assignerId || null,
            updatedAt: Date.now(),
            createdAt : Date.now()

            
        };

        // console.log('this is newRequest', newRequest);
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_SERVICE_REQUESTS);
            collectionRef
                .add(newRequest)
                .then(docRef => {
                 
                    const invRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(docRef.id);
                    invRef.set({uid: docRef.id}, {merge: true});

                    resolve(docRef);
                    this._progressBarService.endLoading2();
                })
                .catch( error => {
                    console.error('Error adding document: ', error);
                    reject();
                });
        });
    }
    getServiceRequestById(uid): Promise<any> {
        const datas = {
            data: {
                serviceRequestIds : [uid]
            }
        }

        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/getServiceRequests', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    let requests = response.result ?  response.product_list : [];
                    const requestId = requests[0].uid;
                    let newRequest = new HLServiceRequestModel(requestId, requests[0]);
                    // this.makeInvoiceDraft(newRequest);
                    // this.getAmountOfInvoiceDrafts();
                    resolve();
                }, reject);
        });
    }

   
}
