import { Component, OnInit, Inject} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HLStripeCardModel } from 'app/model/users';

@Component({
  selector: 'cards-modal',
  templateUrl: './cards-modal.component.html',
  styleUrls: ['./cards-modal.component.scss']
})

export class CardsModalComponent implements OnInit {

  selectedCard: HLStripeCardModel;

  constructor(
      public _matDialogRef: MatDialogRef<CardsModalComponent>,
      @Inject(MAT_DIALOG_DATA) public cards: HLStripeCardModel[]
  ) {

  }

  ngOnInit(): void {
  }

  onClose(): void {
    this._matDialogRef.close();
  }
  onDone(): void {
      this._matDialogRef.close(this.selectedCard);
  }

}
