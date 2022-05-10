import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule } from '@ngx-translate/core';
import { MatSidenavModule, MatListModule,  MatRadioModule, MatGridListModule, MatDatepickerModule, MatNativeDateModule, MatCardModule} from '@angular/material';
import { FuseSharedModule } from '@fuse/shared.module';
import { FuseSidebarModule } from '@fuse/components';
import { FormsModule } from '@angular/forms';
import { A11yModule} from '@angular/cdk/a11y';
import { DragDropModule} from '@angular/cdk/drag-drop';
import { PortalModule} from '@angular/cdk/portal';
import { ScrollingModule} from '@angular/cdk/scrolling';
import { CdkStepperModule} from '@angular/cdk/stepper';
import { CdkTableModule} from '@angular/cdk/table';
import { CdkTreeModule} from '@angular/cdk/tree';
import { MatAutocompleteModule} from '@angular/material/autocomplete';
import { MatBadgeModule} from '@angular/material/badge';
import { MatBottomSheetModule} from '@angular/material/bottom-sheet';
import { MatChipsModule} from '@angular/material/chips';
import { MatStepperModule} from '@angular/material/stepper';
import { MatDividerModule} from '@angular/material/divider';
import { MatExpansionModule} from '@angular/material/expansion';
import { MatPaginatorModule} from '@angular/material/paginator';
import { MatProgressBarModule} from '@angular/material/progress-bar';
import { MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatSliderModule} from '@angular/material/slider';
import { MatSnackBarModule} from '@angular/material/snack-bar';
import { MatSortModule} from '@angular/material/sort';
import { MatTableModule} from '@angular/material/table';
import { MatTabsModule} from '@angular/material/tabs';
import { MatTooltipModule} from '@angular/material/tooltip';
import { MatTreeModule} from '@angular/material/tree';
import { ReactiveFormsModule } from '@angular/forms';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { HorseManagerComponent } from 'app/main/horse/horse-manager/horse-manager.component';
import { HorseManagerListComponent } from './horse-manager-list/horse-manager-list.component';
import { HorseManagerListItemComponent } from './horse-manager-list/horse-manager-list-item/horse-manager-list-item.component';
import { HorseManagerDetailsComponent } from './horse-manager-details/horse-manager-details.component';
import { HorseManagerProfileComponent } from './horse-manager-profile/horse-manager-profile.component';
import { HorseManagerScheduleComponent } from './horse-manager-schedule/horse-manager-schedule.component';
import { HorseManagerConfirmComponent } from './horse-manager-confirm/horse-manager-confirm.component';
import { HorseSearchServiceComponent} from './horse-search-service/horse-search-service.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CalendarComponent } from './horse-manager-details/calendar/calendar.component';
import { HorseProviderServiceComponent } from './horse-manager-schedule/horse-provider-service/horse-provider-service.component';
import { HorseRequestEditComponent } from './horse-manager-details/horse-request-edit/horse-request-edit.component';
import { HorseShowSearchComponent } from './horse-show-search/horse-show-search.component';
import { MatDialogModule } from '@angular/material/dialog';
import { UserAuthGuard } from 'app/service/user-auth.guard';
import { HorseFilterComponent } from './horse-manager-list/horse-filter/horse-filter.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { HorseOwnerCreateComponent } from 'app/main/horse/horse-manager/owner-create/owner-create/owner-create.component';
import { HorseOwnerPaymentApproverComponent } from 'app/main/horse/horse-manager/owner-create/payment-approver/payment-approver.component';
import { HorseOwnerPaymentInfoComponent } from 'app/main/horse/horse-manager/owner-create/payment-info/payment-info.component';

const routes: Routes = [
    {
        path     : '',
        component: HorseManagerComponent,
        canActivate: [UserAuthGuard],
        resolve  : {
            horsemanager: HorseManagerService
        }
    },
   
    {
        path      : '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];

@NgModule({
    declarations   : [
        HorseManagerComponent,
        HorseManagerListComponent,
        HorseManagerListItemComponent,
        HorseManagerDetailsComponent,
        HorseManagerProfileComponent,
        HorseManagerScheduleComponent,
        HorseManagerConfirmComponent,
        HorseSearchServiceComponent,
        HorseProviderServiceComponent,
        HorseShowSearchComponent,
        HorseRequestEditComponent,
        CalendarComponent,
        HorseFilterComponent,
        HorseOwnerCreateComponent,
        HorseOwnerPaymentApproverComponent,
        HorseOwnerPaymentInfoComponent,
    ],
    imports        : [
        RouterModule.forChild(routes),
        MatButtonModule,
        MatCheckboxModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatRippleModule,
        MatSelectModule,
        MatToolbarModule,
        MatSidenavModule,
        MatListModule,  
        MatRadioModule, 
        MatGridListModule, 
        MatDatepickerModule, 
        MatNativeDateModule, 
        MatCardModule,
        TranslateModule,
        MatSlideToggleModule,
        FuseSharedModule,
        FuseSidebarModule,
        A11yModule,
        CdkStepperModule,
        CdkTableModule,
        CdkTreeModule,
        DragDropModule,
        MatAutocompleteModule,
        MatBadgeModule,
        MatBottomSheetModule,
        MatChipsModule,
        MatStepperModule,
        MatDividerModule,
        MatExpansionModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatSliderModule,
        MatSnackBarModule,
        MatSortModule,
        MatTableModule,
        MatTabsModule,
        MatTooltipModule,
        MatTreeModule,
        PortalModule,
        ScrollingModule, 
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        InfiniteScrollModule,
        
    ],
    exports     : [
      ],
    entryComponents: [
        HorseProviderServiceComponent,
        HorseRequestEditComponent,
        HorseFilterComponent
    ],
    providers      : [
        
    ],
   
})
export class HorseManagerModule
{
}
