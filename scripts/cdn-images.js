hexo.extend.tag.register('cdnimage', function(args) {
  return `<p><img src="${hexo.config.cdn_prefix}${args[0]}" alt="${args[0]}" /></p>`;
});
