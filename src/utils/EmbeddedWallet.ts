import {core, KeystoreType, } from 'tinywallet';
export {ix_Transfer, ix_TransferSPL} from 'tinywallet/dist/instructionbuilder';

export class EmbeddedWallet {

    private static walletCore: core | null = null;

    static async initialize(): Promise<void> {
        if (!this.walletCore) {
            this.walletCore = await core.CreateAsync(KeystoreType.Turnkey);
        }
    }

    static get(): core {
        if (!this.walletCore) {
            throw new Error('EmbeddedWallet not initialized');
        }
        return this.walletCore!;
    }
}