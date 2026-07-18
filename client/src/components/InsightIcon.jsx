import {
  HiOutlineLightBulb,
  HiChartBar,
  HiDocumentText,
  HiCheckCircle,
  HiExclamationTriangle,
  HiBell,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiUsers,
  HiShoppingCart,
  HiSparkles,
  HiBanknotes,
  HiClipboardDocumentList,
  HiBriefcase,
} from 'react-icons/hi2';

/** Maps API / UI emoji strings to Heroicons v2. Unknown → light bulb. */
const EMOJI_TO_ICON = {
  '💡': HiOutlineLightBulb,
  '📊': HiChartBar,
  '📈': HiArrowTrendingUp,
  '📉': HiArrowTrendingDown,
  '🧾': HiDocumentText,
  '✅': HiCheckCircle,
  '⚠️': HiExclamationTriangle,
  '⚠': HiExclamationTriangle,
  '🔔': HiBell,
  '💰': HiBanknotes,
  '✨': HiSparkles,
  '🎯': HiSparkles,
  '👥': HiUsers,
  '🛒': HiShoppingCart,
  '📋': HiClipboardDocumentList,
  '🔥': HiSparkles,
  '⭐': HiSparkles,
  '🌟': HiSparkles,
  '📝': HiDocumentText,
  '💼': HiBriefcase,
};

/**
 * @param {string} [value] — emoji or short glyph from API (e.g. Gemini insight icon)
 * @param {string} [className]
 */
export default function InsightIcon({ value, className = 'inline-block h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400' }) {
  const v = typeof value === 'string' ? value.trim() : '';
  if (!v || v === '•') {
    return <HiOutlineLightBulb className={className} aria-hidden />;
  }
  const Icon = EMOJI_TO_ICON[v];
  if (Icon) {
    return <Icon className={className} aria-hidden />;
  }
  return <HiOutlineLightBulb className={className} aria-hidden />;
}
