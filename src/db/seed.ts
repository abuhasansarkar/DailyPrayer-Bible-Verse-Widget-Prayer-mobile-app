import { getDb, generateId, toJson, todayDate } from './client';

// ─────────────────────────────────────────────────────────────────────────────
// Seed data — verses, topics, guided prayers, devotionals, reminders
// ─────────────────────────────────────────────────────────────────────────────

export async function seedDatabase(): Promise<void> {
  const db = getDb();

  // Only seed if verses table is empty
  const count = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM verses'
  );
  if ((count?.count ?? 0) > 0) return;

  await db.withTransactionAsync(async () => {
    // ── Topics ────────────────────────────────────────────────────────────────
  const topics = [
    { id: 'hope', name: 'Hope', slug: 'hope', description: 'Verses about hope and trust in God', icon: '✨', color: '#F2B84B', is_premium: 0 },
    { id: 'peace', name: 'Peace', slug: 'peace', description: 'Find peace in God\'s presence', icon: '🕊️', color: '#96AA88', is_premium: 0 },
    { id: 'strength', name: 'Strength', slug: 'strength', description: 'Be strong in the Lord', icon: '💪', color: '#D98262', is_premium: 0 },
    { id: 'love', name: 'Love', slug: 'love', description: 'God\'s unfailing love', icon: '❤️', color: '#D98262', is_premium: 0 },
    { id: 'faith', name: 'Faith', slug: 'faith', description: 'Walking by faith, not by sight', icon: '🙏', color: '#F2B84B', is_premium: 0 },
    { id: 'gratitude', name: 'Gratitude', slug: 'gratitude', description: 'Thankfulness in all things', icon: '🌟', color: '#96AA88', is_premium: 0 },
    { id: 'anxiety', name: 'Anxiety & Fear', slug: 'anxiety', description: 'Do not be afraid', icon: '🤍', color: '#7BB8D4', is_premium: 0 },
    { id: 'healing', name: 'Healing', slug: 'healing', description: 'God\'s restoration and wholeness', icon: '🌿', color: '#96AA88', is_premium: 0 },
    { id: 'guidance', name: 'Guidance', slug: 'guidance', description: 'Let God direct your path', icon: '🌅', color: '#F2B84B', is_premium: 0 },
    { id: 'forgiveness', name: 'Forgiveness', slug: 'forgiveness', description: 'Grace and mercy for all', icon: '💙', color: '#7BB8D4', is_premium: 0 },
    { id: 'family', name: 'Family', slug: 'family', description: 'Blessing for households', icon: '🏡', color: '#D98262', is_premium: 0 },
    { id: 'morning', name: 'Morning', slug: 'morning', description: 'New mercies every morning', icon: '🌄', color: '#F2B84B', is_premium: 0 },
    { id: 'evening', name: 'Evening', slug: 'evening', description: 'Rest and reflection at day\'s end', icon: '🌙', color: '#B8A8CC', is_premium: 1 },
    { id: 'work', name: 'Work & Purpose', slug: 'work', description: 'Calling and purpose in daily work', icon: '🌱', color: '#96AA88', is_premium: 1 },
    { id: 'grief', name: 'Grief & Comfort', slug: 'grief', description: 'God\'s comfort in sorrow', icon: '💜', color: '#B8A8CC', is_premium: 1 },
  ];

  for (const topic of topics) {
    await db.runAsync(
      `INSERT OR IGNORE INTO topics (id, name, slug, description, icon, color, is_premium) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [topic.id, topic.name, topic.slug, topic.description, topic.icon, topic.color, topic.is_premium]
    );
  }

  // ── Verses ────────────────────────────────────────────────────────────────
  const verses = [
    // Hope
    { id: 'jer-29-11', reference: 'Jeremiah 29:11', book: 'Jeremiah', chapter: 29, verse_number: 11, translation: 'NIV', text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', topics: ['hope', 'guidance', 'faith'], is_featured: 1 },
    { id: 'rom-15-13', reference: 'Romans 15:13', book: 'Romans', chapter: 15, verse_number: 13, translation: 'NIV', text: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.', topics: ['hope', 'peace', 'faith'], is_featured: 1 },
    { id: 'lam-3-22-23', reference: 'Lamentations 3:22-23', book: 'Lamentations', chapter: 3, verse_number: 22, translation: 'NIV', text: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.', topics: ['hope', 'morning', 'love'], is_featured: 1 },
    { id: 'ps-42-5', reference: 'Psalm 42:5', book: 'Psalms', chapter: 42, verse_number: 5, translation: 'NIV', text: 'Why, my soul, are you downcast? Why so disturbed within me? Put your hope in God, for I will yet praise him, my Savior and my God.', topics: ['hope', 'anxiety'], is_featured: 0 },
    { id: 'heb-11-1', reference: 'Hebrews 11:1', book: 'Hebrews', chapter: 11, verse_number: 1, translation: 'NIV', text: 'Now faith is confidence in what we hope for and assurance about what we do not see.', topics: ['hope', 'faith'], is_featured: 0 },
    // Peace
    { id: 'john-14-27', reference: 'John 14:27', book: 'John', chapter: 14, verse_number: 27, translation: 'NIV', text: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.', topics: ['peace', 'anxiety'], is_featured: 1 },
    { id: 'phil-4-6-7', reference: 'Philippians 4:6-7', book: 'Philippians', chapter: 4, verse_number: 6, translation: 'NIV', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', topics: ['peace', 'anxiety', 'gratitude'], is_featured: 1 },
    { id: 'isa-26-3', reference: 'Isaiah 26:3', book: 'Isaiah', chapter: 26, verse_number: 3, translation: 'NIV', text: 'You will keep in perfect peace those whose minds are steadfast, because they trust in you.', topics: ['peace', 'faith'], is_featured: 0 },
    { id: 'ps-23-1', reference: 'Psalm 23:1', book: 'Psalms', chapter: 23, verse_number: 1, translation: 'NIV', text: 'The Lord is my shepherd, I lack nothing.', topics: ['peace', 'faith', 'guidance'], is_featured: 1 },
    // Strength
    { id: 'phil-4-13', reference: 'Philippians 4:13', book: 'Philippians', chapter: 4, verse_number: 13, translation: 'NIV', text: 'I can do all this through him who gives me strength.', topics: ['strength', 'faith'], is_featured: 1 },
    { id: 'isa-40-31', reference: 'Isaiah 40:31', book: 'Isaiah', chapter: 40, verse_number: 31, translation: 'NIV', text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', topics: ['strength', 'hope'], is_featured: 1 },
    { id: 'ps-46-1', reference: 'Psalm 46:1', book: 'Psalms', chapter: 46, verse_number: 1, translation: 'NIV', text: 'God is our refuge and strength, an ever-present help in trouble.', topics: ['strength', 'peace', 'anxiety'], is_featured: 0 },
    { id: 'eph-6-10', reference: 'Ephesians 6:10', book: 'Ephesians', chapter: 6, verse_number: 10, translation: 'NIV', text: 'Finally, be strong in the Lord and in his mighty power.', topics: ['strength', 'faith'], is_featured: 0 },
    // Love
    { id: 'john-3-16', reference: 'John 3:16', book: 'John', chapter: 3, verse_number: 16, translation: 'NIV', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', topics: ['love', 'faith', 'hope'], is_featured: 1 },
    { id: 'rom-8-38-39', reference: 'Romans 8:38-39', book: 'Romans', chapter: 8, verse_number: 38, translation: 'NIV', text: 'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord.', topics: ['love', 'hope', 'faith'], is_featured: 1 },
    { id: '1-cor-13-4', reference: '1 Corinthians 13:4', book: '1 Corinthians', chapter: 13, verse_number: 4, translation: 'NIV', text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud.', topics: ['love', 'family'], is_featured: 0 },
    { id: 'ps-136-1', reference: 'Psalm 136:1', book: 'Psalms', chapter: 136, verse_number: 1, translation: 'NIV', text: 'Give thanks to the Lord, for he is good. His love endures forever.', topics: ['love', 'gratitude'], is_featured: 0 },
    // Anxiety & Fear
    { id: 'matt-6-34', reference: 'Matthew 6:34', book: 'Matthew', chapter: 6, verse_number: 34, translation: 'NIV', text: 'Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.', topics: ['anxiety', 'peace'], is_featured: 0 },
    { id: 'ps-55-22', reference: 'Psalm 55:22', book: 'Psalms', chapter: 55, verse_number: 22, translation: 'NIV', text: 'Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.', topics: ['anxiety', 'faith', 'peace'], is_featured: 0 },
    { id: '1-pet-5-7', reference: '1 Peter 5:7', book: '1 Peter', chapter: 5, verse_number: 7, translation: 'NIV', text: 'Cast all your anxiety on him because he cares for you.', topics: ['anxiety', 'love'], is_featured: 1 },
    { id: 'isa-41-10', reference: 'Isaiah 41:10', book: 'Isaiah', chapter: 41, verse_number: 10, translation: 'NIV', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.', topics: ['anxiety', 'strength', 'faith'], is_featured: 1 },
    // Gratitude
    { id: '1-thess-5-18', reference: '1 Thessalonians 5:18', book: '1 Thessalonians', chapter: 5, verse_number: 18, translation: 'NIV', text: 'Give thanks in all circumstances; for this is God\'s will for you in Christ Jesus.', topics: ['gratitude', 'faith'], is_featured: 1 },
    { id: 'ps-107-1', reference: 'Psalm 107:1', book: 'Psalms', chapter: 107, verse_number: 1, translation: 'NIV', text: 'Give thanks to the Lord, for he is good; his love endures forever.', topics: ['gratitude', 'love'], is_featured: 0 },
    { id: 'col-3-17', reference: 'Colossians 3:17', book: 'Colossians', chapter: 3, verse_number: 17, translation: 'NIV', text: 'And whatever you do, whether in word or deed, do it all in the name of the Lord Jesus, giving thanks to God the Father through him.', topics: ['gratitude', 'work'], is_featured: 0 },
    // Morning & Evening
    { id: 'ps-5-3', reference: 'Psalm 5:3', book: 'Psalms', chapter: 5, verse_number: 3, translation: 'NIV', text: 'In the morning, Lord, you hear my voice; in the morning I lay my requests before you and wait expectantly.', topics: ['morning', 'faith'], is_featured: 0 },
    { id: 'ps-19-1', reference: 'Psalm 19:1', book: 'Psalms', chapter: 19, verse_number: 1, translation: 'NIV', text: 'The heavens declare the glory of God; the skies proclaim the work of his hands.', topics: ['morning', 'faith', 'gratitude'], is_featured: 0 },
    { id: 'ps-4-8', reference: 'Psalm 4:8', book: 'Psalms', chapter: 4, verse_number: 8, translation: 'NIV', text: 'In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.', topics: ['evening', 'peace'], is_featured: 0 },
    // Guidance
    { id: 'prov-3-5-6', reference: 'Proverbs 3:5-6', book: 'Proverbs', chapter: 3, verse_number: 5, translation: 'NIV', text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', topics: ['guidance', 'faith', 'hope'], is_featured: 1 },
    { id: 'ps-119-105', reference: 'Psalm 119:105', book: 'Psalms', chapter: 119, verse_number: 105, translation: 'NIV', text: 'Your word is a lamp for my feet, a light on my path.', topics: ['guidance', 'faith'], is_featured: 0 },
    // Forgiveness
    { id: '1-john-1-9', reference: '1 John 1:9', book: '1 John', chapter: 1, verse_number: 9, translation: 'NIV', text: 'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.', topics: ['forgiveness', 'faith'], is_featured: 0 },
    { id: 'ps-103-12', reference: 'Psalm 103:12', book: 'Psalms', chapter: 103, verse_number: 12, translation: 'NIV', text: 'As far as the east is from the west, so far has he removed our transgressions from us.', topics: ['forgiveness', 'love'], is_featured: 0 },
  ];

  for (const verse of verses) {
    await db.runAsync(
      `INSERT OR IGNORE INTO verses (id, reference, book, chapter, verse_number, text, translation, topics, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [verse.id, verse.reference, verse.book, verse.chapter, verse.verse_number, verse.text, verse.translation, toJson(verse.topics), verse.is_featured]
    );
  }

  // Update topic verse counts
  for (const topic of topics) {
    const vCount = verses.filter((v) => v.topics.includes(topic.id)).length;
    await db.runAsync(
      'UPDATE topics SET verse_count = ? WHERE id = ?',
      [vCount, topic.id]
    );
  }

  // ── Daily Verses (next 30 days) ───────────────────────────────────────────
  const featuredVerseIds = verses.filter(v => v.is_featured).map(v => v.id);
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0]!;
    const verseId = featuredVerseIds[i % featuredVerseIds.length]!;

    const reflections: Record<string, { reflection: string; prayer: string }> = {
      'jer-29-11': {
        reflection: 'God\'s plans for you are rooted in love and purpose. Even when circumstances feel uncertain, this promise reminds us that we are held by a God who sees our future and calls it good. Take a moment to rest in that truth today.',
        prayer: 'Lord, thank you for the plans you have for me — plans filled with hope and a future. When I feel lost or uncertain, remind me that you hold my tomorrow. Help me trust your goodness even when I cannot see ahead. Amen.',
      },
      'john-3-16': {
        reflection: 'The depth of God\'s love is expressed in the greatest gift ever given. This verse isn\'t just familiar — it\'s foundational. Take a moment to let these words speak freshly to your heart today.',
        prayer: 'Father, thank you for loving me so completely that you gave your Son. Help me never take this gift for granted. Let your love be the foundation I stand on today. Amen.',
      },
    };

    const r = reflections[verseId] ?? { reflection: 'Take a moment to meditate on this verse today. Let God\'s Word speak to your heart and guide your steps.', prayer: 'Lord, speak to me through your Word today. Let it bring light to my path and peace to my heart. Amen.' };

    await db.runAsync(
      `INSERT OR IGNORE INTO daily_verses (id, date, verse_id, reflection, prayer) VALUES (?, ?, ?, ?, ?)`,
      [generateId(), dateStr, verseId, r.reflection, r.prayer]
    );
  }

  // ── Guided Prayers ────────────────────────────────────────────────────────
  const prayers = [
    {
      id: 'morning-grace', title: 'Morning Grace', category: 'morning', duration_minutes: 3, is_premium: 0,
      intro: 'Begin your day in God\'s presence, offering your morning as an act of worship.',
      body: 'Heavenly Father,\n\nThank you for the gift of this new day. Your mercies are new every morning — what a beautiful reminder that I begin each day covered in your grace.\n\nI offer you this day, Lord. My thoughts, my words, my work, my rest — all of it belongs to you. Guide my steps and align my heart with your purposes.\n\nWhere I feel tired or uncertain, fill me with your strength. Where I carry worry, replace it with your peace. Help me to see the people around me through your eyes today.\n\nMay everything I do today reflect your love. In Jesus\' name, Amen.',
      scripture_ref: 'Lamentations 3:22-23', scripture_text: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.',
      tags: ['morning', 'new-day', 'grace'],
    },
    {
      id: 'evening-rest', title: 'Evening Rest', category: 'evening', duration_minutes: 4, is_premium: 0,
      intro: 'Close the day with gratitude and surrender, releasing what is finished into God\'s hands.',
      body: 'Lord,\n\nAs this day comes to a close, I come before you with a grateful heart. Thank you for your presence through every moment — the joyful ones and the difficult ones alike.\n\nI release this day into your hands. The things I accomplished and the things I didn\'t. The conversations that went well and the ones I wish had gone differently. I lay them all at your feet.\n\nForgive me where I fell short today. Thank you for your grace that covers every shortcoming.\n\nAs I rest tonight, guard my heart and mind. Let me sleep in your peace, knowing that you hold all things. Tomorrow is in your hands.\n\nThank you, Lord. In Jesus\' name, Amen.',
      scripture_ref: 'Psalm 4:8', scripture_text: 'In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.',
      tags: ['evening', 'rest', 'peace'],
    },
    {
      id: 'anxiety-peace', title: 'When I Feel Anxious', category: 'anxiety', duration_minutes: 5, is_premium: 0,
      intro: 'When worry weighs heavy, this prayer invites you to bring your burdens to God.',
      body: 'Father,\n\nI come to you honest and a little overwhelmed. My mind has been running fast, and my heart feels heavy with worry.\n\nYou said not to be anxious about anything — but to bring everything to you in prayer. So here I am, Lord. I\'m bringing you what I cannot carry alone.\n\n[Take a moment to silently tell God what is worrying you right now.]\n\nThank you that you care about every detail of my life. Thank you that you are not surprised by anything I face. Your peace — the kind that goes beyond understanding — please let it guard my heart and mind right now.\n\nHelp me to take one faithful step at a time, trusting that you are with me. In Jesus\' name, Amen.',
      scripture_ref: 'Philippians 4:6-7', scripture_text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.',
      tags: ['anxiety', 'worry', 'peace', 'comfort'],
    },
    {
      id: 'gratitude-prayer', title: 'A Grateful Heart', category: 'gratitude', duration_minutes: 3, is_premium: 0,
      intro: 'Cultivate a posture of thankfulness, noticing God\'s goodness in everyday life.',
      body: 'Lord,\n\nToday I want to begin simply with thank you.\n\nThank you for life — for breath, for the morning, for another opportunity to walk with you. Thank you for the people in my life. Thank you for the small things I often overlook: the warmth of a cup of tea, a kind message, a quiet moment.\n\nYour Word says to give thanks in all circumstances, not just the easy ones. So today, I also thank you for the hard seasons, trusting that you are working in those places too.\n\nOpen my eyes to see your goodness around me today. Help me carry a grateful heart through every hour.\n\nWith a full heart, I say thank you. Amen.',
      scripture_ref: '1 Thessalonians 5:18', scripture_text: 'Give thanks in all circumstances; for this is God\'s will for you in Christ Jesus.',
      tags: ['gratitude', 'thankfulness'],
    },
    {
      id: 'strength-courage', title: 'Strength for Today', category: 'strength', duration_minutes: 4, is_premium: 0,
      intro: 'When you need courage and strength for what lies ahead.',
      body: 'Lord God,\n\nToday feels like a day I need your strength — not my own. I acknowledge that I am limited, but you are limitless. My resources run low, but yours never do.\n\nYour Word says I can do all things through Christ who strengthens me. I want to believe that today. Fill me with that strength now.\n\nGive me courage for the conversations I am dreading. Give me endurance for the work that feels endless. Give me patience for the moments that test me. Give me wisdom for the decisions I need to make.\n\nAnd when I feel like I cannot take another step — remind me that you are right beside me. In you, I will not grow weary. In you, I can keep going.\n\nIn Jesus\' powerful name, Amen.',
      scripture_ref: 'Isaiah 40:31', scripture_text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
      tags: ['strength', 'courage', 'endurance'],
    },
    {
      id: 'healing-prayer', title: 'Prayer for Healing', category: 'healing', duration_minutes: 5, is_premium: 1,
      intro: 'Bring your pain — physical, emotional, or spiritual — to the One who heals.',
      body: 'Healing God,\n\nI come to you carrying pain. You know exactly what I am experiencing right now — you know my body, my heart, and my mind better than I do.\n\nI ask for your healing touch. Whether healing comes quickly or slowly, I choose to trust that you are at work. Your timing is not always mine, but your love is constant.\n\nFor the pain I can name, I lay it before you. For the pain I don\'t have words for, you understand it anyway.\n\nBring comfort to my body. Bring peace to my heart. Restore what has been broken. And even in the waiting, help me to sense that you are near — not distant, not absent, but present with me in every moment of difficulty.\n\nI trust you, Lord. Amen.',
      scripture_ref: 'Psalm 46:1', scripture_text: 'God is our refuge and strength, an ever-present help in trouble.',
      tags: ['healing', 'pain', 'comfort'],
    },
    {
      id: 'forgiveness-prayer', title: 'Receiving Forgiveness', category: 'forgiveness', duration_minutes: 4, is_premium: 0,
      intro: 'A gentle prayer for receiving God\'s grace and releasing guilt.',
      body: 'Gracious Father,\n\nI come before you honestly, carrying the weight of things I have done and things left undone. I have fallen short. I have said things I shouldn\'t have. I have chosen my way over yours.\n\nBut your Word says that if I confess, you are faithful and just to forgive. I receive that forgiveness now — not because I deserve it, but because of what Christ has done.\n\nHelp me to receive your grace fully, and not to keep dragging myself back to what you have already forgiven. Teach me to walk in the freedom you purchased for me.\n\nAnd where I need to make something right with another person, give me the courage to do that. Restore what has been broken.\n\nThank you for a love that covers every failure. In Jesus\' name, Amen.',
      scripture_ref: '1 John 1:9', scripture_text: 'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.',
      tags: ['forgiveness', 'grace', 'freedom'],
    },
    {
      id: 'family-prayer', title: 'Prayer for My Family', category: 'family', duration_minutes: 4, is_premium: 0,
      intro: 'Lift the people you love most to God\'s care and protection.',
      body: 'Lord,\n\nToday I bring the people I love most before you. You know each of them by name — their hopes, their struggles, their hearts.\n\nI ask for your protection over my family. Keep them safe as they go through their days. Guard their minds from discouragement and their hearts from fear.\n\nWhere there is tension or misunderstanding between us, bring your peace. Give us patience with each other and grace for imperfection.\n\nBless each member of my family with a sense of your presence today. May they know they are loved — by me, and even more, by you.\n\nIn Jesus\' name, Amen.',
      scripture_ref: 'Proverbs 3:5-6', scripture_text: 'Trust in the Lord with all your heart and lean not on your own understanding.',
      tags: ['family', 'protection', 'love'],
    },
  ];

  for (const prayer of prayers) {
    await db.runAsync(
      `INSERT OR IGNORE INTO guided_prayers (id, title, intro, body, category, scripture_ref, scripture_text, duration_minutes, is_premium, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [prayer.id, prayer.title, prayer.intro, prayer.body, prayer.category, prayer.scripture_ref, prayer.scripture_text, prayer.duration_minutes, prayer.is_premium, toJson(prayer.tags)]
    );
  }

  // ── Devotionals ───────────────────────────────────────────────────────────
  const devotionals = [
    {
      id: 'morning-dev-1', title: 'New Mercies, New Morning', type: 'morning', date: todayDate(),
      author: 'DailyPrayer', reading_time: 3, is_premium: 0,
      scripture_ref: 'Lamentations 3:22-23', scripture_text: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.',
      content: 'There is something sacred about a morning. Before the inbox floods, before the demands of the day press in, there is a threshold moment — a space between sleeping and being fully awake — where God\'s mercies are waiting to meet you.\n\nLamentations was written in a season of deep grief, yet from that place of sorrow came one of Scripture\'s most enduring declarations of hope: His mercies are new every morning.\n\nNot recycled. Not leftovers from yesterday. New.\n\nWhatever you carried into sleep last night — the worry, the regret, the unfinished conversation — this morning it is met with fresh grace. God does not hold yesterday over you. He opens today with generosity.\n\n**A thought to carry today:** What would it look like to begin this day genuinely expecting God\'s goodness?',
    },
    {
      id: 'evening-dev-1', title: 'Laying It Down', type: 'evening', date: todayDate(),
      author: 'DailyPrayer', reading_time: 3, is_premium: 0,
      scripture_ref: 'Psalm 4:8', scripture_text: 'In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.',
      content: 'There is a spiritual practice that doesn\'t get enough attention: the practice of ending a day well. Of consciously laying down what the day held — the good, the hard, the incomplete — and trusting it to God.\n\nThe Psalmist could sleep in peace not because everything was resolved, but because he knew who held everything. Safety wasn\'t found in having all the answers. It was found in the One who held all the answers.\n\nYou don\'t have to carry tomorrow\'s worries into tonight\'s sleep. You don\'t have to solve everything before you rest. God is awake through the night — watching, working, sustaining — so you don\'t have to be.\n\n**An invitation:** Before you sleep, take sixty seconds to hand the day back to God. Name three things from today — big or small — and thank him for them.',
    },
  ];

  for (const dev of devotionals) {
    await db.runAsync(
      `INSERT OR IGNORE INTO devotionals (id, title, content, author, date, type, scripture_ref, scripture_text, is_premium, reading_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [dev.id, dev.title, dev.content, dev.author ?? '', dev.date, dev.type, dev.scripture_ref, dev.scripture_text, dev.is_premium, dev.reading_time]
    );
  }

  // ── Default reminders ─────────────────────────────────────────────────────
  const defaultReminders = [
    { id: 'morning-reminder', title: 'Morning Devotion', time: '07:00', days_of_week: [0, 1, 2, 3, 4, 5, 6], type: 'morning', is_active: 1 },
    { id: 'evening-reminder', title: 'Evening Reflection', time: '20:00', days_of_week: [0, 1, 2, 3, 4, 5, 6], type: 'evening', is_active: 0 },
  ];

  for (const r of defaultReminders) {
    await db.runAsync(
      `INSERT OR IGNORE INTO reminders (id, title, time, days_of_week, type, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      [r.id, r.title, r.time, toJson(r.days_of_week), r.type, r.is_active]
    );
  }

  // ── Default user preferences ──────────────────────────────────────────────
  await db.runAsync(
    `INSERT OR IGNORE INTO user_preferences (id, goals, preferred_translation, app_theme) VALUES (1, ?, 'NIV', 'system')`,
    [toJson([])]
  );

  // ── Community Prayers Seed ──────────────────────────────────────────────
  const communityPrayers = [
    { id: 'comm-1', author: 'Sarah M.', category: 'Healing', content: 'Please pray for my mother\'s upcoming surgery next Tuesday. Praying for peace for our family and wisdom for the surgeons.', prayer_count: 14, user_prayed: 0 },
    { id: 'comm-2', author: 'Brother David', category: 'Peace', content: 'Seeking God\'s clarity and calm heart amidst a heavy week at work and major decisions ahead.', prayer_count: 9, user_prayed: 0 },
    { id: 'comm-3', author: 'Grace & John', category: 'Family', content: 'Praying for our newborn baby who is in the ICU. We trust in God\'s unfailing healing hands.', prayer_count: 32, user_prayed: 0 },
    { id: 'comm-4', author: 'Anonymous Pilgrim', category: 'Strength', content: 'Asking for strength to overcome anxiety and walk in the confidence of God\'s love every morning.', prayer_count: 21, user_prayed: 0 },
    { id: 'comm-5', author: 'Elena R.', category: 'Guidance', content: 'Praying for direction as I apply to college and seek God\'s true calling for my life.', prayer_count: 11, user_prayed: 0 },
  ];

  for (const cp of communityPrayers) {
    await db.runAsync(
      `INSERT OR IGNORE INTO community_prayers (id, author_alias, category, content, prayer_count, user_prayed) VALUES (?, ?, ?, ?, ?, ?)`,
      [cp.id, cp.author, cp.category, cp.content, cp.prayer_count, cp.user_prayed]
    );
  }
  });
}
