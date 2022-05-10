import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';

import { HLUserModel, HLHorseManagerModel } from 'app/model/users';
import { HLUserType } from 'app/model/enumerations';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';

import { ProfileManagerService } from 'app/main/profile/manager/manager.service';

@Component({
    selector     : 'apps-profile-manager-list',
    templateUrl  : './list.component.html',
    styleUrls    : ['./list.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class ProfileManagerListComponent implements OnInit, OnDestroy{
    selectedProfileNo: number;
    
    user: HLUserModel;

    avatarUrl: string;
    userName: string;
    barnName: string;
    phoneNum: string;
    location: string;

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
        private _activatedRoute: ActivatedRoute,
        private _location: Location,
        private _profileService: ProfileManagerService,
        private _fuseSidebarService: FuseSidebarService,
        private _appService: AppService,
        private _userAuthService: UserAuthService,
        private _profileManagerService: ProfileManagerService
    )
    {
        this.selectedProfileNo = 0;
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

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
        this.avatarUrl = this.user.horseManager.avatarUrl;
        this.userName = this.user.horseManager.name;
        this.barnName = this.user.horseManager.barnName;
        this.phoneNum = this.user.horseManager.phone;
        this.location = this.user.horseManager.location;

        this._userAuthService.onHLUserChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(user => {
            if (user !== false){
                this.user = new HLUserModel(user.uid, user);
                this.avatarUrl = this.user.horseManager.avatarUrl;
                this.userName = this.user.horseManager.name;
                this.barnName = this.user.horseManager.barnName;
                this.phoneNum = this.user.horseManager.phone;
                this.location = this.user.horseManager.location;
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
    onSelectedProfile(profileNo: any): void
    {
        this.selectedProfileNo = profileNo; 
        this._profileService.setSelectProfileNo(this.selectedProfileNo);
        this._profileService.setCurrentProfileFlag(true);
    }
    editProfile(): void
    {
        this._fuseSidebarService.getSidebar('profile-manager-editprofile').toggleOpen();
    }
    getContactHorseLinc(): string{
        return this._appService.contactHorseLinc();
    }
}
