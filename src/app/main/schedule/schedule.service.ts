import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { HLServiceRequestModel, HLServiceShowModel } from 'app/model/service-requests';
import { HLServiceProviderModel, HLServiceProviderServiceModel } from 'app/model/users';
import { COLLECTION_SERVICE_REQUESTS, COLLECTION_SERVICE_SHOWS, COLLECTION_SERVICE_PROVIDER_SERVICES} from 'app/model/constants';
import { AppService} from 'app/service/app.service';
import { HttpClient } from '@angular/common/http';
import { SCHEDULE_LIMIT } from 'app/model/constants';
import { HLScheduleFilterModel } from 'app/model/filter';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

@Injectable()
export class ScheduleService implements Resolve<any>
{
    userId = '';
    baseUrl = '';
    currentRequestList: HLServiceRequestModel[];
    pastRequestList: HLServiceRequestModel[];
    serviceShows: HLServiceShowModel[] = [];
    serviceAdded: HLServiceRequestModel;
    serviceProviders: HLServiceProviderModel[];
    shows: HLServiceShowModel[];
    shouldLoadMorePast: boolean;
    shouldLoadMoreCurrent: boolean;
    isLoadingCurrent: boolean;
    isLoadingPast: boolean;
    selectedTab: string;
    filter: HLScheduleFilterModel = null;

    onCurrentRequestListChanged: BehaviorSubject<any>;
    onPastRequestListChanged: BehaviorSubject<any>;
    onRequestChanged: BehaviorSubject<any>;
    onCurrentServiceRequestChange: BehaviorSubject<any>;
    onCurrentServiceProvider: BehaviorSubject<any>;
    onCurrentShowsChange: BehaviorSubject<any>;
    onServiceProviderServices: BehaviorSubject<any>;
    onAddRequest: BehaviorSubject<any>;
    onSearchType: Subject<any>;
    onSearchServiceProviders: Subject<any>;
    onSearchServiceProvider: Subject<any>;
    onSearchShows: Subject<any>;
    onSearchShow: Subject<any>;
    onSearchOpen: BehaviorSubject<any>;
    onCurrentProviderHorse: BehaviorSubject<any>;
    onSearchSelectItem: BehaviorSubject<any>;
    onLoadingCurrent: BehaviorSubject<any>;
    onLoadingPast: BehaviorSubject<any>;

    constructor(
        private db: AngularFirestore,
        private _appService: AppService,
        private _httpClient: HttpClient,
        private _progressBarService: FuseProgressBarService,
    )
    {
        this.selectedTab = 'current';
        this.shouldLoadMorePast = false;
        this.shouldLoadMoreCurrent = false;
        this.isLoadingCurrent = false;
        this.isLoadingPast = false;
        this.currentRequestList = [];
        this.pastRequestList = [];

        this.onCurrentRequestListChanged = new BehaviorSubject({});
        this.onPastRequestListChanged = new BehaviorSubject({});
        this.onRequestChanged = new BehaviorSubject([]);
        this.onCurrentServiceRequestChange = new BehaviorSubject([]);
        this.onCurrentServiceProvider = new BehaviorSubject([]);
        this.onCurrentShowsChange = new BehaviorSubject([]);
        this.onServiceProviderServices = new BehaviorSubject([]);
        this.onAddRequest = new BehaviorSubject([]);
        this.onSearchOpen = new BehaviorSubject([]);
        this.onCurrentProviderHorse = new BehaviorSubject([]);
        this.onSearchSelectItem = new BehaviorSubject([]);
        this.onLoadingCurrent = new BehaviorSubject([]);
        this.onLoadingPast = new BehaviorSubject([]);
        this.onSearchType = new Subject();
        this.onSearchServiceProviders = new Subject();
        this.onSearchServiceProvider = new Subject();
        this.onSearchShows = new Subject();
        this.onSearchShow = new Subject();
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
        this.filter = null;
        this.currentRequestList = [];
        this.pastRequestList = [];
        const data = {
            list: null,
            isRefresh: true
        };
        this.onCurrentRequestListChanged.next(data);
        this.onPastRequestListChanged.next(data);

        this.getCurrentRequestList(null, true)
        .catch(() => {
            this.onLoadingCurrent.next(false);
            this.isLoadingCurrent = false;
        });

        return new Promise((resolve, reject) => {
            Promise.all([
            ]).then(
                () => {
                    resolve();
                },
                reject
            );
        });
    }

