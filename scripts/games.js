const _ = require('lodash');

function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      html += '<span class="game-star full">★</span>';
    } else if (rating >= i - 0.5) {
      html += '<span class="game-star half"><span class="game-star-bg">☆</span><span class="game-star-fg">★</span></span>';
    } else {
      html += '<span class="game-star empty">☆</span>';
    }
  }
  return html;
}

hexo.extend.tag.register('games', function() {
  const {games} = hexo.locals.get('data');

  const sorted = _.sortBy(games, g => -(g.year || 0));

  const styles = `
    <style>
      .markdown-body:has(.games-list),
      article:has(.games-list) {
        overflow: visible !important;
      }
      .games-list {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
      }
      .game-card {
        display: flex;
        align-items: flex-start;
        width: calc(50% - 8px);
        overflow: visible;
      }
      .game-cover {
        flex-shrink: 0;
        width: 120px;
        aspect-ratio: 2 / 3;
        object-fit: cover;
        border-radius: 4px;
        position: relative;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .game-cover:hover {
        transform: scale(1.08);
        z-index: 10;
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        border-radius: 4px;
      }
      .game-info {
        flex: 1;
        min-width: 0;
        padding: 0 12px 8px;
      }
      .game-title {
        margin: 0 !important;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.3;
      }
      .game-title-en {
        margin: 0 0 0 !important;
        font-size: 14px;
        font-weight: 400;
        color: #666;
        line-height: 1.3;
      }
      .game-rating {
        margin: 2px 0 0 !important;
        font-size: 13px;
        color: #e8a030;
        letter-spacing: 1px;
      }
      .game-star {
        position: relative;
        display: inline-block;
      }
      .game-star.half {
        display: inline-block;
        position: relative;
        color: #ddd;
      }
      .game-star.half .game-star-bg {
        color: #ddd;
      }
      .game-star.half .game-star-fg {
        position: absolute;
        left: 0;
        top: 0;
        width: 50%;
        overflow: hidden;
        color: #e8a030;
      }
      .game-star.empty {
        color: #ddd;
      }
      .game-progress {
        margin: 2px 0 0 !important;
        font-size: 12px;
        color: #666;
      }
      .game-tags {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        margin: 2px 0 0;
      }
      .game-tag {
        display: inline-block;
        padding: 0 6px;
        font-size: 11px;
        color: #555;
        background: #f0f0f0;
        border-radius: 3px;
      }
      .game-review {
        margin: 6px 0 0 !important;
        font-size: 13px;
        color: #555;
        line-height: 1.5;
      }
      @media (max-width: 768px) {
        .game-card {
          width: 100%;
        }
      }
    </style>
  `;

  const cards = sorted.map(game => {
    const tags = (game.tags || []).map(tag => {
      return `<span class="game-tag">${tag}</span>`;
    }).join('');

    const yearAttr = game.year ? ` title="${game.year}"` : '';

    const enLine = game.nameEn
      ? `<p class="game-title-en"${yearAttr}>${game.nameEn}</p>`
      : '';

    const ratingLine = game.rating != null
      ? `<div class="game-rating">${renderStars(game.rating)}</div>`
      : '';

    return `
      <div class="game-card">
        <img class="game-cover" src="${game.cover}" alt="${game.name}" loading="lazy">
        <div class="game-info">
          <h3 class="game-title"${yearAttr}>${game.name}</h3>
          ${enLine}
          ${ratingLine}
          ${game.progress ? `<p class="game-progress">${game.progress}</p>` : ''}
          <div class="game-tags">${tags}</div>
          ${game.review ? `<p class="game-review">${game.review}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');

  return styles + `<div class="games-list">${cards}</div>`;
});
