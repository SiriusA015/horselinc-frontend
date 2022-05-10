import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatSnackBar, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { ProfileProviderService } from 'app/main/profile/provider/provider.service';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { HLUserType } from 'app/model/enumerations';
import { HLUserModel } from 'app/model/users';

@Component({
  selector: 'profile-provider-updateemail',
  templateUrl: './update-email.component.html',
  styleUrls: ['./update-email.component.scss']
})

export class ProfileProviderUpdateEmailComponent implements OnInit {
    user: HLUserModel;
    updateEmailForm: FormGroup;
    message: string;

    // Private
    private _unsubscribeAll: Subject<any>;

    constructor(
    private _appService: AppService,
    private _userAuthService: UserAuthService,
    private _fuseSidebarService: FuseSidebarService,
    private _profileProviderService: ProfileProviderService,
    private _formBuilder: FormBuilder){
        // Set the private defaults
        this._unsubscribeAll = new Subject();
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
                this.updateEmailForm = this._formBuilder.group({
                    email       : [this.user.email, Validators.required],
                });
            }
            this.message = '';
        });
        this._profileProviderService.onChangingEmailEvent
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(email => {
            this.updateEmailForm = this._formBuilder.group({
                email       : [this.user.email, Validators.required],
            });    
        });

        this.updateEmailForm = this._formBuilder.group({
            email       : [this.user.email, Validators.required],
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
    
    updateEmail(): void{
        const credential = this.updateEmailForm.value;

        this._userAuthService.changeEmail(credential.email)
        .then(() => {
            this.user.email = credential.email;

            this._userAuthService.updateUser(this.user);
            // Show the success message
            this._appService.showSnackBar('Your email has been updated!', 'OK');
            this.closePanel();
        })
        .catch((error) => {    
            this._appService.showSnackBar(error.message, 'FAIL');
        });
    }
 
    closePanel(): void{
        this._fuseSidebarService.getSidebar('profile-provider-updateemail').close();
        this._fuseSidebarService.getSidebar('profile-provider-editprofile').open();
    }
}
