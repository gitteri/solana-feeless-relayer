import { validatePublicKey } from './publicKey';
import { PublicKey } from '@solana/web3.js';

describe('validatePublicKey', () => {
    it('should return false for a valid public key', () => {
        const validPublicKey = new PublicKey('Aw9KGfJLxLxPV6fZVN4RejAcgZoo6QaTioxSCQjppz9q'); // replace with an actual valid public key
        const result = validatePublicKey(validPublicKey);
        expect(result).toBe(true);
    });

    it('should return false for an invalid public key type', () => {
        const invalidPublicKey ='invalid_key';
        // @ts-expect-error
        const result = validatePublicKey(invalidPublicKey);
        expect(result).toBe(false);
    });
});
