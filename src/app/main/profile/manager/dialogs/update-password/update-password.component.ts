import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { fuseAnimations } from '@fuse/animations';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { HLUserType } from 'app/model/enumerations';
import { ProfileManagerService } from 'app/main/profile/manager/manager.service';

@Component({
  selector: 'profile-manager-updatepassword',
  templateUrl: './update-password.component.html',
  styleUrls: ['./update-password.component.scss'],

  animations   : fuseAnimations
})

export class ProfileManagerUpdatePasswordComponent implements OnInit {
    updatePsswordForm: FormGroup;
    message: string;

    // Private
    private _unsubscribeAll: Subject<any>;

    constructor(
    private _appService: AppService,
    private _userAuthService: UserAuthService,
    private _fuseSidebarService: FuseSidebarService,
    private _profileManagerService: ProfileManagerService,
    private _formBuilder: FormBuilder){
        // Set the private defaults
        this._unsubscribeAll = new Subject();
   }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    /**
     * On init
     */
    ngOnInit(): void{
        this.updatePsswordForm = this._formBuilder.group({
            passwordOld       : ['', Validators.required],
            passwordNew       : ['', Validators.required],
            passwordConfirm: ['', [Validators.required, confirmPasswordValidator]]
        });

        this._profileManagerService.onChangingPasswordEvent
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(password => {
            this.updatePsswordForm = this._formBuilder.group({
                passwordOld       : ['', Validators.required],
                passwordNew       : ['', Validators.required],
                passwordConfirm: ['', [Validators.required, confirmPasswordValidator]]
            });
        });
        
        // Update the validity of the 'passwordConfirm' field
        // when the 'password' field changes
        this.updatePsswordForm.get('passwordNew').valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.updatePsswordForm.get('passwordConfirm').updateValueAndValidity();
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

    updatePassword(): void{
        const credential = this.updatePsswordForm.value;
        if (credential.passwordOld == '' || credential.passwordNew == '' || credential.passwordConfirm == '' || credential.passwordNew != credential.passwordConfirm )
        {
            this._appService.showSnackBar('Your password is not incorrect!', 'FAIL');
            return;
        }
        
        this._userAuthService.changePassword(credential.passwordOld, credential.passwordNew)
        .then(() => {
            // Show the success message
            this._appService.showSnackBar('Your password has been updated!', 'OK');
            this.closePanel();
        })
        .catch((error) => {    
                this._appService.showSnackBar('Please input the old password correctly', 'Fail');
        });

    }
    closePanel(): void{
        this._fuseSidebarService.getSidebar('profile-manager-updatepassword').close();
        this._fuseSidebarService.getSidebar('profile-manager-editprofile').open();
    }
}


/**
 * Confirm password validator
 *
 * @param {AbstractControl} control
 * @returns {ValidationErrors | null}
 */
export const confirmPasswordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {

    if ( !control.parent || !control )
    {
        return null;
    }

    const passwordNew = control.parent.get('passwordNew');
    const passwordConfirm = control.parent.get('passwordConfirm');

    if ( !passwordNew || !passwordConfirm )
    {
        return null;
    }

    if ( passwordConfirm.value === '' )
    {
        return null;
    }

    if ( passwordNew.value === passwordConfirm.value )
    {
        return null;
    }

    return {passwordsNotMatching: true};
}