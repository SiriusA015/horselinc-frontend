import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { MatSnackBar, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material';

import { FuseConfigService } from '@fuse/services/config.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { ConfirmDlgComponent } from 'app/main/@shared/confirm-dlg/confirm-dlg.component';

import { HLUserModel, HLHorseManagerModel, HLHorseManagerProviderModel} from 'app/model/users';

import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { UserManagerProvidersService } from 'app/service/user-manager-providers.service';

import { ProfileManagerService } from 'app/main/profile/manager/manager.service';
// interface Horse

@Component({
    selector   : 'apps-profile-manager-provider',
    templateUrl: './provider.component.html',
    styleUrls  : ['./provider.component.scss']
})
export class ProfileManagerProviderComponent implements OnInit, OnDestroy{
    user: HLUserModel;

    avatarUrl: string;
    userName: string;
    barnName: string;
    phoneNum: string;
    location: string;
    managerProviders: HLHorseManagerProviderModel[];
    managerProvidersSort = new Map();
    managerProvidersSort1: any;

    // Private
    private _unsubscribeAll: Subject<any>;
    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     */
    constructor(
        private _matDialog: MatDialog,
        private _fuseConfigService: FuseConfigService,
        private _fuseSidebarService: FuseSidebarService,
        private _userAuthService: UserAuthService,
        private _horseManagerService: UserHorseManagerService,
        private _managerProvidersService: UserManagerProvidersService,
        private _profileManagerService: ProfileManagerService
    )
    {
        this.managerProviders = [];
        this.managerProvidersSort = new Map();
        this.managerProvidersSort1 = [];
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void{

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

        this._managerProvidersService.onManagerProvidersChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(managerProviders => {
            this.managerProviders = [];
            this.managerProvidersSort = new Map();
            if (managerProviders.length > 0){
                this.managerProviders = managerProviders;
                this.managerProviders.forEach((element) => {

                    let providerSort: HLHorseManagerProviderModel[];
                    if (this.managerProvidersSort.get(element.serviceType) == null){
                        providerSort = [];
                        this.managerProvidersSort.set(element.serviceType, providerSort);
                    }
                    this.managerProvidersSort.get(element.serviceType).push(element);    
                });
            }
            this.managerProvidersSort1 = Array.from(this.managerProvidersSort);
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
    onDeleteProvider(managerProvider: HLHorseManagerProviderModel): void{
        const event = {
            title: 'HorseLinc',
            msg: 'Are you sure you want to delete?',
            btn1Name: 'No',
            btn2Name: 'Yes'
        }
        const dialogRef = this._matDialog.open(ConfirmDlgComponent, {
            disableClose: true,
            panelClass: 'confirmDlg',
            data: {event: event}
        });

        dialogRef.afterClosed().subscribe((action: any) => {
            if (action == event.btn2Name) {
                this._managerProvidersService.deleteManagerProvider(managerProvider);
            }
            else
            {
            }
        });
    }
    editProfile(): void
    {
        this._fuseSidebarService.getSidebar('profile-manager-editprofile').toggleOpen();
    }
    addServiceProvider(): void
    {
        this._profileManagerService.setCurrentProvider('Add');
        this._fuseSidebarService.getSidebar('profile-manager-addprovider').toggleOpen();
    }
}
