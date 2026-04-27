import type { CurrentUserBundle } from "@/lib/user-self-service";
import type { Locale } from "@/lib/locale";

import {
  formatDateTime,
  getMediaStatus,
  getStatusLabel,
  IdPreview,
  mapUserStatus,
  normalizeOptionalString,
  PassportPreview,
  type ReviewStatus,
  VideoPreview,
} from "../dashboard-shared-ui";
import { PhotoStackPreview } from "../dashboard-shared-photo-stack-preview";
import type {
  DashboardSharedCopy,
  DashboardSharedMyStateCopy,
} from "./dashboard-shared-my-state-copy";

export function createDashboardSharedMyViewModel({
  bundle,
  copy,
  locale,
  sharedCopy,
}: {
  bundle: CurrentUserBundle | null;
  copy: DashboardSharedMyStateCopy;
  locale: Locale;
  sharedCopy: DashboardSharedCopy;
}) {
  const authUser = bundle?.authUser ?? null;
  const mediaAssets: CurrentUserBundle["mediaAssets"] = bundle?.mediaAssets ?? [];
  const privacyData = bundle?.privacyData ?? null;
  const privacyRequests: CurrentUserBundle["privacyRequests"] =
    bundle?.privacyRequests ?? [];
  const profile = bundle?.profile ?? null;
  const vipMembership = bundle?.vipMembership ?? null;

  const approvedIdentityValue = normalizeOptionalString(privacyData?.id_card) ?? "";
  const approvedPassportValue = normalizeOptionalString(privacyData?.passport) ?? "";
  const pendingIdentityRequest = privacyRequests.find(
    (request) =>
      request.status === "pending" && normalizeOptionalString(request.id_card_requests),
  );
  const pendingPassportRequest = privacyRequests.find(
    (request) =>
      request.status === "pending" && normalizeOptionalString(request.passport_requests),
  );

  const identityStatus: ReviewStatus = pendingIdentityRequest
    ? "pending"
    : approvedIdentityValue
      ? "approved"
      : "empty";
  const passportStatus: ReviewStatus = pendingPassportRequest
    ? "pending"
    : approvedPassportValue
      ? "approved"
      : "empty";
  const identityValue =
    normalizeOptionalString(pendingIdentityRequest?.id_card_requests) ??
    approvedIdentityValue;
  const passportValue =
    normalizeOptionalString(pendingPassportRequest?.passport_requests) ??
    approvedPassportValue;

  const photoAssets = mediaAssets.filter((asset) => asset.kind === "image");
  const videoAssets = mediaAssets.filter((asset) => asset.kind === "video");
  const photoStatus = getMediaStatus(photoAssets);
  const videoStatus = getMediaStatus(videoAssets);
  const verificationStatus: ReviewStatus =
    identityStatus === "approved"
      ? "approved"
      : identityStatus === "pending"
        ? "pending"
        : "empty";
  const certified = verificationStatus === "approved";

  const displayName =
    normalizeOptionalString(profile?.name) ??
    normalizeOptionalString(authUser?.user_metadata?.name) ??
    normalizeOptionalString(authUser?.email?.split("@")[0]) ??
    copy.unnamedUser;
  const displayCity =
    normalizeOptionalString(profile?.city) ??
    normalizeOptionalString(authUser?.user_metadata?.city) ??
    copy.pendingCity;
  const displayPhone =
    normalizeOptionalString(profile?.phone) ??
    normalizeOptionalString(authUser?.user_metadata?.phone) ??
    normalizeOptionalString(authUser?.phone) ??
    copy.pendingValue;
  const displayEmail =
    normalizeOptionalString(profile?.email) ??
    normalizeOptionalString(authUser?.email) ??
    copy.pendingValue;
  const displayReferralCode =
    normalizeOptionalString(profile?.referral_code) ?? copy.pendingReferralCode;
  const displayLastLogin = formatDateTime(authUser?.last_sign_in_at, locale);
  const displayStatus = mapUserStatus(profile?.status, sharedCopy);
  const hasActiveVip =
    vipMembership?.status === "active" &&
    (!vipMembership.expires_at ||
      new Date(vipMembership.expires_at).getTime() > Date.now());
  const membershipLabel = hasActiveVip ? copy.vipMembership : copy.standardMembership;

  const assets = [
    {
      key: "identity" as const,
      title: copy.identityTitle,
      status: getStatusLabel("identity", identityStatus, sharedCopy),
      tone: identityStatus,
      body: <IdPreview />,
    },
    {
      key: "passport" as const,
      title: copy.passportTitle,
      status: getStatusLabel("passport", passportStatus, sharedCopy),
      tone: passportStatus,
      body: <PassportPreview />,
    },
    {
      key: "photos" as const,
      title: copy.photosTitle,
      status: getStatusLabel("photos", photoStatus, sharedCopy),
      tone: photoStatus,
      body: (
        <PhotoStackPreview
          assets={photoAssets}
          footerLabel={
            photoAssets.length
              ? copy.photoCountLabel(photoAssets.length)
              : copy.uploadPhotosPrompt
          }
        />
      ),
    },
    {
      key: "videos" as const,
      title: copy.videosTitle,
      status: getStatusLabel("videos", videoStatus, sharedCopy),
      tone: videoStatus,
      body: <VideoPreview count={videoAssets.length} title={videoAssets[0]?.original_name} />,
    },
  ];

  const profileStats = [
    { label: copy.phoneLabel, value: displayPhone },
    { label: copy.emailLabel, value: displayEmail },
    { label: copy.passwordLabel, value: copy.passwordValue, mono: true },
    { label: copy.inviteCodeLabel, value: displayReferralCode, mono: true },
    { label: copy.accountStatusLabel, value: displayStatus.label, accent: displayStatus.accent },
    { label: copy.lastLoginLabel, value: displayLastLogin },
  ] as const;

  return {
    approvedIdentityValue,
    approvedPassportValue,
    assets,
    authUser,
    certified,
    displayCity,
    displayName,
    identityStatus,
    identityValue,
    membershipLabel,
    passportStatus,
    passportValue,
    photoAssets,
    photoStatus,
    profile,
    profileStats,
    verificationStatus,
    videoAssets,
    videoStatus,
  };
}
