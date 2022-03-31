import {Component, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MsgExecuteContract, LCDClient} from '@terra-money/terra.js';
import {
  WalletController,
  getChainOptions,
  WalletStatus,
  useConnectedWallet,
  TxResult,
} from '@terra-money/wallet-provider';
import { marketSmartContractAddr } from './config';
import {WalletChooseDialog} from './wallet-choose-dialog.component';
import {LcdService} from './lcd.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  displayPopUp: boolean = false;
  terraController: WalletController | undefined;
  walletConnected = false;
  walletAddress = '';
  connectedWallet: any;
  selectedContract = "";
  marketSmartContractAddr = '';

  constructor(public dialog: MatDialog,private lcdService: LcdService) {
    // this.getData();
    this.walletInit();
    this.marketSmartContractAddr = marketSmartContractAddr
  }

  ngOnInit(): void {
  }

  async getData() {
    // let url = 'https://www.lunarassistant.com/api/stats';
    /*let result = await fetch(url, { mode: 'no-cors'} );
    console.log(result);*/

    /*this.landingService.getStats()
      .subscribe((data) => {
        console.log(data);
      })*/
  }

  async walletInit() {
    const chainOptions = await getChainOptions();
    // this.connectedWallet = useConnectedWallet();
    // console.log(this.connectedWallet);

    this.terraController = new WalletController({
      ...chainOptions,
    });

    this.terraController.states().subscribe(async (states) => {
      console.log(states,'states');
      switch (states.status) {
        case WalletStatus.WALLET_NOT_CONNECTED:
          this.walletConnected = false
          this.walletAddress = ''
          break;

        case WalletStatus.WALLET_CONNECTED:
          this.walletConnected = true
          this.walletAddress = states.wallets[0].terraAddress
          break;
      }
    })
  }

  openSocialLink(type: string) {
    if (type === 'telegram') {
      window.open('https://t.me/GraviDAO', '_blank')
    } else if (type === 'twitter') {
      window.open('https://twitter.com/GraviDAO_', '_blank')
    } else if (type === 'medium') {
      window.open('https://gravidao.medium.com/', '_blank')
    } else if (type === 'github') {
      window.open('https://github.com/GraviDAO', '_blank')
    } else {
      window.open('https://discord.gg/nD6YFKQTRF', '_blank')
    }
  }

  displayMenu() {
    this.displayPopUp = !this.displayPopUp;
  }

  outSide() {
    this.displayPopUp = false;
  }

  async walletConnect() {

    const dialogRef = this.dialog.open(WalletChooseDialog, {});

    dialogRef.afterClosed().subscribe(result => {
      console.log(result)
      if (result) {
        this.terraController?.connect(result);
        this.walletInit();
      }
    });
  }

  async walletDisconnect() {
    this.terraController?.disconnect();
  }

  async postTransaction(nft?: any) {
    if (this.terraController) {
      this.terraController
        .post({
          msgs: [
            new MsgExecuteContract(this.walletAddress, this.selectedContract,
              {
                "approve": {
                  "spender": marketSmartContractAddr,
                  "token_id": nft.id
                }
              }),
            new MsgExecuteContract(this.walletAddress, marketSmartContractAddr,
              {
                "post_ad": {
                  "nft": {
                    "contract_addr": this.selectedContract,
                    "token_id": nft.id
                  },
                  "price": {
                    "denom": "uluna",
                    "amount": String(nft.price)
                  },
                  "buyer": nft.buyer == "" ? null : nft.buyer
                }
              }),
            new MsgExecuteContract(this.walletAddress, marketSmartContractAddr,
              {
                "deposit": {
                  "nft": {
                    "contract_addr": this.selectedContract,
                    "token_id": nft.id
                  },
                }
              })
          ],
        })
        .then((nextTxResult: TxResult) => {
          this.waitForUpdate(() => {
            // this.loading = false
            // this.refreshAds()
          })
        })
        .catch((err) => {
          console.log(err, 'error');
        })
    };
  }

  async waitForUpdate(cb: any) {

    this.lcdService.getQuery(marketSmartContractAddr, { "ads": {} }).subscribe((rsp) => {
      console.log(rsp.result.ads.sort());
    });
  }

  // to verify if the user owns the wallet
  signIn() {
    // useConnectedWallet()?.sign()
  }
}
