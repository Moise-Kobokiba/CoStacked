// src/components/stack-suite/ShowcasesTab.jsx

import { useState } from 'react';
import { ArrowBigUp, MessageSquare, Handshake, ArrowLeft, Users, Calendar } from 'lucide-react';
import { CommentThread } from './CommentThread';
import styles from './StackSuite.module.css';

const stageBadgeClass = {
  Idea:     styles.badgeIdea,
  MVP:      styles.badgeMvp,
  Beta:     styles.badgeBeta,
  Launched: styles.badgeLaunched,
};

/* Gradient pairs mapped via CSS vars compatible backgrounds */
const gradients = {
  'from-primary/10 to-amber-50':   'linear-gradient(135deg, rgba(79,70,229,0.08), #fffbeb)',
  'from-emerald-50 to-sky-50':     'linear-gradient(135deg, #ecfdf5, #f0f9ff)',
  'from-sky-50 to-violet-50':      'linear-gradient(135deg, #f0f9ff, #f5f3ff)',
  'from-rose-50 to-primary/10':    'linear-gradient(135deg, #fff1f2, rgba(79,70,229,0.08))',
  'from-amber-50 to-emerald-50':   'linear-gradient(135deg, #fffbeb, #ecfdf5)',
  'from-violet-50 to-rose-50':     'linear-gradient(135deg, #f5f3ff, #fff1f2)',
};

