import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject,  Observable} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';

import { fuseAnimations } from '@fuse/animations';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';

import { HLUserModel, HLHorseManagerModel, HLServiceProviderServiceModel } from 'app/model/users';
import { HLUserType } from 'app/model/enumerations';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { UserServiceProviderService } from 'app/service/user-service-provider.service';
import { ProfileProviderService } from 'app/main/profile/provider/provider.service';
import { UserProviderServicesService } from 'app/service/user-provider-services.service';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

@Component({
    selector     : 'apps-profile-provider-list',
    templateUrl  : './list.component.html',
    styleUrls    : ['./list.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class ProfileProviderListComponent implements OnInit, OnDestroy
{
    selectedProfileNo: number;

    user: HLUserModel;

    avatarUrl: string;
    userName: string;
    phoneNum: string;
    location: string;

    providerServices: HLServiceProviderServiceModel[];

    invoicingFlag: boolean;
    invoicingLabel: string;
    invoicingURL: string;

    instantAmount: number;
    isInstant: boolean;

    winref: any;
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {ActivatedRoute} _activatedRoute
     * @param {ProfileService} _profileService
     * @param {Location} _location
     */
    constructor(
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _profileService: ProfileProviderService,
        private _location: Location,
        private _fuseSidebarService: FuseSidebarService,
        private _appService: AppService,
        private _userAuthService: UserAuthService,
        private _serviceProviderService: UserServiceProviderService,
        private _providerServicesService: UserProviderServicesService,
        private _progressBarService: FuseProgressBarService
    )
    {
        this.invoicingLabel = 'Enable Invoicing';
        this.selectedProfileNo = 2;
        this.providerServices = [];
        this.instantAmount = 0;
        this.isInstant = false;
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this._profileService.onSelectedProfileNoChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(selectedProfileNo => {
            this.selectedProfileNo = selectedProfileNo;
        });

        // Get CUrrent User
        this.user = this._userAuthService.hlUser;
        this.avatarUrl = this.user.serviceProvider.avatarUrl;
        this.userName = this.user.serviceProvider.name;
        this.phoneNum = this.user.serviceProvider.phone;
        this.location = this.user.serviceProvider.location;

        this._userAuthService.onHLUserChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(user => {
            if (user !== false){
                this.user = new HLUserModel(user.uid, user);
                this.avatarUrl = this.user.serviceProvider.avatarUrl;
                this.userName = this.user.serviceProvider.name;
                this.phoneNum = this.user.serviceProvider.phone;
                this.location = this.user.serviceProvider.location;

                this.invoicingFlag = false;
                this.invoicingLabel = 'Enable Invoicing';
                this.invoicingURL = this._appService.invoicingURL + this.user.uid + this._appService.invoicingRedirectURLForProfile;

                if (this.user.serviceProvider.account){
                    if (this.user.serviceProvider.account.externalAccounts){
                        this.invoicingFlag = true;
                        this.invoicingLabel = 'Update Payment Information';
                        this._serviceProviderService.getExpressLoginUrl(this.user.serviceProvider.account.id).then(
                            (response) => {
                                this.invoicingURL = response.result.url;
                            });
                    }
                    this._serviceProviderService.retrieveAccountInfo(this.user.serviceProvider.account.id).then(
                        (response) => {
                            this.instantAmount = response.result.balance.amount / 100.0;
                            this.isInstant = response.result.instant;
                        });
                }
            }
        });

        // Subscribe to update providerServices on changes
        this.providerServices = [];
        this._providerServicesService.onProviderServicesChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(providerServices => {          
                if (providerServices.length > 0){
                    this.providerServices = providerServices;
                }
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    onGoInvoicing(): void{
        if (this.invoicingFlag){
            window.open(this.invoicingURL, 'Stripe', 'dialog=yes,width=1000,height=800');
        }
        else{
            window.location.href = this.invoicingURL;
        }
    }
    getContactHorseLinc(): string{
        return this._appService.contactHorseLinc();
    }
    onSelectedProfile(profileNo: any): void
    {
        this.selectedProfileNo = profileNo; 
        this._profileService.setSelectProfileNo(this.selectedProfileNo);
        this._profileService.setCurrentProfileFlag(true);
    }
    editProfile(): void
    {
        this._fuseSidebarService.getSidebar('profile-provider-editprofile').toggleOpen();
    }
    addServiceProvider(): void
    {
    }
    instantPayout(): void{
        this._fuseSidebarService.getSidebar('profile-provider-instantpayout').toggleOpen();
    }
}
