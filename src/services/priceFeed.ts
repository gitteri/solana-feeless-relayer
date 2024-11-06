
import { Price, PriceServiceConnection } from '@pythnetwork/price-service-client';
import Decimal from 'decimal.js';

export class PriceFeed {
  private connection: PriceServiceConnection;

  // note: this endpoint is not recommended for production use due to its rate limits
  constructor(endpoint: string = 'https://hermes.pyth.network') {
    this.connection = new PriceServiceConnection(endpoint);
  }

  /**
   * Get the current price of SOL from Pyth
   * @returns {Promise<number>} The current price of SOL
   */
  async getSolPrice(): Promise<string> {
    // Get the latest values of the SOL/USD price feed as a JSON object.
    try {
      const currentPrices = await this.connection.getLatestPriceFeeds(['0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d']);
      console.log(currentPrices);
      if (!currentPrices || currentPrices.length === 0) {
        throw new Error('No price data found');
      }
      // get the EMA price for the SOL/USD price feed no later than 60 seconds ago
      let price = currentPrices[0].getEmaPriceNoOlderThan(60);
      if (!price) {
        // if no EMA price, get the latest price no older than 60 seconds
        price = currentPrices[0].getPriceNoOlderThan(60);
      }
      if (!price) {
        throw new Error('No price data found');
      }
      return this.convertPriceToDecimalString(price);
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      throw error;
    }
  }
  /**
   * Convert a price object to a decimal string using the provided expo
   * @param {Price} priceObj - The price object to convert
   * @returns {string} The price as a decimal string
   */
  convertPriceToDecimalString(priceObj: Price): string {
    // Price object example:
    //     price: Price {
    //       conf: '3315255511',
    //       expo: -8,
    //       price: '6619626406527',
    //       publishTime: 1715870606
    //     }
    const { price, expo } = priceObj;
    const decimalPrice = new Decimal(price).mul(new Decimal(10).pow(expo));
    return decimalPrice.toString();
  }
}
