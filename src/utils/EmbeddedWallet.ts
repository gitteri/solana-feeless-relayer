import {core, KeystoreType, } from 'tinywallet';
export {ix_Transfer, ix_TransferSPL} from 'tinywallet/dist/instructionbuilder';

// A singleton class to manage the embedded wallet.
export class EmbeddedWallet {

    private static walletCore: core | null = null;

    private static async initialize(): Promise<void> {
        if (!this.walletCore) {
            this.walletCore = await core.CreateAsync(KeystoreType.Turnkey);
        }
    }

    // Gets the instance of the embedded wallet.
    // All operations on the wallet should be done through this instance.
    static get(): core {
        if (!this.walletCore) {
            throw new Error('EmbeddedWallet not initialized');
        }
        return this.walletCore!;
    }
}

// Automatically initializes the wallet during module import,
// to save consumers from having to call initialize() themselves.
(async () => {
    await EmbeddedWallet['initialize']();
})();