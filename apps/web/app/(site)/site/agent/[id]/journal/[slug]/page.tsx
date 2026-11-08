import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { AgentSiteData, Post } from '../../../../../../../components/agent-site/types';
import { PostView } from '../../../../../../../components/agent-site/PostView';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const body = await res.json();
    return (body?.data ?? body) as T;
  } catch {
    return null;
  }
}

type Params = { params: Promise<{ id: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id, slug } = await params;
  const [post, site] = await Promise.all([
    get<Post>(`/agent-site/${encodeURIComponent(id)}/posts/${encodeURIComponent(slug)}`),
    get<AgentSiteData>(`/agent-site/${encodeURIComponent(id)}`),
  ]);
  if (!post || !site) return { title: 'Not found' };
  const description = post.excerpt ?? post.body.slice(0, 160);
  return {
    title: `${post.title} — ${site.agent.displayName}`,
    description,
    openGraph: { title: post.title, description, ...(post.coverUrl && { images: [post.coverUrl] }) },
  };
}

/** One journal post on an agent website (see proxy.ts for /journal/<slug> on agent hosts). */
export default async function AgentPostPage({ params }: Params) {
  const { id, slug } = await params;
  const [post, site] = await Promise.all([
    get<Post>(`/agent-site/${encodeURIComponent(id)}/posts/${encodeURIComponent(slug)}`),
    get<AgentSiteData>(`/agent-site/${encodeURIComponent(id)}`),
  ]);
  if (!post || !site) notFound();
  return <PostView post={post} site={site} />;
}