const showcases = [
  { id: 1, name: "PayFlex", description: "Split payments made simple for South African freelancers and small businesses.", longDescription: "PayFlex is building the Stripe for South Africa's gig economy. We enable freelancers and SMEs to accept split payments, automate invoicing, and manage cash flow - all from a single dashboard. Currently processing R2.3M in monthly transactions across 340 active merchants.\n\nWe're integrating with major SA banks for instant EFT settlements and building a mobile-first experience for merchants who run their businesses from their phones.", stage: "MVP", techStack: ["Next.js", "Supabase", "Stripe"], upvotes: 156, comments: 23, gradient: 'from-primary/10 to-amber-50', icon: "PF", founder: "Thando M.", founderInitials: "TM", teamSize: 3, launched: "Jan 2026", looking: ["Backend Developer", "Design Partner"], threadComments: [{ id: 1001, author: "Sipho K.", initials: "SK", role: "Developer", content: "Really impressive transaction volume for an MVP! How are you handling the reconciliation with SA banks?", time: "4h ago", upvotes: 12, likes: 7, replies: [{ id: 1002, author: "Thando M.", initials: "TM", role: "Founder", content: "Great question! We're using Stitch for bank integrations. Their webhook reliability is solid, but we had to build a custom reconciliation queue for edge cases.", time: "3h ago", upvotes: 8, likes: 5, replies: [] }] }, { id: 1003, author: "Naledi P.", initials: "NP", role: "Founder", content: "Love the focus on mobile-first for merchants. Have you considered adding WhatsApp invoicing?", time: "2h ago", upvotes: 15, likes: 10, replies: [] }] },
  { id: 2, name: "FarmLink", description: "Connecting small-scale farmers directly with urban restaurants and markets.", longDescription: "FarmLink eliminates middlemen in the SA fresh produce supply chain. Small-scale farmers in Limpopo, KZN, and Eastern Cape can list their produce and connect directly with restaurants, hotels, and market traders in Joburg and Cape Town.\n\nWe handle logistics through partnerships with existing transport networks. Currently onboarding 120 farmers and 45 restaurant partners.", stage: "Beta", techStack: ["React Native", "Node.js", "PostgreSQL"], upvotes: 203, comments: 41, gradient: 'from-emerald-50 to-sky-50', icon: "FL", founder: "Naledi P.", founderInitials: "NP", teamSize: 5, launched: "Nov 2025", looking: ["Mobile Developer", "Logistics Partner"], threadComments: [{ id: 2001, author: "Kgosi R.", initials: "KR", role: "Founder", content: "The minibus taxi logistics angle is genius. How do you handle cold chain requirements for perishables?", time: "8h ago", upvotes: 19, likes: 11, replies: [] }] },
  { id: 3, name: "StudyPal AI", description: "AI-powered study companion for South African university students.", longDescription: "StudyPal AI generates personalized study plans, practice questions, and explanations tailored to South African university curricula. We support content for all major SA universities.\n\nOur AI tutor understands the local curriculum structure. Currently 8,200 active students with a 73% weekly retention rate.", stage: "Launched", techStack: ["Next.js", "OpenAI", "Vercel"], upvotes: 312, comments: 67, gradient: 'from-sky-50 to-violet-50', icon: "SP", founder: "Zanele N.", founderInitials: "ZN", teamSize: 4, launched: "Aug 2025", looking: ["Content Creator", "University Partnerships"], threadComments: [{ id: 3001, author: "Amara D.", initials: "AD", role: "Developer", content: "73% weekly retention is outstanding for an education app. What's driving that engagement?", time: "6h ago", upvotes: 22, likes: 14, replies: [{ id: 3002, author: "Zanele N.", initials: "ZN", role: "Founder", content: "Honestly, it's the daily streak + the AI tutor combo. Students get addicted to their streak.", time: "5h ago", upvotes: 16, likes: 9, replies: [] }] }] },
  { id: 4, name: "TaxiTrack", description: "Real-time minibus taxi tracking and payment platform for commuters.", longDescription: "TaxiTrack brings ride-hailing visibility to the minibus taxi industry. Commuters can see real-time taxi locations, estimated arrival times, and pay via mobile money or card.\n\nPiloting in Soweto with 25 taxis. Target: 200 taxis across Gauteng by Q2 2026.", stage: "Idea", techStack: ["Flutter", "Firebase", "Maps API"], upvotes: 89, comments: 15, gradient: 'from-rose-50 to-primary/10', icon: "TT", founder: "Kgosi R.", founderInitials: "KR", teamSize: 2, launched: "Feb 2026", looking: ["Flutter Developer", "Taxi Association Contacts"], threadComments: [{ id: 4001, author: "Sipho K.", initials: "SK", role: "Developer", content: "This could be massive if you crack the taxi association relationships. Have you spoken to SANTACO yet?", time: "1d ago", upvotes: 14, likes: 8, replies: [] }] },
  { id: 5, name: "LoadShield", description: "Smart load-shedding management for homes and small businesses.", longDescription: "LoadShield combines IoT sensors with predictive algorithms to help homes and businesses optimize their energy usage during load-shedding. Currently in beta with 50 devices deployed across Johannesburg. Average users save 30% on backup power costs.", stage: "MVP", techStack: ["Python", "IoT", "React"], upvotes: 178, comments: 34, gradient: 'from-amber-50 to-emerald-50', icon: "LS", founder: "Amara D.", founderInitials: "AD", teamSize: 3, launched: "Dec 2025", looking: ["IoT Engineer", "Hardware Partners"], threadComments: [{ id: 5001, author: "Thando M.", initials: "TM", role: "Founder", content: "30% savings is a strong value prop. What's the unit economics looking like? Hardware + subscription model?", time: "2d ago", upvotes: 11, likes: 6, replies: [] }] },
  { id: 6, name: "AfriLearn", description: "Micro-learning platform delivering skills training in local languages.", longDescription: "AfriLearn delivers bite-sized skills training in isiZulu, isiXhosa, Afrikaans, Sesotho, and English. Courses cover digital literacy, financial skills, and vocational training. 15,000 registered learners across 6 provinces.", stage: "Beta", techStack: ["Next.js", "Prisma", "AWS"], upvotes: 245, comments: 52, gradient: 'from-violet-50 to-rose-50', icon: "AL", founder: "Zanele N.", founderInitials: "ZN", teamSize: 6, launched: "Sep 2025", looking: ["Language Consultants", "NGO Partners"], threadComments: [{ id: 6001, author: "Naledi P.", initials: "NP", role: "Founder", content: "The low-bandwidth design is so important for reaching rural communities. Are the lessons available offline too?", time: "3d ago", upvotes: 18, likes: 12, replies: [{ id: 6002, author: "Zanele N.", initials: "ZN", role: "Founder", content: "Yes! Offline mode was our #1 feature request. Learners can download entire course modules over WiFi and complete them offline. Progress syncs when they reconnect.", time: "3d ago", upvotes: 13, likes: 9, replies: [] }] }] },
];

