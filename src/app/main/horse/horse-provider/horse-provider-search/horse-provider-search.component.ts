import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { AppService } from 'app/service/app.service';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { UserAuthService } from 'app/service/user-auth.service';
import { HLUserModel } from 'app/model/users';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { HorseProviderService } from 'app/service/horse-provider.service';
import { Subject } from 'rxjs';
import { HLHorseModel } from 'app/model/horses';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { HLHorseManagerModel } from 'app/model/users';
import { MatSnackBar, MatDialogRef, MatDialog } from '@angular/material';
import { HLServiceShowModel } from 'app/model/service-requests';
import { takeUntil, debounceTime, distinctUntilChanged  } from 'rxjs/operators';

@Component({
  selector: 'horse-provider-search',
  templateUrl: './horse-provider-search.component.html',
  styleUrls: ['./horse-provider-search.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HorseProviderSearchComponent implements OnInit {

    user: HLUserModel;
    userId: string;
    horses: HLHorseModel[];
    shows: HLServiceShowModel[];
    baseUrl: string;
    httpOptions: any;
    message: string;
    statue: string;
    display: any;
    Title: string;
    userQuestionUpdate = new Subject<string>();
    userQuestion: string = '';
    isLogging: boolean;
    findErr: boolean = false;
    //currentProviderHorse: HLHorseModel;

    private _unsubscribeAll: Subject<any>;

    constructor(

            private _appService: AppService,
            private db: AngularFirestore,
            private _fuseSidebarService: FuseSidebarService,
            private _httpClient: HttpClient,
            private _horseProviderService: HorseProviderService,
            private _matSnackBar: MatSnackBar, 
    ) 
    {       
            this._unsubscribeAll = new Subject(); 
            this.baseUrl = this._appService.apiUrl;
            this.httpOptions = this._appService.httpOptions;
            this.user = this._appService.getCurUser();
            this.userId = this.user.uid;  
    }

    ngOnInit(): void
    {
        this._horseProviderService.onSearchOpen
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(statue => {

                this.statue = statue;    
                this.isLogging = false;
                this.findErr = false; 
                this.userQuestion = '';
                this.shows = [];
                this.horses = []; 
                if (this.statue === 'horse' ){this.Title ="Search by horse barn name";}
                if (this.statue === 'show' ){this.Title ="Search for Show by Title";}
                // console.log(this.statue);
        });
          
        this.userQuestionUpdate.pipe(
            debounceTime(200),
            distinctUntilChanged())
            .subscribe(value => {
                if (value !== '' && value.length >= 3){
                    this.isLogging = true;
                    this.findErr = false; 
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
                                    
                        this.horses = response.result;
                        
                        if (this.horses && this.horses.length > 0){
                    
                            this.shows = [];
                            // console.log('this is display', this.display, this.horses);  
            
                            this.isLogging = false;
                            this.findErr = false; 
                        }   
                        else
                        {
                            this.isLogging = false;
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
                       
                        this.shows = response.result;

                        if (this.shows && this.shows.length > 0 ){
                        
                            this.horses = [];     
                            this.isLogging = false;
                            this.findErr = false; 
                            
                        }   
                        else
                        {
                            this.isLogging = false;
                            this.findErr = true; 
                        }
                        resolve(this.shows);

                    }, reject);
            });

        }
    }

    

    searchCancel(): void{
        //this._horseProviderService.onSearchOpen.next('horse');
        
        this._fuseSidebarService.getSidebar('horse-provider-search-panel').toggleOpen();
        // this._fuseSidebarService.getSidebar('horse-provider-invoice-panel').toggleOpen();
    }

    getCurrentProviderHorse(uid): void{
        // console.log('this is uid', uid);
        let currentProviderHorse: HLHorseModel;
        
        currentProviderHorse = this.horses.find(horse => {
            return( horse.uid === uid);
        });
        
        this._horseProviderService.onCurrentProviderHorse.next(currentProviderHorse);
        this._fuseSidebarService.getSidebar('horse-provider-search-panel').toggleOpen();
        // this._fuseSidebarService.getSidebar('horse-provider-invoice-panel').toggleOpen();

    }
    getCurrentShow(uid): void{

        // console.log('this is trainer uid', uid);
        let currentShow: HLServiceShowModel;
        
        currentShow = this.shows.find(show => {
            return( show.uid === uid);
        });
        
        this._horseProviderService.onCurrentShowsChange.next(currentShow);
        this._fuseSidebarService.getSidebar('horse-provider-search-panel').toggleOpen();
        // this._fuseSidebarService.getSidebar('horse-provider-invoice-panel').toggleOpen();

    }
    onNewHorse():void{
        this._fuseSidebarService.getSidebar('horse-provider-search-panel').toggleOpen();
        this._fuseSidebarService.getSidebar('invoice-horse-profile-panel').toggleOpen();
    }

    
}
