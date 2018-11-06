// https://stackoverflow.com/questions/3552461/how-to-format-a-javascript-date
function formatDate(date) {
  var monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
  ];

  var day = date.getDate();
  var month = monthNames[date.getMonth()];
  var year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}
