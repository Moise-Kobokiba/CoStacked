// src/components/stack-suite/ValidationBoardTab.jsx

import { useState } from 'react';
import { 
  Search, PlusCircle, Lightbulb, TrendingUp, Users, Rocket, 
  MessageSquare, ThumbsUp, ChevronLeft, ChevronRight, Loader2,
  AlertCircle
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStackPosts } from '../../api/stackSuiteApi';
import { DiscussionDetail } from './DiscussionDetail';
import styles from './StackSuite.module.css';

const PHASE_COLORS = {
  Problem:  { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  Solution: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  MVP:      { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  General:  { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
};

export function ValidationBoardTab({ search: globalSearch }) {
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [localSearch, setLocalSearch] = useState('');
  const [selectedId, setSelectedId]   = useState(null);
  const queryClient = useQueryClient();

  const finalSearch = localSearch || globalSearch;

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['stackPosts', { category: 'Validation', search: finalSearch, phase: phaseFilter }],
    queryFn: () => getStackPosts({ category: 'Validation', search: finalSearch, phase: phaseFilter }),
  });

  const phases = [
    { id: 'all', label: 'All Ideas' },
    { id: 'Problem', label: 'Problem Validation' },
    { id: 'Solution', label: 'Solution Validation' },
    { id: 'MVP', label: 'MVP/Landing Page' },
  ];

  if (selectedId) {
    return <DiscussionDetail discussionId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">Validation Board</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Validate your ideas with the community and build something people want. Get feedback from experienced builders.</p>
        </div>
      </div>

      {/* Filter Tab Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <nav className="flex gap-8 whitespace-nowrap min-w-max">
            {phases.map(phase => (
              <button
                key={phase.id}
                onClick={() => setPhaseFilter(phase.id)}
                className={`pb-4 px-1 text-sm font-bold transition-colors border-b-2 ${
                  phaseFilter === phase.id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {phase.label}
              </button>
            ))}
          </nav>
          <div className="relative w-full md:w-72 mb-4 md:mb-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={14} />
            </div>
            <input 
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              placeholder="Search ideas..." 
              type="text"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid and Sidebar Container */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Ideas Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <Lightbulb size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-white">No ideas found</h3>
              <p className="text-slate-500">Try a different filter or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map(post => {
                const phaseInfo = PHASE_COLORS[post.phase] || PHASE_COLORS.General;
                return (
                  <div key={post._id} onClick={() => setSelectedId(post._id)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-xl hover:border-blue-500/30 transition-all group flex flex-col h-full cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${phaseInfo.bg} ${phaseInfo.text}`}>
                        {post.phase} Phase
                      </span>
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-bold text-blue-600 leading-none">{post.confidenceScore || 0}%</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Confidence</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors mb-2">
                      {post.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                      {post.body}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {post.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                          {post.author?.avatarUrl ? (
                            <img src={post.author.avatarUrl} alt={post.author.name} />
                          ) : (
                            post.author?.name?.slice(0, 2).toUpperCase() || '??'
                          )}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {post.author?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-400">
                        <div className="flex items-center gap-1">
                          <ThumbsUp size={14} />
                          <span className="text-xs font-bold">{post.upvoteCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare size={14} />
                          <span className="text-xs font-bold">{post.commentCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Placeholder */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Page 1 of 1</span>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 flex flex-col gap-6">
          {/* Community Stats */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Community Stats</h4>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">1,240</p>
                <p className="text-sm text-slate-500">Total Ideas Validated</p>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-3/4"></div>
              </div>
              <p className="text-xs text-slate-400">Join 5,000+ founders active this month.</p>
            </div>
          </div>

          {/* Validation Tips */}
          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-blue-600">
              <Lightbulb size={18} />
              <h4 className="text-xs font-bold uppercase tracking-widest">Validation Tips</h4>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">01</span>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">Define your ICP.</span> Be specific about who has the problem you're solving.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">02</span>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">Ask open questions.</span> Don't lead the witness. Let them tell you their pain points.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">03</span>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">Iterate quickly.</span> If people aren't excited, tweak the pitch and repost.
                </p>
              </li>
            </ul>
            <a className="mt-6 inline-block text-sm font-bold text-blue-600 hover:underline" href="#">Read full guide →</a>
          </div>

          {/* Top Contributors Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Top Contributors</h4>
            <div className="space-y-4">
              {[
                { name: 'Sarah G.', validations: 14, rank: 1 },
                { name: 'David L.', validations: 12, rank: 2 },
                { name: 'Marcus T.', validations: 10, rank: 3 },
              ].map(contributor => (
                <div key={contributor.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                      {contributor.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{contributor.name}</span>
                      <span className="text-xs text-slate-400">{contributor.validations} validations</span>
                    </div>
                  </div>
                  <span className="text-blue-600 text-xs font-bold">#{contributor.rank}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
