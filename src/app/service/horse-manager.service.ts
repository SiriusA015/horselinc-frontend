import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { HLHorseModel, HLHorseOwnerModel, HLHorseFilterModel } from 'app/model/horses';
import { HLServiceRequestModel, HLServiceShowModel} from 'app/model/service-requests';
import { UserAuthService } from 'app/service/user-auth.service';
import { HLUserModel } from 'app/model/users';
import { HLServiceProviderModel } from 'app/model/users';
import { HLServiceProviderServiceModel } from 'app/model/users';
import { HLHorseManagerModel } from 'app/model/users';
import { COLLECTION_SERVICE_PROVIDER_SERVICES } from 'app/model/constants';
import { COLLECTION_SERVICE_REQUESTS, COLLECTION_SERVICE_SHOWS, COLLECTION_HORSES } from 'app/model/constants';
import { AppService } from 'app/service/app.service';
import { COLLECTION_HORSE_OWNERS} from 'app/model/constants';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { MatSnackBar } from '@angular/material';
@Injectable()


export class HorseManagerService implements Resolve<any>
{   
    routeParams: any;
    user: HLUserModel;
    userId: string;
    request: HLServiceRequestModel;
    horses: HLHorseModel[] = [];
    serviceRequests: HLServiceRequestModel[] = [];
    currentSearchRequest: HLServiceRequestModel;
    currentHorseManager: HLHorseModel;
    currentSearchProvider: HLServiceProviderModel;
    currentSearchTrainer: HLHorseManagerModel;
    currentHorseFlag: boolean;
    currentProviderUserId: string;
    currentSearchLeaser: HLHorseManagerModel;
    currentSearchOwner: HLHorseManagerModel;
    currentOwners: HLHorseOwnerModel[] = [];
    selectHorse: HLHorseModel;
    serviceProviders: HLServiceProviderModel[] = [];
    serviceProviderServices: HLServiceProviderServiceModel[];
    horseTrainer: HLHorseManagerModel[];
    horseOwner: HLHorseManagerModel[];
    invoiceId: any;
    baseUrl: string;
    httpOptions: any;
    trainer: HLHorseManagerModel;
    owner: HLHorseManagerModel;
    checked: boolean;
    sortType: string;
    query: string;
    stopHorseLoadmore: boolean;
    filterDate: HLHorseFilterModel;
    filterFlag: boolean;
    firstLoadHorsesFlag: boolean;
    firstLoadHorses: HLHorseModel[];

    onCurrentHorseChanged: BehaviorSubject<any>;
    onHorsesChanged: BehaviorSubject<any>;
    onCurrentHorseFlagChanged: BehaviorSubject<any>;
    onHorseServiceRequests: BehaviorSubject<any>;
    onSearchManagerProvider: BehaviorSubject<any>;
    onCurrentServiceProvider: BehaviorSubject<any>;
    onServiceProviderServices: BehaviorSubject<any>;
    onGetServiceHorse: BehaviorSubject<any>;
    onEditHorseProfile: BehaviorSubject<any>;
    onCurrentSearchTrainer: BehaviorSubject<any>;
    onSearchSelectItem: BehaviorSubject<any>;
    onManagerTrainer: BehaviorSubject<any>;
    onCurrentSearchLeaser: BehaviorSubject<any>;
    onCurrentSearchOwner: BehaviorSubject<any>;
    onCurrentServiceRequestChange: BehaviorSubject<any>;
    onAddRequest: BehaviorSubject<any>;
    onUpdateRequest: BehaviorSubject<any>;
    onSearchOpen: BehaviorSubject<any>;
    onCurrentShowsChange: BehaviorSubject<any>;
    onCurrentProviderHorse: BehaviorSubject<any>;
    onHorseServiceRequestedFlag: BehaviorSubject<any>;