    getCurrentRequestList(lastRequestId: string, isRefresh: boolean): Promise<any>
    {
        if (isRefresh){
            this.isLoadingCurrent = false;
            this.shouldLoadMoreCurrent = false;
        }

        if (this.isLoadingCurrent) {
            return;
        }
        this.userId = this._appService.getCurUser().uid;
        
        let lastId: string;
        if (this.shouldLoadMoreCurrent && !lastRequestId) {
            lastId = null;
        } else {
            lastId = lastRequestId;
        }

        if (isRefresh) {
            lastId = null;
        }

        let date: any;
        date = new Date();
        date.setHours(0, 0, 0, 0);
        const startDate = date.getTime();
        const datas = {
            data: {
                serviceProviderId: this.userId,
                statuses: [
                    'pending', 'accepted', 'completed', 'declined'
                    ],
                limit: SCHEDULE_LIMIT,
                lastRequestId: lastId,
                startDate: startDate ? startDate : null,
            }
        };

        this.onLoadingCurrent.next(true);
        this.isLoadingCurrent = true;
        this.baseUrl = this._appService.getApiUri();

        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchServiceRequests', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    this.currentRequestList = [];
                    const List = response.result ?  response.result : [];
                    List.forEach(doc => {
                        this.currentRequestList.push(new HLServiceRequestModel(doc.uid, doc));
                    });
                    const data = {
                        list: this.currentRequestList,
                        isRefresh: isRefresh
                    };
                    this.onCurrentRequestListChanged.next(data);
                    this.onLoadingCurrent.next(false);
                    this.isLoadingCurrent = false;
                    this.shouldLoadMoreCurrent = (this.currentRequestList.length >= SCHEDULE_LIMIT) ? true : false;
                    resolve(this.currentRequestList);
                },
                reject);
        });
    }

    getPastRequestList(lastRequestId: string, isRefresh: boolean): Promise<any>
    {
        if (this.isLoadingPast) { return; }
        let sort: any;
        sort = null;

        this.userId = this._appService.getCurUser().uid;

        let endDate: number;
        let date: any;
        date = new Date();
        if (this.filter && this.filter.endDate){
            endDate = this.filter.endDate;
        } else {
            date.setHours(23, 59, 59, 999);
            date.setDate(date.getDate() - 1);
            endDate = date.getTime();
        }
        const datas = {
            data: {
                serviceProviderId: this.userId,
                statuses: [
                    'pending', 'accepted', 'completed', 'declined', 'invoiced', 'paid'
                    ],
                limit: SCHEDULE_LIMIT,
                lastRequestId: lastRequestId,
                startDate: this.filter ? this.filter.startDate : null,
                endDate: endDate ? endDate : null,
                sort: sort ? sort : null,
            }
        };
        this.onLoadingPast.next(true);
        this.isLoadingPast = true;
        this.baseUrl = this._appService.getApiUri();

        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchServiceRequests', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    this.pastRequestList = [];
                    const List = response.result ?  response.result : [];
                    List.forEach(doc => {
                        this.pastRequestList.push(new HLServiceRequestModel(doc.uid, doc));
                    });
                    const data = {
                        list: this.pastRequestList,
                        isRefresh: isRefresh
                    };
                    this.onPastRequestListChanged.next(data);
                    this.onLoadingPast.next(false);
                    this.isLoadingPast = false;
                    this.shouldLoadMorePast = (this.pastRequestList.length >= SCHEDULE_LIMIT)? true: false;
                    resolve(this.pastRequestList);
                },
                reject);
        });
    }

    onAddRequestServices(request: HLServiceRequestModel): void {
        if (request){
            this.serviceAdded = request;
        }
    }
    getServiceAdded(): HLServiceRequestModel {
        return this.serviceAdded;
    }

    updateRequest(requestForm): Promise<any> {
        const newRequest = {
            uid: requestForm.uid,
            requestDate: new Date(requestForm.requestDate).getTime(),
            competitionClass: requestForm.competitionClass || '',
            horseBarnName: requestForm.horseBarnName,
            horseDisplayName: requestForm.horseDisplayName,
            horseId: requestForm.horseId,
            showId: requestForm.showId || '',
            instruction: requestForm.instruction,
            providerNote: requestForm.providerNote,            
            isCustomRequest: requestForm.isCustomRequest === 'true' ? true : false,
            dismissedBy: requestForm.dismissedBy,
            status: requestForm.status,
            creatorId: requestForm.creatorId,
            serviceProviderId: requestForm.serviceProviderId,
            services: requestForm.services,
            assignerId: requestForm.assignerId,
            updatedAt: Date.now()
        };
        
        this._progressBarService.beginLoading2();
        return new Promise((resolve, reject) => {            
            const docRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(newRequest.uid);
            docRef.set(newRequest, {merge: true})
            .then(() =>  {
                this.getServiceRequestById(newRequest.uid)
                .then((res) => {
                    this.getRequests(res);
                    resolve(res);
                    this._progressBarService.endLoading2();
                });
                
            }).catch( error => {
                reject();
                this._progressBarService.endLoading2();
            });
        });
    }

    setSearchType(filter: string): void {
        if (filter){
            this.onSearchType.next(filter);
        } 
    }

    async searchServiceProviders(query): Promise<any>{
        const datas = {
            data: {
                query: query,
                limit: '',      
                excludeIds: []
            }
        };
        this.baseUrl = this._appService.getApiUri();

        this._progressBarService.beginLoading2();
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchServiceProviders', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    this.serviceProviders = response.result ?  response.result : [];
                    this.onSearchServiceProviders.next(this.serviceProviders);
                    resolve(this.serviceProviders);

                    this._progressBarService.endLoading2();
                }, reject);
        });
    }

    async searchShows(query): Promise<any>{
        const datas = {
            data: {
                query: query,
                limit: '',      
                lastShowId: ''
            }
        };
        this.baseUrl = this._appService.getApiUri();
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchServiceShows', JSON.stringify(datas), this._appService.httpOptions)
                .subscribe((response: any) => {
                    if (response.result){
                        this.shows = [];     
                        this.shows = response.result;
                        this.onSearchShows.next(this.shows);
                    }   
                    resolve(this.shows);
                }, reject);
        });
    }

    setSearchShow(show: any): void {
        if (show){
            this.onSearchShow.next(show);
        } 
    }

    setSearchServiceProvider(serviceProvider: any): void {
        if (serviceProvider){
            this.onSearchServiceProvider.next(serviceProvider);
        } 
    }

    getServiceProviderService(uid: string): Promise<any>{
        return new Promise(async (resolve, reject) => {
            if (uid != null && uid !== '') {      
                const queryRef = await this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES, ref => ref.where('userId', '==', uid)).get();
                await queryRef.subscribe((snapshot) => {
                    let serviceProviderServices: HLServiceProviderServiceModel[];
                    serviceProviderServices = [];
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

    async saveNewShow(showName: string): Promise<any>{
        if (!showName || showName == '') { return; }

        return new Promise((resolve, reject) => {
            const newId = this.db.createId();
            const collectionRef = this.db.collection(COLLECTION_SERVICE_SHOWS).doc(newId);
            const newShow = {                    
                uid: newId,
                name:   showName, 
                createdAt : Date.now(),
            };
            collectionRef
                .set(newShow, {merge: true})
                .then(() => {
                    let show: HLServiceShowModel;
                    show = new HLServiceShowModel(newId, newShow);
                    resolve(show);
                })
                .catch(() => {
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

    setSelectedTab(selectedTab): void {
        if (selectedTab == 0){
            this.selectedTab = 'current';
        } else {
            this.selectedTab = 'past';
        }
    }

    getServiceRequestById(uid): Promise<any> {
        const datas = {
            data: {
                serviceRequestIds : [uid]
            }
        };
        this.baseUrl = this._appService.getApiUri();
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/getServiceRequests', JSON.stringify(datas), this._appService.getHttpOptions())
                .subscribe((response: any) => {
                    const requests = response.result ?  response.result : [];
                    const requestId = requests[0].uid;
                    const newRequest = new HLServiceRequestModel(requestId, requests[0]);
                    resolve(newRequest);
                }, reject);
        });
    }

    getRequests(newRequest): void {
        if (!newRequest || !newRequest.uid) {return; }
        if (this.selectedTab == 'current'){
            this.getCurrentRequestList(null, true);
        } else {
            this.getPastRequestList(null, true);
        }
    }

    udpateRequestBy(id: string, data): Promise<any> {
        if (!id) {
            return;
        }

        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(id);
            collectionRef
            .set(data, {merge: true})
            .then(() => {
                resolve();
            }, reject)
            .catch(() => {
            });
        });
    }
}
