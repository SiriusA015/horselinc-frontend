import { Component, OnInit } from "@angular/core";
import { FuseConfigService } from '@fuse/services/config.service';
import { HLServiceProviderServiceModel } from 'app/model/users';
import { AppService } from 'app/service/app.service';
import { ActivatedRoute } from '@angular/router';
import { UserAuthService } from 'app/service/user-auth.service';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: "app-user-profile-sp",
  templateUrl: "./user-profile-sp.component.html",
  styleUrls: ["./user-profile-sp.component.scss"]
})


export class UserProfileSpComponent implements OnInit {

  serviceProviderServices: HLServiceProviderServiceModel[];
  
  user: any;
  userInfo: string;
  isLogging: boolean;
  serviceFlag: boolean;

  constructor(
    private _fuseConfigService: FuseConfigService,
    private _appService: AppService,
    private route: ActivatedRoute,
    private _userAuthService: UserAuthService,
    private _horseManagerService: HorseManagerService,
    private sanitizer: DomSanitizer

  ) { 

      this._fuseConfigService.config = {
        layout: {
            navbar   : {
                hidden: true
            },
            toolbar  : {
                hidden: true
            },
            footer   : {
                hidden: true
            },
            sidepanel: {
                hidden: true
            }
        }
    };

  }

  ngOnInit(): void {

    this.isLogging = true;
    this.route.paramMap.subscribe(params => {
      this.userInfo = params.get('userInfo');
      console.log('this is userInfo', this.userInfo);
    });
    this.ngInfoProcess(this.userInfo);
  }

  ngInfoProcess(userInfo: string): void{

    let phone: string;
    let name: string;
    let tempName: string;
    phone = userInfo.slice(userInfo.length - 4);
    tempName = userInfo.substr(0, userInfo.length - 4);
    name = tempName.replace('_', ' ');
    
    this._userAuthService.getCurrentUserForInfo(name, phone).then(user => {
      
      this.user = user;
      this.isLogging = false;
      this._horseManagerService.getServiceProviderService(user.serviceProvider.userId).then(services =>
        {
          if (services.length > 0){
            this.serviceProviderServices = services;
            this.serviceFlag = true;
          }else{
            this.serviceFlag = false;
          }
        });
      
    });
   
  }
  getAmountWithApplicationFee(amount: number): number{
    return this._appService.getAmountWithApplicationFee(amount);
  }
  getUrl(): SafeUrl{
    let url = '';
    if (this._appService.settings){
        url = this._appService.settings.urls.terms;
    }
    return url;
  }
  getInviteHorseLinc(): string{
    return this._appService.spEmailLinc(this.user.email);
  }
} 