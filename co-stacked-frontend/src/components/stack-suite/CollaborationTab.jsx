// src/components/stack-suite/CollaborationTab.jsx

import { useState } from 'react';
import { MessageSquare, Paperclip, CheckCircle2, Clock, AlertCircle, ArrowLeft, GitBranch, CalendarDays } from 'lucide-react';
import { CommentThread } from './CommentThread';
import styles from './StackSuite.module.css';

const progressConfig = {
  Completed:    { badgeClass: styles.badgeCompleted,   Icon: CheckCircle2 },
  'In Progress':{ badgeClass: styles.badgeInProgress,  Icon: Clock        },
  'Needs Review':{ badgeClass: styles.badgeNeedsReview, Icon: AlertCircle  },
};

const threads = [
  { id: 1, project: "PayFlex", milestone: "Payment gateway integration complete", description: "Successfully integrated with Stripe Connect for split payments. Ready for QA testing on staging environment.", longDescription: "We've completed the Stripe Connect integration for our split payment feature. This was a 3-week sprint involving:\n\n1. Setting up Stripe Connect accounts for merchants\n2. Building the payment splitting logic (supports up to 5 recipients per transaction)\n3. Implementing webhook handlers for payment confirmations and failures\n4. Adding retry logic for failed settlements\n5. Building a reconciliation dashboard for merchants\n\nThe staging environment is live and ready for QA. We need to test edge cases around partial refunds and currency conversion before pushing to production.\n\nKey metrics from staging:\n- Average payment processing time: 2.3 seconds\n- Webhook delivery success rate: 99.7%\n- Settlement accuracy: 100% across 500 test transactions", team: [{ initials: "TM", name: "Thando M.", role: "Lead" }, { initials: "SK", name: "Sipho K.", role: "Backend" }, { initials: "AD", name: "Amara D.", role: "QA" }], progress: "Completed", attachment: "payment-flow-v2.pdf", comments: 8, time: "2h ago", branch: "feature/stripe-connect", deadline: "Feb 15, 2026", threadComments: [{ id: 7001, author: "Amara D.", initials: "AD", role: "Developer", content: "QA testing started. Found 2 edge cases so far:\n\n1. When a merchant's Stripe account is in 'restricted' status, the split fails silently.\n2. Partial refunds don't recalculate the split correctly if one recipient has already been paid out.", time: "1h ago", upvotes: 6, likes: 4, replies: [{ id: 7002, author: "Sipho K.", initials: "SK", role: "Developer", content: "Good catches. I'll fix the restricted account handling today. For the partial refund issue, let's discuss the logic in tomorrow's standup.", time: "45min ago", upvotes: 4, likes: 3, replies: [] }] }, { id: 7003, author: "Thando M.", initials: "TM", role: "Founder", content: "Excellent work team. The 99.7% webhook success rate is great. Let's aim for 99.9% before production.", time: "30min ago", upvotes: 8, likes: 5, replies: [] }] },
  { id: 2, project: "FarmLink", milestone: "User onboarding flow redesigned", description: "New farmer onboarding now includes location-based matching and crop type selection. Reduced steps from 8 to 4.", longDescription: "Major overhaul of the farmer onboarding experience based on user research with 30 farmers in Limpopo and KZN.\n\nKey changes:\n- Reduced registration from 8 steps to 4 by combining related fields\n- Added GPS-based location detection (eliminates manual address entry)\n- Implemented visual crop type selector with images\n- Added USSD fallback for farmers without smartphones\n- Onboarding completion rate in testing: jumped from 34% to 78%\n\nThe USSD integration was the biggest challenge - we're using Africa's Talking API and had to work around character limits for multilingual content.", team: [{ initials: "NP", name: "Naledi P.", role: "Design" }, { initials: "KR", name: "Kgosi R.", role: "Frontend" }], progress: "In Progress", attachment: "onboarding-mockups.fig", comments: 14, time: "5h ago", branch: "feature/onboarding-v2", deadline: "Feb 20, 2026", threadComments: [{ id: 8001, author: "Kgosi R.", initials: "KR", role: "Founder", content: "The visual crop selector is working beautifully on mobile. Tested on a Samsung A14 and performance is smooth even on 3G.", time: "4h ago", upvotes: 12, likes: 8, replies: [] }, { id: 8002, author: "Naledi P.", initials: "NP", role: "Founder", content: "Just got feedback from our pilot group in Tzaneen - they love the GPS feature but some are concerned about location privacy.", time: "3h ago", upvotes: 9, likes: 7, replies: [{ id: 8003, author: "Kgosi R.", initials: "KR", role: "Founder", content: "Great feedback. I'll add a permission dialog with a visual explanation.", time: "2h ago", upvotes: 7, likes: 5, replies: [] }] }] },
  { id: 3, project: "StudyPal AI", milestone: "AI tutor module - first prototype", description: "Built the initial conversational AI tutor using GPT-4o with RAG for course material. Needs review for accuracy on STEM subjects.", longDescription: "First working prototype of our AI tutor feature is ready for review. Architecture:\n\n- GPT-4o as the base model with custom system prompts per subject\n- RAG pipeline using Pinecone for course material retrieval\n- Chunks indexed from 12 university textbooks (with permission)\n- Conversation memory using Supabase for session continuity\n\nCurrent accuracy benchmarks:\n- Mathematics: 91% correct answers\n- Computer Science: 88%\n- Physics: 85%\n- Chemistry: 79% (needs improvement)\n\nThe Chemistry accuracy is lower because many questions require diagram interpretation which our current pipeline doesn't handle well.", team: [{ initials: "ZN", name: "Zanele N.", role: "Product" }, { initials: "SK", name: "Sipho K.", role: "AI/ML" }, { initials: "TM", name: "Thando M.", role: "Backend" }, { initials: "LP", name: "Lebo P.", role: "Content" }], progress: "Needs Review", attachment: "ai-tutor-demo.mp4", comments: 22, time: "1d ago", branch: "feature/ai-tutor", deadline: "Mar 1, 2026", threadComments: [{ id: 9001, author: "Sipho K.", initials: "SK", role: "Developer", content: "For the Chemistry accuracy issue, I've been experimenting with GPT-4o's vision capabilities. Initial tests show ~15% accuracy improvement on diagram-dependent questions.", time: "20h ago", upvotes: 18, likes: 12, replies: [{ id: 9002, author: "Zanele N.", initials: "ZN", role: "Founder", content: "That's a great approach! Let's prototype this as a separate feature flag so we can A/B test.", time: "18h ago", upvotes: 10, likes: 6, replies: [] }] }] },
  { id: 4, project: "LoadShield", milestone: "IoT sensor data pipeline live", description: "Real-time energy monitoring pipeline is now streaming data from 50 beta test devices. Latency under 200ms on average.", longDescription: "Our real-time data pipeline is production-ready. The full stack:\n\n- ESP32-based sensors measuring voltage, current, and power factor\n- MQTT broker (AWS IoT Core) for device-to-cloud communication\n- Apache Kafka for stream processing\n- TimescaleDB for time-series storage\n- React dashboard with WebSocket updates\n\n50 beta devices are live across Sandton, Midrand, and Centurion. Average latency from sensor reading to dashboard update: 187ms. We're handling ~2.4M data points per day.", team: [{ initials: "AD", name: "Amara D.", role: "IoT Lead" }, { initials: "KR", name: "Kgosi R.", role: "Backend" }], progress: "Completed", attachment: "metrics-dashboard.png", comments: 6, time: "2d ago", branch: "main", deadline: "Feb 10, 2026", threadComments: [{ id: 10001, author: "Kgosi R.", initials: "KR", role: "Founder", content: "Pipeline has been rock solid for 48 hours now. Zero dropped messages, and the auto-scaling on the Kafka consumers is handling the load beautifully.", time: "1d ago", upvotes: 9, likes: 6, replies: [] }] },
  { id: 5, project: "AfriLearn", milestone: "Zulu language module content ready", description: "First batch of 40 micro-lessons translated and voiced in isiZulu. Awaiting review from language consultants before publishing.", longDescription: "Our first isiZulu content module is complete! This was a massive collaborative effort:\n\n- 40 micro-lessons covering basic digital literacy\n- Professional voice recordings by native isiZulu speakers\n- Culturally adapted examples\n- Low-bandwidth audio format (opus codec, average 1.2MB per lesson)\n- Subtitles in both isiZulu and English for accessibility\n\nTotal content duration: 4 hours 20 minutes. We're now waiting for feedback from 3 language consultants at UKZN before publishing.", team: [{ initials: "NP", name: "Naledi P.", role: "Content Lead" }, { initials: "ZN", name: "Zanele N.", role: "Product" }, { initials: "LP", name: "Lebo P.", role: "Voice" }], progress: "In Progress", attachment: "lesson-samples.zip", comments: 11, time: "3d ago", branch: "content/zulu-module-1", deadline: "Feb 28, 2026", threadComments: [{ id: 11001, author: "Zanele N.", initials: "ZN", role: "Founder", content: "The voice recordings are exceptional quality. Lebo did an amazing job with the narration - it feels warm and conversational, not like a textbook.", time: "2d ago", upvotes: 14, likes: 11, replies: [{ id: 11002, author: "Naledi P.", initials: "NP", role: "Founder", content: "Agreed! I've shared samples with the UKZN consultants. One suggestion so far: add more colloquial expressions to make it feel even more natural.", time: "2d ago", upvotes: 8, likes: 6, replies: [] }] }] },
];

