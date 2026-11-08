const NEW_LISTING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function getDaycareRatingStatus(daycare, now = new Date()) {
  const rating = Number(daycare?.rating);
  if (Number.isFinite(rating) && rating > 0) {
    return { type: 'rated', rating };
  }

  if (daycare?.createdAt == null || daycare.createdAt === '') {
    return { type: 'unrated', label: 'Be the first to rate' };
  }

  const createdAt = new Date(daycare.createdAt).getTime();
  const currentTime = now instanceof Date ? now.getTime() : Number(now);
  const listingAge = currentTime - createdAt;
  if (
    Number.isFinite(createdAt) &&
    Number.isFinite(currentTime) &&
    listingAge >= 0 &&
    listingAge < NEW_LISTING_WINDOW_MS
  ) {
    return { type: 'new', label: 'New to FindCare' };
  }

  return { type: 'unrated', label: 'Be the first to rate' };
}
