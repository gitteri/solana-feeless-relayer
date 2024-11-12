import Decimal from 'decimal.js';

/**
 * Convert a balance from Decimal to a string representation
 * @param {Decimal} balance - The balance to convert
 * @param {number} decimals - The number of decimal places to consider
 * @returns {string} The balance as a string
 */
export function bigintToUiString(balance: Decimal, decimals: number): string {
  return balance.div(new Decimal(10).pow(decimals)).toString();
}

/**
 * Convert a balance from lamports to a string representation in SOL
 * @param {bigint} lamports - The balance in lamports
 * @returns {string} The balance in SOL as a string
 */
export function lamportsToSolString(lamports: bigint): string {
  const SOL_DECIMALS = 9;
  return bigintToUiString(new Decimal(lamports.toString()), SOL_DECIMALS);
}

export function stringToUiString(value: string, decimals: number): string {
  return bigintToUiString(new Decimal(value), decimals);
}
