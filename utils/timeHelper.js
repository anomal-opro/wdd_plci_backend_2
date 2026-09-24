// =============================================================================
// TIME & DATE HELPERS (FORCE ASIA/JAKARTA / WIB)
// =============================================================================

/**
 * Return current date string in WIB (Asia/Jakarta) format: YYYY-MM-DD
 * Example: '2026-09-24'
 */
const getWibTodayDate = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

/**
 * Return formatted Indonesian date string: Hari, DD MMMM YYYY
 * Example: 'Kamis, 24 September 2026'
 */
const getIndoDateString = (dateObj = new Date()) => {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Return formatted Indonesian time string: HH:MM or HH:MM:SS in WIB
 * Example: '14:30:15'
 */
const getIndoTimeString = (dateObj = new Date(), withSeconds = false) => {
  const opts = {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  if (withSeconds) opts.second = '2-digit';
  return new Intl.DateTimeFormat('id-ID', opts).format(dateObj).replace(/\./g, ':');
};

/**
 * Format number to Indonesian Rupiah currency string
 */
const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num || 0);
};

module.exports = {
  getWibTodayDate,
  getIndoDateString,
  getIndoTimeString,
  formatRupiah
};
