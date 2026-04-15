(function () {
  'use strict';

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data?.type !== '__X_COLLECTOR__') return;

    const { tweets, source } = event.data;
    console.log(`[X Collector] Forwarding ${tweets.length} tweets (${source}) → background`);

    chrome.runtime.sendMessage({
      action: 'addTweets',
      tweets,
      source
    }).catch(() => {});
  });

  console.log('[X Collector] Content script ready ✓');
})();
