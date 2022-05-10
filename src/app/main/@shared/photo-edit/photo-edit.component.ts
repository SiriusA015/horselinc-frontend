import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ImageCroppedEvent } from 'ngx-image-cropper';

export interface UserPhotoInput{
    event: any;
}
export interface UserPhotoOutput{
    croppedImageFile: any;
    croppedImage64: any;
    flag: boolean;
}
@Component({
  selector: 'user-photo-edit',
  templateUrl: './photo-edit.component.html',
  styleUrls: ['./photo-edit.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserPhotoEditComponent {
    output: UserPhotoOutput;
    // croppedImageFile: any = '';
    // croppedImage64: any = '';
    loadedFlag: boolean;

    constructor(
        public _matDialogRef: MatDialogRef<UserPhotoEditComponent>,
        @Inject(MAT_DIALOG_DATA) public _data: UserPhotoInput)
    { 
        this.loadedFlag = false;
        this.output = {croppedImage64: '', croppedImageFile: '', flag: false}
    }
    imageCropped(event: ImageCroppedEvent): void {
        this.output.croppedImageFile = event.file;
        this.output.croppedImage64 = event.base64;
    }
    imageLoaded(): void {
        // show cropper
        this.loadedFlag = true;
    }
    cropperReady(): void {
        // cropper ready
    }
    loadImageFailed(): void {
        // show message
        this.loadedFlag = true;
    }
    onClose(): void{
        
        this._matDialogRef.close(this.output);
    }
    onSave(): void{
        this.output.flag = true;
        this.onClose();
    }
}
