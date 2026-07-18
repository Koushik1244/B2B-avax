/**
 * Inventory Service
 * Checks stock levels and triggers auto-reorder when below threshold.
 */

const Inventory    = require('../models/Inventory');
const Notification = require('../models/Notification');
const { selectBestSupplier } = require('./supplierService');
const { sendReorderEmail }   = require('./emailService');

const checkInventoryAndReorder = async (userId) => {
  const lowStock = await Inventory.find({
    userId,
    $expr: { $lt: ['$quantity', '$threshold'] },
  }).populate('supplierIds');

  if (lowStock.length === 0) return [];

  const results = [];

  for (const item of lowStock) {
    const suppliers  = item.supplierIds || [];
    const best       = selectBestSupplier(suppliers);
    const reorderQty = item.threshold * 2;

    let supplierName = best ? best.name : 'No supplier assigned';

    // Send reorder email (non-blocking)
    if (best) {
      sendReorderEmail(best, item.productName, reorderQty).catch(err =>
        console.warn(`[Inventory] Reorder email failed for ${item.productName}: ${err.message}`)
      );
    }

    // Create notification
    await Notification.create({
      userId,
      title: `Low stock — ${item.productName}`,
      message: `${item.productName} is at ${item.quantity} units (threshold: ${item.threshold}). Reorder of ${reorderQty} units triggered via ${supplierName}.`,
      type: 'reorder_triggered',
      priority: 'medium',
    });

    console.log(`[Inventory] Low stock: ${item.productName} (${item.quantity}/${item.threshold}) → reorder ${reorderQty} via ${supplierName}`);

    results.push({
      productName:  item.productName,
      quantity:     item.quantity,
      threshold:    item.threshold,
      reorderQty,
      supplier:     supplierName,
    });
  }

  return results;
};

module.exports = { checkInventoryAndReorder };
