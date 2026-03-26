import type { ProfileData } from '../types';

export const parseProfileText = {
  parseCount(text: string): number {
    const cleaned = text.replace(/,/g, '').trim();
    if (cleaned.endsWith('K') || cleaned.endsWith('k')) {
      return Math.round(parseFloat(cleaned.slice(0, -1)) * 1000);
    }
    if (cleaned.endsWith('M') || cleaned.endsWith('m')) {
      return Math.round(parseFloat(cleaned.slice(0, -1)) * 1000000);
    }
    return parseInt(cleaned) || 0;
  },
};

export function buildProfileData(
  handle: string,
  displayName: string | null,
  bio: string | null,
  profilePicUrl: string | null,
  followerText: string,
  followingText: string,
  postText: string,
  websiteUrl: string | null,
): ProfileData {
  return {
    instagram_handle: handle.startsWith('@') ? handle : `@${handle}`,
    display_name: displayName,
    bio,
    profile_pic_url: profilePicUrl,
    follower_count: parseProfileText.parseCount(followerText),
    following_count: parseProfileText.parseCount(followingText),
    post_count: parseProfileText.parseCount(postText),
    website_url: websiteUrl,
  };
}
