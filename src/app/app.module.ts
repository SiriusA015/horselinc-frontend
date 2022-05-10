import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';

import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatButtonModule, MatDialogRef, MAT_DIALOG_DATA,  MatFormFieldModule, MatIconModule, MatInputModule, MatRadioModule, MatToolbarModule, MatSlideToggleModule,
    MatCardModule, MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS, MatSnackBarModule, MatTableModule, MatProgressBarModule, MatDividerModule} from '@angular/material';

import { InMemoryWebApiModule } from 'angular-in-memory-web-api';
import { TranslateModule } from '@ngx-translate/core';
import 'hammerjs';
import { FormsModule } from '@angular/forms';
import { FuseModule } from '@fuse/fuse.module';
import { FuseSharedModule } from '@fuse/shared.module';
import { FuseProgressBarModule, FuseSidebarModule, FuseThemeOptionsModule } from '@fuse/components';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { fuseConfig } from 'app/fuse-config';

import { AppComponent } from 'app/app.component';
import { LayoutModule } from 'app/layout/layout.module';

import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule, FirestoreSettingsToken } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';

import { NgxStripeModule } from '@nomadreservations/ngx-stripe';

import {AgmCoreModule, MapsAPILoader } from '@agm/core';
import { ImageCropperModule } from 'ngx-image-cropper';

import { environment } from '../environments/environment';
import { ConfirmDlgComponent } from 'app/main/@shared/confirm-dlg/confirm-dlg.component';
import { WelcomeComponent } from 'app/main/welcome/welcome.component';

import { UserPhotoEditComponent } from 'app/main/@shared/photo-edit/photo-edit.component';
import { UserServiceEditComponent } from 'app/main/@shared/sevice-edit/service-edit.component';
import { UserPaymentCardComponent } from 'app/main/@shared/payment-card/payment-card.component';
import { UserProfileSpComponent } from 'app/main/@shared/user-profile-sp/user-profile-sp.component';

// Define Services
import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserAuthGuard } from 'app/service/user-auth.guard';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { UserPaymentApproversService } from 'app/service/user-payment-approvers.service';
import { UserManagerProvidersService } from 'app/service/user-manager-providers.service';
import { UserServiceProviderService } from 'app/service/user-service-provider.service';
import { UserProviderServicesService } from 'app/service/user-provider-services.service';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { HorseProviderService } from 'app/service/horse-provider.service';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
const appRoutes = [
    {
        path        : 'welcome',
        component   :  WelcomeComponent,
    },
    {
        path        : 'users/:userInfo',
        component   :  UserProfileSpComponent,
    },
    {
        path        : 'user',
        loadChildren: 'app/main/user/user.module#UserModule'
    },
    {
        path        : 'manager/profile',
        // canActivate : [UserAuthGuard],
        loadChildren: 'app/main/profile/manager/manager.module#ProfileManagerModule'
    },
    {
        path        : 'provider/profile',
        // canActivate : [UserAuthGuard],
        loadChildren: 'app/main/profile/provider/provider.module#ProfileProviderModule'
    },
    {
        path        : 'provider/horses',
        // canActivate : [UserAuthGuard],
        loadChildren: 'app/main/horse/horse-provider/horse-provider.module#HorseProviderModule'
    },
    {
        path        : 'manager/horses',
        // canActivate : [UserAuthGuard],
        loadChildren: 'app/main/horse/horse-manager/horse-manager.module#HorseManagerModule'
    },
    {
        path        : 'manager/payments',
        // canActivate : [UserAuthGuard],
        loadChildren: 'app/main/payment/payment-manager/payment-manager.module#PaymentManagerModule'
    },
    {
        path        : 'provider/payments',
        // canActivate : [UserAuthGuard],
        loadChildren: 'app/main/payment/payment-provider/payment-provider.module#PaymentProviderModule'
    },
    {
        path        : 'schedules',
        // canActivate : [UserAuthGuard],
        loadChildren: 'app/main/schedule/schedule.module#ScheduleModule',
    },
    {
        path        : 'notifications',
        // canActivate : [UserAuthGuard],
        loadChildren: 'app/main/notification/notification.module#NotificationModule'
    },
    {
        path        : '',
        redirectTo  : 'welcome',
        pathMatch   : 'full'
    },
    {
        path        : '**',
        redirectTo  : 'welcome',
        pathMatch   : 'full'
    },
];

@NgModule({
    declarations: [
        AppComponent,
        WelcomeComponent,
        UserPhotoEditComponent,
        UserServiceEditComponent,
        UserPaymentCardComponent,
        ConfirmDlgComponent,
        UserProfileSpComponent
        
    ],
    imports     : [
        CommonModule,
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        RouterModule.forRoot(appRoutes),
        TranslateModule.forRoot(),

        // Material moment date module
        MatMomentDateModule,

        // Material
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatRadioModule,
        MatCardModule,
        MatSlideToggleModule,
        MatToolbarModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTableModule,
        MatDividerModule,
        MatProgressBarModule,
        ImageCropperModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        // Fuse modules
        FuseModule.forRoot(fuseConfig),
        FuseProgressBarModule,
        FuseSharedModule,
        FuseSidebarModule,
        FuseThemeOptionsModule,
        FormsModule,
        // App modules
        LayoutModule,
        // Firebase module
        AngularFireModule.initializeApp(environment.firebaseConfig),
        AngularFirestoreModule,
        AngularFireAuthModule,
        AngularFireStorageModule,
        AgmCoreModule.forRoot(environment.googleConfig),
        NgxStripeModule.forRoot(environment.stripeConfig.apiKey)
       
        
        
    ],
    bootstrap   : [
        AppComponent
    ],
    entryComponents: [
        UserPhotoEditComponent,
        UserServiceEditComponent,
        UserPaymentCardComponent,
        ConfirmDlgComponent,
        UserProfileSpComponent
    ],
    exports: [
        UserPhotoEditComponent,
        UserServiceEditComponent,
        UserPaymentCardComponent,
    ],
    providers: [    
        { provide: FirestoreSettingsToken, useValue: {} },
        
        FuseProgressBarService,

        AppService,
        UserAuthGuard,
        UserAuthService, 

        UserHorseManagerService,
        UserManagerProvidersService,
        UserPaymentApproversService,
        UserServiceProviderService,
        UserProviderServicesService,
       
        UserAuthGuard,

        HorseProviderService,
        HorseManagerService,

        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: [] },
        // {provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackDrop: true}}
    ],
})
export class AppModule
{
}
