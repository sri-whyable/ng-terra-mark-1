import {Component, OnInit} from '@angular/core';
import {
  WalletController,
  getChainOptions,
  WalletStatus,
  UserDenied, CreateTxFailed, TxFailed, TxUnspecifiedError,
} from '@terra-money/wallet-provider';
import {MsgSend, StdFee} from '@terra-money/terra.js';

@Component({
  selector: 'app-why-linking',
  template: `
    <section style="padding: 30px">
      <button (click)="signInTn()">Sign In Tn</button>
    </section>
  `,
  styles: []
})
export class LinkingPageComponent {
  connectedWallet: any;
  terraController: WalletController | undefined;
  walletConnected = false;
  walletAddress = '';

  constructor() {
    // this.connectedWallet = useConnectedWallet();
    this.walletInit();
  }

  async walletInit() {
    const chainOptions = await getChainOptions();
    // this.connectedWallet = useConnectedWallet();
    // console.log(this.connectedWallet);

    this.terraController = new WalletController({
      ...chainOptions,
    });

    this.terraController.states().subscribe(async (states) => {
      console.log(states, 'states');
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

  async signInTn() {
    let signBytesResult: any;
    try {
      // revisit later how to make sure not duplicate
      // signBytesResult = await connectedWallet.signBytes(
      //   Buffer.from('LunarAssistant'),
      // );
      signBytesResult = await this.terraController?.sign({
        fee: new StdFee(0, '0usd'),
        msgs: [
          new MsgSend(
            this.walletAddress,
            'terra1f5u6ds3q95jwl2y5ellsczuwd2349g68u8af4l',
            {uusd: 0},
          ),
        ],
      });

      // setLoading(true);
    } catch (error: unknown) {
      // setLoading(false);
      console.error(error);
      if (error instanceof UserDenied) {
        console.error('User Denied');
      } else if (error instanceof CreateTxFailed) {
        console.error(`Create tx failed: ${error.message}`);
      } else if (error instanceof TxFailed) {
        console.error(`Tx failed: ${error.message}`);
      } else if (error instanceof TxUnspecifiedError) {
        console.error(`Tx unspecified ${error.message}`);
      } else {
        console.error(
          `Unknown Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    if (!signBytesResult) {
      console.error('Could not sign transaction properly');
      return;
    }
    console.log(signBytesResult.result.auth_info.signer_infos[0].public_key);

    const publicKeyData =
      signBytesResult.result.auth_info.signer_infos[0].public_key.toData();

    const recid = 0;

    const signature = Buffer.from(
      signBytesResult.result.signatures[0],
    ).toString('base64');
    console.log(signature);
  }
}
