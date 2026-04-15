const STORAGE_KEY = 'x_collector_tweets';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'addTweets') {
    handleAddTweets(message.tweets, message.source).then(sendResponse);
    return true;
  }
});

async function handleAddTweets(tweets, source) {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const stored = data[STORAGE_KEY] || {};

  let added = 0;
  for (const tweet of tweets) {
    const id = tweet.TweetID;
    if (id && !stored[id]) {
      stored[id] = Object.assign({}, tweet, { _source: source, _ts: Date.now() });
      added++;
    }
  }

  if (added > 0) {
    await chrome.storage.local.set({ [STORAGE_KEY]: stored });
    console.log(`[X Collector] +${added} new tweets stored (${source}), total: ${Object.keys(stored).length}`);
  }

  updateBadge(Object.keys(stored).length);
  return { added, total: Object.keys(stored).length };
}

function updateBadge(count) {
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#D71921' });
}

chrome.storage.local.get(STORAGE_KEY).then(data => {
  const count = Object.keys(data[STORAGE_KEY] || {}).length;
  if (count > 0) updateBadge(count);
});
