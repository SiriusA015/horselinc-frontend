import { Component, OnInit, Pipe } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { PaymentManagerService } from '../payment-manager.service';
import {AppService} from 'app/service/app.service';

@Component({
  selector: 'payment-manager-search-provider',
  templateUrl: './search-provider.component.html',
  styleUrls: ['./search-provider.component.scss']
})
export class PaymentManagerSearchProviderComponent implements OnInit {
   
    serviceProviders: [];
    currentProviderId: string;
    userQuestionUpdate = new Subject<string>();
    public userQuestion: string;
    findErr: boolean;
    horses: [];
    searchType: string;
    title: string;
    isLogging: boolean;

    private _unsubscribeAll: Subject<any>;

    constructor(
        private _fuseSidebarService: FuseSidebarService,
        private _userAuthService: UserAuthService,
        private _paymentManagerService: PaymentManagerService,
        private _AppService: AppService,
        ) {
            this.findErr = false;
            this.title = 'Service provider';
            this.searchType = 'provider';
            this._unsubscribeAll = new Subject();
            this.serviceProviders = [];
            this.horses = [];
        }

    ngOnInit(): void{

        this._paymentManagerService.onSearchType
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(searchType => {
                this.searchType = searchType;
                if ( searchType === 'provider'){
                    this.title = 'Service provider';
                } 
                else {
                    this.title = 'Horse';
                } 
        });

        this._paymentManagerService.onProviderIdChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(provider => {
                this.currentProviderId = provider;
        });

        this._paymentManagerService.onSearchServiceProviders
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(serviceProviders => {
                if ( serviceProviders && serviceProviders.length > 0) {
                    this.findErr = true;
                }
                this.isLogging = false;
                this.serviceProviders = serviceProviders;
        });

        this._paymentManagerService.onSearchHorses
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(horses => {
                this.isLogging = false;
                this.horses = horses;
        });

        this.userQuestionUpdate.pipe(
            debounceTime(200),
            distinctUntilChanged())
            .subscribe(value => {
                if (value !== '' && value.length >= 3){
                    this.isLogging = true;
                    this.searchCurrent(value);
                }
            });
    }

    searchCurrent(query): void{
        const userId = this._AppService.getCurUser().uid;

        if (this.searchType === 'provider'){
            this._paymentManagerService.searchServiceProviders(query);
        } 
        else {
            this._paymentManagerService.searchHorses(query, userId)
            .then(() => {
            });
        }
    }

    selectServiceProvider(serviceProvider: any): void{
        this.currentProviderId = serviceProvider.uid;
        this._paymentManagerService.setSearchServiceProvider(serviceProvider);
        this.closePanel();
    }

    selectHorse(horse: any): void{
        this._paymentManagerService.setSearchHorse(horse);
        this.closePanel();
    }

    closePanel(): void{
        this.findErr = false;
        this.serviceProviders = [];
        this.userQuestion = '';
        this.horses = [];
        this._fuseSidebarService.getSidebar('payment-manager-searchprovider').close();
        this._fuseSidebarService.getSidebar('payment-manager-export-invoice').open();
    }

    getInviteHorseLinc(): string{
        return this._AppService.inviteHorseLinc();
    }
}
