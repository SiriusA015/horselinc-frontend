import { Component, OnInit, Pipe } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';

import { HLUserModel, HLServiceProviderModel, HLHorseManagerModel, HLHorseManagerProviderModel} from 'app/model/users';
import { HLSettingsModel, HLHorseServiceTypeModel } from 'app/model/settings';

import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { UserManagerProvidersService } from 'app/service/user-manager-providers.service';

import { ProfileManagerService } from 'app/main/profile/manager/manager.service';
import { AppService } from 'app/service/app.service';

@Component({
  selector: 'profile-manager-addprovider',
  templateUrl: './add-provider.component.html',
  styleUrls: ['./add-provider.component.scss']
})
export class ProfileManagerAddProviderComponent implements OnInit {
    currentProvider: HLHorseManagerProviderModel;
    managerProviders: HLHorseManagerProviderModel[];
    serviceProvider: HLServiceProviderModel;

    avatarUrl: string;
    userName: string;
    serviceType: string;
    customType: string;
    customTypeFlag: boolean;

    message: string;
    isProcessing: boolean;

    // Private
    private _unsubscribeAll: Subject<any>;

  constructor(
    private _fuseSidebarService: FuseSidebarService,
    private _appService: AppService,
    private _userAuthService: UserAuthService,
    private _horseManagerService: UserHorseManagerService,
    private _managerProvidersService: UserManagerProvidersService,
    private _profileManagerService: ProfileManagerService
    )
    {
        this.serviceType = '';
        this.customTypeFlag = false;
        this.customType = '';
        this.isProcessing = false;

        this._unsubscribeAll = new Subject();
    }

    ngOnInit(): void{

        this._managerProvidersService.onManagerProvidersChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(managerProviders => {
            this.managerProviders = managerProviders;
        });

        this._profileManagerService.onSelectedProviderChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(provider => {
            this.currentProvider = provider;

            this.avatarUrl = this.currentProvider.avatarUrl;
            this.userName = this.currentProvider.name;
            this.serviceType = this.currentProvider.serviceType;

            this.serviceType = '';
            this.customTypeFlag = false;
            this.customType = '';
            this.isProcessing = false;
            this.serviceProvider = new HLServiceProviderModel({});
        });

        this.userName = 'Search for Provider';
        this._horseManagerService.onSearchServiceProvider
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(serviceProvider => {

            if (serviceProvider.name){
                this.serviceProvider = new HLServiceProviderModel(serviceProvider);
                this.avatarUrl = this.serviceProvider.avatarUrl;
                this.userName = this.serviceProvider.name;
            }
            else{
                this.userName = 'Search for Provider';
            }
            this.message = '';
        });
    }
    getServiceTypes(): any{
        let serviceTypes: HLHorseServiceTypeModel[];

        if (this._appService.settings){
            serviceTypes = this._appService.settings.serviceTypes;
        }
        
        return serviceTypes;
    }
    onServiceTypeChange(): void{
        this.customTypeFlag = this.serviceType === 'other';
    }
    checkForm(): boolean{
        let bRet = true;
        let serviceType = this.serviceType;

        if (this.customTypeFlag){
            serviceType = this.customType;
        }
        if (!this.serviceProvider){
            this.message = 'Please select service provider';
            bRet = false;
        }
        else if (!this.serviceProvider.userId){
            this.message = 'Please select service provider';
            bRet = false;
        }
        else if (this._horseManagerService.findServiceProvider(this.serviceProvider.userId)){
            this.message = 'Please select service provider';
            bRet = false;
        }
        if (serviceType === ''){
            this.message = 'Please select service type';
            bRet = false;
        }
        if (!bRet){
            this._appService.showSnackBar(this.message, 'FAIL');
        }

        return bRet;
    }

    onAddProvider(): void{
        if (this.isProcessing){
            return;
        }
        const serviceType = this.serviceType;
        if ( !this.checkForm() ){
            return;
        }

        this.isProcessing = true;
        this._managerProvidersService.addManagerProvider(serviceType, this.serviceProvider)
        .then(() => {
                this.isProcessing = true;
                this.closePanel();
            })
        .catch((error) => {
            this.isProcessing = false;
            });
            
    }

    closePanel(): void{
        this._fuseSidebarService.getSidebar('profile-manager-addprovider').close();
    }
    searchProvider(): void{
        this.closePanel();
        this._fuseSidebarService.getSidebar('profile-manager-searchprovider').open();
    }
}
