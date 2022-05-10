import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'confirmDlg',
  templateUrl: './confirm-dlg.component.html',
  styleUrls: ['./confirm-dlg.component.scss']
})
export class ConfirmDlgComponent {

  constructor(
    public _matDialogRef: MatDialogRef<ConfirmDlgComponent>,
    @Inject(MAT_DIALOG_DATA) public _data: any
  ) { 
  }

  ngOnInit() {
   
  }

  onbtn1Name(): void{
      this._matDialogRef.close(this._data.event.btn1Name);
  }

  onbtn2Name(): void {
      this._matDialogRef.close(this._data.event.btn2Name);
  }

}
