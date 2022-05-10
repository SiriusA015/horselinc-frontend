import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatSnackBar, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { ProfileProviderService } from 'app/main/profile/provider/provider.service';
import { UserServiceProviderService } from 'app/service/user-service-provider.service';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { HLUserType } from 'app/model/enumerations';
import { HLUserModel } from 'app/model/users';

@Component({
  selector: 'profile-provider-instantpayout',
  templateUrl: './instant-payout.component.html',
  styleUrls: ['./instant-payout.component.scss']
})

export class ProfileProviderInstantPayoutComponent implements OnInit {
    user: HLUserModel;
    instantPayoutForm: FormGroup;
    message: string;
    instantAmount: number;
    payoutPlaceholder: string;

    // Private
    private _unsubscribeAll: Subject<any>;

    constructor(
    private _appService: AppService,
    private _userAuthService: UserAuthService,
    private _fuseSidebarService: FuseSidebarService,
    private _profileProviderService: ProfileProviderService,
    private _serviceProviderService: UserServiceProviderService,
    private _formBuilder: FormBuilder){
        // Set the private defaults
        this._unsubscribeAll = new Subject();
        this.instantAmount = 9999;
        this.payoutPlaceholder = '$ 9,999 Maximum';
   }

    /**
     * On init
     */
    ngOnInit(): void{
        this.user = this._userAuthService.hlUser;
        this._userAuthService.onHLUserChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(user => {
            if (user !== false){
                this.user = new HLUserModel(user.uid, user);
                this.instantPayoutForm = this._formBuilder.group({
                    payoutAmount       : [''],
                });
                if (this.user.serviceProvider.account){
                    this._serviceProviderService.retrieveAccountInfo(this.user.serviceProvider.account.id).then(
                        (response) => {
                            this.instantAmount = response.result.balance.amount / 100.0;
                            this.payoutPlaceholder = '$ ' + this.instantAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' Maximum';  // 12,345.67
                            this.instantPayoutForm = this._formBuilder.group({
                                payoutAmount       : [''],
                            });        
                        });
                }

            }
        });
        this.instantPayoutForm = this._formBuilder.group({
            payoutAmount       : [''],
        });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void{
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
    
    payout(): void{
        const data = this.instantPayoutForm.value;
        if (data.payoutAmount == '' || parseInt(data.payoutAmount) <= 0){
            this._appService.showSnackBar('Enter amount value', 'FAIL');
            return;
        }

        this._serviceProviderService.instantPayout(this.user.serviceProvider.account.id, data.payoutAmount*100)
        .then((response: any) => {
            })
        .catch((error) => {
            // Show the success message
            this._appService.showSnackBar(error.message, 'FAIL');
        });
    }
 
    closePanel(): void{
        this._fuseSidebarService.getSidebar('profile-provider-instantpayout').close();
    }
}
