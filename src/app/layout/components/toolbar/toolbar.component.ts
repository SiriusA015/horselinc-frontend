import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';

import { FuseConfigService } from '@fuse/services/config.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';

import { HLUserModel, HLHorseManagerModel } from 'app/model/users';
import { HLUserType } from 'app/model/enumerations';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';

@Component({
    selector     : 'toolbar',
    templateUrl  : './toolbar.component.html',
    styleUrls    : ['./toolbar.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ToolbarComponent implements OnInit, OnDestroy
{
    horizontalNavbar: boolean;
    rightNavbar: boolean;
    hiddenNavbar: boolean;
    navigation: any;

    user: HLUserModel;
    userName: string;
    avatarUrl: string;
    userType: string;
    switchProfile: string;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     * @param {FuseSidebarService} _fuseSidebarService
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _fuseSidebarService: FuseSidebarService,
        private _appService: AppService,
        private _router: Router,
        private _userAuthService: UserAuthService,
    )
    {
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
        // Subscribe to the config changes
        this._fuseConfigService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((settings) => {
                this.horizontalNavbar = settings.layout.navbar.position === 'top';
                this.rightNavbar = settings.layout.navbar.position === 'right';
                this.hiddenNavbar = settings.layout.navbar.hidden === true;
            });

        // Get CUrrent User
        this.user = this._userAuthService.hlUser;
        this.userType = this.user.type === HLUserType.manager ? 'Horse manager' : 'Service provider';
        this.userName = this.user.type === HLUserType.manager ? this.user.horseManager.name : this.user.serviceProvider.name;
        this.avatarUrl = this.user.type === HLUserType.manager ? this.user.horseManager.avatarUrl : this.user.serviceProvider.avatarUrl;
        this.switchProfile = this.user.type === HLUserType.manager ? 'Switch To Provider Profile' : 'Switch To Manager Profile';
   
        this._userAuthService.onHLUserChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(user => {
            if (user !== false){
                this.user = new HLUserModel(user.uid, user);
                this.userType = this.user.type === HLUserType.manager ? 'Horse manager' : 'Service provider';
                this.userName = this.user.type === HLUserType.manager ? this.user.horseManager.name : this.user.serviceProvider.name;
                this.avatarUrl = this.user.type === HLUserType.manager ? this.user.horseManager.avatarUrl : this.user.serviceProvider.avatarUrl;
                this.switchProfile = this.user.type === HLUserType.manager ? 'Switch To Provider Profile' : 'Switch To Manager Profile';
            }
        });
    }

    onSwitchProfile(): void
    {
        let userType: HLUserType;
        let typeUri: string;
        let loginUrl: string;
       
        userType = this._appService.curUser.type;
        if (userType === HLUserType.manager)
        {
            userType = HLUserType.provider;
            typeUri = 'provider';
            loginUrl = '/user/register/' + typeUri;
            if (this._userAuthService.hlUser.serviceProvider){
                if (this._userAuthService.hlUser.serviceProvider.userId){
                    loginUrl = '/' + typeUri + '/profile';
                }
            }
        }
        else{
            userType = HLUserType.manager;
            typeUri = 'manager';
            loginUrl = '/user/register/' + typeUri;
            if (this._userAuthService.hlUser.horseManager){
                if (this._userAuthService.hlUser.horseManager.userId){
                    loginUrl = '/' + typeUri + '/profile';
                }
            }
        }

        this._userAuthService.switchUserRole(userType)
        .then((user) => {
            this._router.navigate([loginUrl]);
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

    /**
     * Toggle sidebar open
     *
     * @param key
     */
    toggleSidebarOpen(key): void
    {
        // this._fuseConfigService.config = 
        this._fuseSidebarService.getSidebar(key).toggleOpen();
    }
}
