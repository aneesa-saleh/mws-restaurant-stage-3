// https://stackoverflow.com/questions/3552461/how-to-format-a-javascript-date
function formatDate(date) {
  const monthNames = [
    'January', 'February', 'March',
    'April', 'May', 'June', 'July',
    'August', 'September', 'October',
    'November', 'December',
  ];

  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

function stringToBoolean(string) {
  if (typeof string === 'boolean') return string;

  return string === 'true';
}
