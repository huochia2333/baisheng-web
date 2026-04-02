"use client";

import { useCallback, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2, Upload } from "lucide-react";

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
  type PhotoThumbnail,
} from "../dashboard-shared-photo-stack-preview";
import { Button } from "../../ui/button";

export function useDashboardSharedMyState() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [bundle, setBundle] = useState<CurrentUserBundle | null>(null);
  const [loading, setLoading] = useState(true);
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

        setPageError(toErrorMessage(error));
      } finally {
        if (isMounted()) {
          setLoading(false);
        }
      }
    },
    [recoverCloudSync, router, supabase],
  );

  useSupabaseAuthSync(supabase, {
    refreshKey: syncGeneration,
    onReady: ({ isMounted }) =>
      loadBundle({
        isMounted,
        showLoading: loadingStateRef.current || !bundleStateRef.current,
      }),
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
      const message = toErrorMessage(error);

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
  const vipData = bundle?.vipData ?? null;

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
    "未命名用户";
  const displayCity =
    normalizeOptionalString(profile?.city) ??
    normalizeOptionalString(authUser?.user_metadata?.city) ??
    "待补充城市";
  const displayPhone =
    normalizeOptionalString(profile?.phone) ??
    normalizeOptionalString(authUser?.user_metadata?.phone) ??
    normalizeOptionalString(authUser?.phone) ??
    "待补充";
  const displayEmail =
    normalizeOptionalString(profile?.email) ??
    normalizeOptionalString(authUser?.email) ??
    "待补充";
  const displayReferralCode = normalizeOptionalString(profile?.referral_code) ?? "待生成";
  const displayLastLogin = formatDateTime(authUser?.last_sign_in_at);
  const displayStatus = mapUserStatus(profile?.status);
  const membershipLabel = vipData?.status ? "VIP 尊享会员" : "标准会员";
  const photoThumbnails: PhotoThumbnail[] = photoAssets
    .filter((asset) => asset.previewUrl)
    .map((asset) => ({
      alt: asset.original_name,
      src: asset.previewUrl as string,
    }));

  const assets = [
    {
      key: "identity" as const,
      title: "基础信息",
      status: getStatusLabel("identity", identityStatus),
      tone: identityStatus,
      body: <IdPreview />,
    },
    {
      key: "passport" as const,
      title: "通行信息",
      status: getStatusLabel("passport", passportStatus),
      tone: passportStatus,
      body: <PassportPreview />,
    },
    {
      key: "photos" as const,
      title: "个人照片",
      status: getStatusLabel("photos", photoStatus),
      tone: photoStatus,
      body: (
        <PhotoStackPreview
          footerLabel={
            photoAssets.length ? `${photoAssets.length} 张照片` : "请上传个人照片"
          }
          thumbnails={photoThumbnails}
        />
      ),
    },
    {
      key: "videos" as const,
      title: "个人视频",
      status: getStatusLabel("videos", videoStatus),
      tone: videoStatus,
      body: <VideoPreview count={videoAssets.length} title={videoAssets[0]?.original_name} />,
    },
  ];

  const profileStats = [
    { label: "手机号码", value: displayPhone },
    { label: "电子邮箱", value: displayEmail },
    { label: "账号密码", value: "可发送重置邮件", mono: true },
    { label: "邀请码", value: displayReferralCode, mono: true },
    { label: "账号状态", value: displayStatus.label, accent: displayStatus.accent },
    { label: "最后登录", value: displayLastLogin },
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
      setPageNotice({ tone: "error", message: "当前账号缺少邮箱，无法发送重置邮件。" });
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

      setPageNotice({ tone: "success", message: "重置密码邮件已发送，请检查你的邮箱。" });
    } catch (error) {
      setPageNotice({ tone: "error", message: toErrorMessage(error) });
    } finally {
      setBusyKey(null);
    }
  };

  const copyInviteCode = async () => {
    if (!profile?.referral_code) {
      setPageNotice({ tone: "error", message: "当前账号还没有可复制的邀请码。" });
      return;
    }

    try {
      await navigator.clipboard.writeText(profile.referral_code);
      setPageNotice({ tone: "success", message: "邀请码已复制到剪贴板。" });
    } catch {
      setPageNotice({ tone: "error", message: "复制失败，请稍后重试。" });
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
      setProfileDialogNotice({ tone: "success", message: "个人资料已保存。" });
      setPageNotice({ tone: "success", message: "城市信息已更新。" });
    } catch (error) {
      setProfileDialogNotice({ tone: "error", message: toErrorMessage(error) });
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

      await refreshBundle({ dialogMessage: "身份证号已提交，当前状态为待审核。", quiet: true });
      setIdentityEditing(false);
    } catch (error) {
      setDialogNotice({ tone: "error", message: toErrorMessage(error) });
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

      await refreshBundle({ dialogMessage: "护照号码已提交，当前状态为待审核。", quiet: true });
      setPassportEditing(false);
    } catch (error) {
      setDialogNotice({ tone: "error", message: toErrorMessage(error) });
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
      await refreshBundle({ dialogMessage: "个人照片已上传，当前状态为待审核。", quiet: true });
    } catch (error) {
      setDialogNotice({ tone: "error", message: toErrorMessage(error) });
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
      await refreshBundle({ dialogMessage: "个人视频已上传，当前状态为待审核。", quiet: true });
    } catch (error) {
      setDialogNotice({ tone: "error", message: toErrorMessage(error) });
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
      await refreshBundle({ dialogMessage: "所选照片已删除。", quiet: true });
    } catch (error) {
      setDialogNotice({ tone: "error", message: toErrorMessage(error) });
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
      await refreshBundle({ dialogMessage: "所选视频已删除。", quiet: true });
    } catch (error) {
      setDialogNotice({ tone: "error", message: toErrorMessage(error) });
    } finally {
      setBusyKey(null);
    }
  };

  const dialogTitle =
    activeDialog === "identity"
      ? "基础信息"
      : activeDialog === "passport"
        ? "通行信息"
        : activeDialog === "photos"
          ? "个人照片"
          : activeDialog === "videos"
            ? "个人视频"
            : "";

  const dialogDescription =
    activeDialog === "identity"
      ? "提交后会进入审核流程，审核通过后会同步更新你的身份资料。"
      : activeDialog === "passport"
        ? "提交后会进入审核流程，审核通过后会同步更新你的通行资料。"
        : activeDialog === "photos"
          ? "上传后会进入待审核，审核通过后会展示在你的个人资料中。"
          : activeDialog === "videos"
            ? "上传后会进入待审核，审核通过后会展示在你的个人资料中。"
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
          删除照片
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
          上传照片
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
          删除视频
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
          上传视频
        </Button>
      </>
    ) : undefined;


  return {
    activeDialog,
    assets,
    bodyBundle: bundle,
    bundle,
    busyKey,
    certified,
    closeDialog,
    closeProfileDialog,
    copyInviteCode,
    deletePhotoAssets,
    deleteVideoAssets,
    dialogActions,
    dialogDescription,
    dialogNotice,
    dialogTitle,
    displayCity,
    displayName,
    identityDraft,
    identityEditing,
    identityStatus,
    identityValue,
    loading,
    membershipLabel,
    openDialog,
    openProfileDialog,
    pageError,
    pageNotice,
    passportDraft,
    passportEditing,
    passportStatus,
    passportValue,
    photoAssets,
    photoInputRef,
    photoStatus,
    profileCityDraft,
    profileDialogNotice,
    profileDialogOpen,
    profileStats,
    recoverCloudSync,
    refreshBundle,
    saveProfileCity,
    sendPasswordReset,
    setIdentityDraft,
    setIdentityEditing,
    setPassportDraft,
    setPassportEditing,
    setProfileCityDraft,
    submitIdentity,
    submitPassport,
    supabase,
    uploadPhotos,
    uploadVideos,
    verificationStatus,
    videoAssets,
    videoInputRef,
    videoStatus,
  };
}
