import { Component, ViewChild, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MsgExecuteContract, LCDClient } from '@terra-money/terra.js';
import { MatTable } from '@angular/material/table';
import { marketSmartContractAddr, nftCollection, toastDurationSeconds } from "./config"
import {
  getChainOptions,
  TxResult,
  WalletController,
  WalletStatus,
} from '@terra-money/wallet-provider';
import { LcdService } from './lcd.service';
import {
  MatSnackBar,
} from '@angular/material/snack-bar';
import { WalletChooseDialog } from './wallet-choose-dialog.component';
import { SellDialog } from './sell-dialog.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'terra-flea-market';
  nftContracts = nftCollection
  selectedContract = "";
  terraController: WalletController | undefined;
  walletConnected = false;
  walletAddress = ""
  walletNfts: any[] = [];
  selectedNft: any;
  allAds: any[] = [];
  recentPurchases: any = [];
  alreadyPostedAd = false;
  displayedColumns: string[] = ["image", "nft#", 'seller', "price", "price with fee", "created_at", "buy"];
  recentPurchaseColumns: string[] = ["image", "nft#", "price", "time", "txn_link"];
  lcdClient: any;
  loading = false;
  marketConfig = { "maker_fees": 1.01, "taker_fees": 1.01 }
  lastRspUpdate = []
  @ViewChild("all_ads", { static: true }) table: MatTable<any> | undefined;
  @ViewChild("recent_purchases", { static: true }) table2: MatTable<any> | undefined;
  marketSmartContractAddr: string

  constructor(private lcdService: LcdService, public dialog: MatDialog, private _snackBar: MatSnackBar) {
    this.walletInit()
    this.marketSmartContractAddr = marketSmartContractAddr
  }

  async walletInit() {


    const chainOptions = await getChainOptions();

    this.terraController = new WalletController({
      ...chainOptions,
    });

    this.terraController.states().subscribe(async (states) => {
      switch (states.status) {
        case WalletStatus.WALLET_NOT_CONNECTED:
          this.walletConnected = false
          this.walletAddress = ""
          break;

        case WalletStatus.WALLET_CONNECTED:
          this.walletConnected = true
          this.walletAddress = states.wallets[0].terraAddress
          this.lcdService.setLcdHost(states.network.lcd)

          this.refreshAds()
          this.lcdClient = new LCDClient({
            URL: states.network.lcd,
            chainID: states.network.chainID,
          })
          this.refreshMarketConfig()
          break;
      }
    })

  }

  refreshMarketConfig() {
    this.lcdService.getQuery(marketSmartContractAddr, { "get_config": {} })
      .subscribe((rsp) => {
        this.marketConfig = {
          "maker_fees": parseFloat(rsp.result.config.maker_fees) / 100 + 1,
          "taker_fees": parseFloat(rsp.result.config.taker_fees) / 100 + 1
        }
      })
  }

  refreshRecentPurchase() {
    this.lcdService.getRecentTx(marketSmartContractAddr)
      .subscribe((txns) => {
        txns.txs.forEach((tx: any) => {
          let msgs = tx.tx?.value?.msg

          if (msgs[0]?.value?.execute_msg?.buy) {
            let item = {
              "nft": {
                "contract_addr": tx.logs[0].events[3].attributes[2].value,
                "token_id": tx.logs[0].events[3].attributes[8].value
              },
              "price": msgs[0]?.value?.coins[0],
              "time": String(new Date(tx.timestamp).getTime() * 1000),
              "txhash": tx.txhash,
              "extension": {}
            }
            item.price.amount = String(parseInt(item.price.amount) / this.marketConfig.maker_fees)


            this.lcdService.getQuery(item.nft.contract_addr, { "nft_info": { "token_id": item.nft.token_id } })
              .subscribe(
                (nft_info) => {
                  item.extension = nft_info.result.extension
                  this.recentPurchases.push(item)
                  if (this.table2?.renderRows)
                    this.table2.renderRows();
                })
          }
        })
      })
  }

  refreshAds() {
    this.alreadyPostedAd = false
    this.allAds = []
    this.loading = true
    this.refreshRecentPurchase()
    this.lcdService.getQuery(marketSmartContractAddr, { "ads": {} })
      .subscribe((rsp) => {
        this.lastRspUpdate = JSON.parse(JSON.stringify(rsp.result.ads))
        rsp.result.ads.forEach((element: any) => {
          if (element.status == "active") {
            this.lcdService.getQuery(element.nft.contract_addr, { "nft_info": { "token_id": element.nft.token_id } })
              .subscribe(
                (nft_info) => {
                  console.log(this.allAds)
                  element.extension = nft_info.result.extension
                  this.allAds.push(element)

                  if (this.table?.renderRows)
                    this.table.renderRows()
                })
            if (element.seller == this.walletAddress) {
              this.alreadyPostedAd = true
            }
          }
        });

        this.loading = false
      })
  }

  async walletConnect() {

    const dialogRef = this.dialog.open(WalletChooseDialog, {
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.terraController?.connect(result);
      }
    });
  }
  async walletDisconnect() {
    this.terraController?.disconnect();
  }

  onNftContractChange() {
    this.lcdContractQuery()
  }

  openSellDialog(nft: any): void {
    const dialogRef = this.dialog.open(SellDialog, {
      width: '300px',
      data: { ...nft, price: 0, buyer: "" }

    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.postSell(result)
      }
    });
  }

  postSell(nft: any) {
    this.loading = true
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
          this.loading = true
          this.waitForUpdate(() => {
            this.loading = false
            this.refreshAds()
          })

          this._snackBar.open("Sell Ad Posted", "Ok", {
            duration: toastDurationSeconds,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        })
        .catch((err) => {
          this.loading = false
          if (err?.name != "UserDenied") {
            this._snackBar.open("Some Error Occured", "Ok", {
              duration: toastDurationSeconds,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
          }
        })
    };

  }

  getPrice(s: string) {
    return parseFloat(s) / 10 ** 6
  }

  buyNft(nft: any) {
    if (this.terraController) {
      this.terraController
        .post({
          msgs: [
            new MsgExecuteContract(this.walletAddress, marketSmartContractAddr,
              {
                "buy": {
                  "seller": nft.seller
                }
              },
              { uluna: parseInt(nft.price.amount) * 1.01 }
            ),
          ],
        })
        .then((nextTxResult: TxResult) => {
          this.loading = true
          this.waitForUpdate(() => {
            this.loading = false
            this.refreshAds()
          })
          this._snackBar.open("Buy Success", "Ok", {
            duration: toastDurationSeconds,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });

        })
        .catch((err) => {

          this.loading = false
          if (err?.name != "UserDenied") {
            this._snackBar.open("Some Error Occured", "Ok", {
              duration: toastDurationSeconds,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
          }
        })
    };
  }

  async waitForUpdate(cb: any) {

    this.lcdService.getQuery(marketSmartContractAddr, { "ads": {} }).subscribe((rsp) => {
      if (JSON.stringify(this.lastRspUpdate.sort()) == JSON.stringify(rsp.result.ads.sort())) {
        this.lastRspUpdate = rsp.result.ads
        setTimeout(this.waitForUpdate.bind(this), 500, cb)
      } else {
        this.lastRspUpdate = rsp.result.ads
        cb()
      }
    })
  }

  cancelNft(nft: any) {
    if (this.terraController) {
      this.terraController
        .post({
          msgs: [
            new MsgExecuteContract(this.walletAddress, marketSmartContractAddr,
              {
                "cancel": {
                }
              }),
          ],
        })
        .then((nextTxResult: TxResult) => {

          this.alreadyPostedAd = false
          this.loading = true
          this.waitForUpdate(() => {
            this.loading = false
            this.refreshAds()
          })
          this._snackBar.open("Ad Canceled", "Ok", {
            duration: toastDurationSeconds,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });

        })
        .catch((err) => {
          this.loading = false
          if (err?.name != "UserDenied") {
            this._snackBar.open("Some Error Occured", "Ok", {
              duration: toastDurationSeconds,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
          }
        })
    };
  }

  getImage(nft: any) {
    if (nft.image.startsWith("ipfs")) {
      if (nft.name.indexOf("HellCat") != -1){
        return `https://cdn.luart.io/mainnet/terra1nssfuchvr6nn58a9gqqxz62d7rz42zes82rehs/random-images/${nft.id}.png`
      }
      return "https://d75aawrtvbfp1.cloudfront.net/" + nft.image
    } else {
      return nft.image
    }
  }

  cleanDate(time: any) {
    return new Date(parseInt(time) / 1000).toLocaleString()
  }

  lcdContractQuery() {
    this.walletNfts = []
    this.lcdService.getQuery(this.selectedContract, { "tokens": { "owner": this.walletAddress } })
      .subscribe((rsp) => {
        if (rsp.result?.tokens.length) {
          rsp.result?.tokens.forEach((nft_id: string) => {
            this.lcdService.getQuery(this.selectedContract, { "nft_info": { "token_id": nft_id } }).subscribe(
              (nft_info) => {
                nft_info.result.extension["id"] = nft_id
                this.walletNfts.push(nft_info.result.extension)
              })
          });

        } else {
          this._snackBar.open("No NFT Found", "Ok", {
            duration: toastDurationSeconds,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        }
      })
  }

}


@Component({
  selector: 'toast-snack-bar',
  template: `<span class="toast">
              {{ msg }}
            </span>`,
  styles: [`
    .toast {
      color: hotpink;
    }
  `],
})
export class ToastSnackBarComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public msg: any) {

  }
}