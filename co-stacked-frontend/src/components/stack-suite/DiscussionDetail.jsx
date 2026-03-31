// src/components/stack-suite/DiscussionDetail.jsx

import { useState } from 'react';
import { ArrowLeft, Eye, Pin, Loader2, ArrowBigUp, MessageSquare, Bookmark, Share2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getStackPostById, getStackPosts, upvoteStackPost, deleteStackPost, getStackComments } from '../../api/stackSuiteApi';
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

export function DiscussionDetail({ discussionId, onBack }) {
  const queryClient = useQueryClient();
  const [bookmarked, setBookmarked] = useState(false);
  
  const currentUser = useSelector((state) => state.auth.user);

  // Fetch single post
  const { data: discussion, isLoading } = useQuery({
    queryKey: ['stackPost', discussionId],
    queryFn: () => getStackPostById(discussionId),
  });

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['stackComments', 'post', discussionId],
    queryFn: () => getStackComments('post', discussionId),
    enabled: !!discussionId,
  });

  const upvoteMutation = useMutation({
    mutationFn: (id) => upvoteStackPost(id),
    onSuccess: (res, id) => {
      queryClient.setQueryData(['stackPost', id], prev => ({
        ...prev,
        upvoteCount: res.upvoteCount,
        isUpvoted: res.isUpvoted
      }));
      queryClient.invalidateQueries(['stackPosts']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteStackPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['stackPosts']);
      onBack();
    },
    onError: (err) => {
      alert(`Failed to delete post: ${err.response?.data?.message || err.message}`);
    }
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      deleteMutation.mutate(discussionId);
    }
  };

  if (isLoading || !discussion) {
    return (
      <div className="flex justify-center py-20 text-slate-400">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  const initials = discussion.author?.name ? discussion.author.name.slice(0, 2).toUpperCase() : 'U';
  const isAuthor = currentUser && (currentUser._id === (discussion.author?._id || discussion.author) || currentUser.id === (discussion.author?._id || discussion.author));

  return (
    <div className="max-w-3xl mx-auto">
      <button className="flex items-center gap-2 mb-6 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors" onClick={onBack}>
        <ArrowLeft size={16} /> Back to List
      </button>

      <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${categoryBadgeClass[discussion.category] || styles.badgeGeneral}`}>
            {discussion.category}
          </span>
          {discussion.pinned && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[10px] font-bold uppercase">
              <Pin size={10} /> Pinned
            </span>
          )}
          <span className="text-xs text-slate-400">{discussion.time}</span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Eye size={12} /> {discussion.viewCount || 0} views
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white leading-tight">
          {discussion.title}
        </h1>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold overflow-hidden">
            {discussion.author?.avatarUrl ? (
              <img src={discussion.author.avatarUrl} alt={discussion.author.name} />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{discussion.author?.name || 'Unknown User'}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${roleBadgeClass[discussion.author?.role] || styles.badgeDeveloper}`}>
                {discussion.author?.role || 'Developer'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Posted {discussion.time}</p>
          </div>
          
          {isAuthor && (
            <button 
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
              className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {deleteMutation.isLoading ? <Loader2 size={12} className="animate-spin" /> : 'Delete Post'}
            </button>
          )}
        </div>

        <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line mb-8">
          {discussion.body}
        </div>

        {discussion.tags && discussion.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {discussion.tags.map(tag => (
              <span key={tag} className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">#{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => upvoteMutation.mutate(discussion._id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                discussion.isUpvoted 
                  ? 'bg-blue-50 border-blue-200 text-blue-600' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowBigUp size={20} />
              <span className="font-bold">{discussion.upvoteCount}</span>
            </button>
            <span className="flex items-center gap-2 text-sm text-slate-400">
              <MessageSquare size={16} /> {discussion.commentCount || 0} comments
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBookmarked(v=>!v)}
              className={`p-2 rounded-lg transition-colors ${bookmarked ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </article>

      <div className="mt-8">
        <h2 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">
          Comments ({discussion.commentCount || 0})
        </h2>
        {commentsLoading ? (
           <p className="text-sm text-slate-400">Loading comments...</p>
        ) : (
           <CommentThread 
             comments={comments} 
             parentType="post"
             parentId={discussion._id}
           />
        )}
      </div>
    </div>
  );
}
