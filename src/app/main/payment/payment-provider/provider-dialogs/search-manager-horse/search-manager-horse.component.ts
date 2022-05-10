import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { PaymentProviderService } from '../../payment-provider.service';
import { AppService } from 'app/service/app.service';

@Component({
  selector: 'payment-provider-search-manager',
  templateUrl: './search-manager-horse.component.html',
  styleUrls: ['./search-manager-horse.component.scss']
})
export class PaymentProviderSearchManagerComponent implements OnInit {

    horseManagers: [];
    currentManagerId: string;
    userQuestionUpdate = new Subject<string>();
    public userQuestion: string;
    findErr = false;

    horses: [];
    searchType = 'manager';
    title = 'Horse Manager';
    isLogging: boolean;

    private _unsubscribeAll: Subject<any>;

    constructor(
        private _fuseSidebarService: FuseSidebarService,
        private _userAuthService: UserAuthService,
        private _paymentProviderService: PaymentProviderService,
        private _appService: AppService
        ) {
            this._unsubscribeAll = new Subject();
            this.horseManagers = [];
            this.horses = [];
        }

    ngOnInit(): void{
        this._paymentProviderService.onSearchType
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(searchType => {
                this.searchType = searchType;
                if (searchType == 'manager'){
                    this.title = 'Horse Manager';
                } 
                else {
                    this.title = 'Horse';
                }
        });

        this._paymentProviderService.onProviderIdChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(managerId => {
                this.currentManagerId = managerId;
        });

        this._paymentProviderService.onSearchServiceProviders
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(managers => {
                if (managers && managers.length > 0) {
                    this.findErr = true;
                }
                this.isLogging = false;
                this.horseManagers = managers;
        });

        this._paymentProviderService.onSearchHorses
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
        const userId = this._appService.getCurUser().uid;

        if (this.searchType == 'manager') {
            this._paymentProviderService.searchServiceProviders(query);
        }
        else {
            this._paymentProviderService.searchHorses(query, userId)
            .then(() => {
            });
        }
    }

    selectServiceProvider(serviceProvider: any): void{
        this.currentManagerId = serviceProvider.uid;
        this._paymentProviderService.setSearchServiceProvider(serviceProvider);
        this.closePanel();
    }

    selectHorse(horse: any): void{
        this._paymentProviderService.setSearchHorse(horse);
        this.closePanel();
    }

    closePanel(): void{
        this.findErr = false;
        this.horseManagers = [];
        this.isLogging = false;
        this.userQuestion = '';
        this.horses = [];
        this._fuseSidebarService.getSidebar('payment-provider-searchmanager').close();
        this._fuseSidebarService.getSidebar('payment-provider-export-invoice').open();
    }

    getInviteHorseLinc(): string{
        return this._appService.inviteHorseLinc();
    }
}
