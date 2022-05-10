import { Component, OnInit, OnDestroy, NgZone, ElementRef, ViewChild } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { Router } from '@angular/router';

import { UserPhotoEditComponent, UserPhotoInput, UserPhotoOutput } from 'app/main/@shared/photo-edit/photo-edit.component';
import { HLUserModel, HLServiceProviderModel, HLHorseManagerModel, HLHorseManagerProviderModel, HLHorseManagerPaymentApproverModel } from 'app/model/users';
import { HLUserType } from 'app/model/enumerations';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { UserManagerProvidersService } from 'app/service/user-manager-providers.service';
import { UserPaymentApproversService } from 'app/service/user-payment-approvers.service';


@Component({
    selector   : 'user-register-role',
    templateUrl: './register-role.component.html',
    styleUrls  : ['./register-role.component.scss']
})
export class UserRegisterRoleComponent implements OnInit {
    user: HLUserModel;
    /**
     * Constructor
     *
     * @param {FuseConfigService} _fuseConfigService
     */
    constructor(
        private _appService: AppService,
        private _fuseConfigService: FuseConfigService,
        private _userAuthService: UserAuthService,
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
    }
    
    /**
     * On init
     */
    ngOnInit(): void{
    }

    onManagerRole(): void {
        this._userAuthService.switchUserRole(HLUserType.manager)
        .then((user) => {
            this._router.navigate(['/user/register/manager']);
         })
         .catch((error) => {            
            this._appService.showSnackBar(error.message, 'FAIL');
        });
    }
    onProviderRole(): void {
            this._userAuthService.switchUserRole(HLUserType.provider)
            .then((user) => {
                this._router.navigate(['/user/register/provider']);
             })         
             .catch((error) => {            
                this._appService.showSnackBar(error.message, 'FAIL');
            });
    }
    
}
