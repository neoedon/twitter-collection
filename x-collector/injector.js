(function () {
  'use strict';

  const TAG = '%c[X Collector]';
  const STYLE = 'color:#D71921;font-weight:bold';
  const API_PATH_RE = /\/i\/api\/graphql\/([^/?]+)\/([^/?]+)/;

  const BOOKMARK_OPS = new Set([
    'bookmarks', 'bookmarktimeline', 'bookmarkfoldertimeline',
    'bookmarks_by_type', 'fetchbookmarks'
  ]);
  const LIKE_OPS = new Set([
    'likes', 'userlikes', 'favorites', 'liketimeline', 'likedtweets'
  ]);

  function classifyUrl(url) {
    const m = url.match(API_PATH_RE);
    if (!m) return null;
    const op = m[2].toLowerCase();
    console.log(TAG, STYLE, 'GraphQL op:', m[2], '→', op);
    if (BOOKMARK_OPS.has(op)) return 'bookmark';
    if (LIKE_OPS.has(op)) return 'favourite';
    return null;
  }

  // ── Hook fetch ──
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await origFetch.apply(this, args);
    try {
      const url = (typeof args[0] === 'string') ? args[0] : (args[0]?.url || '');
      const source = classifyUrl(url);
      if (source) {
        console.log(TAG, STYLE, 'fetch hit →', source);
        const clone = response.clone();
        clone.json().then(data => processResponse(data, source)).catch(() => {});
      }
    } catch (e) { /* silent */ }
    return response;
  };

  // ── Hook XMLHttpRequest ──
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._xc_url = typeof url === 'string' ? url : (url?.toString?.() || '');
    return origOpen.call(this, method, url, ...rest);
  };

  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    const url = this._xc_url || '';
    const source = classifyUrl(url);
    if (source) {
      console.log(TAG, STYLE, 'XHR hit →', source);
      this.addEventListener('load', function () {
        try {
          processResponse(JSON.parse(this.responseText), source);
        } catch (e) { /* silent */ }
      });
    }
    return origSend.apply(this, args);
  };

  // ── Process API response ──
  function processResponse(data, source) {
    // Method 1: structured entry-based extraction
    const entries = findEntries(data, 0);
    console.log(TAG, STYLE, `findEntries returned ${entries.length} entries`);

    let tweets = [];
    for (const entry of entries) {
      try {
        const itemContent = entry?.content?.itemContent || entry?.item?.itemContent || entry?.itemContent;
        if (!itemContent) continue;
        let result = itemContent?.tweet_results?.result;
        if (!result) continue;
        if (result.__typename === 'TweetWithVisibilityResults') result = result.tweet;
        if (!result?.legacy) continue;
        const tweet = parseTweetResult(result);
        if (tweet) tweets.push(tweet);
      } catch (e) { /* skip */ }
    }

    // Method 2: brute-force deep search for tweet objects
    if (tweets.length === 0) {
      console.log(TAG, STYLE, 'Structured parse found 0 → trying deep scan...');
      console.log(TAG, STYLE, 'Response top keys:', Object.keys(data));
      console.log(TAG, STYLE, 'Response preview:', JSON.stringify(data).substring(0, 800));
      tweets = findTweetsDirect(data, 0);
    }

    console.log(TAG, STYLE, `TOTAL extracted: ${tweets.length} tweets (${source})`);
    if (tweets.length > 0) {
      window.postMessage({ type: '__X_COLLECTOR__', source, tweets }, '*');
    }
  }

  // ── Method 1: find timeline entries via instructions ──
  function findEntries(obj, depth) {
    if (!obj || typeof obj !== 'object' || depth > 15) return [];
    if (Array.isArray(obj)) return obj.flatMap(item => findEntries(item, depth + 1));
    if (obj.type === 'TimelineAddEntries' && Array.isArray(obj.entries)) return obj.entries;
    if (obj.type === 'TimelineAddToModule' && Array.isArray(obj.moduleItems)) return obj.moduleItems;
    return Object.values(obj).flatMap(v => findEntries(v, depth + 1));
  }

  // ── Method 2: recursively find anything that looks like a tweet ──
  function findTweetsDirect(obj, depth) {
    if (!obj || typeof obj !== 'object' || depth > 20) return [];
    if (Array.isArray(obj)) return obj.flatMap(item => findTweetsDirect(item, depth + 1));

    // Pattern A: this IS a tweet object (has rest_id + legacy.full_text + core.user_results)
    if (obj.rest_id && obj.legacy?.full_text != null && obj.core?.user_results) {
      const tweet = parseTweetResult(obj);
      if (tweet) return [tweet];
    }

    // Pattern B: this has tweet_results.result
    if (obj.tweet_results?.result) {
      let result = obj.tweet_results.result;
      if (result.__typename === 'TweetWithVisibilityResults') result = result.tweet;
      if (result?.rest_id && result?.legacy) {
        const tweet = parseTweetResult(result);
        if (tweet) return [tweet];
      }
    }

    return Object.values(obj).flatMap(v => findTweetsDirect(v, depth + 1));
  }

  // ── Parse a single tweet ──
  function parseTweetResult(result) {
    const legacy = result.legacy;
    const userResult = result.core?.user_results?.result;
    const userLegacy = userResult?.legacy;
    if (!userLegacy) return null;

    const media = legacy.extended_entities?.media || [];
    const photos = media.filter(m => m.type === 'photo');
    const videos = media.filter(m => m.type === 'video' || m.type === 'animated_gif');

    let mediaType = '', imageUrls = [], videoUrl = '';
    if (videos.length > 0) {
      mediaType = 'video';
      imageUrls = [videos[0].media_url_https];
      const variants = (videos[0].video_info?.variants || [])
        .filter(v => v.content_type === 'video/mp4')
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      videoUrl = variants[0]?.url || '';
    } else if (photos.length > 0) {
      mediaType = 'photo';
      imageUrls = photos.map(p => p.media_url_https);
    }

    const hasLink = (legacy.entities?.urls || []).some(u => {
      const ex = u.expanded_url || '';
      return ex && !ex.includes('twitter.com/') && !ex.includes('x.com/');
    });

    let formattedDate = '';
    try {
      const d = new Date(legacy.created_at);
      formattedDate = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${d.toLocaleTimeString()}`;
    } catch (e) { formattedDate = legacy.created_at || ''; }

    return {
      TweetID: result.rest_id,
      TwitterUserID: userResult?.rest_id || '',
      UserScreenName: userLegacy.screen_name,
      UserProfileName: userLegacy.name,
      UserProfilePic: userLegacy.profile_image_url_https,
      TweetText: legacy.full_text,
      'Tweet Url': `https://twitter.com/${userLegacy.screen_name}/status/${result.rest_id}`,
      TweetCreatedDate: formattedDate,
      MediaType: mediaType,
      MediaImageUrl: imageUrls.join(','),
      MediaVideoUrl: videoUrl,
      SystemCreatedDate: new Date().toLocaleString(),
      HasLink: hasLink ? 'True' : 'False'
    };
  }

  console.log(TAG, STYLE, 'Interceptor active ✓ (v1.1)');
})();
