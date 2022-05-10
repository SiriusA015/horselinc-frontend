import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatRadioModule, MatToolbarModule, MatSlideToggleModule,
    MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS, MatSnackBarModule, MatTableModule, MatProgressBarModule, MatAutocompleteModule, MatOptionModule } from '@angular/material';
import { MatProgressButtonsModule } from 'mat-progress-buttons';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FuseSharedModule } from '@fuse/shared.module';
import { FuseSidebarModule } from '@fuse/components';
import { FuseConfirmDialogModule } from '@fuse/components';
import { ImageCropperModule } from 'ngx-image-cropper';

import { UserPhotoEditComponent, UserPhotoInput, UserPhotoOutput } from 'app/main/@shared/photo-edit/photo-edit.component';
import { UserServiceEditComponent } from 'app/main/@shared/sevice-edit/service-edit.component';

import { UserLoginComponent } from './login/login.component';
import { UserResetPasswordComponent } from './reset-password/reset-password.component';
import { UserRegisterComponent } from './register/register.component';
import { UserRegisterRoleComponent } from './register-role/register-role.component';
import { UserRegisterManagerComponent } from './register-manager/register-manager.component';
import { UserRegisterProviderComponent } from './register-provider/register-provider.component';
import { UserPaymentInfoComponent } from './register-manager/payment-info/payment-info.component';
import { UserPaymentApproverComponent } from './register-manager/payment-approver/payment-approver.component';

import { UserService } from 'app/main/user/user.service';
import { UserAuthGuard } from 'app/service/user-auth.guard';

const routes = [

    {
        path        : 'login',
        component   :  UserLoginComponent,
        // canActivate: [UserAuthGuard],
    },
    {
        path        : 'register',
        component   :  UserRegisterComponent,
        // canActivate: [UserAuthGuard],
    },
    {
        path        : 'resetpassword',
        component   :  UserResetPasswordComponent,
        // canActivate: [UserAuthGuard],
    },
    {
        path        :  'register/role',
        component   :   UserRegisterRoleComponent,
        // canActivate: [UserAuthGuard],
    },
    {
        path        : 'register/manager',
        component   :   UserRegisterManagerComponent,        
        // canActivate: [UserAuthGuard],
    },
    {
        path        : 'register/provider',
        component   :   UserRegisterProviderComponent,        
        // canActivate: [UserAuthGuard],
    },
    {
        path      : '**',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];

@NgModule({
    imports     : [
        RouterModule.forChild(routes),
        FuseSharedModule,
        FuseSidebarModule,
        FuseConfirmDialogModule,
        FormsModule, ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatRadioModule,
        MatSlideToggleModule,
        MatToolbarModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTableModule,
        MatProgressBarModule,
        MatAutocompleteModule, MatOptionModule,
        MatProgressButtonsModule,
        MatProgressSpinnerModule,
        ImageCropperModule
    ],
    declarations: [
        UserLoginComponent, 
        UserRegisterComponent,
        UserResetPasswordComponent,
        UserRegisterRoleComponent,
        UserRegisterManagerComponent,
        UserRegisterProviderComponent,
        UserPaymentInfoComponent,
        UserPaymentApproverComponent
    ],
    entryComponents: [
    ],

    exports     : [
        UserLoginComponent,
        UserRegisterComponent,
        UserResetPasswordComponent,
        UserRegisterRoleComponent,
        UserRegisterManagerComponent,
        UserRegisterProviderComponent,
        UserPaymentInfoComponent,
        UserPaymentApproverComponent
    ],

    providers   : [
        UserService
    ],
})
export class UserModule
{
}
