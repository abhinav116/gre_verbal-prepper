export interface RSSSource {
  name: string
  url: string
  topic_hint: string // default topic if Claude can't determine
}

export const RSS_SOURCES: RSSSource[] = [
  {
    name: 'The Economist',
    url: 'https://www.economist.com/rss/the_world_this_week',
    topic_hint: 'Business',
  },
  {
    name: 'Scientific American',
    url: 'https://www.scientificamerican.com/feed/rss/',
    topic_hint: 'Science',
  },
  {
    name: 'The Atlantic',
    url: 'https://feeds.feedburner.com/TheAtlantic',
    topic_hint: 'Humanities',
  },
  {
    name: 'Nature News',
    url: 'https://www.nature.com/nature.rss',
    topic_hint: 'Science',
  },
  {
    name: 'Foreign Affairs',
    url: 'https://www.foreignaffairs.com/rss.xml',
    topic_hint: 'Social Science',
  },
  {
    name: 'Smithsonian Magazine',
    url: 'https://www.smithsonianmag.com/rss/latest-articles-from-smithsoniancom/',
    topic_hint: 'Humanities',
  },
  {
    name: 'Aeon',
    url: 'https://aeon.co/feed.rss',
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
