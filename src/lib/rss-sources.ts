export interface RSSSource {
  name: string
  rssUrl: string
  domain: string
  topic_hint: string
}

export const RSS_SOURCES: RSSSource[] = [
  {
    name: 'Aeon',
    rssUrl: 'https://aeon.co/feed.rss',
    domain: 'aeon.co',
    topic_hint: 'Humanities',
  },
  {
    name: 'Quanta Magazine',
    rssUrl: 'https://api.quantamagazine.org/feed/',
    domain: 'quantamagazine.org',
    topic_hint: 'Science',
  },
  {
    name: 'Nautilus',
    rssUrl: 'https://nautil.us/feed/',
    domain: 'nautil.us',
    topic_hint: 'Science',
  },
  {
    name: 'Smithsonian Magazine',
    rssUrl: 'https://www.smithsonianmag.com/rss/latest-articles-from-smithsoniancom/',
    domain: 'smithsonianmag.com',
    topic_hint: 'Humanities',
  },
  {
    name: 'The Conversation',
    rssUrl: 'https://theconversation.com/us/articles.atom',
    domain: 'theconversation.com',
    topic_hint: 'Social Science',
  },
  {
    name: 'The Atlantic',
    rssUrl: 'https://feeds.feedburner.com/TheAtlantic',
    domain: 'theatlantic.com',
    topic_hint: 'Humanities',
  },
]

// Listicle patterns to reject
export const LISTICLE_PATTERNS = [
  /\b\d+\s+(things|ways|reasons|tips|steps|facts|signs|mistakes|habits|secrets)\b/i,
  /^how to\b/i,
  /\bbest\s+\d+\b/i,
  /\btop\s+\d+\b/i,
]
