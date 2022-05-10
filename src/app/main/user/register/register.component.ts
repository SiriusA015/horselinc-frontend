import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/internal/operators';
import { Message } from '@angular/compiler/src/i18n/i18n_ast';
import { Router } from '@angular/router';

import { FuseConfigService } from '@fuse/services/config.service';
import { UserAuthService } from 'app/service/user-auth.service';

import { UserService } from 'app/main/user/user.service';
import { AppService } from 'app/service/app.service';

@Component({
    selector     : 'user-register',
    templateUrl  : './register.component.html',
    styleUrls    : ['./register.component.scss'],
//    encapsulation: ViewEncapsulation.None,
//    animations   : fuseAnimations
})
export class UserRegisterComponent implements OnInit, OnDestroy
{
    registerForm: FormGroup;
    message: Message;
    isProcessing: boolean;

    // Private
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _appService: AppService,
        private _userService: UserService,
        private _userAuthService: UserAuthService,
        private _fuseConfigService: FuseConfigService,
        private _formBuilder: FormBuilder,
        private _router: Router
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

        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.registerForm = this._formBuilder.group({
            email   : [this._userService.userEmail, [Validators.required, Validators.email]],
            password: [this._userService.userPassword, [Validators.required, Validators.pattern(/[a-zA-Z0-9]/), Validators.minLength(4)]]
        });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
    register(): void
    {
        if (this.isProcessing){
            return;
        }
        this.isProcessing = true;
        const credential = this.registerForm.value;
        this._userAuthService.register(credential.email, credential.password)
        .then(() => {
            this._router.navigate(['/user/register/role']);
        })
        .catch((error) => {            
            this.message = error.message;
            this.isProcessing = false;  
            this._appService.showSnackBar(error.message, 'FAIL');
        });
    }
}
