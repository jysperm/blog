hexo.extend.helper.register 'duoshuoKey', (post) ->
  duoshuo_id = post.raw.match /duoshuo_id: ?(.*)/

  if duoshuo_id
    return duoshuo_id[1]

  post_permalink = post.raw.match /permalink: ?(.*)/

  if post_permalink
    return post_permalink[1]
