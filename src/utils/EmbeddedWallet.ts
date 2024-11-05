import {core, KeystoreType} from 'tinywallet';

class EmbeddedWallet {

    private static walletCore: core | null = null;

    static async initialize(): Promise<void> {
        if (!this.walletCore) {
            this.walletCore = await core.CreateAsync(KeystoreType.Local);
        }
    }

    static get(): core {
        return this.walletCore!;
    }
}

export default EmbeddedWallet;