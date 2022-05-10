import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxDnDModule } from '@swimlane/ngx-dnd';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
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
import { MatDatepickerModule, MatCardModule} from '@angular/material';
import {MatDividerModule} from '@angular/material/divider';

import {MatTabsModule} from '@angular/material/tabs';

import { FuseSharedModule } from '@fuse/shared.module';
import { FuseSidebarModule } from '@fuse/components';

import { ScheduleComponent } from './schedule.component';
import { SchedulePastComponent } from './schedule-past/schedule-past.component';
import { ScheduleCurrentComponent } from './schedule-current/schedule-current.component';
import { ScheduleFilterDialogComponent } from './schedule-filter-dialog/schedule-filter-dialog.component';
import { ScheduleCardComponent } from './schedule-card/schedule-card.component';
// import { ConfirmDlgComponent } from './schedule-card/confirmDlg/confirmDlg.component';
import { AddServicesComponent } from './add-services/add-services.component';
import { ServicesModalComponent } from './add-services/services-modal/services-modal.component';
import { AssignConfirmComponent } from './assign-confirm/assign-confirm.component';
import { ScheduleAssignComponent } from './schedule-assign/schedule-assign.component';
import { ProviderServiceComponent} from './schedule-assign/provider-service/provider-service.component'
import { ScheduleService } from './schedule.service';
import { HorseShowSearchComponent } from './horse-show-search/horse-show-search.component';
import { HorseSearchServiceComponent} from './horse-search-service/horse-search-service.component';
import { MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material'

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { FactScrollerComponent } from 'app/fact-scroller/fact-scroller.component';
import { UserAuthGuard } from 'app/service/user-auth.guard';

const routes: Routes = [
    {
        path     : '',
        component: ScheduleComponent,
        canActivate: [UserAuthGuard],
        resolve     : {
            data    : ScheduleService
        }
    },
    {
        path      : '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    MatFormFieldModule,
    MatInputModule,
    MatRippleModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatCardModule,
    MatButtonModule,
    NgxDnDModule,
    MatDatepickerModule,
    FuseSharedModule,
    FuseSidebarModule,
    MatTabsModule,
    MatDialogModule,
    MatCheckboxModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatIconModule,
    InfiniteScrollModule
  ],
  declarations: [
      ScheduleComponent,
      SchedulePastComponent,
      ScheduleCurrentComponent,
      ScheduleFilterDialogComponent,
      ScheduleCardComponent,
      // ConfirmDlgComponent,
      AddServicesComponent,
      ServicesModalComponent,
      AssignConfirmComponent,
      ScheduleAssignComponent,
      ProviderServiceComponent,
      HorseShowSearchComponent,
      HorseSearchServiceComponent,
      FactScrollerComponent
    ],
  exports     : [
    // ConfirmDlgComponent,
    ServicesModalComponent,
    ProviderServiceComponent
  ],
  entryComponents : [
    // ConfirmDlgComponent,
    ServicesModalComponent,
    ProviderServiceComponent
  ],
  providers   : [
    ScheduleService
  ]
})
export class ScheduleModule { }
