import { BigDecimal } from "@joaonmatos/decimal";

function allCombinations(n: number, k: number): bigint[] {
  if (n < 0 || k < 0) {
    throw new Error("n and k must be non-negative");
  }
  if (k > n) {
    throw new Error("k must be less than or equal to n");
  }
  if (n == 0 || (n == 1 && k == 0)) {
    return [1n];
  }
  if (n == 1 && k == 1) {
    return [1n, 1n];
  }
  const out = new Array<bigint>(k + 1);
  out.fill(1n);
  for (let i = 2; i <= n; i++) {
    let previous = out[0];
    for (let j = 1; j < i && j <= k; j++) {
      const current = out[j];
      out[j] = current + previous;
      previous = current;
    }
  }
  return out;
}

const ONE_HUNDRED = new BigDecimal(1n, 2);
function probability(n: number, k: number, p: number, nCk: bigint): BigDecimal {
  const nCkDecimal = BigDecimal.valueOf(nCk);
  const successChances = BigDecimal.valueOf(p).pow(k);
  const failureChances = BigDecimal.valueOf(1 - p).pow(n - k);
  return nCkDecimal
    .multiply(successChances)
    .multiply(failureChances)
    .multiply(ONE_HUNDRED)
    .round(12);
}

export function allProbabilities(n: number, p: number): BigDecimal[] {
  const combinations = allCombinations(n, n);
  const results = combinations.map((nCk, k) => probability(n, k, p, nCk));
  return results;
}