    // onSearchLeased: BehaviorSubject<any>;
    // onSearchOwner: BehaviorSubject<any>;
    // onSearchService: BehaviorSubject<any>;

    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     */
    constructor(
        private db: AngularFirestore,
        private _userAuthService: UserAuthService,
        private _httpClient: HttpClient,
        private _appService: AppService,
        private _progressBarService: FuseProgressBarService,
        private _matSnackBar: MatSnackBar, 

    )
    {
        // Set the defaults
        
        this.onCurrentHorseChanged = new BehaviorSubject([]);
        this.onHorsesChanged = new BehaviorSubject([]);
        this.onCurrentHorseFlagChanged = new BehaviorSubject([]);
        this.onHorseServiceRequests = new BehaviorSubject([]);
        this.onHorseServiceRequestedFlag = new BehaviorSubject([]);
        this.onSearchManagerProvider = new BehaviorSubject([]);
        this.onCurrentServiceProvider = new BehaviorSubject([]);
        this.onServiceProviderServices = new BehaviorSubject([]);
        this.onGetServiceHorse = new BehaviorSubject([]);
        this.onEditHorseProfile = new BehaviorSubject([]);
        this.onCurrentSearchTrainer = new BehaviorSubject([]);
        this.onSearchSelectItem = new BehaviorSubject([]);
        this.onManagerTrainer = new BehaviorSubject([]);
        this.onCurrentSearchLeaser = new BehaviorSubject([]);
        this.onCurrentSearchOwner = new BehaviorSubject([]);
        this.onCurrentServiceRequestChange = new BehaviorSubject([]);
        this.onAddRequest = new BehaviorSubject([]);
        this.onUpdateRequest = new BehaviorSubject([]);
        this.onSearchOpen = new BehaviorSubject([]);
        this.onCurrentShowsChange = new BehaviorSubject([]);
        this.onCurrentProviderHorse =  new BehaviorSubject([]);

        this.baseUrl = this._appService.apiUrl;
        this.httpOptions = this._appService.httpOptions;
        this.selectHorse = new HLHorseModel('', {});

        // this.loadFilterData();
        // this.onSearchOwner = new BehaviorSubject([]);
        // this.onSearchService = new BehaviorSubject([]);
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
        this.selectHorse = new HLHorseModel('', {});
        this.user = this._appService.getCurUser();
        this.userId = this.user.uid;
        this.horses = [];
        this.serviceRequests = [];
        this.loadFilterData();
        this.getHorsesForManager('');
        this.onCurrentHorseFlagChanged.next(false);
        
        return new Promise((resolve, reject) => {

            Promise.all([])
                .then(() => {

                  
                   
                    resolve();
                },
                reject
            ); 
        });
    }
    loadFilterData(): void{
        // const  filterData =  JSON.parse(localStorage.getItem('filterData'));
        
        // if (filterData  !=  null )
        // {   
        //     this.trainer = filterData.trainer;
        //     this.owner = filterData.owner;
        //     if (this.trainer == null || !this.trainer){this.trainer = new HLHorseManagerModel({}); }
        //     if (this.owner == null || !this.trainer){this.owner = new HLHorseManagerModel({}); }
        //     this.sortType  = filterData.sortType;
        //     this.query = filterData.query;
        //     this.checked = filterData.checked;
        //     this.filterFlag = true;
        // }
        // else{
            this.trainer = new HLHorseManagerModel({});
            this.owner = new HLHorseManagerModel({});
            this.firstLoadHorses = [];
            this.sortType  = '';
            this.query = '';
            this.checked = false;
            this.filterFlag = false;
            this.firstLoadHorsesFlag = true;
            this.filterFlag = false;
            this.stopHorseLoadmore = false;
            //}
        //if (this.trainer.userId =='' && this.owner.userId == '' && this.checked == false && this.sortType == '' ) { this.filterFlag = false; }
    }

    getFilterHorseForManager(searchType: string): Promise<any>{
            const datas = {
            data: {
                userId: this.userId,  
                searchType: searchType,
                limit: 100,
                excludeIds: [],    
                }
            };
            // this._progressBarService.beginLoading2();   
            return new Promise((resolve, reject) => {
                this._httpClient.post(this.baseUrl + '/searchHorseUsers', JSON.stringify(datas), this.httpOptions)
                    .subscribe((response: any) => {

                            let horseManagers : HLHorseManagerModel[] = [];
                            
                            const listHorseManager = response.result ?  response.result : [];
                            listHorseManager.map(doc => {
                                horseManagers.push(new HLHorseManagerModel(doc));
                            });
                           
                            resolve(horseManagers);
                            // this._progressBarService.endLoading2();
                    }, reject);
            });    
    }
    
