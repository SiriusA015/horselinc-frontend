import { Component, OnInit, Input } from '@angular/core';
import { HLServiceRequestModel } from 'app/model/service-requests';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AngularFirestore } from '@angular/fire/firestore';
import { COLLECTION_SERVICE_REQUESTS} from 'app/model/constants';
import {HLServiceRequestStatus} from 'app/model/enumerations';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { ConfirmDlgComponent } from 'app/main/@shared/confirm-dlg/confirm-dlg.component';
import { ScheduleService } from '../schedule.service';
import { AppService } from 'app/service/app.service';

@Component({
  selector: 'schedule-card',
  templateUrl: './schedule-card.component.html',
  styleUrls: ['./schedule-card.component.scss']
})

export class ScheduleCardComponent implements OnInit {

    @Input() request: HLServiceRequestModel;
    @Input() reservation: string;

    trainerAvatarUrl: string;
    horseAvatarUrl: string;
    enableShow: boolean;
    userId: string;
    isAssignedSchedule: boolean;
    inputAssignFlag: boolean;
    outAssignFlag: boolean;
    noneButtonFlag: boolean;

    constructor(
        private db: AngularFirestore,
        private _matDialog: MatDialog, 
        private _fuseSidebarService: FuseSidebarService,
        private _scheduleService: ScheduleService,
        private _appService: AppService
    ) {
        this.trainerAvatarUrl = '';
        this.horseAvatarUrl = '';
        this.enableShow = false;
        this.isAssignedSchedule = false;
        this.noneButtonFlag = false;
    }

    ngOnInit(): void{
        this.userId = this._appService.getCurUser().uid;
        if (this.request.serviceProviderId == this.userId){
            this.inputAssignFlag = false;
            if (this.request.assigner) {
                this.outAssignFlag = true;
            }
            else{
                this.outAssignFlag = false;
            }
        }
        else{
            this.inputAssignFlag = true;
            this.outAssignFlag = false;
        }
        if (this.request.status == 'invoiced' || this.request.status == 'paid'){
            this.noneButtonFlag = true;
        }
    }

    onAssign(): void{
        this._scheduleService.onCurrentServiceRequestChange.next(this.request);
        this._fuseSidebarService.getSidebar('schedule-assign-panel').toggleOpen();
    }

    onAccept(): void {
        this._scheduleService.udpateRequestBy(this.request.uid, {status: HLServiceRequestStatus.accepted})
        .then(() => {
            this.request.status = HLServiceRequestStatus.accepted;
        });
    }

    onJobComplete(): void {
        const event = {
            title: 'HorseLinc',
            msg: 'Are you sure to mark this job as complete? This action cannot be undone. Once a job is marked complete, it will be moved into the payments tab.',
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
                this._scheduleService.udpateRequestBy(this.request.uid, {status: HLServiceRequestStatus.completed})
                .then(() => {
                    this.request.status = HLServiceRequestStatus.completed;
                });
            }
        });
    }

    requestDenial(): void{
        if ( this.request.status == 'invoiced') {return; }
        if (!this.outAssignFlag) {
            if (this.request.status == 'accepted' && this.reservation != 'Upcoming') {
                const event = {
                    title: 'Job Options',
                    msg: '',
                    btn1Name: 'View Notes/Add Services',
                    btn2Name: 'CANCEL'
                };
                const dialogRef = this._matDialog.open(ConfirmDlgComponent, {
                    disableClose: true,
                    panelClass: 'confirmDlg',
                    data: {event: event}
                });
                dialogRef.afterClosed().subscribe((action: any) => {
                    if (action == event.btn1Name) {
                        this.onShowAddServices();
                    }
                });
            } else if (this.request.status != 'declined') {
                const event = {
                    title: 'Job Options',
                    msg: '',
                    btn1Name: 'DECLINE',
                    btn2Name: 'CANCEL'
                };
                const dialogRef = this._matDialog.open(ConfirmDlgComponent, {
                    disableClose: true,
                    panelClass: 'confirmDlg',
                    data: {event: event}
                });
                dialogRef.afterClosed().subscribe((action: any) => {
                    if (action == event.btn1Name) {
                        this._scheduleService.udpateRequestBy(this.request.uid, {status: HLServiceRequestStatus.declined})
                        .then(() => {
                            this.request.status = HLServiceRequestStatus.declined;
                        });
                    }
                });
            }
        } else {             // assined to other sp
            const event = {
                title: 'Job Options',
                msg: '',
                btn1Name: 'Assign Job to Someone Else',
                btn2Name: 'CANCEL'
            };

            const dialogRef = this._matDialog.open(ConfirmDlgComponent, {
                disableClose: true,
                panelClass: 'confirmDlg',
                data: {event: event}
            });

            dialogRef.afterClosed().subscribe((action: any) => {
                if (action == event.btn1Name) {
                    this.onAssign();
                }
            });
        }
    }

    onShowAddServices(): void
    {
        this._scheduleService.onRequestChanged.next(this.request);
        this._fuseSidebarService.getSidebar('schedule-addServices-panel').toggleOpen();
    }
}
