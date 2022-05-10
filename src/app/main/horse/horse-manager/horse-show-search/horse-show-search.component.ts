import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { AppService } from 'app/service/app.service';
import { HttpClient } from '@angular/common/http';
import { HLUserModel } from 'app/model/users';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged  } from 'rxjs/operators';
import { HLHorseModel } from 'app/model/horses';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material';
import { HLServiceShowModel } from 'app/model/service-requests';
import { HorseManagerService } from 'app/service/horse-manager.service';


@Component({
  selector: 'horse-show-search',
  templateUrl: './horse-show-search.component.html',
  styleUrls: ['./horse-show-search.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class HorseShowSearchComponent implements OnInit, OnDestroy
 {

    user: HLUserModel;
    userId: string;
    horses: HLHorseModel[];
    shows: HLServiceShowModel[];
    baseUrl: string;
    httpOptions: any;
    message: string;
    statue: string;
    display: any;
    userQuestionUpdate = new Subject<string>();
    userQuestion: string;
    isLogging: boolean;
    findErr: boolean;

    private _unsubscribeAll: Subject<any>;

    constructor(

            private _appService: AppService,
            private db: AngularFirestore,
            private _fuseSidebarService: FuseSidebarService,
            private _httpClient: HttpClient,
            private _horseManagerService: HorseManagerService,
            private _matSnackBar: MatSnackBar, 
    ) 
    {       
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
        this._horseManagerService.onSearchOpen
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(statue => {

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
                        
                        this.shows = [];
                        this.isLogging = false;
                        this.horses = response.result;
                        if (response.result.length > 0 && response != false){
               
                            this.findErr = false;
                        }
                        else
                        {
                            this.findErr = true;
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
                        
                            this.horses = [];     
                            this.isLogging = false;
                            this.shows = response.result;
                            if (response.result.length > 0 && response != false){
               
                                this.findErr = false;
                            }
                            else
                            {
                                this.findErr = true;
                            }
                        resolve(this.shows);

                    }, reject);
            });

        }
 
    }

    searchCancel(): void{
        //this._horseProviderService.onSearchOpen.next('horse');
        this._fuseSidebarService.getSidebar('horse-show-search-panel').toggleOpen();
    }

    getCurrentProviderHorse(uid): void{

        // console.log('this is uid', uid);
        let currentProviderHorse: HLHorseModel;
        
        currentProviderHorse = this.horses.find(horse => {
            return( horse.uid === uid);
        });
        
        this._horseManagerService.onCurrentProviderHorse.next(currentProviderHorse);
        this.userQuestion = '';
        this.findErr = false;
        this._fuseSidebarService.getSidebar('horse-show-search-panel').toggleOpen();
        // this._fuseSidebarService.getSidebar('horse-manager-schedule-panel').toggleOpen();

    }
   
    getCurrentShow(uid): void{

        // console.log('this is trainer uid', uid);
        let currentShow: HLServiceShowModel;
        
        currentShow = this.shows.find(show => {
            return( show.uid === uid);
        });
        
        this._horseManagerService.onCurrentShowsChange.next(currentShow);
        this.userQuestion = '';
        this.findErr = false;
        this._fuseSidebarService.getSidebar('horse-show-search-panel').toggleOpen();
       // this._fuseSidebarService.getSidebar('horse-manager-schedule-panel').toggleOpen();

    }

    
}
