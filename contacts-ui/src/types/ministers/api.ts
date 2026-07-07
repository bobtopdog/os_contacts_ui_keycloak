/* Mirrors the OpenAPI schemas. Hand-written rather than generated to keep
   the deps slim — they're small and stable. */

export type Department = {
  id: number;
  name: string;
};

export type PostHolder = {
  member_id: number;
  name_display_as: string | null;
  name_full_title: string | null;
  party_name: string | null;
  gender: string | null;
  start_date: string | null;
  end_date: string | null;
  laying_minister_name: string | null;
  is_current: boolean;
};

export type Post = {
  id: number;
  name: string;
  hansard_name: string | null;
  departments: Department[];
  post_holders: PostHolder[];
};

export type Contact = {
  type: string | null;
  phone: string | null;
  email: string | null;
  line1: string | null;
};

export type MemberPost = {
  post_id: number;
  post_name: string;
  hansard_name?: string | null;
  start_date: string | null;
  end_date: string | null;
  laying_minister_name?: string | null;
  is_current: boolean;
};

export type Member = {
  id: number;
  name_display_as: string | null;
  name_full_title: string | null;
  party_name: string | null;
  gender: string | null;
  posts_held: MemberPost[];
  contacts: Contact[];
};

export type DepartmentDetail = {
  id: number;
  name: string;
  posts: { id: number; name: string; hansard_name: string | null }[];
};

export type Paginated<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

export type Single<T> = { data: T };

