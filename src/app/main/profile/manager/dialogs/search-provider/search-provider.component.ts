import { Component, OnInit, Pipe } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { HLUserModel, HLHorseManagerModel, HLHorseManagerProviderModel} from 'app/model/users';
import { HLUserType } from 'app/model/enumerations';

import { AppService } from 'app/service/app.service'
import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { UserManagerProvidersService } from 'app/service/user-manager-providers.service';

import { ProfileManagerService } from 'app/main/profile/manager/manager.service';

@Component({
  selector: 'profile-manager-searchprovider',
  templateUrl: './search-provider.component.html',
  styleUrls: ['./search-provider.component.scss']
})
export class ProfileManagerSearchProviderComponent implements OnInit {
   
    serviceProviders: [];
    userQuestionUpdate = new Subject<string>();
    public userQuestion: string;
    
    private _unsubscribeAll: Subject<any>;

  constructor(
    private _fuseSidebarService: FuseSidebarService,
    private _appService: AppService,
    private _userAuthService: UserAuthService,
    private _horseManagerService: UserHorseManagerService,
    private _managerProvidersService: UserManagerProvidersService,
    private _profileManagerService: ProfileManagerService
    ) {
        this._unsubscribeAll = new Subject();
        this.serviceProviders = [];
    }

    ngOnInit(): void{
        this._horseManagerService.onSearchServiceProviders
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(serviceProviders => {
            this.serviceProviders = serviceProviders;
        });
        this._profileManagerService.onSelectedProviderChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(provider => {
            this.userQuestion = '';
        });


        this.userQuestionUpdate.pipe(
            debounceTime(200),
            distinctUntilChanged())
            .subscribe(value => {
                if (value !== '' && value.length >= 3){
                    this.searchCurrent(value);
                }
            });
    }
    searchCurrent(query): void{
        this._horseManagerService.searchServiceProviders(query);
    }
    selectServiceProvider(serviceProvider: any): void{
        this._horseManagerService.setSearchServiceProvider(serviceProvider);
        this.closePanel();
    }
    closePanel(): void{
    this._fuseSidebarService.getSidebar('profile-manager-searchprovider').close();
    this._fuseSidebarService.getSidebar('profile-manager-addprovider').open();
    }

    getInviteHorseLinc(): string{
        return this._appService.inviteHorseLinc();
    }
}
