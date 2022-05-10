import { Component, OnDestroy, OnInit, Inject} from '@angular/core';
import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
import { interval, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppService } from 'app/service/app.service';


@Component({
    selector   : 'apps-privacy',
    templateUrl: './app-privacy.component.html',
    styleUrls  : ['./app-privacy.component.scss']
})
export class AppPrivacyComponent implements OnInit
{
    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     */

    private _unsubscribeAll: Subject<any>;

    constructor(
        private sanitizer: DomSanitizer,
        private _appService: AppService,
        private _fuseConfigService: FuseConfigService,

    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }
    ngOnInit(): void
    {
        // let url: string;
        // this._appService.onHLSettingChanged
        // .pipe(takeUntil(this._unsubscribeAll))
        // .subscribe(setting => {
        //     if (setting != false){
        //         if (this._appService.settings){
        //             url = this._appService.settings.urls.privacy;
        //             // window.open(url);
        //         }        
        //     }
        // });
    }
    
    getUrl(): SafeUrl{
        let url = '';
        if (this._appService.settings){
            url = this._appService.settings.urls.privacy;
        }
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
}
