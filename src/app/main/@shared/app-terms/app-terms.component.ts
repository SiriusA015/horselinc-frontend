import { Component } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppService } from 'app/service/app.service';

@Component({
    selector   : 'apps-terms',
    templateUrl: './app-terms.component.html',
    styleUrls  : ['./app-terms.component.scss']
})
export class AppTermsComponent
{
    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     */
    constructor(
        private sanitizer: DomSanitizer,
        private _appService: AppService,
        private _fuseConfigService: FuseConfigService,
    )
    {
    }
    getUrl(): SafeUrl{
        let url = '';
        if (this._appService.settings){
            url = this._appService.settings.urls.terms;
        }
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
}
