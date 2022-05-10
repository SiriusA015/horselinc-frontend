import { Injectable } from '@angular/core';
import {
  CanActivate, Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanActivateChild,
  NavigationExtras,
  CanLoad, Route
} from '@angular/router';
import { UserAuthService } from 'app/service/user-auth.service';
import { AppService } from 'app/service/app.service';
import { HLUserType } from 'app/model/enumerations';

@Injectable()
// , CanActivateChild, CanLoad
export class UserAuthGuard implements  CanActivate  {

  constructor(private router: Router, 
              private _appService: AppService,
              private _userAuthService: UserAuthService) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // check token duration    
    // if (!this._userAuthService.isAuthenticated()) {
    //   console.log('invalid token!');
    //   this.router.navigate(['user/login']);
    //   return false;
    // }
    // return true;
    let url: string = state.url;
    // console.log('canActive:', url);

    return this.checkLogin(url);
  }
  
  checkLogin(url: string): boolean {
    let bRet: boolean;
    bRet = true;

    const type = this._appService.getUserShortType();
    // console.log('checkLogin:', type, ',', url.search('manager'), ',', url.search('provider'));

    if (url.search('deeplink') !== -1){
          // Store the attempted URL for redirecting
      const redirectUrl = url; // url.replace('deeplink', 'dlinking');
      this._userAuthService.redirectUrl = redirectUrl;
      // console.log('checkLogin-deeplink');
      // bRet = false;
    }

    if (this._userAuthService.isAuthenticated()){
      // console.log('checkLogin');      

      if (url.search('manager') !== -1 || url.search('provider') !== -1){
        // console.log('checkLogin-another');
        if (url.search(type) === -1){
          bRet = false;
        }
      }

      if (bRet){
        return true;
      }

      // console.log('checkLogin-logout');
      // this._userAuthService.logout();
    }

    // console.log('auth-invalid token!');
    this.router.navigate(['user/login']);
    // Navigate to the login page with extras

    return false;
  }
}
