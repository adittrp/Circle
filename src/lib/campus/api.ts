import { createClient } from "@/lib/supabase/client";
import type {
  Community,
  CommunityKind,
  Notification,
  Post,
  PostComment,
  PostIntent,
  YearLevel,
} from "@/lib/supabase/database.types";

export type FeedSort = "hot" | "new" | "top";

export type PostWithMeta = Post & {
  author_name: string | null;
  author_avatar: string | null;
  community_name: string | null;
  community_slug: string | null;
  my_vote: number | null;
  saved: boolean;
};

export type CommunityWithMembership = Community & {
  member_count: number;
  is_member: boolean;
};

function hotScore(post: Pick<Post, "vote_score" | "comment_count" | "created_at">) {
  const ageHours =
    (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
  return post.vote_score * 2 + post.comment_count * 3 - ageHours * 0.35;
}

export function sortPosts(posts: PostWithMeta[], sort: FeedSort) {
  const copy = [...posts];
  if (sort === "new") {
    return copy.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
  if (sort === "top") {
    return copy.sort(
      (a, b) => b.vote_score - a.vote_score || b.comment_count - a.comment_count
    );
  }
  return copy.sort((a, b) => hotScore(b) - hotScore(a));
}

export async function syncMyCommunities() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("sync_my_communities");
  return { data, error: error?.message ?? null };
}

export async function listMyCommunities(profileId: string) {
  const supabase = createClient();
  const { data: memberships, error } = await supabase
    .from("community_members")
    .select("community_id, joined_at, communities(*)")
    .eq("profile_id", profileId)
    .order("joined_at", { ascending: false });
  if (error) return { data: [] as CommunityWithMembership[], error: error.message };

  const communities = (memberships ?? [])
    .map((row) => {
      const community = row.communities as Community | null;
      if (!community) return null;
      return {
        ...community,
        member_count: 0,
        is_member: true,
      } satisfies CommunityWithMembership;
    })
    .filter(Boolean) as CommunityWithMembership[];

  return { data: communities, error: null };
}

export async function listDiscoverableCommunities(kinds?: CommunityKind[]) {
  const supabase = createClient();
  let query = supabase
    .from("communities")
    .select("*")
    .eq("is_discoverable", true)
    .order("name");
  if (kinds?.length) query = query.in("kind", kinds);
  const { data, error } = await query;
  if (error) return { data: [] as Community[], error: error.message };
  return { data: data ?? [], error: null };
}

export async function getCommunityBySlug(slug: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return { data: data as Community | null, error: error?.message ?? null };
}

export async function joinCommunity(communityId: string, profileId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("community_members").insert({
    community_id: communityId,
    profile_id: profileId,
  });
  return { error: error?.message ?? null };
}

export async function leaveCommunity(communityId: string, profileId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("profile_id", profileId);
  return { error: error?.message ?? null };
}

export async function isMember(communityId: string, profileId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("community_id", communityId)
    .eq("profile_id", profileId)
    .maybeSingle();
  return Boolean(data);
}

async function hydratePosts(
  posts: Post[],
  profileId: string | null
): Promise<PostWithMeta[]> {
  if (!posts.length) return [];
  const supabase = createClient();
  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const communityIds = [
    ...new Set(posts.map((p) => p.community_id).filter(Boolean)),
  ] as string[];
  const postIds = posts.map((p) => p.id);

  const [authorsRes, communitiesRes, votesRes, savesRes] = await Promise.all([
    supabase
      .from("student_directory")
      .select("id, first_name, avatar_url")
      .in("id", authorIds),
    communityIds.length
      ? supabase.from("communities").select("id, name, slug").in("id", communityIds)
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
    profileId
      ? supabase
          .from("post_votes")
          .select("post_id, value")
          .eq("profile_id", profileId)
          .in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string; value: number }[] }),
    profileId
      ? supabase
          .from("post_saves")
          .select("post_id")
          .eq("profile_id", profileId)
          .in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const authors = new Map(
    (authorsRes.data ?? []).map((a) => [a.id, a] as const)
  );
  const communities = new Map(
    (communitiesRes.data ?? []).map((c) => [c.id, c] as const)
  );
  const votes = new Map(
    (votesRes.data ?? []).map((v) => [v.post_id, v.value] as const)
  );
  const saves = new Set((savesRes.data ?? []).map((s) => s.post_id));

  return posts.map((post) => {
    const author = authors.get(post.author_id);
    const community = post.community_id
      ? communities.get(post.community_id)
      : null;
    return {
      ...post,
      author_name: author?.first_name ?? null,
      author_avatar: author?.avatar_url ?? null,
      community_name: community?.name ?? null,
      community_slug: community?.slug ?? null,
      my_vote: votes.get(post.id) ?? null,
      saved: saves.has(post.id),
    };
  });
}

export async function listCampusPosts(options: {
  profileId: string;
  communityId?: string;
  communityIds?: string[];
  sort?: FeedSort;
  limit?: number;
  lookingForPeople?: boolean;
  planIdeas?: boolean;
}) {
  const supabase = createClient();
  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 40);

  if (options.communityId) query = query.eq("community_id", options.communityId);
  if (options.communityIds?.length) {
    query = query.in("community_id", options.communityIds);
  }
  if (options.lookingForPeople) query = query.eq("intent", "looking_for_people");
  if (options.planIdeas) query = query.eq("intent", "plan_idea");

  const { data, error } = await query;
  if (error) return { data: [] as PostWithMeta[], error: error.message };
  const hydrated = await hydratePosts(data ?? [], options.profileId);
  return {
    data: sortPosts(hydrated, options.sort ?? "hot"),
    error: null,
  };
}

