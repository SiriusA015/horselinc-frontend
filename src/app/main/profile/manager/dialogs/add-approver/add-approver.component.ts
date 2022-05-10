import { Component, OnInit, Pipe } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { MatSnackBar, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';

import { HLUserModel, HLServiceProviderModel, HLHorseManagerModel, HLHorseManagerProviderModel, HLHorseManagerPaymentApproverModel } from 'app/model/users';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { UserManagerProvidersService } from 'app/service/user-manager-providers.service';
import { UserPaymentApproversService } from 'app/service/user-payment-approvers.service';

import { ProfileManagerService } from 'app/main/profile/manager/manager.service';

@Component({
  selector: 'profile-manager-addapprover',
  templateUrl: './add-approver.component.html',
  styleUrls: ['./add-approver.component.scss']
})
export class ProfileManagerAddApproverComponent implements OnInit {
    horseManagers: [];

    action: string;
    curApprover: HLHorseManagerPaymentApproverModel;

    userQuestionUpdate = new Subject<string>();
    userQuestion: string;
    userQuestionAuto: string;
    amountUnlimited: boolean;
    amountValue: number;
    message: string;
    isProcessing: boolean;

    private _unsubscribeAll: Subject<any>;

  constructor(
    private _appService: AppService,
    private _fuseSidebarService: FuseSidebarService,
    private _userAuthService: UserAuthService,
    private _horseManagerService: UserHorseManagerService,
    private _managerProvidersService: UserManagerProvidersService,
    private _paymentApproversService: UserPaymentApproversService,
    private _profileManagerService: ProfileManagerService
    ) {
        this._unsubscribeAll = new Subject();
        this.horseManagers = [];
        this.curApprover = new HLHorseManagerPaymentApproverModel('', {});
        this.amountUnlimited = false;
        this.amountValue = 0;
        this.isProcessing = false;
    }

    ngOnInit(): void {

        this._horseManagerService.onSearchHorseManagers
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(horseManagers => {
            this.horseManagers = horseManagers;
        });
        this._profileManagerService.onSelectedApproverChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(approver => {
            this.action = this._profileManagerService.actionOfApprover;
            if (this.action === 'Add'){
                this.curApprover = new HLHorseManagerPaymentApproverModel('', {});
                this.amountValue = 0;
                this.amountUnlimited = false;
    
            }
            else{
                this.curApprover = new HLHorseManagerPaymentApproverModel(approver.uid, approver);
                this.amountValue = this.curApprover.amount;
                this.amountUnlimited = this.curApprover.amount == null || this.curApprover.amount === 0;
                }
            this.userQuestion = this.curApprover.name;
            this.message = '';
        });

        this.userQuestionUpdate.pipe(
            debounceTime(200),
            distinctUntilChanged())
            .subscribe(value => {
                if (value !== '' && value.length >= 3){
                    this.searchCurrent(value);
                }
            });
    }
    displayFnOfSearch(item): string{
        return item ? item.name : '';
    }
    searchCurrent(query): void{
        this._horseManagerService.searcHorseManagers(query);
    }
    onSelectApprover(horseManager: HLHorseManagerModel): void{
        this.curApprover.userId = horseManager.userId;
        this.curApprover.creatorId = this._userAuthService.hlUser.uid;
        this.curApprover.name = horseManager.name || '';
        this.curApprover.location = horseManager.location || '';
        this.curApprover.avatarUrl = horseManager.avatarUrl || '';
        this.curApprover.phone = horseManager.phone || '';
        this.curApprover.createdAt = Date.now();
    }

    checkForm(): boolean{
        let bRet = true;

        if (this.amountUnlimited){
            this.curApprover.amount = null;
        }
        else{
            this.curApprover.amount = Number(this.amountValue);
            if (this.amountValue <= 0)
            {
                this.message = 'Please enter amount';
                bRet = false;
            }
        }
        if (this.curApprover.name == ''){
            this.message = 'Please select approver';
            bRet = false;
        }

        if (!bRet){
            this._appService.showSnackBar(this.message, 'FAIL');
        }
        return bRet;
    }

    editApprover(): void{
        if (this.isProcessing){
            return;
        }
        if ( !this.checkForm() ){
            return;
        }

        this.curApprover.percentage = 100;
        if (this.action === 'Add'){
            this._paymentApproversService.addPaymentApprover(this.curApprover);
        }
        else{
            this._paymentApproversService.updatePaymentApprover(this.curApprover);
        }
        this.closePanel();
    }
    closePanel(): void{
        this._fuseSidebarService.getSidebar('profile-manager-addapprover').close();
    }

    psearch(evt): boolean{
        const charCode = (evt.which) ? evt.which : evt.keyCode;
        
        if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)){
            window.event.returnValue = false;
            return false;
        }

        // Textbox value    
        const _value = this.amountValue.toString();    
        const _pattern0 = /\d+/;
        if (_pattern0.test(_value)) {
            if (charCode == 46) {
                window.event.returnValue = false;
                return false;
            }
        }
        
        const _pattern2 = /\d+/;
        if (_pattern2.test(_value)) {
            window.event.returnValue = false;
            return false;
        }
        window.event.returnValue = true;
        return true;
    }
}
