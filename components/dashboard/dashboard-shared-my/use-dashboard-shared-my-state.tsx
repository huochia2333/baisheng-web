"use client";

import { useCallback, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoaderCircle, Trash2, Upload } from "lucide-react";

import { useLocale } from "@/components/i18n/locale-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import {
  markBrowserCloudSyncActivity,
  resetBrowserCloudSyncState,
  shouldRecoverBrowserCloudSyncState,
} from "@/lib/browser-sync-recovery";
import { useResumeRecovery } from "@/lib/use-resume-recovery";
import {
  createPrivacyRequest,
  deleteUserMediaAssets,
  getCurrentUserBundle,
  type CurrentUserBundle,
  updateUserProfileCity,
  uploadUserMedia,
} from "@/lib/user-self-service";
import { useSupabaseAuthSync } from "@/lib/use-supabase-auth-sync";

import {
  createDashboardSharedCopy,
  formatDateTime,
  getMediaStatus,
  getStatusLabel,
  IdPreview,
  mapUserStatus,
  normalizeOptionalString,
  PassportPreview,
  type MediaAssetKey,
  type NoticeTone,
  type ReviewStatus,
  toErrorMessage,
  VideoPreview,
} from "../dashboard-shared-ui";
import {
  PhotoStackPreview,
} from "../dashboard-shared-photo-stack-preview";
import { Button } from "../../ui/button";

