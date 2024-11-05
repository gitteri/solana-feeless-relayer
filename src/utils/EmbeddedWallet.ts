import {core, KeystoreType} from 'tinywallet';

class EmbeddedWallet {

    private static wallet: core;

    private static async initialize(): Promise<void> {
        this.wallet = await core.CreateAsync(KeystoreType.Local);
    }

    static get(): core {

        if (!this.wallet) {
            this.initialize();
        }
        return this.wallet;
    }
}

export default EmbeddedWallet;