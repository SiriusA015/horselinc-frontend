import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { AppService } from 'app/service/app.service';
import { HttpClient} from '@angular/common/http';
import { HLUserModel } from 'app/model/users';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { PaymentProviderService } from '../../payment-provider.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { HLServiceShowModel } from 'app/model/service-requests';
import { HLHorseModel } from 'app/model/horses';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

@Component({
  selector: 'add-new-service',
  templateUrl: './add-new-service.component.html',
  styleUrls: ['./add-new-service.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddNewServiceComponent implements OnInit, OnDestroy {

    currentSearchType: string;
    user: HLUserModel;
    userId: string;
    horse: HLHorseModel;
    horses: HLHorseModel[];
    shows: HLServiceShowModel[];
    baseUrl: string;
    httpOptions: any;
    message: string;
    display: string;
    isLogging: boolean;
    userQuestionUpdate = new Subject<string>();
    public userQuestion: string;
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _appService: AppService,
        private db: AngularFirestore,
        private _fuseSidebarService: FuseSidebarService,
        private _httpClient: HttpClient,
        private _paymentProviderService: PaymentProviderService,
        private _progressBarService: FuseProgressBarService,
    ) 
    {       
        this._unsubscribeAll = new Subject(); 
        this.baseUrl = this._appService.apiUrl;
        this.httpOptions = this._appService.httpOptions;
        this.user = this._appService.getCurUser();
        this.userId = this.user.uid;
        this.shows = [];
        this.horse = null;
        this.horses = [];
        this.currentSearchType = 'horse';
        this.display = 'Search by horse barn name';
    }

    ngOnInit(): void
    {
        this.shows = [];
        this.horses = [];

        this._paymentProviderService.onSearchType
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(type => {
            this.currentSearchType = type;
            if (this.currentSearchType == 'horse'){
                this.display = 'Search by horse barn name';
            } else{
                this.display = 'Search for Show by Title';
            } 
            this.shows = [];
            this.horses = [];
            this.userQuestion = '';
        });

        this.userQuestionUpdate.pipe(
            debounceTime(200),
            distinctUntilChanged())
            .subscribe(value => {
                if (value !== '' && value.length >= 3){
                    this.isLogging = true;
                    this.getSearch(value);
                }
            });
    }

    ngOnDestroy(): void{
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    getSearch(query): Promise<any>{
        if (this.currentSearchType === 'show')
        {
            const datas = {
                data: {
                    query: query,
                    limit: '',      
                    lastShowId: ''
                }
            };

            // this._progressBarService.beginLoading2();
            return new Promise((resolve, reject) => {
                this._httpClient.post(this.baseUrl + '/searchServiceShows', JSON.stringify(datas), this._appService.httpOptions)
                    .subscribe((response: any) => {
                        
                        if (response.result){
                            // this.horses = [];     
                            this.shows = response.result;
                        }   
                        this.isLogging = false;
                        resolve(this.shows);

                        // this._progressBarService.endLoading2();
                    }, reject);
            });
        } else{
            this._paymentProviderService.getHosreList(query)
            .then(result => {
                if (result && result != false){
                    
                    this.horses = result;
                }
                this.isLogging = false;
            });
        }
    }

    searchCancel(): void{
        this._fuseSidebarService.getSidebar('payment-provider-showSearch-panel').toggleOpen();
        this._fuseSidebarService.getSidebar('payment-provider-create-panel').toggleOpen();
        this.shows = [];
        this.userQuestion = '';
    }

    getCurrentProviderHorse(uid): void{

        let currentProviderHorse: HLHorseModel;
        
        currentProviderHorse = this.horses.find(horse => {
            return( horse.uid === uid);
        });
        
        this._paymentProviderService.setSearchHorse(currentProviderHorse);

        this._fuseSidebarService.getSidebar('payment-provider-showSearch-panel').toggleOpen();
        this._fuseSidebarService.getSidebar('payment-provider-create-panel').toggleOpen();

    }
    getCurrentShow(uid): void{

        let currentShow: HLServiceShowModel;
        
        currentShow = this.shows.find(show => {
            return( show.uid === uid);
        });
        
        this._paymentProviderService.onCurrentShowsChange.next(currentShow);

        this._fuseSidebarService.getSidebar('payment-provider-showSearch-panel').toggleOpen();
        this._fuseSidebarService.getSidebar('payment-provider-create-panel').toggleOpen();

        this.shows = [];
        this.userQuestion = '';

    }

    onNewHorse(): void{
        this._fuseSidebarService.getSidebar('invoice-horse-profile-panel').toggleOpen();
        this._fuseSidebarService.getSidebar('payment-provider-showSearch-panel').close();
    }
}
