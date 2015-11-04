hexo.extend.generator.register('blogs', function(locals) {
  var baseUrl = this.config.url + this.config.root;

  return {
    path: 'blogs.json',
    data: JSON.stringify(locals.posts.sort('-date').limit(10).toArray().map(function(post) {
      return {
        title: post.title,
        url: baseUrl + post.path,
        createdAt: post.date.format(),
        tags: post.tags.toArray().map(function(tag) {
          return tag.name;
        })
      };
    }))
  };
});

hexo.extend.generator.register('tweets', function(locals) {
  return {
    path: 'tweets.json',
    data: JSON.stringify(locals.data.tweets.slice(0, 9))
  };
});
