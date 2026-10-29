const SUPPORTED_AGE_GROUPS = require('../constants/ageGroups');

function getAvailabilityIncreases(previous, next) {
  return Object.fromEntries(SUPPORTED_AGE_GROUPS
    .filter(ageGroup => Number(next?.[ageGroup] || 0) > Number(previous?.[ageGroup] || 0))
    .map(ageGroup => [ageGroup, Number(next[ageGroup])]));
}

module.exports = getAvailabilityIncreases;