/* ─────────── Detail View ─────────── */
function ThreadDetail({ thread, onBack }) {
  const cfg = progressConfig[thread.progress] || progressConfig['In Progress'];
  const ProgressIcon = cfg.Icon;

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <button className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} /> Back to Collaboration
      </button>

      <article className={styles.card} style={{ padding: 24, marginBottom: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{thread.project}</span>
          <span style={{ color: 'var(--muted-foreground)' }}>/</span>
          <span className={`${styles.badge} ${cfg.badgeClass}`}>
            <ProgressIcon size={12} /> {thread.progress}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{thread.time}</span>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, lineHeight: 1.3, color: 'var(--foreground)' }}>
          {thread.milestone}
        </h1>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, fontSize: 13 }}>
          {thread.branch && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--input-background)', padding: '4px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }}>
              <GitBranch size={13} /> {thread.branch}
            </span>
          )}
          {thread.deadline && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-foreground)' }}>
              <CalendarDays size={13} /> Due: {thread.deadline}
            </span>
          )}
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--foreground)', whiteSpace: 'pre-line', marginBottom: 20, opacity: 0.9 }}>
          {thread.longDescription}
        </div>

        {thread.attachment && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--input-background)', padding: '8px 12px', borderRadius: 8, marginBottom: 20, border: '1px solid var(--border)' }}>
            <Paperclip size={13} style={{ color: 'var(--muted-foreground)' }} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>{thread.attachment}</span>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: 12 }}>Team</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {thread.team.map(member => (
              <div key={member.initials} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--input-background)', padding: '6px 12px', borderRadius: 10 }}>
                <div className={`${styles.avatar} ${styles.avatarSm}`}>{member.initials}</div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)' }}>{member.name}</p>
                  <p style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--foreground)' }}>
          Updates & Discussion ({thread.threadComments.length})
        </h2>
        <CommentThread comments={thread.threadComments} />
      </div>
    </div>
  );
}

