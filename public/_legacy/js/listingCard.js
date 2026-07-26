/* ───────────────────────────────────────────────────────────
   listingCard.js  —  Shared listing-card renderer for Nexus
   Returns a DOM element; injects card CSS once.
   ─────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var styleInjected = false;

  /* ── Inject card CSS (once) ──────────────────────────────── */
  function injectStyles() {
    if (styleInjected) return;
    styleInjected = true;

    var style = document.createElement('style');
    style.id = 'listing-card-styles';
    style.textContent = [
      /* Grid container */
      '.listing-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px}',

      /* Card shell */
      '.listing-card{background:#fff;border-radius:16px;overflow:hidden;',
      'box-shadow:0 4px 24px rgba(0,0,0,.08);',
      'transition:transform .3s cubic-bezier(.4,0,.2,1),box-shadow .3s cubic-bezier(.4,0,.2,1);',
      'cursor:pointer;position:relative;display:flex;flex-direction:column}',
      '.listing-card:hover{transform:translateY(-6px);box-shadow:0 12px 48px rgba(0,0,0,.14)}',

      /* Image wrapper (3:2 aspect) */
      '.listing-card__img-wrap{position:relative;width:100%;padding-top:66.67%;overflow:hidden;background:#f1f5f9}',
      '.listing-card__img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;transition:transform .45s ease}',
      '.listing-card:hover .listing-card__img{transform:scale(1.06)}',

      /* Placeholder icon (no image) */
      '.listing-card__placeholder{position:absolute;top:0;left:0;width:100%;height:100%;',
      'display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:2.8rem}',

      /* Favourite heart */
      '.listing-card__fav{position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;',
      'background:rgba(255,255,255,.92);backdrop-filter:blur(6px);border:none;cursor:pointer;',
      'display:flex;align-items:center;justify-content:center;font-size:1rem;color:#94a3b8;',
      'transition:all .25s ease;z-index:2}',
      '.listing-card__fav:hover{background:#fff;transform:scale(1.18)}',
      '.listing-card__fav.active{color:#e94560}',

      /* Status badge */
      '.listing-card__badge{position:absolute;top:12px;left:12px;padding:4px 10px;border-radius:6px;',
      'font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;z-index:2}',
      '.listing-card__badge--active{background:rgba(16,185,129,.15);color:#059669}',
      '.listing-card__badge--sold{background:rgba(59,130,246,.15);color:#2563eb}',
      '.listing-card__badge--removed{background:rgba(239,68,68,.15);color:#dc2626}',

      /* Body */
      '.listing-card__body{padding:16px 18px;flex:1}',
      '.listing-card__title{font-size:1rem;font-weight:600;color:#1a1a2e;margin:0 0 6px;',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.listing-card__price{font-size:1.25rem;font-weight:800;color:#e94560;margin:0 0 10px}',
      '.listing-card__meta{display:flex;align-items:center;gap:14px;font-size:.8rem;color:#64748b;flex-wrap:wrap}',
      '.listing-card__meta i{margin-right:3px;font-size:.72rem}',

      /* Condition mini badge */
      '.listing-card__condition{display:inline-block;padding:2px 8px;border-radius:4px;',
      'background:#f1f5f9;font-size:.72rem;font-weight:600;color:#475569;text-transform:capitalize}',

      /* Action buttons row */
      '.listing-card__actions{display:flex;gap:8px;padding:0 18px 16px}',
      '.listing-card__action-btn{flex:1;padding:9px 10px;border-radius:8px;border:1px solid #e2e8f0;',
      'background:#fff;font-size:.78rem;font-weight:500;cursor:pointer;transition:all .2s ease;',
      'display:flex;align-items:center;justify-content:center;gap:5px;font-family:inherit;color:#475569}',
      '.listing-card__action-btn:hover{border-color:#e94560;color:#e94560}',
      '.listing-card__action-btn--danger:hover{border-color:#dc2626;color:#dc2626}',
      '.listing-card__action-btn--sold:hover{border-color:#059669;color:#059669}',

      /* Responsive */
      '@media(max-width:640px){.listing-grid{grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}}',
      '@media(max-width:400px){.listing-grid{grid-template-columns:1fr}}'
    ].join('\n');

    document.head.appendChild(style);
  }

  /* ── Helper: format price ────────────────────────────────── */
  function formatPrice(n) {
    if (typeof n !== 'number') return '';
    return '₹' + n.toLocaleString('en-IN');
  }

  /* ── Helper: escape HTML ─────────────────────────────────── */
  function esc(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ── Main renderer ───────────────────────────────────────── */

  /**
   * Build a listing-card DOM node.
   *
   * @param {Object}   listing
   * @param {Object}   [opts]
   * @param {boolean}  [opts.showStatus]       – render Active/Sold/Removed badge
   * @param {boolean}  [opts.showActions]       – render Edit/Sold/Delete buttons
   * @param {Set}      [opts.favoriteIds]       – set of listing IDs user has favorited
   * @param {Function} [opts.onFavoriteToggle]  – callback(listingId, nowFavorited)
   * @param {Function} [opts.onAction]          – callback(action, listingId, cardEl)
   * @returns {HTMLElement}
   */
  window.renderListingCard = function (listing, opts) {
    opts = opts || {};
    injectStyles();

    var id = listing._id || listing.id;
    var images = listing.images || [];
    var imgUrl = images.length > 0 ? images[0].url : null;
    var isFav  = opts.favoriteIds ? opts.favoriteIds.has(id) : false;
    var condition = listing.condition ? listing.condition.replace(/-/g, ' ') : '';

    /* ── Build HTML ──────────────────────────────────────── */
    var card = document.createElement('div');
    card.className = 'listing-card';
    card.setAttribute('data-listing-id', id);

    var badgeHtml = '';
    if (opts.showStatus && listing.status) {
      var label = listing.status.charAt(0).toUpperCase() + listing.status.slice(1);
      badgeHtml = '<span class="listing-card__badge listing-card__badge--' + listing.status + '">' + label + '</span>';
    }

    var imgHtml = imgUrl
      ? '<img class="listing-card__img" src="' + esc(imgUrl) + '" alt="' + esc(listing.title) + '" loading="lazy">'
      : '<div class="listing-card__placeholder"><i class="fas fa-image"></i></div>';

    var actionsHtml = '';
    if (opts.showActions) {
      var soldBtn = listing.status === 'active'
        ? '<button class="listing-card__action-btn listing-card__action-btn--sold" data-action="sold"><i class="fas fa-check"></i> Sold</button>'
        : '';
      actionsHtml =
        '<div class="listing-card__actions">' +
          '<button class="listing-card__action-btn" data-action="edit"><i class="fas fa-pen"></i> Edit</button>' +
          soldBtn +
          '<button class="listing-card__action-btn listing-card__action-btn--danger" data-action="delete"><i class="fas fa-trash"></i> Delete</button>' +
        '</div>';
    }

    card.innerHTML =
      '<div class="listing-card__img-wrap">' +
        imgHtml +
        badgeHtml +
        '<button class="listing-card__fav' + (isFav ? ' active' : '') + '" aria-label="Toggle favorite">' +
          '<i class="' + (isFav ? 'fas' : 'far') + ' fa-heart"></i>' +
        '</button>' +
      '</div>' +
      '<div class="listing-card__body">' +
        '<h3 class="listing-card__title">' + esc(listing.title || 'Untitled') + '</h3>' +
        '<p class="listing-card__price">' + formatPrice(listing.price) + '</p>' +
        '<div class="listing-card__meta">' +
          (listing.location ? '<span><i class="fas fa-map-marker-alt"></i> ' + esc(listing.location) + '</span>' : '') +
          (condition ? '<span class="listing-card__condition">' + esc(condition) + '</span>' : '') +
        '</div>' +
      '</div>' +
      actionsHtml;

    /* ── Events ──────────────────────────────────────────── */

    // Navigate on card click (skip buttons)
    card.addEventListener('click', function (e) {
      if (e.target.closest('.listing-card__fav') || e.target.closest('.listing-card__action-btn')) return;
      window.location.href = '/listing-detail?id=' + id;
    });

    // Favourite toggle
    var favBtn = card.querySelector('.listing-card__fav');
    favBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!window.currentUser) { window.requireAuth(); return; }

      var nowFav = favBtn.classList.contains('active');
      var promise = nowFav
        ? window.api.delete('/api/favorites/' + id)
        : window.api.post('/api/favorites', { listingId: id });

      promise.then(function () {
        if (nowFav) {
          favBtn.classList.remove('active');
          favBtn.querySelector('i').className = 'far fa-heart';
        } else {
          favBtn.classList.add('active');
          favBtn.querySelector('i').className = 'fas fa-heart';
        }
        if (opts.onFavoriteToggle) opts.onFavoriteToggle(id, !nowFav);
      }).catch(function (err) {
        console.error('Favorite toggle failed:', err.message);
      });
    });

    // Action buttons
    if (opts.showActions) {
      card.querySelectorAll('.listing-card__action-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (opts.onAction) opts.onAction(btn.dataset.action, id, card);
        });
      });
    }

    return card;
  };
})();
