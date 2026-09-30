function toPublicDaycare(daycare) {
  if (!daycare) return daycare;

  const publicDaycare = typeof daycare.toObject === 'function'
    ? daycare.toObject()
    : { ...daycare };

  if (publicDaycare.hideAddress) {
    publicDaycare.address = '';
    if (publicDaycare.coordinates?.lat != null && publicDaycare.coordinates?.lng != null) {
      publicDaycare.coordinates = {
        lat: Number(publicDaycare.coordinates.lat.toFixed(2)),
        lng: Number(publicDaycare.coordinates.lng.toFixed(2)),
      };
    }
  }

  return publicDaycare;
}

module.exports = toPublicDaycare;