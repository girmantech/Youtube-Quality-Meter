export function getBackgroundColor(percentage) {
  if (percentage < 1) {
    return ['#FFECEC', '#F72D00'];
  } else if (percentage >= 1 && percentage < 2) {
    return ['#FFEDE2', '#ED6400'];
  } else if (percentage >= 2 && percentage < 3) {
    return ['#FFFDD1', '#9F8F00'];
  } else {
    return ['#EAFFD6', '#40A800'];
  }
}
