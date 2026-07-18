/**
 * Supplier Selection Service
 * Picks the best supplier based on price, delivery speed, and rating.
 *
 * Score formula (lower is better):
 *   score = (priceIndex * 0.5) + (avgDeliveryDays * 0.3) - (rating * 0.2)
 */

const selectBestSupplier = (suppliers) => {
  if (!suppliers || suppliers.length === 0) return null;

  let best = null;
  let bestScore = Infinity;

  for (const s of suppliers) {
    const score =
      (s.priceIndex      * 0.5) +
      (s.avgDeliveryDays * 0.3) -
      (s.rating          * 0.2);

    if (score < bestScore) {
      bestScore = score;
      best = s;
    }
  }

  return best;
};

module.exports = { selectBestSupplier };