export function communityHandle(community: Pick<Community, "slug" | "name">) {
  return `c/${community.slug}`;
}

export function communityAccent(kind: CommunityKind) {
  switch (kind) {
    case "campus":
      return "#00B84D";
    case "major":
      return "#0d9488";
    case "residence":
      return "#ea580c";
    case "year":
      return "#2563eb";
    case "interest":
      return "#7c3aed";
    case "class":
      return "#db2777";
    case "custom":
      return "#475569";
    default:
      return "#00B84D";
  }
}

export async function getPost(postId: string, profileId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();
  if (error || !data) return { data: null, error: error?.message ?? "Not found" };
  const [hydrated] = await hydratePosts([data], profileId);
  return { data: hydrated, error: null };
}

export async function createPost(input: {
  authorId: string;
  universityId: string;
  communityId: string;
  body: string;
  title?: string;
  category?: string;
  intent?: PostIntent | null;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: input.authorId,
      university_id: input.universityId,
      community_id: input.communityId,
      body: input.body.trim(),
      title: input.title?.trim() || null,
      category: input.category?.trim() || null,
      intent: input.intent ?? null,
    })
    .select("*")
    .single();
  return { data: data as Post | null, error: error?.message ?? null };
}

export async function listComments(postId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) return { data: [] as (PostComment & { author_name: string | null })[], error: error.message };

  const authorIds = [...new Set((data ?? []).map((c) => c.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase
        .from("student_directory")
        .select("id, first_name")
        .in("id", authorIds)
    : { data: [] as { id: string; first_name: string | null }[] };
  const map = new Map((authors ?? []).map((a) => [a.id, a.first_name]));
  return {
    data: (data ?? []).map((c) => ({
      ...c,
      author_name: map.get(c.author_id) ?? null,
    })),
    error: null,
  };
}

export async function addComment(input: {
  postId: string;
  authorId: string;
  body: string;
  parentId?: string | null;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: input.postId,
      author_id: input.authorId,
      body: input.body.trim(),
      parent_id: input.parentId ?? null,
    })
    .select("*")
    .single();
  return { data, error: error?.message ?? null };
}

export async function setVote(postId: string, profileId: string, value: 1 | -1 | 0) {
  const supabase = createClient();
  if (value === 0) {
    const { error } = await supabase
      .from("post_votes")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", profileId);
    return { error: error?.message ?? null };
  }
  const { error } = await supabase.from("post_votes").upsert({
    post_id: postId,
    profile_id: profileId,
    value,
  });
  return { error: error?.message ?? null };
}

export async function toggleSave(postId: string, profileId: string, saved: boolean) {
  const supabase = createClient();
  if (saved) {
    const { error } = await supabase
      .from("post_saves")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", profileId);
    return { error: error?.message ?? null };
  }
  const { error } = await supabase.from("post_saves").insert({
    post_id: postId,
    profile_id: profileId,
  });
  return { error: error?.message ?? null };
}

export async function createPlanFromPost(postId: string, title?: string, location?: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_plan_from_post", {
    p_post_id: postId,
    p_title: title ?? undefined,
    p_location_label: location ?? undefined,
  });
  return { data, error: error?.message ?? null };
}

export async function createCircleFromPost(postId: string, title?: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_circle_from_post", {
    p_post_id: postId,
    p_title: title ?? undefined,
  });
  return { data, error: error?.message ?? null };
}

export async function createCampusGroup(input: {
  name: string;
  description?: string;
  rules?: string;
  isDiscoverable?: boolean;
  memberLimit?: number | null;
  interestId?: string | null;
  constraintYear?: YearLevel | null;
  constraintMajorId?: string | null;
  constraintResidenceHallId?: string | null;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_campus_group", {
    p_name: input.name,
    p_description: input.description ?? undefined,
    p_rules: input.rules ?? undefined,
    p_is_discoverable: input.isDiscoverable ?? true,
    p_member_limit: input.memberLimit ?? undefined,
    p_interest_id: input.interestId ?? undefined,
    p_constraint_year: input.constraintYear ?? undefined,
    p_constraint_major_id: input.constraintMajorId ?? undefined,
    p_constraint_residence_hall_id: input.constraintResidenceHallId ?? undefined,
  });
  return { data: data as string | null, error: error?.message ?? null };
}

export async function campusSearch(query: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("campus_search", {
    p_query: query,
    p_limit: 8,
  });
  return { data, error: error?.message ?? null };
}

export async function listNotifications(profileId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", profileId)
    .order("created_at", { ascending: false })
    .limit(30);
  return { data: (data ?? []) as Notification[], error: error?.message ?? null };
}

export async function markNotificationRead(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function reportPost(input: {
  reporterId: string;
  postId: string;
  reason: string;
}) {
  const supabase = createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: input.reporterId,
    post_id: input.postId,
    reason: input.reason,
    category: "other",
  });
  return { error: error?.message ?? null };
}

export function kindLabel(kind: CommunityKind) {
  switch (kind) {
    case "campus":
      return "University";
    case "major":
      return "Major";
    case "residence":
      return "Residence";
    case "interest":
      return "Interest";
    case "year":
      return "Year";
    case "class":
      return "Class";
    case "custom":
      return "Group";
    default:
      return kind;
  }
}
