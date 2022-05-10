import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { FuseUtils } from '@fuse/utils';
import { HLUserModel, HLHorseManagerModel, HLHorseManagerPaymentApproverModel, HLHorseManagerProviderModel } from 'app/model/users';

@Injectable()
export class UserService implements Resolve<any>
{
    routeParams: any;

    userEmail: string;
    userPassword: string;

    paymentInfoShow: boolean;
    paymentApproverShow: boolean;

    onSelectedApproverChanged: BehaviorSubject<any>;
    actionOfApprover: string;
    currentApprover: HLHorseManagerPaymentApproverModel;

    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     */
    constructor(
        private _httpClient: HttpClient,
        private _router: Router,
    )
    {
        this.userEmail = '';
        this.userPassword = '';

        // Set the defaults
        this.paymentInfoShow = false;
        this.paymentApproverShow = false;
        
        this.actionOfApprover = 'Add';
        this.onSelectedApproverChanged = new BehaviorSubject([]);
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
    setCurrentApprover(actionType: string, currentApprover?: HLHorseManagerPaymentApproverModel): void{
        this.actionOfApprover = actionType;
        this.currentApprover = currentApprover;
        if (actionType === 'Add'){
            this.currentApprover = new HLHorseManagerPaymentApproverModel('', {});
        }
        this.onSelectedApproverChanged.next(this.currentApprover);
    }
}
