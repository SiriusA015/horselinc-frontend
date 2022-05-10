import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { Router, ActivatedRoute } from '@angular/router';

import { FuseConfigService } from '@fuse/services/config.service';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { HLUserType } from 'app/model/enumerations';

import { UserService } from 'app/main/user/user.service';

@Component({
  selector: 'user-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations   : fuseAnimations,
})

export class UserLoginComponent implements OnInit {
    loginForm: FormGroup;
    message: string;
    isProcessing: boolean;

    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        private _userService: UserService,
        private _appService: AppService,
        private _userAuthService: UserAuthService,
        private _fuseConfigService: FuseConfigService,
        private _formBuilder: FormBuilder,
        private _router: Router,
    )
    {
        // Configure the layout
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

        this.isProcessing = false;
    }


    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.loginForm = this._formBuilder.group({
            email   : [this._userService.userEmail, [Validators.required, Validators.email]],
            password: [this._userService.userPassword, [Validators.required, Validators.pattern(/[a-zA-Z0-9]/), Validators.minLength(4)]]
        });
    }
    
    /**
     * Login
     */
    
    login(): void{                
        if (this.isProcessing){
            return;
        }
        const credential = this.loginForm.value;
        let redirecting = false;

        this.isProcessing = true;
        this._userAuthService.login(credential.email, credential.password)
        .then((hlUser) => {
            if (hlUser != false){
                if (this._userAuthService.hlUser.type === HLUserType.manager){
                    if (this._userAuthService.hlUser.horseManager == null){
                        this._router.navigate(['/user/register/role']);
                        return;
                    }
                }
                else{
                    if (this._userAuthService.hlUser.serviceProvider == null){
                        this._router.navigate(['user/register/role']);  // must be change
                        return;
                    }
                }

                if ( this._userAuthService.redirectUrl ){
                    redirecting = true;
                    if (this._userAuthService.hlUser.type === HLUserType.manager){
                        if (this._userAuthService.redirectUrl.search('manager') === -1){
                        redirecting = false;
                        }
                    }
                    if (this._userAuthService.hlUser.type === HLUserType.provider){
                        if (this._userAuthService.redirectUrl.search('provider') === -1){
                            redirecting = false;
                        }
                    }
                }
                if ( redirecting ){
                    const redirectURL = this._userAuthService.redirectUrl; 
                    this._userAuthService.redirectUrl = '';
                    this._router.navigateByUrl(redirectURL);
                }
                else{
                    this._appService.navigateToFirstPage();
                }
            }
            else{
                this.message = 'Login failed. Try again later';
                this._appService.showSnackBar(this.message, 'FAIL');
                this.isProcessing = false;  
            }
        })
        .catch((error) => {    
            this.message = 'Login failed. Try again later';
            if ( error.message ) {
                this.message = error.message;
            }
            this._appService.showSnackBar(error.message, 'FAIL');
            this.isProcessing = false;  
        });
    }
    register(): void{
        const credential = this.loginForm.value;
        this._userService.userEmail = credential.email;
        this._userService.userPassword = credential.password;

        this._router.navigate(['/user/register']);
    }
    /**
     * Check session
     */
    checkSession(): void {
        if (this._userAuthService.isAuthenticated()) {     
            this._userAuthService.login('hengsong829@gmail.com', 'hyonsung1986')
            .then(() => {
                this._appService.navigateToFirstPage();
            })
            .catch((error) => {    
                this.message = 'Login failed. Try again later';
                if ( error.message ) {
                    this.message = error.message;
                }        
                
            });
        }
    }
}
