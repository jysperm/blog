const moment = require('moment');

hexo.extend.tag.register('tweets', function(args, content) {
  const {tweets} = hexo.locals.get('data');

  return `
    <ul>
    ${tweets.map( tweet => {
      return `
        <li>
          <p>${moment(tweet.createdAt).format('YYYY-MM-DD')}</p>
          <p>${tweet.content}</p>
        </li>
      `;
    }).join('')}
    </ul>
  `;

  return ;
});
