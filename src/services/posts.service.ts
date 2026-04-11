import { POSTS } from '../data/posts';

export interface Post {
  id: number;
  slug: string;
  variant: 'hero' | 'blueprint' | 'minimal';
  author: {
    name: string;
    avatar?: string;
    initials?: string;
    meta: string;
  };
  title: string | [string, string];
  titleHighlight?: boolean;
  excerpt: string;
  content: string;
  image?: string;
  stats?: {
    views: string;
    comments: number;
  };
  tags?: {
    label: string;
    style: 'gold' | 'muted';
  }[];
}

export const getAllPosts = (): Post[] => {
  return POSTS as any as Post[];
};

export const getPostBySlug = (slug: string): Post | undefined => {
  return (POSTS as any as Post[]).find(post => post.slug === slug);
};

export const getLatestPosts = (count: number = 3): Post[] => {
  return [...(POSTS as any as Post[])].reverse().slice(0, count);
};
