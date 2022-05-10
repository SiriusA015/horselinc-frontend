import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { interval, Subject } from 'rxjs';

import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

import { HttpClient, HttpHeaders} from '@angular/common/http';
import { Router } from '@angular/router';
import { HLBaseUserModel,HLServiceProviderModel } from 'app/model/users';
import { HLUserModel, HLHorseManagerModel, HLHorseManagerPaymentApproverModel, HLHorseManagerProviderModel } from 'app/model/users';
import { HLUserType } from 'app/model/enumerations';
import { COLLECTION_USERS } from 'app/model/constants';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserPaymentApproversService } from 'app/service/user-payment-approvers.service';
import { UserManagerProvidersService } from 'app/service/user-manager-providers.service';


@Injectable()
export class UserHorseManagerService{
    horseManager: HLUserModel;

    serviceProviders: HLServiceProviderModel[] = [];
    onSearchServiceProviders: BehaviorSubject<any>;
    onSearchServiceProvider: BehaviorSubject<any>;

    horseManagers: HLHorseManagerModel[] = [];
    onSearchHorseManagers: BehaviorSubject<any>;
    onSearchHorseManager: BehaviorSubject<any>;

    editingHorseOwner: HLUserModel;
    onHorseOwnerCreate: BehaviorSubject<any>;
    onHorseOwnerCreated: BehaviorSubject<any>;
    onHorseOwnerPaymentApprover: BehaviorSubject<any>;

    onSelectedApproverChanged: BehaviorSubject<any>;
    actionOfApprover: string;
    currentApprover: HLHorseManagerPaymentApproverModel;
    
    baseUrl: string;
    httpOptions: any;

    // Private
    private _unsubscribeAll: Subject<any>;

    // Private
    /**
     * Constructor
     *
     * @param {ManagerProvidersService}  _managerProvidersService
     * @param {PaymentApproversService}  _paymentApproversService
     */
    constructor(
        private router: Router,
        private _httpClient: HttpClient,
        private _db: AngularFirestore,           
        private _appService: AppService,
        private _paymentApproversService: UserPaymentApproversService,
        private _managerProvidersService: UserManagerProvidersService,
        private _userAuthService: UserAuthService,
        private _progressBarService: FuseProgressBarService,
    ) {
        this.baseUrl = this._appService.apiUrl;
        this.httpOptions = this._appService.httpOptions;

        // Set the defaults
        this.horseManager = new HLUserModel('', {});

        this.serviceProviders = [];
        this.onSearchServiceProviders = new BehaviorSubject([]);
        this.onSearchServiceProvider = new BehaviorSubject({});

        this.horseManagers = [];
        this.onSearchHorseManagers = new BehaviorSubject([]);
        this.onSearchHorseManager = new BehaviorSubject({});

        this.editingHorseOwner = new HLUserModel('', {});
        this.onHorseOwnerCreate = new BehaviorSubject({});
        this.onHorseOwnerCreated = new BehaviorSubject({});
        this.onHorseOwnerPaymentApprover = new BehaviorSubject({});

        this.actionOfApprover = 'new';
        this.onSelectedApproverChanged = new BehaviorSubject([]);
        
        // Set the private defaults
        this._unsubscribeAll = new Subject();

        this._userAuthService.onHLUserChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(user => {
            if (user !== false){
                if (user.type === HLUserType.manager){
                    this.updatedUser(user);
                }
            }
        });
    }

    updatedUser(hlUser: HLUserModel): void {
        this.horseManager = new HLUserModel(hlUser.uid, hlUser);
        // set user id for horse manager provider.
        this._managerProvidersService.userId = hlUser.uid;
        this._managerProvidersService.getManagerProviders();
        // set user id for paymentApprover.
        this._paymentApproversService.userId = hlUser.uid;
        this._paymentApproversService.getPaymentApprovers(hlUser.uid);
    }

    createCustomer(horseManagerId: string): Promise<any>{
        const datas = {
            data: {
                userId: horseManagerId,
            }
        };

        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/createCustomer', JSON.stringify(datas), this.httpOptions)
                .subscribe((response: any) => {
                    this._userAuthService.loadUser();
                    resolve(response.result);
                }, reject);
        });
    }
    
    addCardToCustomer(customerId: string, sourceId: string, horseManagerId: string): Promise<any>{
        // console.log('addCardToCustomer:', horseManagerId);
        const datas = {
            data: {
                userId: horseManagerId,
                customerId: customerId,
                sourceId: sourceId,
            }
        };
        this._progressBarService.beginLoading2();
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/addCardToCustomer', JSON.stringify(datas), this.httpOptions)
                .subscribe((response: any) => {
                    // this._userAuthService.loadUser();
                    resolve(response.result);

                    this._progressBarService.endLoading2();
                }, reject);
        });
    }
    changeDefaultCard(customerId: string, sourceId: string, horseManagerId: string): Promise<any>{
        const datas = {
            data: {
                userId: horseManagerId,
                customerId: customerId,
                sourceId: sourceId,
            }
        };
        this._progressBarService.beginLoading2();

        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/changeDefaultCard', JSON.stringify(datas), this.httpOptions)
                .subscribe((response: any) => {
                    // this._userAuthService.loadUser();
                    resolve(response.result);

                    this._progressBarService.endLoading2();
                }, reject);
        });
    }
    deletePaymentCard(customerId: string, sourceId: string, horseManagerId: string): Promise<any>{
        const datas = {
            data: {
                userId: horseManagerId,
                customerId: customerId,
                sourceId: sourceId,
            }
        };
        this._progressBarService.beginLoading2();

        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/deleteCard', JSON.stringify(datas), this.httpOptions)
                .subscribe((response: any) => {
                    // this._userAuthService.loadUser();
                    resolve(response.result);

                    this._progressBarService.endLoading2();
                }, reject);
        });
    }
    updateProviders(providers: any): void{
        // this.horseManager.horseManager.providerIds = providers;
        // this._userAuthService.updateUser(this.horseManager);
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
        this._progressBarService.beginLoading2();
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.baseUrl + '/searchServiceProviders', JSON.stringify(datas), this.httpOptions)
                .subscribe((response: any) => {
                    this.serviceProviders = response.result ?  response.result : [];
                    this.onSearchServiceProviders.next(this.serviceProviders);
                    resolve(this.serviceProviders);

                    this._progressBarService.endLoading2();
                }, reject);
        });
    }

    setSearchServiceProvider(serviceProvider: any): void {
        this.onSearchServiceProvider.next(serviceProvider);
    }

    // find service providers in 
    findServiceProvider(userId: string): boolean{
        if (this.horseManager.horseManager)
        {
            if (this.horseManager.horseManager.providerIds)
            {
                if (this.horseManager.horseManager.providerIds.indexOf(userId) > 0){
                    return true;
                }
            }
        }
        return false;
    }

    // functions related to add payment manager
    async searcHorseManagers(query): Promise<any>{

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
                    this.horseManagers = response.result ?  response.result : [];
                    this.onSearchHorseManagers.next(this.horseManagers);
                    resolve(this.horseManagers);
                    this._progressBarService.endLoading2();
                }, reject);
        });
    }

    setSearchHorseManager(horseManager: any): void {
        this.onSearchHorseManager.next(horseManager);
    }

    requestHorseOwnerCreate(): void{
        this.editingHorseOwner = new HLUserModel('', {});
        this.onHorseOwnerCreate.next(this.editingHorseOwner);
    }
    requestHorseOwnerCreated(): void{
        this.onHorseOwnerCreated.next(this.editingHorseOwner);
    }
}
