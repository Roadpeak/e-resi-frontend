'use client';

import { useQuery } from '@tanstack/react-query';
import { billingApi } from '../../lib/api/billing';
import { agentsApi } from '../../lib/api/agents';
import { LISTING_FEE_MONTHLY, fmtUsd } from '../../lib/onboarding/catalog';

/**
 * What one development's listing costs this owner, from the admin settings:
 * developer or agent (individual / agency), monthly or one-time, or free.
 */
export function useListingQuote(agent: boolean) {
  const { data: cfg } = useQuery({
    queryKey: ['listing-plans'],
    queryFn: () => billingApi.listingPlans(),
    staleTime: 5 * 60_000,
  });
  const { data: me } = useQuery({
    queryKey: ['agent-me'],
    queryFn: () => agentsApi.me(),
    enabled: agent,
    staleTime: 5 * 60_000,
  });

  if (!cfg) {
    return { free: false, oneTime: false, amount: LISTING_FEE_MONTHLY, price: `${fmtUsd(LISTING_FEE_MONTHLY)} / month`, short: `${fmtUsd(LISTING_FEE_MONTHLY)}/month` };
  }
  const company = me?.kind === 'COMPANY';
  const enabled = agent ? cfg.agent.enabled : cfg.developer.enabled;
  const plan = agent ? cfg.agent.plan : cfg.developer.plan;
  const amount = agent
    ? (plan === 'ONE_TIME' ? cfg.agent.oneTime : cfg.agent.monthly)[company ? 'company' : 'individual']
    : (plan === 'ONE_TIME' ? cfg.developer.oneTime : cfg.developer.monthly);
  const free = !enabled || amount <= 0;
  const oneTime = plan === 'ONE_TIME';
  return {
    free,
    oneTime,
    amount: free ? 0 : amount,
    price: free ? 'Free' : oneTime ? `${fmtUsd(amount)} one-time` : `${fmtUsd(amount)} / month`,
    short: free ? 'free' : oneTime ? `${fmtUsd(amount)} once` : `${fmtUsd(amount)}/month`,
  };
}
