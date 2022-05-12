hexo.extend.filter.register('before_post_render', function(post) {
  post.appends = [{
    markdown: '## 撰写评论\n如希望撰写评论，请发邮件至 [jysperm@gmail.com](mailto:jysperm@gmail.com?subject=' +
      encodeURIComponent('评论：' + post.title) + ') 并注明文章标题，我会挑选对读者有价值的评论附加到文章末尾。'
  }];

  if (post.reviews) {
    post.appends.push({
      markdown: '## 评论 \n' + post.reviews.map(function(review) {
        var body = review.body, author = review.author;

        if (author) {
          return '**' + author + '** ：' + body;
        } else {
          return body;
        }
      }).join('\n- - - -\n')
    });
  }
});
