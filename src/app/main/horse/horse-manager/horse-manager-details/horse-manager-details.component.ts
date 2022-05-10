
import { Component, OnDestroy,  OnInit , ViewEncapsulation, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { HorseManagerService } from 'app/service/horse-manager.service';
import { HLHorseModel } from 'app/model/horses';
import { MatSnackBar, MatDialog, MatCalendar, MatCalendarCellCssClasses} from '@angular/material';
import { UserAuthService } from 'app/service/user-auth.service';
import { HLUserModel } from 'app/model/users';
import { HLServiceRequestModel} from 'app/model/service-requests';
import { HorseRequestEditComponent } from './horse-request-edit/horse-request-edit.component';
import { Router } from '@angular/router';
import { FuseConfigService } from '@fuse/services/config.service';
import { ConfirmDlgComponent } from 'app/main/@shared/confirm-dlg/confirm-dlg.component';
import { HLUserType } from 'app/model/enumerations';
import { AppService } from 'app/service/app.service';

interface SortedRequest {
    date: string;
    displayDate: string;
    requestList: HLServiceRequestModel[];
}

@Component({
    selector     : 'horse-manager-details',
    templateUrl  : './horse-manager-details.component.html',
    styleUrls    : ['./horse-manager-details.component.scss'],
    
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})

export class HorseManagerDetailsComponent implements OnInit, OnDestroy
{

    @ViewChild('calendar', {static: false}) calendar: MatCalendar<Date>;

    horse: HLHorseModel;
    serviceRequests: HLServiceRequestModel[];
    sortDateServiceRequests: SortedRequest[] = [];
    allServiceRequests: HLServiceRequestModel[] = [];
    showDetails: boolean;
    selectedDate: any;
    dateToggle: boolean;
    lastTime: string;
    currentDate: any[];
    leaserFlag: boolean;
    requestFlag: boolean;
    requestChangeFlag: boolean;
    user: HLUserModel;
    lastRefresh: number = Date.now();
    caleFlag: boolean;
    firstrequestFlag: boolean;
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _dialog: MatDialog, 
        private _horseManagerService: HorseManagerService,
        private _fuseSidebarService: FuseSidebarService,
        private _matSnackBar: MatSnackBar, 
        private _matDialog: MatDialog, 
        private _router: Router,
        private _fuseConfigService: FuseConfigService,
        private _appService: AppService,   
        private _userAuthService: UserAuthService,
    )
    {
        this.showDetails = false;
        this._unsubscribeAll = new Subject();
        this.firstrequestFlag = true;
    }
  
    ngOnInit(): void
    {
        this.dateToggle = true;
        this.currentDate = [];
        this.user = this._userAuthService.hlUser;

        this._horseManagerService.onCurrentHorseChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(currentHorse => {
                    this.caleFlag = false;
                    this.horse = currentHorse;    
                    this.lastTime = this.getDisplayDate(currentHorse.createdAt);   
                    this.requestChangeFlag = true;    
                   
            });
            
        this._horseManagerService.onHorseServiceRequests
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(serviceRequests => {
                this.sortDateServiceRequests = [];
                this.allServiceRequests = [];
                this.currentDate = [];
                this.allServiceRequests = serviceRequests;
                if (serviceRequests.length > 0 ){
                    if (this.horse.leaser){this.leaserFlag = true; this.requestFlag = false; }else{this.requestFlag = false; this.leaserFlag = false; }
                    serviceRequests.forEach(serviceRequest => {
                        this.currentDate.push(new Date( serviceRequest.requestDate).getTime());   
                    });  
                    this.caleFlag = true;
                    serviceRequests.forEach(serviceRequest => {
                        this.pushNewRequest(serviceRequest, this.sortDateServiceRequests);
                    });
                }else{ 
                    if (this.horse.leaser){this.leaserFlag = true; this.requestFlag = false; }else{this.requestFlag = true; this.leaserFlag = false; } 
                    if (!this.firstrequestFlag) {this.caleFlag = true; } else {this.firstrequestFlag = false; }
                }
            });     
    }
  
    ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
   
    ScheduleService(): void
    {
        if (!this.checkPaymentMethodValid()) {
            this._appService.showSnackBar( 'First Add Payment Method. You need to complete your payment information in your profile before you may proceed.', 'OK' );                     
            return;
        }
        this._horseManagerService.onGetServiceHorse.next(this.horse );
        this._horseManagerService.onCurrentServiceRequestChange.next('');
        this._fuseSidebarService.getSidebar('horse-manager-schedule-panel').toggleOpen();
    }
    DateShow(): void
    {     
        this.dateToggle = !this.dateToggle;
    
    }

    checkPaymentMethodValid(): boolean {
        const user = this._appService.getCurUser();
        if (!user.type) { return false; }

        if ( user.type == HLUserType.manager) {
            if ( user.horseManager.customer ) {
                if (user.horseManager.customer.id) {
                    return true;
                } else {
                    return false;
                }
            } else { return false; }
            
        } else {
            if (user.serviceProvider.account) {
                if (user.serviceProvider.account.id) {
                    return true;
                } else {           
                    return false;
                }
            } else {return false; }
        }   
    }  

    dateClass() {
        return (date: Date): MatCalendarCellCssClasses => {
          const highlightDate = this.currentDate
            .some(d => new Date(d).getDate() === date.getDate() && new Date(d).getMonth() === date.getMonth() && new Date(d).getFullYear() === date.getFullYear());
          return highlightDate ? 'special-date' : '';
        };
    }
   
    allRequest(): void{
        this.calendar.updateTodaysDate();    
    }
   
    onSelect(date): void{
        let sortDate: number;
        let nextDate: any;
        this.selectedDate = date;
        sortDate = new Date(date).getTime(),
        // nextDate = new Date(new Date(date).getFullYear(), new Date(date).getMonth(), new Date(date).getDate()+1).getTime();
        this.requestChangeFlag = false;
        this._horseManagerService.setCurrentHorseSchedule(this.horse.uid, sortDate, sortDate); 
    }
   
    editHorseProfile(): void
    {
        this._horseManagerService.onEditHorseProfile.next(this.horse);
        this._fuseSidebarService.getSidebar('horse-manager-profile-panel').toggleOpen();
    }

    pushNewRequest(serviceRequest: HLServiceRequestModel, RequestList: SortedRequest[]): void{
        const date = serviceRequest.requestDate;
        let temp: SortedRequest = {    
            date: null,     
            displayDate: null,  
            requestList: [] 
        };
        if (RequestList.length > 0){
            let flag = false;
            RequestList.forEach(doc => {
                if (doc.date === date){
                    doc.requestList.push(serviceRequest); 
                    flag = true;
                }
            });
            if (!flag) {
                temp.date = date;
                temp.displayDate = this.getDisplayDate(date);
                temp.requestList.push(serviceRequest);
                RequestList.push(temp);
            }
        }
        else{
            temp.date = date;
            temp.displayDate = this.getDisplayDate(date);
            temp.requestList.push(serviceRequest);
            RequestList.push(temp);
        }
    }

    getDisplayDate(date: string): string {
        let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const d = new Date(date);
        let day = days[ d.getDay() ];
        let month = months[ d.getMonth() ];
        let dt = d.getDate().toString();
        let year = d.getFullYear().toString();
        let retVal: string = '';
        retVal = day + ', '  + month + '  ' + dt + ', ' + year;
        return retVal;
    }

    diaEditDel(status: string, uid: string): void{
        if (status === 'pending' || status === 'accepted' || status === 'declined'){
            const dialogRef = this._dialog.open(HorseRequestEditComponent, {
                data: status
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result === 'edit' ){
                        let currentRequest: HLServiceRequestModel;
                        currentRequest = new HLServiceRequestModel('', {});
                        currentRequest = this.allServiceRequests.find(serviceRequest => {
                            return serviceRequest.uid === uid;
                        });
                        this._horseManagerService.onGetServiceHorse.next(this.horse );
                        this._horseManagerService.onCurrentServiceRequestChange.next(currentRequest);
                        this._fuseSidebarService.getSidebar('horse-manager-schedule-panel').toggleOpen();
                    }
                if (result === 'delete'){
                    this.onSendReminder(uid);
                }
            });
        }
    }

    onSendReminder(uid): void {
        const event = {
            title: 'HorseLinc',
            msg: 'Are you sure you want to delete this request?',
            btn1Name: 'CANCEL',
            btn2Name: 'OK'
        };
        const dialogRef = this._matDialog.open(ConfirmDlgComponent, {
            disableClose: true,
            panelClass: 'confirmDlg',
            data: {event: event}
        });

        dialogRef.afterClosed().subscribe((action: any) => {
            if (action == event.btn2Name) {
                this.delRequest(uid);
            }
        });
    }

    delRequest(uid): void{
        this._horseManagerService.deleteRequest(uid)
        .then(() => {
            this._appService.showSnackBar('Request data deleted successfully', 'OK');   
            this._horseManagerService.setCurrentHorseSchedule(this._horseManagerService.selectHorse.uid);
        });
    }

    chooseProvider(uid: string): void{
            let currentRequest: HLServiceRequestModel;
            currentRequest = this.allServiceRequests.find(serviceRequest => {   
                return serviceRequest.uid === uid;
            });
            this._horseManagerService.onCurrentServiceRequestChange.next(currentRequest);
            this._fuseSidebarService.getSidebar('horse-manager-schedule-panel').toggleOpen();
    }
}
