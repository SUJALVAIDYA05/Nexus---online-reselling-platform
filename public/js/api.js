/* ───────────────────────────────────────────────────────────
   api.js  —  Lightweight fetch wrapper for the Nexus API
   Attach helpers to window.api so every page can call them.
   ─────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /**
   * Internal request handler.
   * @param {'GET'|'POST'|'PUT'|'DELETE'} method
   * @param {string}  path       — e.g. '/api/listings'
   * @param {*}       [body]     — JS object (JSON) or FormData
   * @param {boolean} [isUpload] — true when body is FormData
   * @returns {Promise<Object>}
   */
  async function request(method, path, body, isUpload) {
    var opts = {
      method: method,
      credentials: 'include',          // always send the auth cookie
      headers: {}
    };

    if (body && !isUpload) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else if (body && isUpload) {
      // Let the browser set the multipart boundary automatically
      opts.body = body;
    }

    var res = await fetch(path, opts);

    // Some endpoints (204 No Content, etc.) return empty bodies
    var text = await res.text();
    var data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      var err = new Error(data.error || data.message || 'Request failed (' + res.status + ')');
      err.status = res.status;
      throw err;
    }

    return data;
  }

  /* ── Public API ──────────────────────────────────────────── */
  window.api = {
    /** GET  /path */
    get: function (path) {
      return request('GET', path);
    },

    /** POST /path  with JSON body */
    post: function (path, body) {
      return request('POST', path, body, false);
    },

    /** PUT  /path  with JSON body */
    put: function (path, body) {
      return request('PUT', path, body, false);
    },

    /** DELETE /path */
    delete: function (path) {
      return request('DELETE', path);
    },

    /** POST /path  with FormData (multipart — file uploads) */
    upload: function (path, formData) {
      return request('POST', path, formData, true);
    }
  };
})();
