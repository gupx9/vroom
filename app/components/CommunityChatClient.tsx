'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import UserProfileShowcase from '@/app/components/UserProfileShowcase';

type ReactionValue = -1 | 0 | 1;

type ChatUser = {
  id: string;
  username: string;
  reputation: number;
};

type ChatReply = {
  id: string;
  messageId: string;
  authorId: string;
  author: ChatUser;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  likes: number;
  dislikes: number;
  viewerReaction: ReactionValue;
};

type ChatMessage = {
  id: string;
  authorId: string;
  author: ChatUser;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  likes: number;
  dislikes: number;
  viewerReaction: ReactionValue;
  replies: ChatReply[];
};

type CommunityPayload = {
  currentUserId: string;
  messages: ChatMessage[];
};

type ProfileModalData = {
  id: string;
  username: string;
  reputation: number;
  createdAt: string;
  cars: Array<{
    id: string;
    imageData: string | null;
    brand: string;
    carModel: string;
    size: string;
    condition: string;
    forSale: boolean;
    forTrade: boolean;
    sellingPrice: number;
  }>;
  dioramas: Array<{
    id: string;
    imageData: string | null;
    description: string;
    forSale: boolean;
    forTrade: boolean;
    sellingPrice: number;
  }>;
};

type ProfileModalPayload = {
  profile: ProfileModalData;
  currentUserId: string;
  existingReview: { stars: number; status: string } | null;
  existingReport: { status: string } | null;
};

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleString();
}

function VoteButtons({
  likes,
  dislikes,
  viewerReaction,
  onVote,
  disabled,
}: {
  likes: number;
  dislikes: number;
  viewerReaction: ReactionValue;
  onVote: (value: 1 | -1) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onVote(1)}
        disabled={disabled}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          viewerReaction === 1
            ? 'border-green-600/60 bg-green-900/40 text-green-300'
            : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
        }`}
      >
        ▲ {likes}
      </button>
      <button
        type="button"
        onClick={() => onVote(-1)}
        disabled={disabled}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          viewerReaction === -1
            ? 'border-red-700/60 bg-red-950/40 text-red-300'
            : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
        }`}
      >
        ▼ {dislikes}
      </button>
    </div>
  );
}

function UserBadge({ username, onClick }: { username: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-zinc-300 hover:text-red-400 transition-colors font-medium"
    >
      @{username}
    </button>
  );
}

