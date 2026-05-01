const path = require('path').posix;

function splitUrl(url) {
  const hashIndex = url.indexOf('#');
  const beforeHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex);
  const queryIndex = beforeHash.indexOf('?');

  if (queryIndex === -1) {
    return {pathname: beforeHash, query: '', hash};
  }

  return {
    pathname: beforeHash.slice(0, queryIndex),
    query: beforeHash.slice(queryIndex),
    hash
  };
}

function pageDir(pagePath) {
  const dir = path.dirname(pagePath || 'index.html');
  return dir === '.' ? '' : dir;
}

function relativeFromPage(pagePath, url) {
  if (!url.startsWith('/') || url.startsWith('//')) return url;

  const {pathname, query, hash} = splitUrl(url);
  const targetPath = pathname.slice(1);
  let relativePath = path.relative(pageDir(pagePath), targetPath);

  if (!relativePath) {
    relativePath = '.';
  }

  if (pathname.endsWith('/')) {
    relativePath += '/';
  }

  return relativePath + query + hash;
}

function rewriteSrcset(pagePath, srcset) {
  return srcset.split(',').map(item => {
    const trimmed = item.trimStart();
    const offset = item.length - trimmed.length;
    const match = trimmed.match(/^(\S+)(.*)$/);

    if (!match) return item;

    return item.slice(0, offset) + relativeFromPage(pagePath, match[1]) + match[2];
  }).join(',');
}

hexo.extend.filter.register('after_render:html', function(html, data) {
  const pagePath = data && data.path;

  return html
    .replace(/\b(href|src|action|poster)=(["'])(\/(?!\/)[^"']*)\2/g, function(match, attr, quote, url) {
      return attr + '=' + quote + relativeFromPage(pagePath, url) + quote;
    })
    .replace(/\bsrcset=(["'])([^"']*)\1/g, function(match, quote, srcset) {
      return 'srcset=' + quote + rewriteSrcset(pagePath, srcset) + quote;
    });
});