    getHorsesForManager(lastHorseId: string): Promise<any> {
        
        let tempsort = this.sortType;
        let tempquery =  this.query; 

        let sort: any;  
        let query: string;
        sort = '';
        query = 'horse';
        if (lastHorseId == ''){this.horses = [];}
        if (tempsort == 'BarnName(ascending)'){
            sort = { 'name' : 'barnName' , 'order' : 'asc'};
        }   
        if (tempsort == 'BarnName(descending)'){
            sort = { 'name' : 'barnName' , 'order' : 'desc'};
        }   
        if (tempsort == 'CreationDate(ascending)'){
            sort = { 'name' : 'createdAt' , 'order' : 'asc' };        
        }   
        if (tempsort == 'CreationDate(descending)'){
            sort = { 'name' : 'createdAt' , 'order' : 'desc'};
        }   
        if (tempquery == 'owner'){
            query = 'owner';
        }
        if (tempquery == 'trainer'){
            query = 'trainer';
        }
        const datas = {
            data: {
                userId: this.userId,  
                query: query,
                limit: 10,
                lastHorseId: lastHorseId,
                sort: sort,
                trainerId: this.trainer.userId || '',
                ownerId: this.owner.userId || '',
                }
            };
          

        this._progressBarService.beginLoading2();   
    
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchHorses', JSON.stringify(datas), this.httpOptions)
                .subscribe((response: any) => {
                    
                    const listhorse = response.result ?  response.result : [];

                    if (listhorse.length < 10){
                        this.stopHorseLoadmore = true;
                        // console.log('this.stopHorseLoadmore', this.stopHorseLoadmore);
                    }   else{
                        this.stopHorseLoadmore = false;
                    }
                    listhorse.forEach(doc => {
                        this.horses.push(new HLHorseModel(doc.uid, doc));
                    });

                // console.log('this is loadmore', this.horses);
                    if (this.horses.length > 0 ){
                        if (this.selectHorse.uid == ''){       
                            this.selectHorse = this.horses[0];
                        }else{ 
                            this.selectHorse = this.horses.find(horse => {
                                return horse.uid == this.selectHorse.uid;
                            });

                        }
                        this.onHorsesChanged.next(this.horses);
                        this.onCurrentHorseChanged.next(this.selectHorse);  
                        this.setCurrentHorseSchedule(this.selectHorse.uid);   
            
                        }else{
                            this.onCurrentHorseChanged.next('');
                            this.onHorsesChanged.next(this.horses);
                        }
                    resolve();
                    this._progressBarService.endLoading2();
            }, reject);
        });  
    }
    saveFilterDataToLocal(newFilterData: HLHorseFilterModel): void{
        
        this.sortType = newFilterData.sortType;
        this.query = newFilterData.query;
        this.checked = newFilterData.checked;
        this.trainer = newFilterData.trainer;
        this.owner = newFilterData.owner;
     
        localStorage.setItem('filterData', JSON.stringify(newFilterData)); 
    }

    setCurrentHorse(uid: any): void
    {   
       
    }
   
    async setCurrentHorseSchedule(uid: any, startDate?: any, endDate?: any): Promise<any> {
        // console.log('this is uid', uid);
        const datas = {
                data: {
                    horseId: uid,
                    statuses: [
                            'pending', 'accepted', 'completed', 'declined'
                        ],
                    limit: 20,
                    startDate: startDate,
                    endDate: endDate
                    // sort: {
                    //         name: 'horseDisplayName',
                    // }
                }
            };
           
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchServiceRequests', JSON.stringify(datas), this.httpOptions)
                .subscribe((response: any) => {
                    
                    this.serviceRequests = [];
                    const List = response.result ?  response.result : [];
                    List.forEach(doc => {
                        this.serviceRequests.push(new HLServiceRequestModel(doc.uid, doc));
                    });

                    this.onHorseServiceRequests.next(this.serviceRequests);

                    this._progressBarService.endLoading2();

                    resolve();            
                }, reject);
        });
    }

    async setAllHorseSchedule(uid: any): Promise<any> {

        const datas = {
                data: {
                    horseId: uid,
                    statuses: [
                            'pending', 'accepted', 'completed', 'declined'
                        ],
                    limit: 20
                    // sort: {
                    //         name: '',
                    // }
                }
            };
           
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchServiceRequests', JSON.stringify(datas), this.httpOptions)
                .subscribe((response: any) => {
                    
                    let allRequest = [];
                    const List = response.result ?  response.result : [];
                    List.forEach(doc => {
                        allRequest.push(new HLServiceRequestModel(doc.uid, doc));
                    });

                    this._progressBarService.endLoading2();

                    resolve(allRequest);            
                }, reject);
        });
    }

    getCurrentScheduleFlag(uid: any): Promise<any> {

        const datas = {
                data: {
                    horseId: uid,
                    statuses: [
                            'pending', 'accepted', 'completed', 'declined'
                        ],
                    limit: 20
                    // sort: {
                    //         name: 'horseDisplayName',
                    // }
                }
            };
           
       
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchServiceRequests', JSON.stringify(datas), this.httpOptions)
                .subscribe((response: any) => {
                    this.serviceRequests = [];
                    
                    this.serviceRequests = response.result;
                    if (this.serviceRequests.length > 0){
                        
                        resolve(true);
                    }
                    else
                    {
                        resolve(false);
                    }           
                }, reject);
        });
    }
  
    // getOwners(): Promise<any>{

    //     let tempOwner = [];
    //     this.currentOwners = [];
    //     // // console.log( this.horse.ownerIds);
    //     return new Promise(async (resolve, reject) => {
    //         if ( this.currentHorseManager.ownerIds != null && this.currentHorseManager.ownerIds) {      
    //             this.currentHorseManager.ownerIds.map(owner => {         
            
    //             const queryRef =  this.db.collection(COLLECTION_HORSE_OWNERS, ref => ref.where('userId', '==', owner).where('horseId', '==', this.currentHorseManager.uid )).get();
    //             queryRef.subscribe((snapshot) => {
    //                 snapshot.forEach((doc) => {
    //                     const service = {
    //                         ...doc.data()
    //                     };                                 
    //                     tempOwner.push(new HLHorseOwnerModel(doc.id, service));
    //                 });    

    //                 //this.currentOwners.push(tempOwner);
    //                 // console.log('this.getOwners', tempOwner);
               
    //                 });      
    //                // this.onServiceProviderServices.next(this.serviceProviderServices);
    //                 resolve(this.serviceProviderServices);                    
    //             }, reject);                
    //         } 
    //         // else {  // controller by "new" URL;                
    //         //     this.onProviderServicesChanged.next(false);
    //         //     resolve(false);
    //         // }
    //     });
    // }

    async getServiceProvider(query): Promise<any>{

        const datas = {
            data: {
                query: query,
                limit: '',      
                excludeIds: []
            }
        };
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchServiceProviders', JSON.stringify(datas), this.httpOptions)
                .subscribe((response: any) => {
                    
                    
                    this.serviceProviders = response.result;
                    // console.log('this is serviceProvider', this.serviceProviders  );
                    this.onSearchManagerProvider.next(this.serviceProviders);

                    resolve(this.serviceProviders);
                    this._progressBarService.endLoading2();
                }, reject);
        });

    }

    
    async getManagerTrainer(query): Promise<any>{

        const datas = {
            data: {
                query: query,
                limit: '',      
                excludeIds: []
            }
        };
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchHorseManagers', JSON.stringify(datas), this.httpOptions)
                .subscribe((response: any) => {
                    
                 
                    this.horseTrainer = response.result;
                    // console.log('this is trainer', this.horseTrainers );
                    this.onSearchManagerProvider.next(this.horseTrainer);           

                    resolve(this.horseTrainer);
                    this._progressBarService.endLoading2();
                }, reject);
        });
    }
    // async getManagerOwner(query): Promise<any>{

    //     const datas = {
    //         data: {
    //             query: query,
    //             limit: '',      
    //             excludeIds: []
    //         }
    //     };
    //     this._progressBarService.beginLoading2(); 
    //     return new Promise((resolve, reject) => {
    //         this._httpClient.post(this.baseUrl + '/searchHorseManagers', JSON.stringify(datas), this.httpOptions)
    //             .subscribe((response: any) => {
                    
                 
    //                 this.horseOwner = response.result;
    //                 // console.log('this is trainer', this.horseTrainers );
    //                 this.onSearchManagerProvider.next(this.horseOwner);           

    //                 resolve(this.horseOwner);
    //                 this._progressBarService.endLoading2();
    //             }, reject);
    //     });
    // }
 
    setSearchServiceProvider(userId: string): void {
    
        this.currentSearchProvider = this.serviceProviders.find(serviceProvider => {
            return serviceProvider.userId === userId;
        });
        this.getServiceProviderService(userId).then(services => {
            this.onServiceProviderServices.next(services);
            this.onCurrentServiceProvider.next(this.currentSearchProvider);    
        }); 
    
    }
    setSearchHorseTrainer(userId: string): void {
    
        this.currentSearchTrainer = this.horseTrainer.find(trainer => {
            
            return trainer.userId === userId;
           
        });
       
        this.onCurrentSearchTrainer.next(this.currentSearchTrainer);    
    }
    setSearchHorseLeaser(uid: string): void {
    
        this.currentSearchLeaser = this.horseTrainer.find(leaser => {
            
            return leaser.userId === uid;
           
        });
       
        this.onCurrentSearchLeaser.next(this.currentSearchLeaser);    
    }
    setSearchHorseOwner(uid: string): void {
    
        this.currentSearchOwner = this.horseTrainer.find(owner => {
            
            return owner.userId === uid;
           
        });
       
        this.onCurrentSearchOwner.next(this.currentSearchOwner);    
    }
    
    getServiceProviderService(userId: string): Promise<any>{

        this.serviceProviderServices = [];
        this._progressBarService.beginLoading2(); 
        return new Promise(async (resolve, reject) => {
            if (userId != null && userId !== '') {                
                const queryRef = await this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES, ref => ref.where('userId', '==', userId)).get();
                await queryRef.subscribe((snapshot) => {
                    snapshot.forEach((doc) => {
                        const service = {
                            ...doc.data()
                        };                                 
                        this.serviceProviderServices.push(new HLServiceProviderServiceModel(doc.id, service));
                    });    
                  
                    //this.onServiceProviderServices.next(this.serviceProviderServices);
                    this._progressBarService.endLoading2();
                    resolve(this.serviceProviderServices);                    
                }, reject);                
            } 
          
        });

    }
    
    // getCurrentHorse(): void{
        
    //     this.onGetServiceHorse.next(this.currentHorseManager);

    // }
    
    createShow(data): Promise<any> {        
        this._progressBarService.beginLoading2(); 

        const addShow = {                    
            // uid: '',
            name:   data.showName, 
            createdAt : Date.now(),
           
        };
        
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
    createRequest(requestForm): Promise<any> {        
        const newRequest = {            
           
            requestDate: new Date(requestForm.requestDate).getTime(),
            competitionClass: requestForm.competitionClass || null,
            horseBarnName: requestForm.horseBarnName,  
            horseDisplayName: requestForm.horseDisplayName,
            horseId: requestForm.horseId,
            showId: requestForm.showId || null,            
            instruction: requestForm.instruction || null,            
            providerNote: requestForm.providerNote,            
            isCustomRequest: requestForm.isCustomRequest = false, //== 'true' ? true : false,
            isDeletedFromInvoice: requestForm.isCustomRequest = false,
            dismissedBy: requestForm.dismissedBy || [],
            status: requestForm.status,
            creatorId: requestForm.creatorId,
            serviceProviderId: requestForm.serviceProviderId,   
            services: requestForm.services,   
            assignerId: requestForm.assignerId || null,
            updatedAt: Date.now(),
            createdAt: Date.now(),
        };
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_SERVICE_REQUESTS);
            collectionRef
                .add(newRequest)
                .then(docRef => {
                    const invRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(docRef.id);
                    invRef.set({uid: docRef.id}, {merge: true});       
                    resolve();
                    this._progressBarService.endLoading2();
                })
                .catch( error => {
                    console.error('Error adding document: ', error);
                    reject();
                });
        });
    }

    deleteRequest(uid): Promise<any>
    {
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {
            // // console.log(horse);
            this.db.collection(COLLECTION_SERVICE_REQUESTS)
                .doc(uid)
                .delete()
                .then(() => {
                    // console.log('Document successfully deleted!');                
                    resolve();
                    this._progressBarService.endLoading2();
            }).catch(error => {
                console.error('Error removing document: ', error);
                reject();
            });
        });
    }

    updateRequest(requestForm): Promise<any> {
        const newRequest = {            
            uid: requestForm.uid,
            requestDate: new Date(requestForm.requestDate).getTime(),
            competitionClass: requestForm.competitionClass || null,
            horseBarnName: requestForm.horseBarnName,  
            horseDisplayName: requestForm.horseDisplayName,
            horseId: requestForm.horseId,
            showId: requestForm.showId || null,            
            instruction: requestForm.instruction || null,            
            providerNote: requestForm.providerNote,            
            isCustomRequest: requestForm.isCustomRequest = false, //== 'true' ? true : false,
            isDeletedFromInvoice: requestForm.isCustomRequest = false,
            dismissedBy: requestForm.dismissedBy || [],
            status: requestForm.status,
            creatorId: requestForm.creatorId,
            serviceProviderId: requestForm.serviceProviderId,   
            services: requestForm.services,   
            assignerId: requestForm.assignerId || null,
            updatedAt: Date.now(),
            createdAt: new Date(requestForm.createdAt).getTime(),
        };
       
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {            
            const docRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(newRequest.uid);
            docRef.set(newRequest, {merge: true})
            .then(() =>  {

                this.request = new HLServiceRequestModel(newRequest.uid, newRequest);
                resolve();
                this._progressBarService.endLoading2();

            }).catch( error => {
                console.error('Error updating document: ', error);
                reject();
            });
        });
    }



    createHorse(horseForm): Promise<any> {        
        const newHorse = {            
          //  uid: horseForm.uid,
            avatarUrl: horseForm.avatarUrl || null,
            barnName: horseForm.barnName,
            displayName: horseForm.displayName,
            gender: horseForm.gender,
            birthYear: horseForm.birthYear,
            trainerId: horseForm.trainerId,            
            creatorId: horseForm.creatorId,
            leaserId: horseForm.leaserId || null,            
            description: horseForm.description,
            privateNote: horseForm.privateNote || null,
            color: horseForm.color,
            sire: horseForm.sire,
            dam: horseForm.dam,
            height: horseForm.height || null,
            ownerIds: horseForm.ownerIds,
            registrations: horseForm.registrations,
            isDeleted: horseForm.isDeleted === 'true' ? true : false,
            createdAt : Date.now()
        };
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_HORSES);
            collectionRef
                .add(newHorse)
                .then(docRef => {
                    
                    const invRef = this.db.collection(COLLECTION_HORSES).doc(docRef.id);
                    invRef.set({uid: docRef.id}, {merge: true}).then(() => {
                        let horse: HLHorseModel;
                        horse =  new HLHorseModel(docRef.id, newHorse); 
                        this.loadFilterData();
                        resolve(horse);
                        this._progressBarService.endLoading2();
                    });

                    
                })
                .catch( error => {
                    console.error('Error adding document: ', error);
                    reject();
                });
        });
    }
    updateHorse(horseForm): Promise<any> {
        const newHorse = {            
            uid: horseForm.uid,
            avatarUrl: horseForm.avatarUrl || null,
            barnName: horseForm.barnName,
            displayName: horseForm.displayName,
            gender: horseForm.gender,
            birthYear: horseForm.birthYear,
            trainerId: horseForm.trainerId,            
            creatorId: horseForm.creatorId,
            leaserId: horseForm.leaserId || null,            
            description: horseForm.description,
            privateNote: horseForm.privateNote || null,
            color: horseForm.color,
            sire: horseForm.sire,
            dam: horseForm.dam,
            height: horseForm.height || null,
            ownerIds: horseForm.ownerIds,
            registrations: horseForm.registrations,
            isDeleted: horseForm.isDeleted === 'true' ? true : false,
            createdAt : Date.now()
        };
        // console.log('requestupdatenewHorse', newHorse);
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {            
            const docRef = this.db.collection(COLLECTION_HORSES).doc(newHorse.uid);
            docRef.set(newHorse, {merge: true})
            .then(() =>  {
                let horse = new HLHorseModel(newHorse.uid, newHorse);
                this.loadFilterData()
               // this.onCurrentHorseChanged.next(horse);
                resolve(horse);
                this._progressBarService.endLoading2();
            }).catch( error => {
                console.error('Error updating document: ', error);
                reject();
            });
        });
    }

    deleteHorse(horse): Promise<any>
    {
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {
            // // console.log(horse);
            this.db.collection(COLLECTION_HORSES)
                .doc(horse.uid)
                .delete()
                .then(() => {
                    this.loadFilterData()
                    resolve();
                    this._progressBarService.endLoading2();
            }).catch(error => {
                console.error('Error removing document: ', error);
                reject();
            });
        });
    }

    createOwner(horseForm): Promise<any> {        
        const newOwner = {            
          //  uid: horseForm.uid,
            avatarUrl: horseForm.avatarUrl || null,
            barnName: horseForm.barnName || '',
            createdAt : Date.now(),
            horseId: horseForm.horseId || '',
            location: horseForm.location || '',
            name: horseForm.name || '',
            percentage: horseForm.percentage || '',
            phone: horseForm.phone || '',
            userId: horseForm.userId
        };
        // console.log(horseForm);
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_HORSE_OWNERS);
            collectionRef
                .add(newOwner)
                .then(docRef => {
                    const invRef = this.db.collection(COLLECTION_HORSE_OWNERS).doc(docRef.id);
                    invRef
                        .set({uid: docRef.id}, {merge : true})
                        .then(() => {
                        let owner: HLHorseOwnerModel;
                        owner =  new HLHorseOwnerModel(docRef.id, newOwner); 
                        this.onCurrentHorseFlagChanged.next(true);
                        resolve();
                        this._progressBarService.endLoading2();
                    });
                 })
                .catch( error => {
                    console.error('Error adding document: ', error);
                    reject();
                });
        });
    }

    updateOwner(horseForm): Promise<any> {        
        const newOwner = {            
            uid: horseForm.uid,
            avatarUrl: horseForm.avatarUrl || null,
            barnName: horseForm.barnName || '',
            createdAt : Date.now(),
            horseId: horseForm.horseId || '',
            location: horseForm.location || '',
            name: horseForm.name || '',
            percentage: horseForm.percentage || '',
            phone: horseForm.phone || '',
            userId: horseForm.userId
        };
        // console.log(horseForm);
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {            
            const docRef = this.db.collection(COLLECTION_HORSE_OWNERS).doc(newOwner.uid);
            docRef.set(newOwner, {merge: true})
            .then(() =>  {
                resolve();
                this._progressBarService.endLoading2();
            }).catch( error => {
                reject();
            });
        });
    }

    deleteOwner(owner): Promise<any> {        
       
        this._progressBarService.beginLoading2(); 
        return new Promise((resolve, reject) => {
          
            this.db.collection(COLLECTION_HORSE_OWNERS)
                .doc(owner.uid)
                .delete()
                .then(() => {    
                    resolve();
                    this._progressBarService.endLoading2();
            }).catch(error => {
                reject();
            });
        });
    }
}
