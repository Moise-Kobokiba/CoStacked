// src/components/stack-suite/DiscussionsTab.jsx

import { useState } from 'react';
import { ArrowBigUp, MessageSquare, ArrowLeft, Eye, Bookmark, Share2, Pin } from 'lucide-react';
import { CommentThread } from './CommentThread';
import styles from './StackSuite.module.css';

const categoryBadgeClass = {
  Validation: styles.badgeValidation,
  Tech:       styles.badgeTech,
  Equity:     styles.badgeEquity,
  Growth:     styles.badgeGrowth,
  Legal:      styles.badgeLegal,
  General:    styles.badgeGeneral,
};

const roleBadgeClass = {
  Founder:   styles.badgeFounder,
  Developer: styles.badgeDeveloper,
};

const discussions = [
  {
    id: 1,
    title: "How do you validate a B2B SaaS idea before writing a single line of code?",
    category: "Validation",
    author: "Thando M.",
    initials: "TM",
    role: "Founder",
    tags: ["saas", "mvp", "research"],
    upvotes: 42,
    comments: 18,
    time: "3h ago",
    views: 342,
    pinned: true,
    body: "I've been going back and forth on a new B2B SaaS concept for construction project management. Before I invest months of development time, I want to know: what frameworks or processes do you use to validate that there's real demand?\n\nSome things I've tried:\n- Cold outreach to 20 potential customers on LinkedIn\n- A simple landing page with a waitlist form\n- Competitor analysis on G2 and Capterra\n\nBut I'm still not confident. What's worked for you? Especially interested in hearing from founders who've pivoted after early validation showed weak signals.",
    threadComments: [
      { id: 101, author: "Sipho K.", initials: "SK", role: "Developer", content: "I usually start with a fake door test - build a landing page that describes the product, run some Google/Facebook ads to it, and measure click-through rates and waitlist signups. If you can get a 5%+ conversion rate, that's a decent signal. Cost is usually under R2,000.", time: "2h ago", upvotes: 15, likes: 8, replies: [{ id: 102, author: "Thando M.", initials: "TM", role: "Founder", content: "That's a great idea! What tools do you use for the landing page? I've been looking at Framer and Carrd.", time: "1h ago", upvotes: 3, likes: 2, replies: [{ id: 103, author: "Sipho K.", initials: "SK", role: "Developer", content: "Framer is solid for this. But honestly, even a simple Next.js page deployed on Vercel works great - gives you more control over tracking pixels and analytics.", time: "45min ago", upvotes: 7, likes: 4, replies: [] }] }] },
      { id: 104, author: "Naledi P.", initials: "NP", role: "Founder", content: "The Mom Test by Rob Fitzpatrick changed how I do customer discovery. The key insight: don't ask people if they'd use your product. Instead, ask about their existing problems and workflows.", time: "2h ago", upvotes: 22, likes: 14, replies: [] },
      { id: 105, author: "Kgosi R.", initials: "KR", role: "Founder", content: "I'd add: look at job postings in your target industry. If companies are hiring people to do the thing your software automates, that's a strong demand signal.", time: "1h ago", upvotes: 11, likes: 6, replies: [{ id: 106, author: "Amara D.", initials: "AD", role: "Developer", content: "This is underrated advice. I used this exact approach to validate our HR tool.", time: "30min ago", upvotes: 5, likes: 3, replies: [] }] },
    ],
  },
  {
    id: 2,
    title: "Best tech stack for a fintech startup in 2026? Next.js vs Remix vs SvelteKit",
    category: "Tech",
    author: "Sipho K.",
    initials: "SK",
    role: "Developer",
    tags: ["nextjs", "fintech", "architecture"],
    upvotes: 67,
    comments: 31,
    time: "5h ago",
    views: 891,
    body: "We're building a fintech product for micro-lending in South Africa. Need to handle KYC flows, real-time transaction processing, and complex dashboards. The team is 3 devs strong.\n\nI'm leaning Next.js because of the ecosystem, but Remix's data loading patterns and SvelteKit's performance are tempting. What are you using for fintech projects and why?",
    threadComments: [
      { id: 201, author: "Zanele N.", initials: "ZN", role: "Founder", content: "We went with Next.js for our payment platform and haven't looked back. The server components model is perfect for dashboards with lots of data fetching.", time: "4h ago", upvotes: 18, likes: 9, replies: [] },
      { id: 202, author: "Amara D.", initials: "AD", role: "Developer", content: "For fintech specifically, I'd prioritize: 1) TypeScript support, 2) Auth/security ecosystem, 3) Testing infrastructure. Next.js wins on #2 and #3 due to sheer community size.", time: "3h ago", upvotes: 24, likes: 11, replies: [{ id: 203, author: "Sipho K.", initials: "SK", role: "Developer", content: "Good framework. Security ecosystem is definitely a concern - we need POPIA compliance, OTP verification, document upload with encryption.", time: "2h ago", upvotes: 6, likes: 3, replies: [] }] },
    ],
  },
  {
    id: 3,
    title: "What equity split makes sense for a technical co-founder joining at MVP stage?",
    category: "Equity",
    author: "Naledi P.",
    initials: "NP",
    role: "Founder",
    tags: ["equity", "co-founder", "negotiation"],
    upvotes: 89,
    comments: 44,
    time: "8h ago",
    views: 1203,
    body: "I've been working on this startup for 6 months solo - customer interviews, business plan, early designs. Now I'm looking to bring on a technical co-founder to build the MVP. They'd be coming in with no financial investment but full-time commitment.\n\nI've seen ranges from 10% to 40% for this scenario. What's fair? Vesting schedule recommendations?",
    threadComments: [
      { id: 301, author: "Kgosi R.", initials: "KR", role: "Founder", content: "I'd suggest 25-35% with a 4-year vesting schedule and 1-year cliff. The key question is: how critical is the tech to the business?", time: "7h ago", upvotes: 34, likes: 19, replies: [] },
      { id: 302, author: "Thando M.", initials: "TM", role: "Founder", content: "Whatever you agree on, make sure you have a shareholders' agreement drafted by a lawyer familiar with SA startup law. Budget R15-25k for a good one.", time: "6h ago", upvotes: 28, likes: 22, replies: [{ id: 303, author: "Naledi P.", initials: "NP", role: "Founder", content: "Thanks for the specific budget range - that's really helpful. Any lawyer recommendations in the Joburg area?", time: "5h ago", upvotes: 4, likes: 2, replies: [] }] },
    ],
  },
  {
    id: 4,
    title: "Growth hacking strategies that actually worked for our township delivery app",
    category: "Growth",
    author: "Kgosi R.",
    initials: "KR",
    role: "Founder",
    tags: ["growth", "marketing", "case-study"],
    upvotes: 124,
    comments: 56,
    time: "12h ago",
    views: 2100,
    body: "After 8 months of iteration, our township delivery app hit 10,000 MAU. Here's what actually moved the needle vs what we thought would work:\n\nWhat WORKED:\n- WhatsApp referral codes (3x more effective than in-app referrals)\n- Partnership with local spaza shops as pickup points\n- Free delivery Friday campaigns\n\nWhat DIDN'T work:\n- Instagram marketing (our users aren't there)\n- App store optimization alone",
    threadComments: [
      { id: 401, author: "Zanele N.", initials: "ZN", role: "Founder", content: "This is gold. The WhatsApp referral insight resonates so much - we found the same thing with our service.", time: "11h ago", upvotes: 31, likes: 18, replies: [] },
    ],
  },
  {
    id: 5,
    title: "Understanding POPIA compliance for SaaS products targeting SA market",
    category: "Legal",
    author: "Amara D.",
    initials: "AD",
    role: "Developer",
    tags: ["legal", "popia", "compliance"],
    upvotes: 35,
    comments: 12,
    time: "1d ago",
    views: 567,
    body: "Just went through our first POPIA compliance audit and wanted to share key learnings for fellow SaaS builders.\n\nKey requirements to implement:\n- Explicit consent collection for all personal data\n- Data breach notification within 72 hours\n- Right to deletion (your database design matters!)\n- Data processing agreements with all third parties",
    threadComments: [
      { id: 501, author: "Sipho K.", initials: "SK", role: "Developer", content: "The right to deletion point is huge. We had to refactor our entire database schema because we were using hard deletes in some places.", time: "22h ago", upvotes: 14, likes: 8, replies: [] },
    ],
  },
  {
    id: 6,
    title: "Weekly wins thread: Share your biggest achievement this week",
    category: "General",
    author: "Zanele N.",
    initials: "ZN",
    role: "Founder",
    tags: ["community", "wins", "motivation"],
    upvotes: 78,
    comments: 63,
    time: "2d ago",
    views: 1456,
    body: "Let's celebrate the small and big wins together! Drop your biggest achievement from this week below. No win is too small - shipped a feature? Got your first user? Fixed that nasty bug? We want to hear it all.",
    threadComments: [
      { id: 601, author: "Thando M.", initials: "TM", role: "Founder", content: "Finally launched our beta this week! 47 signups on day one from organic traffic alone.", time: "1d ago", upvotes: 45, likes: 32, replies: [{ id: 602, author: "Kgosi R.", initials: "KR", role: "Founder", content: "47 organic signups on day one is amazing! What's your activation flow looking like?", time: "1d ago", upvotes: 8, likes: 5, replies: [] }] },
      { id: 603, author: "Amara D.", initials: "AD", role: "Developer", content: "Merged my 100th PR this week and reduced our API response times by 60% with some database query optimizations.", time: "1d ago", upvotes: 22, likes: 15, replies: [] },
    ],
  },
];

