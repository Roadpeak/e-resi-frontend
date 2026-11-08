import { PropertyBaseProvider } from '../../../../components/dashboard/PropertyBase';

/**
 * Agents managing developments they list themselves. The pages are the same
 * ones developers use (one implementation, one set of fixes); this provider
 * keeps every link inside /agent/listings.
 */
export default function AgentListingsLayout({ children }: { children: React.ReactNode }) {
  return <PropertyBaseProvider base="/agent/listings">{children}</PropertyBaseProvider>;
}
