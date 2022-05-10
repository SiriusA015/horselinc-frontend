import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { delay, filter, take, takeUntil } from 'rxjs/operators';

import { FuseConfigService } from '@fuse/services/config.service';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FusePerfectScrollbarDirective } from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';

import { HLUserModel, HLHorseManagerModel } from 'app/model/users';
import { HLUserType } from 'app/model/enumerations';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';

@Component({
    selector     : 'navbar-vertical-style-1',
    templateUrl  : './style-1.component.html',
    styleUrls    : ['./style-1.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class NavbarVerticalStyle1Component implements OnInit, OnDestroy
{
    fuseConfig: any;
    navigation: any;

    user: HLUserModel;
    userName: string;
    avatarUrl: string;
    userType: string;
    switchProfile: string;

    // Private
    private _fusePerfectScrollbar: FusePerfectScrollbarDirective;
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     * @param {FuseNavigationService} _fuseNavigationService
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {Router} _router
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _fuseNavigationService: FuseNavigationService,
        private _fuseSidebarService: FuseSidebarService,
        private _router: Router,
        private _appService: AppService,
        private _userAuthService: UserAuthService,
    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    // Directive
    @ViewChild(FusePerfectScrollbarDirective, {static: true})
    set directive(theDirective: FusePerfectScrollbarDirective)
    {
        if ( !theDirective )
        {
            return;
        }

        this._fusePerfectScrollbar = theDirective;

        // Update the scrollbar on collapsable item toggle
        this._fuseNavigationService.onItemCollapseToggled
            .pipe(
                delay(500),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe(() => {
                this._fusePerfectScrollbar.update();
            });

        // Scroll to the active item position
        this._router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                take(1)
            )
            .subscribe(() => {
                    setTimeout(() => {
                        this._fusePerfectScrollbar.scrollToElement('navbar .nav-link.active', -120);
                    });
                }
            );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this._router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe(() => {
                    if ( this._fuseSidebarService.getSidebar('navbar') )
                    {
                        this._fuseSidebarService.getSidebar('navbar').close();
                    }
                }
            );

        // Subscribe to the config changes
        this._fuseConfigService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config) => {
                this.fuseConfig = config;
            });

        // Get current navigation
        this._fuseNavigationService.onNavigationChanged
            .pipe(
                filter(value => value !== null),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe(() => {
                this.navigation = this._fuseNavigationService.getCurrentNavigation();
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
     * Toggle sidebar opened status
     */
    toggleSidebarOpened(): void
    {
        this._fuseSidebarService.getSidebar('navbar').toggleOpen();
    }

    /**
     * Toggle sidebar folded status
     */
    toggleSidebarFolded(): void
    {
        this._fuseSidebarService.getSidebar('navbar').toggleFold();
    }
    toggleSidebarOpen(key): void
    {
        this._fuseSidebarService.getSidebar(key).toggleOpen();
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
    onLogOut(): void
    {
    }
}