export function useDashboardSharedMyState(initialData: CurrentUserBundle | null = null) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = useTranslations("DashboardMyState");
  const sharedT = useTranslations("DashboardShared");
  const sharedCopy = createDashboardSharedCopy(sharedT);
  const supabase = getBrowserSupabaseClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const skipInitialBundleLoadRef = useRef(Boolean(initialData));
  const copy = {
    unnamedUser: t("unnamedUser"),
    pendingCity: t("pendingCity"),
    pendingValue: t("pendingValue"),
    pendingReferralCode: t("pendingReferralCode"),
    standardMembership: t("standardMembership"),
    vipMembership: t("vipMembership"),
    identityTitle: t("identityTitle"),
    passportTitle: t("passportTitle"),
    photosTitle: t("photosTitle"),
    videosTitle: t("videosTitle"),
    photoCountLabel: (count: number) => t("photoCountLabel", { count }),
    uploadPhotosPrompt: t("uploadPhotosPrompt"),
    phoneLabel: t("phoneLabel"),
    emailLabel: t("emailLabel"),
    passwordLabel: t("passwordLabel"),
    passwordValue: t("passwordValue"),
    inviteCodeLabel: t("inviteCodeLabel"),
    accountStatusLabel: t("accountStatusLabel"),
    lastLoginLabel: t("lastLoginLabel"),
    missingEmailForReset: t("missingEmailForReset"),
    resetSent: t("resetSent"),
    missingInviteCode: t("missingInviteCode"),
    inviteCopied: t("inviteCopied"),
    inviteCopyFailed: t("inviteCopyFailed"),
    profileSaved: t("profileSaved"),
    cityUpdated: t("cityUpdated"),
    identitySubmitted: t("identitySubmitted"),
    passportSubmitted: t("passportSubmitted"),
    photosUploaded: t("photosUploaded"),
    videosUploaded: t("videosUploaded"),
    photosDeleted: t("photosDeleted"),
    videosDeleted: t("videosDeleted"),
    identityDescription: t("identityDescription"),
    passportDescription: t("passportDescription"),
    mediaDescription: t("mediaDescription"),
    deletePhotos: t("deletePhotos"),
    uploadPhotos: t("uploadPhotos"),
    deleteVideos: t("deleteVideos"),
    uploadVideos: t("uploadVideos"),
  };

  const [bundle, setBundle] = useState<CurrentUserBundle | null>(initialData);
  const [loading, setLoading] = useState(initialData === null);
  const [syncGeneration, setSyncGeneration] = useState(0);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<{ tone: NoticeTone; message: string } | null>(
    null,
  );
  const [dialogNotice, setDialogNotice] = useState<{
    tone: NoticeTone;
    message: string;
  } | null>(null);
  const [profileDialogNotice, setProfileDialogNotice] = useState<{
    tone: NoticeTone;
    message: string;
  } | null>(null);
  const [activeDialog, setActiveDialog] = useState<MediaAssetKey | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [identityDraft, setIdentityDraft] = useState("");
  const [passportDraft, setPassportDraft] = useState("");
  const [profileCityDraft, setProfileCityDraft] = useState("");
  const [identityEditing, setIdentityEditing] = useState(false);
  const [passportEditing, setPassportEditing] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const bundleStateRef = useRef<CurrentUserBundle | null>(null);
  const loadingStateRef = useRef(true);

  bundleStateRef.current = bundle;
  loadingStateRef.current = loading;

  const recoverCloudSync = useCallback(() => {
    resetBrowserCloudSyncState();
    markBrowserCloudSyncActivity();
    setSyncGeneration((current) => current + 1);
  }, []);

  const loadBundle = useCallback(
    async ({
      isMounted,
      showLoading,
    }: {
      isMounted: () => boolean;
      showLoading: boolean;
    }) => {
      if (!supabase) {
        return;
      }

      if (showLoading && isMounted()) {
        setLoading(true);
      }

      try {
        if (shouldRecoverBrowserCloudSyncState()) {
          recoverCloudSync();
          return;
        }

        const nextBundle = await getCurrentUserBundle(supabase);

        if (!isMounted()) {
          return;
        }

        if (!nextBundle) {
          router.replace("/login");
          return;
        }

        setBundle(nextBundle);
        setPageError(null);
      } catch (error) {
        if (!isMounted()) {
          return;
        }

        setPageError(toErrorMessage(error, sharedCopy));
      } finally {
        if (isMounted()) {
          setLoading(false);
        }
      }
    },
    [recoverCloudSync, router, sharedCopy, supabase],
  );

  useSupabaseAuthSync(supabase, {
    refreshKey: syncGeneration,
    onReady: ({ isMounted }) => {
      if (skipInitialBundleLoadRef.current) {
        skipInitialBundleLoadRef.current = false;
        markBrowserCloudSyncActivity();

        if (isMounted()) {
          setLoading(false);
        }

        return;
      }

      return loadBundle({
        isMounted,
        showLoading: loadingStateRef.current || !bundleStateRef.current,
      });
    },
    onAuthStateChange: async ({ isMounted, session }) => {
      if (!isMounted()) {
        return;
      }

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      await loadBundle({
        isMounted,
        showLoading: false,
      });
    },
  });

  useResumeRecovery(recoverCloudSync, {
    enabled: Boolean(supabase),
  });

  const refreshBundle = async ({
    dialogMessage,
    pageMessage,
    quiet,
  }: {
    dialogMessage?: string;
    pageMessage?: string;
    quiet?: boolean;
  } = {}) => {
    if (!supabase) {
      return;
    }

    try {
      if (!quiet) {
        setBusyKey("refresh");
      }

      const nextBundle = await getCurrentUserBundle(supabase);

      if (!nextBundle) {
        router.replace("/login");
        return;
      }

      setBundle(nextBundle);
      setPageError(null);

      if (dialogMessage) {
        setDialogNotice({ tone: "success", message: dialogMessage });
      }

      if (pageMessage) {
        setPageNotice({ tone: "success", message: pageMessage });
      }
    } catch (error) {
        const message = toErrorMessage(error, sharedCopy);

      if (activeDialog) {
        setDialogNotice({ tone: "error", message });
      } else {
        setPageError(message);
      }
    } finally {
      if (!quiet) {
        setBusyKey(null);
      }
    }
  };

  const authUser = bundle?.authUser ?? null;
  const mediaAssets: CurrentUserBundle["mediaAssets"] = bundle?.mediaAssets ?? [];
  const privacyData = bundle?.privacyData ?? null;
  const privacyRequests: CurrentUserBundle["privacyRequests"] = bundle?.privacyRequests ?? [];
  const profile = bundle?.profile ?? null;
  const vipMembership = bundle?.vipMembership ?? null;

  const approvedIdentityValue = normalizeOptionalString(privacyData?.id_card) ?? "";
  const approvedPassportValue = normalizeOptionalString(privacyData?.passport) ?? "";
  const pendingIdentityRequest = privacyRequests.find(
    (request) => request.status === "pending" && normalizeOptionalString(request.id_card_requests),
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
    normalizeOptionalString(pendingIdentityRequest?.id_card_requests) ?? approvedIdentityValue;
  const passportValue =
    normalizeOptionalString(pendingPassportRequest?.passport_requests) ?? approvedPassportValue;

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
    (!vipMembership.expires_at || new Date(vipMembership.expires_at).getTime() > Date.now());
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

  const openDialog = (key: MediaAssetKey) => {
    setDialogNotice(null);
    setActiveDialog(key);

    if (key === "identity") {
      setIdentityEditing(identityStatus === "empty");
      setIdentityDraft(identityStatus === "pending" ? identityValue : approvedIdentityValue);
    }

    if (key === "passport") {
      setPassportEditing(passportStatus === "empty");
      setPassportDraft(passportStatus === "pending" ? passportValue : approvedPassportValue);
    }
  };

  const closeDialog = (open: boolean) => {
    if (open) {
      return;
    }

    setActiveDialog(null);
    setDialogNotice(null);
    setIdentityEditing(false);
    setPassportEditing(false);
  };

  const sendPasswordReset = async () => {
    if (!supabase || !authUser?.email) {
      setPageNotice({ tone: "error", message: copy.missingEmailForReset });
      return;
    }

    setBusyKey("password");
    setPageNotice(null);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/forgot-password`
        : undefined;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(authUser.email, {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      setPageNotice({ tone: "success", message: copy.resetSent });
    } catch (error) {
      setPageNotice({ tone: "error", message: toErrorMessage(error, sharedCopy) });
    } finally {
      setBusyKey(null);
    }
  };

  const copyInviteCode = async () => {
    if (!profile?.referral_code) {
      setPageNotice({ tone: "error", message: copy.missingInviteCode });
      return;
    }

    try {
      await navigator.clipboard.writeText(profile.referral_code);
      setPageNotice({ tone: "success", message: copy.inviteCopied });
    } catch {
      setPageNotice({ tone: "error", message: copy.inviteCopyFailed });
    }
  };

  const openProfileDialog = () => {
    setProfileDialogNotice(null);
    setProfileCityDraft(profile?.city ?? "");
    setProfileDialogOpen(true);
  };

  const closeProfileDialog = (open: boolean) => {
    if (open) {
      return;
    }

    setProfileDialogOpen(false);
    setProfileDialogNotice(null);
  };

  const saveProfileCity = async () => {
    if (!supabase || !authUser) {
      return;
    }

    setBusyKey("profile-save");
    setProfileDialogNotice(null);

    try {
      await updateUserProfileCity(supabase, {
        city: profileCityDraft,
        userId: authUser.id,
      });

      await refreshBundle({ quiet: true });
      setProfileDialogNotice({ tone: "success", message: copy.profileSaved });
      setPageNotice({ tone: "success", message: copy.cityUpdated });
    } catch (error) {
      setProfileDialogNotice({ tone: "error", message: toErrorMessage(error, sharedCopy) });
    } finally {
      setBusyKey(null);
    }
  };

  const submitIdentity = async () => {
    if (!supabase || !authUser) {
      return;
    }

    setBusyKey("identity");
    setDialogNotice(null);

    try {
      await createPrivacyRequest(supabase, {
        field: "id_card",
        userId: authUser.id,
        value: identityDraft,
      });

      await refreshBundle({ dialogMessage: copy.identitySubmitted, quiet: true });
      setIdentityEditing(false);
    } catch (error) {
      setDialogNotice({ tone: "error", message: toErrorMessage(error, sharedCopy) });
    } finally {
      setBusyKey(null);
    }
  };

  const submitPassport = async () => {
    if (!supabase || !authUser) {
      return;
    }

    setBusyKey("passport");
    setDialogNotice(null);

    try {
      await createPrivacyRequest(supabase, {
        field: "passport",
        userId: authUser.id,
        value: passportDraft,
      });

      await refreshBundle({ dialogMessage: copy.passportSubmitted, quiet: true });
      setPassportEditing(false);
    } catch (error) {
      setDialogNotice({ tone: "error", message: toErrorMessage(error, sharedCopy) });
    } finally {
      setBusyKey(null);
    }
  };

  const uploadPhotos = async (files: File[]) => {
    if (!supabase || !authUser) {
      return;
    }

    setBusyKey("photos-upload");
    setDialogNotice(null);

    try {
      await uploadUserMedia(supabase, { files, kind: "image", userId: authUser.id });
      await refreshBundle({ dialogMessage: copy.photosUploaded, quiet: true });
    } catch (error) {
      setDialogNotice({ tone: "error", message: toErrorMessage(error, sharedCopy) });
    } finally {
      setBusyKey(null);
    }
  };

  const uploadVideos = async (files: File[]) => {
    if (!supabase || !authUser) {
      return;
    }

    setBusyKey("videos-upload");
    setDialogNotice(null);

    try {
      await uploadUserMedia(supabase, { files, kind: "video", userId: authUser.id });
      await refreshBundle({ dialogMessage: copy.videosUploaded, quiet: true });
    } catch (error) {
      setDialogNotice({ tone: "error", message: toErrorMessage(error, sharedCopy) });
    } finally {
      setBusyKey(null);
    }
  };

  const deletePhotoAssets = async (targets: CurrentUserBundle["mediaAssets"]) => {
    if (!supabase) {
      return;
    }

    setBusyKey("photos-delete");
    setDialogNotice(null);

    try {
      await deleteUserMediaAssets(supabase, targets);
      await refreshBundle({ dialogMessage: copy.photosDeleted, quiet: true });
    } catch (error) {
      setDialogNotice({ tone: "error", message: toErrorMessage(error, sharedCopy) });
    } finally {
      setBusyKey(null);
    }
  };

  const deleteVideoAssets = async (targets: CurrentUserBundle["mediaAssets"]) => {
    if (!supabase) {
      return;
    }

    setBusyKey("videos-delete");
    setDialogNotice(null);

    try {
      await deleteUserMediaAssets(supabase, targets);
      await refreshBundle({ dialogMessage: copy.videosDeleted, quiet: true });
    } catch (error) {
      setDialogNotice({ tone: "error", message: toErrorMessage(error, sharedCopy) });
    } finally {
      setBusyKey(null);
    }
  };

  const dialogTitle =
    activeDialog === "identity"
      ? copy.identityTitle
      : activeDialog === "passport"
        ? copy.passportTitle
        : activeDialog === "photos"
          ? copy.photosTitle
          : activeDialog === "videos"
            ? copy.videosTitle
            : "";

  const dialogDescription =
    activeDialog === "identity"
      ? copy.identityDescription
      : activeDialog === "passport"
        ? copy.passportDescription
        : activeDialog === "photos"
          ? copy.mediaDescription
          : activeDialog === "videos"
            ? copy.mediaDescription
            : "";

  const dialogActions =
    activeDialog === "photos" ? (
      <>
        <Button
          className="h-11 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
          disabled={!photoAssets.length || busyKey !== null}
          onClick={() => void deletePhotoAssets(photoAssets)}
          variant="outline"
        >
          {busyKey === "photos-delete" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          {copy.deletePhotos}
        </Button>
        <Button
          className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
          disabled={busyKey !== null}
          onClick={() => photoInputRef.current?.click()}
        >
          {busyKey === "photos-upload" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {copy.uploadPhotos}
        </Button>
      </>
    ) : activeDialog === "videos" ? (
      <>
        <Button
          className="h-11 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
          disabled={!videoAssets.length || busyKey !== null}
          onClick={() => void deleteVideoAssets(videoAssets)}
          variant="outline"
        >
          {busyKey === "videos-delete" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          {copy.deleteVideos}
        </Button>
        <Button
          className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
          disabled={busyKey !== null}
          onClick={() => videoInputRef.current?.click()}
        >
          {busyKey === "videos-upload" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {copy.uploadVideos}
        </Button>
      </>
    ) : undefined;

  return {
    bundle,
    loading,
    photoInputRef,
    videoInputRef,
    supabase,
    ui: {
      busyKey,
    },
    page: {
      error: pageError,
      notice: pageNotice,
      recoverCloudSync,
      refreshBundle,
    },
    account: {
      certified,
      copyInviteCode,
      displayCity,
      displayName,
      membershipLabel,
      profileStats,
      sendPasswordReset,
      verificationStatus,
    },
    profileDialog: {
      close: closeProfileDialog,
      notice: profileDialogNotice,
      open: profileDialogOpen,
      openDialog: openProfileDialog,
      saveCity: saveProfileCity,
      setCityDraft: setProfileCityDraft,
      cityDraft: profileCityDraft,
    },
    assetDialog: {
      actions: dialogActions,
      activeDialog,
      assets,
      close: closeDialog,
      deletePhotoAssets,
      deleteVideoAssets,
      description: dialogDescription,
      notice: dialogNotice,
      openDialog,
      photoAssets,
      photoStatus,
      title: dialogTitle,
      uploadPhotos,
      uploadVideos,
      videoAssets,
      videoStatus,
    },
    identity: {
      draft: identityDraft,
      editing: identityEditing,
      setDraft: setIdentityDraft,
      setEditing: setIdentityEditing,
      status: identityStatus,
      submit: submitIdentity,
      value: identityValue,
    },
    passport: {
      draft: passportDraft,
      editing: passportEditing,
      setDraft: setPassportDraft,
      setEditing: setPassportEditing,
      status: passportStatus,
      submit: submitPassport,
      value: passportValue,
    },
  };
}
