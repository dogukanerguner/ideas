export type Repo = {
  /** lowercase "owner/name" */
  id: string;
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string;
  homepage: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  license: string | null;
  topics: string[];
  createdAt: string;
  pushedAt: string;
  archived: boolean;
  avatar: string;
  /** cleaned README excerpt */
  readme: string;
  /** primary category slug */
  category: string;
  /** primary + secondary categories */
  categories: string[];
  tags: string[];
  /** curator's personal note */
  note?: string;
  /** category was set by hand and must survive refreshes */
  manualCategory?: boolean;
  addedAt: string;
  updatedAt: string;
};

/** Compact shape shipped to the browser for instant search. */
export type Doc = {
  id: string;
  fullName: string;
  owner: string;
  name: string;
  description: string;
  stars: number;
  language: string | null;
  category: string;
  categories: string[];
  tags: string[];
  topics: string[];
  vibe: number;
  avatar: string;
  addedAt: string;
  /** README excerpt — server-side search only, stripped from browser payloads */
  readme?: string;
};

export type Category = {
  slug: string;
  name: string;
  short: string;
  blurb: string;
  useWhen: string;
  color: string;
  glyph: string;
  keywords: Record<string, number>;
};
