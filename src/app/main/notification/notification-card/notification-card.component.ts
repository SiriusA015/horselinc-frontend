import { Component, OnDestroy, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { HLNotificationModel } from './../../../model/notifications';
import { NotificationService } from './../notification.service';
import { Subject } from 'rxjs';
import * as moment from 'moment';

import { MatDialog } from '@angular/material/dialog';
import { ConfirmDlgComponent } from 'app/main/@shared/confirm-dlg/confirm-dlg.component';

@Component({
  selector: 'notification-card',
  templateUrl: './notification-card.component.html',
  styleUrls: ['./notification-card.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class NotificationCardComponent implements OnInit, OnDestroy
{
  @Input() notification: HLNotificationModel;
  // Private
  private _unsubscribeAll: Subject<any>;

  constructor(
      private _notificationService: NotificationService,
      private _matDialog: MatDialog, 
  ) { 
    // Set the private defaults
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void
  {
      // Unsubscribe from all subscriptions
      this._unsubscribeAll.next();
      this._unsubscribeAll.complete();
  }

  deleteNotification(notification): void {
      const event = {
          title: 'HorseLinc',
          msg: 'Are you sure you want to delete this notification?',
          btn1Name: 'NO',
          btn2Name: 'YES'
      };
      const dialogRef = this._matDialog.open(ConfirmDlgComponent, {
          disableClose: true,
          panelClass: 'confirmDlg',
          data: {event: event}
      });

      dialogRef.afterClosed().subscribe((action: any) => {
        if (action == event.btn2Name) {
            this._notificationService.deleteNotification(notification);
        }
      });
  }
  getDateDisp1(): string{
      const disp = moment(new Date(this.notification.createdAt)).format('ddd, MMM Do, YYYY');
      return disp;
  }
  getDateDisp2(): string{
      const createdAt = new Date(this.notification.createdAt).getTime();
      const now = Date.now();
      const elapsedMilliseconds = now - createdAt;
      const elapsedDays = elapsedMilliseconds / 1000 / 3600 / 24;

      let disp = moment(new Date(this.notification.createdAt)).fromNow();
      if (elapsedDays >= 4){
        disp = moment(new Date(this.notification.createdAt)).format('ll');
      }
      return disp;
   }
}
