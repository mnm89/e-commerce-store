import zeroDecimalCurrencies from "./zero-decimal-currencies";

function roundToTwo(num: number, currency: string): string {
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return `${num}`;
  }
  return num.toFixed(2);
}
export default roundToTwo;
