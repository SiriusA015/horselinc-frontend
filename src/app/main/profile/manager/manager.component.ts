import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { DataSource } from '@angular/cdk/collections';

import { FuseConfigService } from '@fuse/services/config.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { ProfileManagerService } from 'app/main/profile/manager/manager.service';

import { HLUserModel, HLHorseManagerModel } from 'app/model/users';
import { HLUserType } from 'app/model/enumerations';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { UserManagerProvidersService } from 'app/service/user-manager-providers.service';

@Component({
    selector     : 'apps-profile-manager',
    templateUrl  : './manager.component.html',
    styleUrls    : ['./manager.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ProfileManagerComponent implements OnInit, OnDestroy
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
        private _profileService: ProfileManagerService,
        private _appService: AppService,
        private _userAuthService: UserAuthService,
        private _horseManagerService: UserHorseManagerService,
        private _managerProvidersService: UserManagerProvidersService,
        private _fuseConfigService: FuseConfigService,

    ){ 
        // Set the private defaults
        this._unsubscribeAll = new Subject();

        this.selectedProfileNo = 0;
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
    ngOnDestroy(): void{
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    gotoList(): void{
        this._profileService.setCurrentProfileFlag(false);
    }
}
