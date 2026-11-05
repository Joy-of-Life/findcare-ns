export function hasDailyRate(dailyRate) {
  return dailyRate !== null && dailyRate !== undefined && dailyRate !== '' &&
    Number.isFinite(Number(dailyRate)) && Number(dailyRate) >= 0;
}

export function formatDailyRate(dailyRate) {
  return hasDailyRate(dailyRate) ? `$${Number(dailyRate)}/day` : 'Daily rate not confirmed';
}
