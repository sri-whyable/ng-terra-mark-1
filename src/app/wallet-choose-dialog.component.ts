
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {
    ConnectType
} from '@terra-money/wallet-provider';

@Component({
    selector: 'wallet-choose-dialog',
    templateUrl: './wallet-choose-dialog.html',
})
export class WalletChooseDialog {

    constructor(
        public dialogRef: MatDialogRef<WalletChooseDialog>) {

    }
    selectWallet(type: number): void {
        if (type == 0) {
            this.dialogRef.close(ConnectType.CHROME_EXTENSION)
        } else {
            this.dialogRef.close(ConnectType.WALLETCONNECT)
        }

    }
}
