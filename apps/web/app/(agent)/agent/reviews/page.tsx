'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageSquare } from 'lucide-react';
import { agentsApi } from '../../../../lib/api/agents';
import { StarRating } from '../../../../components/directory/StarRating';

/** What clients have said, read-only — an agent cannot edit their own reviews. */
export default function AgentReviews() {
  const { data: me } = useQuery({ queryKey: ['agent', 'me'], queryFn: () => agentsApi.me() });

  const { data, isLoading } = useQuery({
    queryKey: ['agent', 'my-reviews', me?.id],
    queryFn: () => agentsApi.reviews(me!.id, { limit: 50 }),
    enabled: !!me?.id,
  });

  const reviews = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Reviews</h1>
        <p className="text-[14px] text-[#5f6368]">
          Ratings decide where you appear in the agent directory.
        </p>
      </div>

      <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
        <div className="flex items-center gap-4">
          <span className="text-[34px] font-normal text-[#202124]">
            {me?.ratingCount ? me.ratingAverage.toFixed(1) : '—'}
          </span>
          <div>
            <StarRating value={me?.ratingAverage ?? 0} count={me?.ratingCount} size={16} />
            <p className="mt-0.5 text-[13px] text-[#5f6368]">
              {me?.ratingCount
                ? `From ${me.ratingCount} ${me.ratingCount === 1 ? 'client' : 'clients'}`
                : 'No reviews yet — clients can review you after you have worked together.'}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-14">
          <Loader2 size={22} className="animate-spin text-[#80868b]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-[#dadce0] bg-white py-14 text-center">
          <MessageSquare size={26} className="text-[#dadce0]" />
          <p className="max-w-sm text-[15px] text-[#5f6368]">
            Nothing yet. Only clients who have actually dealt with you can leave a
            review, so these are worth having.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#f1f3f4] rounded-3xl border border-[#dadce0] bg-white px-6">
          {reviews.map((r) => (
            <li key={r.id} className="py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-medium text-[#202124]">{r.author.firstName}</span>
                <span className="text-[13px] text-[#80868b]">
                  {new Date(r.createdAt).toLocaleDateString('en-KE', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>
              <div className="mt-1"><StarRating value={r.rating} size={13} /></div>
              {r.comment && (
                <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-[#5f6368]">
                  {r.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
