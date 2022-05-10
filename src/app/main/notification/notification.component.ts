import { Component, OnDestroy, OnInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { HLNotificationModel } from './../../model/notifications';
import { Subject } from 'rxjs';
import { NotificationService } from 'app/main/notification/notification.service';

import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'notification',
    templateUrl: './notification.component.html',
    styleUrls: ['./notification.component.scss'],
    encapsulation: ViewEncapsulation.None,
})

export class NotificationComponent implements OnInit, OnDestroy
{
  notifications: HLNotificationModel[];
  filteredNotifications: HLNotificationModel[];
  isLoading: boolean;

  // Private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {NotificationService} _notificationService
   * @param {MatDialog} _matDialog
   */
  constructor(
    private _notificationService: NotificationService,
    private _fuseConfigService: FuseConfigService,
  ) {
    this.isLoading = true;
    this._unsubscribeAll = new Subject();

    this._fuseConfigService.config = {
      layout: {
          navbar   : {
              hidden: false
          },
          toolbar  : {          
              hidden: false
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

  /**
   * On destroy
   */
  ngOnInit(): void 
  {
    this.isLoading = true;
    
    this._notificationService.onNotificationsChanged
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(notifications => {
            this.notifications = [];
            this.filteredNotifications = [];
            this.notifications = notifications;
            this.sortBy(this.notifications);
    });

    this._notificationService.onLoading
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(isLoading => {
            this.isLoading = isLoading;
        });
  }

  ngOnDestroy(): void
  {
      this.notifications = [];
      // Unsubscribe from all subscriptions
      this._unsubscribeAll.next();
      this._unsubscribeAll.complete();
  }

  sortBy( list: HLNotificationModel[] ): void{
      this.filteredNotifications = list;
      this.filteredNotifications.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        // return dateA.getTime() - dateB.getTime();

        if (dateA < dateB) {
            return 1;
        } else if (dateA == dateB) {
            return 0;
        } else {
            return -1;
        }
      });
  }
}
