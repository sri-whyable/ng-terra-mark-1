import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';


@Component({
    selector: 'sell-dialog',
    templateUrl: './sell-dialog.html',
})
export class SellDialog {

    constructor(
        public dialogRef: MatDialogRef<SellDialog>,
        @Inject(MAT_DIALOG_DATA) public data: any) { }

    onNoClick(): void {
        this.dialogRef.close();
    }
    okClick(): void {

        if (parseFloat(this.data.price) <= 0) {
            alert("Please enter a price")
        } else {
            this.data.price = parseFloat(this.data.price) * 10 ** 6
            this.dialogRef.close(this.data)
        }
    }
}