/* ─────────── Timeline View ─────────── */
export function CollaborationTab() {
  const [selected, setSelected] = useState(null);

  if (selected) {
    return <ThreadDetail thread={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Vertical timeline line */}
      <div style={{ position: 'absolute', left: 23, top: 0, bottom: 0, width: 1, background: 'var(--border)', display: 'none' }} aria-hidden="true" className="timelineLine" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {threads.map(thread => {
          const cfg = progressConfig[thread.progress] || progressConfig['In Progress'];
          const ProgressIcon = cfg.Icon;
          return (
            <article
              key={thread.id}
              style={{ position: 'relative', paddingBottom: 24, cursor: 'pointer' }}
              onClick={() => setSelected(thread)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(thread); }}}
              aria-label={`Open thread: ${thread.milestone}`}
            >
              <div className={styles.card} style={{ padding: 20 }}>
                {/* Header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{thread.project}</span>
                  <span style={{ color: 'var(--muted-foreground)' }} aria-hidden="true">/</span>
                  <span className={`${styles.badge} ${cfg.badgeClass}`} style={{ fontSize: 10 }}>
                    <ProgressIcon size={11} /> {thread.progress}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted-foreground)' }}>{thread.time}</span>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--foreground)', lineHeight: 1.35 }}>
                  {thread.milestone}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted-foreground)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5, marginBottom: 16 }}>
                  {thread.description}
                </p>

                {thread.attachment && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--input-background)', padding: '5px 10px', borderRadius: 8, marginBottom: 16 }}>
                    <Paperclip size={12} style={{ color: 'var(--muted-foreground)' }} />
                    <span style={{ fontSize: 11, fontWeight: 500 }}>{thread.attachment}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex' }}>
                      {thread.team.map((member, i) => (
                        <div key={member.initials} className={`${styles.avatar} ${styles.avatarSm}`}
                          style={{ border: '2px solid var(--card-background)', marginLeft: i > 0 ? -8 : 0 }}>
                          {member.initials}
                        </div>
                      ))}
                    </div>
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--muted-foreground)' }}>
                      {thread.team.length} member{thread.team.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted-foreground)' }}>
                    <MessageSquare size={14} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{thread.comments} comments</span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
