import { Component, OnInit, Pipe } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { UserService } from 'app/main/user/user.service';

import { HLUserModel, HLServiceProviderModel, HLHorseManagerModel, HLHorseManagerProviderModel, HLHorseManagerPaymentApproverModel } from 'app/model/users';
import { HLUserType } from 'app/model/enumerations';

import { AppService } from 'app/service/app.service';
import { UserAuthService } from 'app/service/user-auth.service';
import { UserHorseManagerService } from 'app/service/user-horse-manager.service';
import { UserManagerProvidersService } from 'app/service/user-manager-providers.service';
import { UserPaymentApproversService } from 'app/service/user-payment-approvers.service';

import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

@Component({
  selector: 'user-payment-approver',
  templateUrl: './payment-approver.component.html',
  styleUrls: ['./payment-approver.component.scss']
})
export class UserPaymentApproverComponent implements OnInit {
    horseManagers: [];
    
    action: string;
    curApprover: HLHorseManagerPaymentApproverModel;

    userQuestionUpdate = new Subject<string>();
    userQuestion: string;
    userQuestionAuto: string;
    amountUnlimited: boolean;
    amountValue: number;
    message: string;

    private _unsubscribeAll: Subject<any>;
    /**
     * Constructor
     *
     * @param {FormBuilder} _formBuilder
     * @param {FuseConfigService} _fuseConfigService
     */
    constructor(
        private _appService: AppService,
        private _userService: UserService,
        private _formBuilder: FormBuilder,
        private _fuseConfigService: FuseConfigService,
        private _fuseSidebarService: FuseSidebarService,
        private _userAuthService: UserAuthService,
        private _horseManagerService: UserHorseManagerService,
        private _managerProvidersService: UserManagerProvidersService,
        private _paymentApproversService: UserPaymentApproversService,
        private _progressBarService: FuseProgressBarService,
    )
    {
        this._unsubscribeAll = new Subject();
        this.horseManagers = [];

        this.curApprover = new HLHorseManagerPaymentApproverModel('', {});
        this.amountUnlimited = false;
        this.amountValue = 0;

        // Configure the layout
        this._fuseConfigService.config = {
            layout: {
                navbar   : {
                    hidden: true
                },
                toolbar  : {
                    hidden: true
                },
                footer   : {
                    hidden: true
                },
                sidepanel: {
                    hidden: true
                }
            }
        };
    }


    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this._horseManagerService.onSearchHorseManagers
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(horseManagers => {
            this.horseManagers = horseManagers;
            // console.log('this is horse-manager:', this.horseManagers);
        });

        this._userService.onSelectedApproverChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(approver => {
            this.action = this._userService.actionOfApprover;
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
    searchCurrent(query: any): void{
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
        if (this.curApprover.name === ''){
            this.message = 'Please select approver';
            bRet = false;
        }

        if (!bRet){
            this._appService.showSnackBar(this.message, 'FAIL');
        }
        return bRet;
    }

    editApprover(): void{

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
    closePanel(): void
    {
        this._fuseSidebarService.getSidebar('user-payment-approver').toggleOpen();
        this._fuseSidebarService.getSidebar('user-payment-info').open();
    }
}
