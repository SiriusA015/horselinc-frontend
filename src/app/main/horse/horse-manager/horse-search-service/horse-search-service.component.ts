import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { takeUntil, debounceTime, distinctUntilChanged  } from 'rxjs/operators';
import { AppService } from 'app/service/app.service';
import { HLHorseManagerProviderModel} from 'app/model/users';
import { UserManagerProvidersService } from 'app/service/user-manager-providers.service';
@Component({
  selector: 'horse-search-service',
  templateUrl: './horse-search-service.component.html',
  styleUrls: ['./horse-search-service.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HorseSearchServiceComponent implements OnInit {
   
    serviceType = 'All Payments';
    serviceProviders: [];
    item: string;
    Title: string;
    userQuestion: string = '';
    isLogging: boolean;
    findErr: boolean = false;
    baseUrl: string;
    httpOptions: any;
    user: any;
    userId: string;
    managerProviders: HLHorseManagerProviderModel[];
    managerProvider: HLHorseManagerProviderModel;
    userQuestionUpdate = new Subject<string>();

    private _unsubscribeAll: Subject<any>;

    constructor(
        private _fuseSidebarService: FuseSidebarService,
        private _horseManagerService: HorseManagerService,
        private _AppService: AppService,
        private _managerProvidersService: UserManagerProvidersService,
        private _appService: AppService,
    ) 
    {
        this._unsubscribeAll = new Subject();
        this.serviceProviders = [];
    }

    ngOnInit(): void {
        this.baseUrl = this._appService.apiUrl;
        this.httpOptions = this._appService.httpOptions;
        this.user = this._appService.getCurUser();
        this.userId = this.user.uid;
        this.userQuestion = '';
        this._horseManagerService.onSearchSelectItem
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(item => {
            this.item = item; 
            this.serviceProviders = [];

            switch (this.item) {
                case 'provider':
                    this.Title = ' Service Provider ';
                    break;
                case 'trainer':
                    this.Title = ' Trainer ';
                    break;
                case 'owner':
                    this.Title = ' Owner ';
                    break;
                case 'leaser':
                    this.Title = ' Leaser ';
                    break;
              }
        });

        this._managerProvidersService.onManagerProvidersChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(managerProviders => {
          
            this.managerProviders = [];
            if (managerProviders.length > 0){
               
                this.managerProviders = managerProviders;
            }
        });

        this._horseManagerService.onSearchManagerProvider
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(serviceProviders => {

                this.serviceProviders = serviceProviders;
                if (serviceProviders && serviceProviders != false){  
                    if (this.item == 'leaser'){
                        this.serviceProviders = serviceProviders.filter(manager => { return manager.userId != this.userId });
                    }
                    else{
                        this.serviceProviders = serviceProviders;
                    }
                    this.isLogging = false;
                    this.findErr = false; 
                }
                else
                {
                    this.isLogging = false;
                    this.findErr = true; 
                }
        });

        this.userQuestionUpdate.pipe(
            debounceTime(200),
            distinctUntilChanged())
            .subscribe(value => {
                if (value !== '' && value.length >= 3){
                    this.isLogging = true;
                    this.findErr = false; 
                    this.searchCurrent(value);
                }
            });
    }
    
    searchCurrent(query: any): void{
        switch (this.item) {
            case 'provider':
                this._horseManagerService.getServiceProvider(query);
                break;
            case 'trainer':
                this._horseManagerService.getManagerTrainer(query);
                break;
            case 'owner':
                this._horseManagerService.getManagerTrainer(query);
                break;
            case 'leaser':
                this._horseManagerService.getManagerTrainer(query);
                break;
          }
    }

    selectServiceProvider(userId: string): void{
        switch (this.item) {
            case 'provider':    
                this._horseManagerService.setSearchServiceProvider(userId);
                break;
            case 'trainer':
                this._horseManagerService.setSearchHorseTrainer(userId);
                break;
            case 'owner':
                this._horseManagerService.setSearchHorseOwner(userId);
                break;
            case 'leaser':
                this._horseManagerService.setSearchHorseLeaser(userId);
                break;
          }
        this.closePanel();
    }

    selectManagerProvider(userId: string): void{
        this._horseManagerService.setSearchServiceProvider(userId);
        this.managerProvider = this.managerProviders.find(provider => {
            return provider.userId === userId;
        });
        this._horseManagerService.getServiceProviderService(userId).then(services => {
            this._horseManagerService.onServiceProviderServices.next(services);
            this._horseManagerService.onCurrentServiceProvider.next(this.managerProvider);    
        }); 
        this.closePanel();
    }

    closePanel(): void{
        this.userQuestion = '';
        this.findErr = false;
        this._fuseSidebarService.getSidebar('horse-search-service-panel').toggleOpen();
    }
    getInviteHorseLinc(): string{
        return this._AppService.inviteHorseLinc();
    }
}
