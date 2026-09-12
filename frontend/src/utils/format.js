const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0
});

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

export const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0);
export const formatDate = (value) => dateFormatter.format(new Date(Number(value)));

export function timeRemaining(endDate) {
  const milliseconds = Number(endDate) - Date.now();
  if (milliseconds <= 0) return 'Ended';
  const days = Math.floor(milliseconds / 86400000);
  const hours = Math.floor((milliseconds % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.max(1, Math.floor((milliseconds % 3600000) / 60000));
  return `${hours}h ${minutes}m`;
}

export function toDateTimeLocal(timestamp) {
  const date = new Date(Number(timestamp));
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
