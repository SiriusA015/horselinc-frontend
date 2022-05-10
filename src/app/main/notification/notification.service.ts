import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { HLNotificationModel } from 'app/model/notifications';

import { AngularFirestore } from '@angular/fire/firestore';
import { COLLECTION_NOTIFICATIONS, COLLECTION_USERS } from 'app/model/constants';
import { AppService} from 'app/service/app.service';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';

@Injectable()
export class NotificationService implements Resolve<any>
{
  onNotificationsChanged: BehaviorSubject<any>;

  userId: string;
  notifications: HLNotificationModel[];

  onLoading: BehaviorSubject<any>;

  /**
   * Constructor
   *
   * @param {AngularFirestore} db
   */
  constructor(
    private db: AngularFirestore,
    private _appService: AppService,
    // private _matSnackBar: MatSnackBar,
    private _progressBarService: FuseProgressBarService
  ) 
  {
      this.onLoading = new BehaviorSubject([]);
      this.onNotificationsChanged = new BehaviorSubject([]);
      this.userId = this._appService.getCurUser().uid;
      this.notifications = [];
  }

  // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param {ActivatedRouteSnapshot} route
     * @param {RouterStateSnapshot} state
     * @returns {Observable<any> | Promise<any> | any}
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any
    {
        this.notifications = [];
        return new Promise((resolve, reject) => {

            this.getNotifications();
            Promise.all([
            ]).then(
                () => {
                    resolve();
                },
                reject
            )
            .catch((err) => {
            });
        });
    }

    getNotifications(): Promise<any>
    {
        this.onLoading.next(true);
        return new Promise((resolve, reject) => {
            this.notifications = [];
            this.userId = this._appService.getCurUser().uid;
            const collectionRef = this.db.collection(COLLECTION_NOTIFICATIONS, ref => ref.where('receiverId', '==', this.userId).limit(20)).get();
            // const collectionRef = this.db.collection(COLLECTION_NOTIFICATIONS, ref => ref.where('receiverId','==', this.userId).orderBy("createdAt").limit(10)).get();
            collectionRef.subscribe((snapshots) => {            
                const notificationList = snapshots;
                
                // get receiver user information
                notificationList.forEach(doc => {
                    this.notifications.push(new HLNotificationModel(doc.id, doc.data()));
                });
                this.onNotificationsChanged.next(this.notifications);
                this.onLoading.next(false);
                resolve(this.notifications);
            }, reject);
        });
    }

    /**
     * Delete notification
     *
     * @param notification
     */
    deleteNotification(notification): void
    {
        this._progressBarService.beginLoading2();
        this.db.collection(COLLECTION_NOTIFICATIONS)
            .doc(notification.uid)
            .delete()
            .then(() => {
                // Show the success message
                this._appService.showSnackBar('Notification deleted successfully', 'OK');
                const notificationIndex = this.notifications.indexOf(notification);
                this.notifications.splice(notificationIndex, 1);
                this.onNotificationsChanged.next(this.notifications);

                this._progressBarService.endLoading2();
        }).catch(error => {
            console.error('Error removing document: ', error);
        });
    }
}
