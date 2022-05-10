import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { FuseUtils } from '@fuse/utils';

import { HLUserModel, HLHorseManagerModel, HLHorseManagerPaymentApproverModel, HLHorseManagerProviderModel } from 'app/model/users';

@Injectable()
export class ProfileManagerService implements Resolve<any>
{
    selectedProfileNo: number;
    currentProfileFlag: boolean;
    managerProviders: any;
    routeParams: any;

    onSelectedProfileNoChanged: BehaviorSubject<any>;
    onCurrentProfileFlagChanged: BehaviorSubject<any>;

    onSelectedApproverChanged: BehaviorSubject<any>;
    actionOfApprover: string;
    currentApprover: HLHorseManagerPaymentApproverModel;

    onSelectedProviderChanged: BehaviorSubject<any>;
    actionOfProvider: string;
    currentProvider: HLHorseManagerProviderModel;

    onChangingEmailEvent: BehaviorSubject<any>;
    onChangingPasswordEvent: BehaviorSubject<any>;

    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     */
    constructor(
        private _httpClient: HttpClient,
        private _router: Router,
        // private _horseManagerService: UserHorseManagerService,
        // private _managerProvidersService: UserManagerProvidersService,
    )
    {
        // Set the defaults

        this.selectedProfileNo = 0;
        this.currentProfileFlag = false;
        this.actionOfApprover = 'Add';

        this.onSelectedProfileNoChanged = new BehaviorSubject([]);
        this.onCurrentProfileFlagChanged = new BehaviorSubject([]);
        this.onSelectedApproverChanged = new BehaviorSubject([]);
        this.onSelectedProviderChanged = new BehaviorSubject([]);
        this.onChangingEmailEvent = new BehaviorSubject([]);
        this.onChangingPasswordEvent = new BehaviorSubject([]);
    
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

    /**
     * Set selected profile no
     *
     * @returns {Promise<any>}
     */
    setSelectProfileNo(selectedProfileNo: number): void
    {
        this.selectedProfileNo = selectedProfileNo;
        this.onSelectedProfileNoChanged.next(this.selectedProfileNo);
    }
    setCurrentProfileFlag(currentProfileFlag: boolean): void
    {
        this.currentProfileFlag = currentProfileFlag;
        this.onCurrentProfileFlagChanged.next(this.currentProfileFlag);
    }
    exportManagerPayment(): void
    {
        this.setSelectProfileNo(1);
    }
    setCurrentApprover(actionType: string, currentApprover?: HLHorseManagerPaymentApproverModel): void{
        this.actionOfApprover = actionType;
        this.currentApprover = currentApprover;
        if (actionType === 'Add'){
            this.currentApprover = new HLHorseManagerPaymentApproverModel('', {});
        }
        this.onSelectedApproverChanged.next(this.currentApprover);
    }
    setCurrentProvider(actionType: string, currentProvider?: HLHorseManagerProviderModel): void{
        this.actionOfProvider = actionType;
        this.currentProvider = currentProvider;
        if (actionType === 'Add'){
            this.currentProvider = new HLHorseManagerProviderModel('', {});
        }
        this.onSelectedProviderChanged.next(this.currentProvider);
    }
    onChangeEmail(): void{
        this.onChangingEmailEvent.next([]);
    }
    onChangePassword(): void{
        this.onChangingPasswordEvent.next([]);
    }
}