export default function CommunityChatClient() {
  const [currentUserId, setCurrentUserId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [posting, setPosting] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const [replyTextByMessage, setReplyTextByMessage] = useState<Record<string, string>>({});
  const [replyingMessageId, setReplyingMessageId] = useState('');
  const [openRepliesFor, setOpenRepliesFor] = useState<Record<string, boolean>>({});
  const [deletingTarget, setDeletingTarget] = useState('');

  const [activeProfileUsername, setActiveProfileUsername] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileModalPayload | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/community/messages', { cache: 'no-store' });
      const payload = (await response.json()) as CommunityPayload & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load community chat');
      }

      setCurrentUserId(payload.currentUserId);
      setMessages(payload.messages);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load community chat');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const submitMessage = useCallback(async () => {
    const content = newMessage.trim();
    if (!content) return;

    setPosting(true);
    setError('');

    try {
      const response = await fetch('/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send message');
      }

      setNewMessage('');
      await loadMessages();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to send message');
    } finally {
      setPosting(false);
    }
  }, [loadMessages, newMessage]);

  const voteMessage = useCallback(
    async (messageId: string, value: 1 | -1) => {
      const response = await fetch(`/api/community/messages/${messageId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to apply vote');
      }

      await loadMessages();
    },
    [loadMessages],
  );

  const voteReply = useCallback(
    async (replyId: string, value: 1 | -1) => {
      const response = await fetch(`/api/community/replies/${replyId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to apply vote');
      }

      await loadMessages();
    },
    [loadMessages],
  );

  const submitReply = useCallback(
    async (messageId: string) => {
      const content = (replyTextByMessage[messageId] || '').trim();
      if (!content) return;

      setReplyingMessageId(messageId);
      setError('');

      try {
        const response = await fetch(`/api/community/messages/${messageId}/replies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to send reply');
        }

        setReplyTextByMessage((prev) => ({ ...prev, [messageId]: '' }));
        setOpenRepliesFor((prev) => ({ ...prev, [messageId]: true }));
        await loadMessages();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Failed to send reply');
      } finally {
        setReplyingMessageId('');
      }
    },
    [loadMessages, replyTextByMessage],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      setDeletingTarget(messageId);
      setError('');

      try {
        const response = await fetch(`/api/community/messages/${messageId}`, { method: 'DELETE' });
        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to delete message');
        }

        await loadMessages();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Failed to delete message');
      } finally {
        setDeletingTarget('');
      }
    },
    [loadMessages],
  );

  const deleteReply = useCallback(
    async (replyId: string) => {
      setDeletingTarget(replyId);
      setError('');

      try {
        const response = await fetch(`/api/community/replies/${replyId}`, { method: 'DELETE' });
        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to delete reply');
        }

        await loadMessages();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Failed to delete reply');
      } finally {
        setDeletingTarget('');
      }
    },
    [loadMessages],
  );

  const openProfile = useCallback(async (username: string) => {
    setActiveProfileUsername(username);
    setProfileLoading(true);
    setProfileError('');
    setProfileData(null);

    try {
      const response = await fetch(`/api/community/users/${username}`, { cache: 'no-store' });
      const payload = (await response.json()) as ProfileModalPayload & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load user profile');
      }

      setProfileData(payload);
    } catch (caught) {
      setProfileError(caught instanceof Error ? caught.message : 'Failed to load user profile');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const closeProfile = useCallback(() => {
    setActiveProfileUsername(null);
    setProfileData(null);
    setProfileError('');
  }, []);

  const expandedReplyCount = useMemo(
    () => messages.reduce((acc, message) => acc + (openRepliesFor[message.id] ? message.replies.length : 0), 0),
    [messages, openRepliesFor],
  );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Post to everyone</p>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          maxLength={1200}
          rows={3}
          placeholder="Share updates, ask questions, trade talk..."
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 resize-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">{newMessage.length}/1200</p>
          <button
            type="button"
            onClick={() => void submitMessage()}
            disabled={posting || !newMessage.trim()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {posting ? 'Posting...' : 'Post Message'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Live discussion</p>
          <div className="flex items-center gap-3 text-xs text-zinc-600">
            <span>{messages.length} messages</span>
            <span>{expandedReplyCount} visible replies</span>
          </div>
        </div>

        {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

        {loading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6 text-center text-sm text-zinc-500">
            Loading community chat...
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-8 text-center">
            <p className="text-zinc-500">No messages yet. Be the first to say hi.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwnMessage = currentUserId === message.authorId;
              const repliesOpen = openRepliesFor[message.id] ?? false;
              const replyText = replyTextByMessage[message.id] ?? '';

              return (
                <article key={message.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <UserBadge username={message.author.username} onClick={() => void openProfile(message.author.username)} />
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-500">{formatDate(message.createdAt)}</span>
                        {message.updatedAt !== message.createdAt && !message.isDeleted && (
                          <span className="text-[10px] uppercase tracking-wider text-zinc-600">edited</span>
                        )}
                      </div>
                      <p className={`mt-2 text-sm ${message.isDeleted ? 'italic text-zinc-600' : 'text-zinc-200'}`}>
                        {message.isDeleted ? 'This message was deleted.' : message.content}
                      </p>
                    </div>

                    {isOwnMessage && !message.isDeleted && (
                      <button
                        type="button"
                        onClick={() => void deleteMessage(message.id)}
                        disabled={deletingTarget === message.id}
                        className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-500 transition-colors hover:border-red-800/70 hover:bg-red-950/30 hover:text-red-300 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <VoteButtons
                      likes={message.likes}
                      dislikes={message.dislikes}
                      viewerReaction={message.viewerReaction}
                      onVote={(value) => {
                        void voteMessage(message.id, value).catch((caught) => {
                          setError(caught instanceof Error ? caught.message : 'Failed to apply vote');
                        });
                      }}
                      disabled={message.isDeleted}
                    />
                    <button
                      type="button"
                      onClick={() => setOpenRepliesFor((prev) => ({ ...prev, [message.id]: !repliesOpen }))}
                      className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      {repliesOpen ? 'Hide replies' : `Replies (${message.replies.length})`}
                    </button>
                  </div>

                  {!message.isDeleted && (
                    <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-2">
                      <textarea
                        value={replyText}
                        onChange={(e) =>
                          setReplyTextByMessage((prev) => ({ ...prev, [message.id]: e.target.value }))
                        }
                        rows={2}
                        maxLength={800}
                        placeholder="Write a reply..."
                        className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 resize-none"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-[10px] text-zinc-600">{replyText.length}/800</p>
                        <button
                          type="button"
                          onClick={() => void submitReply(message.id)}
                          disabled={replyingMessageId === message.id || !replyText.trim()}
                          className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {replyingMessageId === message.id ? 'Replying...' : 'Reply'}
                        </button>
                      </div>
                    </div>
                  )}

                  {repliesOpen && (
                    <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
                      {message.replies.length === 0 ? (
                        <p className="text-xs text-zinc-600">No replies yet.</p>
                      ) : (
                        message.replies.map((reply) => {
                          const isOwnReply = currentUserId === reply.authorId;

                          return (
                            <div key={reply.id} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <UserBadge
                                      username={reply.author.username}
                                      onClick={() => void openProfile(reply.author.username)}
                                    />
                                    <span className="text-zinc-600">·</span>
                                    <span className="text-zinc-500">{formatDate(reply.createdAt)}</span>
                                    {reply.updatedAt !== reply.createdAt && !reply.isDeleted && (
                                      <span className="text-[10px] uppercase tracking-wider text-zinc-600">edited</span>
                                    )}
                                  </div>
                                  <p className={`mt-1 text-xs ${reply.isDeleted ? 'italic text-zinc-600' : 'text-zinc-300'}`}>
                                    {reply.isDeleted ? 'This reply was deleted.' : reply.content}
                                  </p>
                                </div>

                                {isOwnReply && !reply.isDeleted && (
                                  <button
                                    type="button"
                                    onClick={() => void deleteReply(reply.id)}
                                    disabled={deletingTarget === reply.id}
                                    className="rounded-md border border-zinc-700 px-2 py-1 text-[10px] text-zinc-500 transition-colors hover:border-red-800/70 hover:bg-red-950/30 hover:text-red-300 disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>

                              <div className="mt-2">
                                <VoteButtons
                                  likes={reply.likes}
                                  dislikes={reply.dislikes}
                                  viewerReaction={reply.viewerReaction}
                                  onVote={(value) => {
                                    void voteReply(reply.id, value).catch((caught) => {
                                      setError(caught instanceof Error ? caught.message : 'Failed to apply vote');
                                    });
                                  }}
                                  disabled={reply.isDeleted}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {activeProfileUsername && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 pt-32">
          <div className="flex h-[calc(100dvh-11rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            <div className="shrink-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-5 py-4">
              <h2 className="text-lg font-bold text-white">User Profile</h2>
              <button
                type="button"
                onClick={closeProfile}
                className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {profileLoading && <p className="text-sm text-zinc-500">Loading profile...</p>}
              {profileError && <p className="text-sm text-red-400">{profileError}</p>}

              {profileData && (
                <UserProfileShowcase
                  profile={profileData.profile}
                  currentUserId={profileData.currentUserId}
                  existingReview={profileData.existingReview ?? null}
                  existingReport={profileData.existingReport ?? null}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
