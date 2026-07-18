/**
 * GST Calculation Service
 */

const calculateGST = ({ pricePerUnit, quantity, gstPercent }) => {
  const baseCost  = parseFloat((pricePerUnit * quantity).toFixed(2));
  const gstAmount = parseFloat(((baseCost * gstPercent) / 100).toFixed(2));
  const finalCost = parseFloat((baseCost + gstAmount).toFixed(2));
  const cgst      = parseFloat((gstAmount / 2).toFixed(2));
  const sgst      = parseFloat((gstAmount / 2).toFixed(2));

  return { baseCost, gstAmount, finalCost, cgst, sgst };
};

module.exports = { calculateGST };
