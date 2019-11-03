const _ = require('lodash');
const moment = require('moment');

hexo.extend.tag.register('footprints', function(args, content) {
  const {footprints} = hexo.locals.get('data');

  return _.map(footprints, (days, city) => {
    return `
      <h3>${city}</h3>
      <ul>
      ${days.map( day => {
        if (_.isDate(day)) {
          return moment(day).format('YYYY-MM-DD');
        } else {
          return day;
        }
      }).map( day => {
        return `<li>${day}</li>`
      }).join('')}
      </ul>
    `;
  }).join('');
});
