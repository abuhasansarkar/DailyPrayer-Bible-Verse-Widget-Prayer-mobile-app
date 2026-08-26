import {
  detectCrisis,
  extractContent,
  offlineReflection,
  RateLimiter,
  AI_MODELS,
  DEFAULT_MODEL,
  CRISIS_RESPONSE,
} from '../services/ai-assistant';

// Covers the parts of the AI integration that are ours rather than the
// provider's: who gets routed away from the model, how often a device may
// ask, what we do with a malformed response, and what the offline text says.

describe('detectCrisis', () => {
  it('catches direct disclosures', () => {
    const inCrisis = [
      'I want to kill myself',
      'I am thinking about suicide',
      'i feel suicidal tonight',
      'I want to die',
      "I don't want to live anymore",
      'everyone would be better off dead',
      'I have been hurting myself',
      'i keep cutting myself',
      'there is no reason to live',
      'I want to end my life',
    ];
    for (const text of inCrisis) {
      expect(detectCrisis(text)).toBe(true);
    }
  });

  it('does not fire on ordinary devotional language', () => {
    const ordinary = [
      'Pray for my grandmother who is dying of cancer',
      'A prayer for someone grieving a death in the family',
      'Help me understand what Jesus meant by dying to self',
      'I am struggling with anxiety at work',
      'My friend passed away last week',
      'Explain Psalm 23, he leads me through the valley of the shadow of death',
    ];
    for (const text of ordinary) {
      expect(detectCrisis(text)).toBe(false);
    }
  });

  it('offers real, free help rather than a generated prayer', () => {
    expect(CRISIS_RESPONSE).toContain('988');
    expect(CRISIS_RESPONSE).toContain('116 123');
    expect(CRISIS_RESPONSE).toContain('findahelpline.com');
    expect(CRISIS_RESPONSE).toMatch(/emergency/i);
  });
});

describe('RateLimiter', () => {
  it('allows requests up to the limit', () => {
    const limiter = new RateLimiter(3, 1000, () => 0);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);
  });

  it('lets the window slide', () => {
    let now = 0;
    const limiter = new RateLimiter(2, 1000, () => now);

    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);

    now = 1001; // both timestamps have aged out
    expect(limiter.tryAcquire()).toBe(true);
  });

  it('reports how long until the next request is allowed', () => {
    let now = 0;
    const limiter = new RateLimiter(1, 1000, () => now);

    limiter.tryAcquire();
    expect(limiter.retryAfterMs()).toBe(1000);

    now = 400;
    expect(limiter.retryAfterMs()).toBe(600);

    now = 1000;
    expect(limiter.retryAfterMs()).toBe(0);
  });

  it('reset clears the window', () => {
    const limiter = new RateLimiter(1, 1000, () => 0);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);
    limiter.reset();
    expect(limiter.tryAcquire()).toBe(true);
  });
});

describe('extractContent', () => {
  it('reads a plain string completion', () => {
    expect(extractContent({ choices: [{ message: { content: '  Amen.  ' } }] })).toBe('Amen.');
  });

  it('joins a multi-part content array', () => {
    expect(
      extractContent({ choices: [{ message: { content: [{ text: 'Peace ' }, { text: 'be with you' }] } }] })
    ).toBe('Peace be with you');
  });

  it('returns null for malformed or empty payloads', () => {
    // The old code read data.choices[0].message.content unguarded, so any of
    // these threw or produced an empty bubble.
    expect(extractContent(null)).toBeNull();
    expect(extractContent({})).toBeNull();
    expect(extractContent({ choices: [] })).toBeNull();
    expect(extractContent({ choices: [{}] })).toBeNull();
    expect(extractContent({ choices: [{ message: { content: '   ' } }] })).toBeNull();
    expect(extractContent({ choices: [{ message: { content: 42 } }] })).toBeNull();
  });
});

describe('offlineReflection', () => {
  it('quotes only public-domain scripture', () => {
    const all = [
      offlineReflection('a prayer for peace'),
      offlineReflection('explain this verse'),
      offlineReflection('something else entirely'),
    ].join('\n');

    // The previous fallback quoted the NIV, which is copyrighted and
    // contradicted the app's public-domain-only rule for Bible text.
    expect(all).not.toMatch(/Do not be anxious about anything/i);
    expect(all).not.toMatch(/whom shall I fear\? The LORD is the stronghold/i);

    expect(all).toMatch(/Be careful for nothing/); // Philippians 4:6, KJV
    expect(all).toMatch(/the strength of my life/); // Psalm 27:1, KJV
  });

  it('picks content that matches the request', () => {
    expect(offlineReflection('write me a prayer')).toMatch(/Heavenly Father/);
    expect(offlineReflection('explain this verse')).toMatch(/Scripture Reflection/);
    expect(offlineReflection('hello there')).toMatch(/Be still/);
  });
});

describe('model catalogue', () => {
  it('offers only general-purpose models', () => {
    // `north-mini-code-free` is a code-completion model and produced poor
    // devotional output; it must not be selectable.
    expect(AI_MODELS.map((m) => m.id)).not.toContain('north-mini-code-free');
    expect(AI_MODELS.length).toBeGreaterThan(0);
  });

  it('has a default that is actually in the list', () => {
    expect(AI_MODELS.map((m) => m.id)).toContain(DEFAULT_MODEL);
  });
});
