// Approximate outlet bias buckets, modeled on AllSides ratings (https://www.allsides.com/media-bias).
// This is a hand-maintained snapshot, NOT a live AllSides feed — ratings drift, so treat as approximate.
// Buckets: left (Left + Lean Left), center, right (Lean Right + Right). Unknown domains are dropped.

const LEFT = [
  'msnbc.com', 'ms.now', 'huffpost.com', 'vox.com', 'slate.com', 'motherjones.com', 'thenation.com', 'newrepublic.com',
  'rollingstone.com', 'democracynow.org', 'jacobin.com', 'salon.com', 'dailykos.com', 'theguardian.com', 'nytimes.com',
  'washingtonpost.com', 'cnn.com', 'nbcnews.com', 'abcnews.go.com', 'cbsnews.com', 'npr.org', 'politico.com', 'axios.com',
  'theatlantic.com', 'time.com', 'bloomberg.com', 'newsweek.com', 'businessinsider.com', 'independent.co.uk', 'thedailybeast.com',
  'propublica.org', 'latimes.com', 'usatoday.com', 'abcnews.com', 'prospect.org', 'rawstory.com', 'crooksandliars.com', 'jezebel.com',
  'erininthemorning.com', 'lawyersgunsmoneyblog.com',
];
const CENTER = [
  'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'thehill.com', 'forbes.com', 'csmonitor.com', 'c-span.org', 'rollcall.com',
  'pbs.org', 'wsj.com', 'marketwatch.com', 'realclearpolitics.com', 'realclearpolling.com', 'newsnationnow.com', 'newsnation.com',
  'bostonglobe.com', 'ballotpedia.org', 'stateline.org', 'nbcnewyork.com', 'upi.com', 'semafor.com', 'spectrumlocalnews.com',
  'mainepublic.org', 'adn.com', 'alaskabeacon.com', 'texastribune.org', 'cnbc.com', 'kffhealthnews.org',
];
const RIGHT = [
  'foxnews.com', 'nypost.com', 'washingtonexaminer.com', 'dailywire.com', 'breitbart.com', 'nationalreview.com', 'dailycaller.com',
  'theblaze.com', 'townhall.com', 'redstate.com', 'thefederalist.com', 'washingtontimes.com', 'newsmax.com', 'oann.com',
  'spectator.org', 'reason.com', 'justthenews.com', 'thepostmillennial.com', 'epochtimes.com', 'theamericanconservative.com',
  'freebeacon.com', 'pjmedia.com', 'americanthinker.com', 'dailysignal.com', 'foxbusiness.com', 'freerepublic.com', 'dailymail.com',
];

const MAP = new Map();
for (const d of LEFT) MAP.set(d, 'left');
for (const d of CENTER) MAP.set(d, 'center');
for (const d of RIGHT) MAP.set(d, 'right');

export function biasOf(domain = '') {
  const d = domain.toLowerCase().replace(/^www\./, '');
  if (MAP.has(d)) return MAP.get(d);
  // match subdomains, e.g. edition.cnn.com → cnn.com
  for (const [k, v] of MAP) if (d.endsWith(`.${k}`)) return v;
  return null;
}
