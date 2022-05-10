import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { AppService } from 'app/service/app.service';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { HLUserModel } from 'app/model/users';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { ScheduleService } from '../schedule.service';
import { Subject } from 'rxjs';
import { HLHorseModel } from 'app/model/horses';
import { AngularFirestore } from '@angular/fire/firestore';
import { HLServiceShowModel } from 'app/model/service-requests';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
@Component({
  selector: 'horse-show-search',
  templateUrl: './horse-show-search.component.html',
  styleUrls: ['./horse-show-search.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class HorseShowSearchComponent implements OnInit, OnDestroy
 {
    userQuestionUpdate = new Subject<string>();
    public userQuestion: string;
    isLogging: boolean;
    user: HLUserModel;
    userId: string;
    horses: HLHorseModel[];
    shows: HLServiceShowModel[];
    baseUrl: string;
    httpOptions: any;
    message: string;
    statue: string;
    display: any;
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _appService: AppService,
        private db: AngularFirestore,
        private _fuseSidebarService: FuseSidebarService,
        private _httpClient: HttpClient,
        private _scheduleService: ScheduleService,
    ) {       
        this._unsubscribeAll = new Subject(); 
    }

    ngOnInit(): void
    {
        this.baseUrl = this._appService.apiUrl;
        this.httpOptions = this._appService.httpOptions;
        this.user = this._appService.getCurUser();
        this.userId = this.user.uid;
        this.shows = [];
        this.horses = [];   
        
        this._scheduleService.onSearchOpen
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(statue => {
                this.userQuestion = '';
                this.statue = statue;   
                this.shows = [];
                this.horses = [];  
        });

        this.userQuestionUpdate.pipe(
            debounceTime(200),
            distinctUntilChanged())
            .subscribe(value => {
                if (value !== '' && value.length >= 3){
                    this.isLogging = true;
                    this.getSearchHorses(value);
                }
            });
    }

    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    getSearchHorses(query): Promise<any>{
        if (this.statue === 'horse'){
            const datas = {
                data: {
                    userId: this.userId,
                    query: query,
                    limit: '',      
                    excludeIds: []
                }
            };

            return new Promise((resolve, reject) => {
                this._httpClient.post(this.baseUrl + '/searchHorses', JSON.stringify(datas), this.httpOptions)
                    .subscribe((response: any) => {
                        if (response.result){
                            this.shows = [];
                            this.horses = response.result;
                        }
                        else{
                            this._appService.showSnackBar('No Result', 'OK');
                        }
                        resolve(this.horses);
                    }, reject);
                });
        }
        if (this.statue === 'show')
        {
            const datas = {
                data: {
                    query: query,
                    limit: '',      
                    lastShowId: ''
                }
            };
            return new Promise((resolve, reject) => {
                this._httpClient.post(this.baseUrl + '/searchServiceShows', JSON.stringify(datas), this.httpOptions)
                    .subscribe((response: any) => {
                        this.isLogging = false;
                        if (response.result){
                            this.horses = [];     
                            this.shows = response.result;
                        }
                        resolve(this.shows);
                    }, reject);
            });
        }
    }

    searchCancel(): void{
        this._fuseSidebarService.getSidebar('horse-show-search-panel').toggleOpen();
    }

    getCurrentProviderHorse(uid): void{
        let currentProviderHorse: HLHorseModel;
        currentProviderHorse = this.horses.find(horse => {
            return( horse.uid === uid);
        });
        this._scheduleService.onCurrentProviderHorse.next(currentProviderHorse);
        this._fuseSidebarService.getSidebar('horse-show-search-panel').toggleOpen();
        this._fuseSidebarService.getSidebar('schedule-assign-panel').toggleOpen();

    }
    getCurrentShow(uid): void{
        let currentShow: HLServiceShowModel;
        currentShow = this.shows.find(show => {
            return( show.uid === uid);
        });
        this._scheduleService.onCurrentShowsChange.next(currentShow);
        this.userQuestion =  '';
        this.shows = [];
        this._fuseSidebarService.getSidebar('horse-show-search-panel').toggleOpen();
    }
}
