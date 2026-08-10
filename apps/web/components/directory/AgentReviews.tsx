'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MessageSquare, Star } from 'lucide-react';
import { agentsApi } from '../../lib/api/agents';
import { useAuthStore } from '../../lib/stores/auth.store';
import { ApiError } from '../../lib/api/client';
import { DirectoryCard } from './DirectoryPrimitives';
import { StarRating } from './StarRating';
import { cn } from '../../lib/utils';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function AgentReviews({ agentId }: { agentId: string }) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading } = useQuery({
    queryKey: ['agent-reviews', agentId],
    queryFn: () => agentsApi.reviews(agentId, { limit: 20 }),
  });

  // Only asked once signed in — the endpoint requires auth, and an anonymous
  // visitor has nothing to act on either way.
  const { data: eligibility } = useQuery({
    queryKey: ['agent-review-eligibility', agentId],
    queryFn: () => agentsApi.reviewEligibility(agentId),
    enabled: isAuthenticated,
    retry: false,
  });

  const reviews = data?.data ?? [];

  return (
    <DirectoryCard className="p-6">
      <h2 className="mb-4 text-[18px] font-semibold text-[#111112]">
        Reviews{data?.meta.total ? ` (${data.meta.total})` : ''}
      </h2>

      {isAuthenticated && (
        <ReviewForm
          agentId={agentId}
          allowed={eligibility?.allowed ?? false}
          reason={eligibility?.reason}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['agent-reviews', agentId] });
            queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
          }}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-[#8a8a90]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <MessageSquare size={24} className="text-[#c4c4c8]" />
          <p className="text-[14px] text-[#6b6b70]">
            No reviews yet. Clients who have worked with this agent can leave one.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-black/[0.06]">
          {reviews.map((r) => (
            <li key={r.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-medium text-[#111112]">
                  {r.author.firstName}
                </span>
                <span className="text-[13px] text-[#8a8a90]">{formatDate(r.createdAt)}</span>
              </div>
              <div className="mt-1">
                <StarRating value={r.rating} size={13} />
              </div>
              {r.comment && (
                <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-[#6b6b70]">
                  {r.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </DirectoryCard>
  );
}

/**
 * The form is shown to any signed-in user but only enabled once they have
 * actually dealt with the agent. Explaining the requirement is more useful
 * than hiding the form and leaving people wondering why they cannot review.
 */
function ReviewForm({
  agentId,
  allowed,
  reason,
  onSaved,
}: {
  agentId: string;
  allowed: boolean;
  reason?: string;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = useMutation({
    mutationFn: () => agentsApi.submitReview(agentId, rating, comment.trim() || undefined),
    onSuccess: () => {
      setDone(true);
      setError('');
      onSaved();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not save your review'),
  });

  if (done) {
    return (
      <p className="mb-5 rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">
        Thanks — your review has been saved.
      </p>
    );
  }

  if (!allowed) {
    return (
      <p className="mb-5 rounded-2xl bg-[#f5f5f6] px-4 py-3 text-[14px] text-[#6b6b70]">
        {reason ?? 'You cannot review this agent yet.'}
      </p>
    );
  }

  const shown = hover || rating;

  return (
    <div className="mb-5 rounded-2xl border border-black/[0.06] bg-[#f8f9fa] p-4">
      <p className="mb-2 text-[14px] font-medium text-[#111112]">Rate this agent</p>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className="cursor-pointer p-0.5"
          >
            <Star
              size={22}
              className={cn(
                'transition-colors',
                n <= shown ? 'fill-[#f5b544] text-[#f5b544]' : 'text-[#dadce0]',
              )}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="What was working with them like? (optional)"
        className="mt-3 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-[14px] text-[#111112] placeholder:text-[#8a8a90] outline-none focus:border-[#4A80F5]"
      />

      {error && <p className="mt-2 text-[13px] text-[#c5221f]">{error}</p>}

      <button
        onClick={() => submit.mutate()}
        disabled={rating === 0 || submit.isPending}
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#111112] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#2a2a2c] cursor-pointer disabled:opacity-40"
      >
        {submit.isPending && <Loader2 size={14} className="animate-spin" />}
        Submit review
      </button>
    </div>
  );
}
