import { formatBibleText, normalizeVersion, normalizeBookSlug } from '../services/bibleApi';

describe('formatBibleText', () => {
  it('strips leading pilcrow paragraph markers', () => {
    expect(formatBibleText('¶ For God so loved the world')).toBe('For God so loved the world');
  });

  it('strips translator marginal notes glued to the verse text', () => {
    // The wldeh KJV source appends notes as `<chapter>.<verse> <note>` with no
    // separator, which used to render inline in the app.
    const raw =
      'For I know the thoughts that I think toward you, saith the LORD, thoughts of ' +
      'peace, and not of evil, to give you an expected end.29.11 expected…: Heb. end and expectation';
    expect(formatBibleText(raw)).toBe(
      'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, ' +
        'and not of evil, to give you an expected end.'
    );
  });

  it('strips several concatenated notes', () => {
    const raw =
      'Why art thou cast down, O my soul?42.5 cast: Heb. bowed42.5 praise: or, give thanks';
    expect(formatBibleText(raw)).toBe('Why art thou cast down, O my soul?');
  });

  it('leaves numbers that appear in ordinary prose alone', () => {
    expect(formatBibleText('about 3.5 cubits long')).toBe('about 3.5 cubits long');
  });

  it('collapses runs of whitespace', () => {
    expect(formatBibleText('  The   LORD  is my shepherd  ')).toBe('The LORD is my shepherd');
  });
});

describe('normalizeVersion', () => {
  it('maps the public-domain translations the app ships', () => {
    expect(normalizeVersion('KJV')).toBe('en-kjv');
    expect(normalizeVersion('ASV')).toBe('en-asv');
    expect(normalizeVersion('WEB')).toBe('en-web');
  });

  it('does not alias copyrighted translations to a public-domain text', () => {
    // Previously NIV -> en-kjv, which served KJV wording under an NIV label.
    // Unknown ids must fall back to KJV *as KJV*, never be presented as NIV.
    for (const id of ['NIV', 'ESV', 'NLT', 'CSB', 'NKJV', 'MSG']) {
      expect(normalizeVersion(id)).toBe('en-kjv');
    }
  });

  it('passes through explicit CDN ids', () => {
    expect(normalizeVersion('en-asv')).toBe('en-asv');
  });

  it('defaults to KJV when unset', () => {
    expect(normalizeVersion()).toBe('en-kjv');
    expect(normalizeVersion('')).toBe('en-kjv');
  });
});

describe('normalizeBookSlug', () => {
  it('collapses spaces for numbered books', () => {
    expect(normalizeBookSlug('1 John')).toBe('1john');
    expect(normalizeBookSlug('Song of Solomon')).toBe('songofsolomon');
    expect(normalizeBookSlug('Genesis')).toBe('genesis');
  });
});