/* ─────────── Detail View ─────────── */
function DiscussionDetail({ discussion, onBack }) {
  const [upvoted, setUpvoted]         = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(discussion.upvotes);
  const [bookmarked, setBookmarked]   = useState(false);

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <button className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} /> Back to Discussions
      </button>

      <article className={styles.card} style={{ padding: 24, marginBottom: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span className={`${styles.badge} ${categoryBadgeClass[discussion.category]}`}>
            {discussion.category}
          </span>
          {discussion.pinned && (
            <span className={`${styles.badge} ${styles.badgePinned}`}>
              <Pin size={11} /> Pinned
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{discussion.time}</span>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Eye size={13} /> {discussion.views} views
          </span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, lineHeight: 1.3, color: 'var(--foreground)' }}>
          {discussion.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div className={`${styles.avatar} ${styles.avatarLg}`}>{discussion.initials}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{discussion.author}</span>
              <span className={`${styles.badge} ${roleBadgeClass[discussion.role]}`} style={{ fontSize: 10 }}>{discussion.role}</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Posted {discussion.time}</p>
          </div>
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--foreground)', whiteSpace: 'pre-line', marginBottom: 20, opacity: 0.9 }}>
          {discussion.body}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {discussion.tags.map(tag => (
            <span key={tag} className={styles.chip}>#{tag}</span>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => { setUpvoteCount(c => upvoted ? c-1 : c+1); setUpvoted(v=>!v); }}
              className={`${styles.upvoteBtn} ${upvoted ? styles.upvoteBtnActive : ''}`}
              aria-label={`Upvote, count ${upvoteCount}`}
            >
              <ArrowBigUp size={20} />
              <span>{upvoteCount}</span>
            </button>
            <span style={{ fontSize: 13, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={15} /> {discussion.comments} comments
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => setBookmarked(v=>!v)}
              className={`${styles.iconBtn} ${bookmarked ? styles.iconBtnActive : ''}`}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
            <button className={styles.iconBtn} aria-label="Share">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </article>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--foreground)' }}>
          Comments ({discussion.threadComments.length})
        </h2>
        <CommentThread comments={discussion.threadComments} />
      </div>
    </div>
  );
}

/* ─────────── List View ─────────── */
export function DiscussionsTab() {
  const [selected, setSelected]             = useState(null);
  const [upvotedPosts, setUpvotedPosts]     = useState(new Set());
  const [upvoteCounts, setUpvoteCounts]     = useState(
    Object.fromEntries(discussions.map(d => [d.id, d.upvotes]))
  );

  if (selected) {
    return <DiscussionDetail discussion={selected} onBack={() => setSelected(null)} />;
  }

  const handleUpvote = (e, postId) => {
    e.stopPropagation();
    setUpvotedPosts(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
    setUpvoteCounts(prev => ({
      ...prev,
      [postId]: upvotedPosts.has(postId) ? prev[postId] - 1 : prev[postId] + 1,
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {discussions.map(post => (
        <article
          key={post.id}
          className={styles.card}
          style={{ padding: 20, cursor: 'pointer' }}
          onClick={() => setSelected(post)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(post); }}}
          aria-label={`Open discussion: ${post.title}`}
        >
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Upvote column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 2 }}>
              <button
                onClick={e => handleUpvote(e, post.id)}
                className={`${styles.upvoteBtn} ${upvotedPosts.has(post.id) ? styles.upvoteBtnActive : ''}`}
                style={{ flexDirection: 'column', padding: '6px 10px', gap: 2 }}
                aria-label={`Upvote, count ${upvoteCounts[post.id]}`}
              >
                <ArrowBigUp size={20} />
                <span style={{ fontSize: 11 }}>{upvoteCounts[post.id]}</span>
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className={`${styles.badge} ${categoryBadgeClass[post.category]}`}>{post.category}</span>
                {post.pinned && (
                  <span className={`${styles.badge} ${styles.badgePinned}`} style={{ fontSize: 10 }}>
                    <Pin size={10} /> Pinned
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{post.time}</span>
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Eye size={12} /> {post.views}
                </span>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, lineHeight: 1.35, color: 'var(--foreground)' }}>
                {post.title}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                {post.body}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={`${styles.avatar} ${styles.avatarSm}`}>{post.initials}</div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>{post.author}</span>
                  <span className={`${styles.badge} ${roleBadgeClass[post.role]}`} style={{ fontSize: 10 }}>{post.role}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {post.tags.map(tag => (
                      <span key={tag} className={styles.chip} style={{ fontSize: 11 }}>#{tag}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted-foreground)' }}>
                    <MessageSquare size={15} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{post.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
