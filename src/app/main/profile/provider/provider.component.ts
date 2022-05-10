import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { FuseConfigService } from '@fuse/services/config.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { ProfileProviderService } from 'app/main/profile/provider/provider.service';

import { HLUserModel, HLServiceProviderModel } from 'app/model/users';
import { HLUserType } from 'app/model/enumerations';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserServiceProviderService } from 'app/service/user-service-provider.service';
import { UserProviderServicesService } from 'app/service/user-provider-services.service';

@Component({
    selector     : 'apps-profile-provider',
    templateUrl  : './provider.component.html',
    styleUrls    : ['./provider.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ProfileProviderComponent implements OnInit, OnDestroy
{
    selectedProfileNo: number;
    currentProfileFlag: boolean;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {ProfileService} _profileService
     */
    constructor(
        private _fuseSidebarService: FuseSidebarService,
        private _profileService: ProfileProviderService,
        private _appService: AppService,
        private _userAuthService: UserAuthService,
        private _serviceProviderService: UserServiceProviderService,
        private _providerServicesService: UserProviderServicesService,
        private _fuseConfigService: FuseConfigService,
    )
    
    // Configure the layout
    { 
        this.selectedProfileNo = 2;
        this.currentProfileFlag = false;
        this._unsubscribeAll = new Subject();

        this._fuseConfigService.config = {
            layout: {
                navbar   : {
                    hidden: false
                },
                toolbar  : {          
                    hidden: false
                },
                footer   : {
                    hidden: true
                },
                sidepanel: {
                    hidden: true
                }
            }
        };
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void{
        // Configure the layout

        this._profileService.onSelectedProfileNoChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(selectedProfileNo => {
            this.selectedProfileNo = selectedProfileNo;
        });

        this._profileService.onCurrentProfileFlagChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(currentProfileFlag => {
            this.currentProfileFlag = currentProfileFlag;
        });
  }
    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    gotoList(): void
    {
        this._profileService.setCurrentProfileFlag(false);
    }
}