/* ─────────── Detail View ─────────── */
function ShowcaseDetail({ project, onBack }) {
  const [upvoted, setUpvoted]         = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(project.upvotes);

  return (
    <div style={{ maxWidth: 768, margin: '0 auto' }}>
      <button className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} /> Back to Showcases
      </button>

      <article className={styles.card} style={{ overflow: 'hidden' }}>
        {/* Gradient hero */}
        <div style={{ height: 176, display: 'flex', alignItems: 'center', justifyContent: 'center', background: gradients[project.gradient] || 'var(--input-background)' }}>
          <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16, background: 'var(--card-background)', fontSize: 22, fontWeight: 700, color: 'var(--foreground)', boxShadow: 'var(--shadow-md)' }}>
            {project.icon}
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)' }}>{project.name}</h1>
            <span className={`${styles.badge} ${stageBadgeClass[project.stage]}`}>{project.stage}</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20, fontSize: 13, color: 'var(--muted-foreground)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className={`${styles.avatar} ${styles.avatarSm}`}>{project.founderInitials}</div>
              <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>{project.founder}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} /> {project.teamSize} team members</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} /> {project.launched}</span>
          </div>

          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--foreground)', whiteSpace: 'pre-line', marginBottom: 20, opacity: 0.9 }}>
            {project.longDescription}
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: 8 }}>Tech Stack</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {project.techStack.map(tech => <span key={tech} className={styles.chip} style={{ padding: '6px 12px' }}>{tech}</span>)}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: 8 }}>Looking For</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {project.looking.map(role => <span key={role} className={`${styles.chip} ${styles.chipPrimary}`} style={{ padding: '6px 12px' }}>{role}</span>)}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => { setUpvoteCount(c => upvoted ? c-1 : c+1); setUpvoted(v=>!v); }}
                className={`${styles.upvoteBtn} ${upvoted ? styles.upvoteBtnActive : ''}`}
              >
                <ArrowBigUp size={20} /> <span>{upvoteCount}</span>
              </button>
              <span style={{ fontSize: 13, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={15} /> {project.comments} comments
              </span>
            </div>
            <button className={`${styles.btn} ${styles.btnPrimary}`}>
              <Handshake size={16} /> Request to Collaborate
            </button>
          </div>
        </div>
      </article>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--foreground)' }}>
          Discussion ({project.threadComments.length})
        </h2>
        <CommentThread comments={project.threadComments} />
      </div>
    </div>
  );
}

/* ─────────── Grid View ─────────── */
export function ShowcasesTab() {
  const [selected, setSelected]               = useState(null);
  const [upvotedProjects, setUpvotedProjects] = useState(new Set());
  const [upvoteCounts, setUpvoteCounts]       = useState(
    Object.fromEntries(showcases.map(s => [s.id, s.upvotes]))
  );

  if (selected) {
    return <ShowcaseDetail project={selected} onBack={() => setSelected(null)} />;
  }

  const handleUpvote = (e, id) => {
    e.stopPropagation();
    setUpvotedProjects(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setUpvoteCounts(prev => ({
      ...prev,
      [id]: upvotedProjects.has(id) ? prev[id] - 1 : prev[id] + 1,
    }));
  };

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
      {showcases.map(project => (
        <article
          key={project.id}
          className={styles.card}
          style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => setSelected(project)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(project); }}}
          aria-label={`View ${project.name} details`}
        >
          {/* Gradient preview */}
          <div style={{ height: 144, display: 'flex', alignItems: 'center', justifyContent: 'center', background: gradients[project.gradient] || 'var(--input-background)' }}>
            <div style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: 'var(--card-background)', fontSize: 18, fontWeight: 700, color: 'var(--foreground)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {project.icon}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{project.name}</h3>
              <span className={`${styles.badge} ${stageBadgeClass[project.stage]}`} style={{ fontSize: 10 }}>{project.stage}</span>
            </div>

            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.5, flex: 1, marginBottom: 16 }}>
              {project.description}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {project.techStack.map(tech => <span key={tech} className={styles.chip} style={{ fontSize: 11 }}>{tech}</span>)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={e => handleUpvote(e, project.id)}
                  className={`${styles.upvoteBtn} ${styles.upvoteBtnSm} ${upvotedProjects.has(project.id) ? styles.upvoteBtnActive : ''}`}
                  aria-label={`Upvote ${project.name}, count ${upvoteCounts[project.id]}`}
                >
                  <ArrowBigUp size={15} />
                  <span style={{ fontSize: 11 }}>{upvoteCounts[project.id]}</span>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted-foreground)' }}>
                  <MessageSquare size={13} />
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{project.comments}</span>
                </div>
              </div>
              <button
                className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                onClick={e => { e.stopPropagation(); setSelected(project); }}
              >
                <Handshake size={13} /> Collaborate
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
