"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2, Upload } from "lucide-react";

import { useLocale } from "@/components/i18n/locale-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import {
  createPrivacyRequest,
  deleteUserMediaAssets,
  getCurrentUserBundle,
  type CurrentUserBundle,
  updateUserProfileCity,
  uploadUserMedia,
} from "@/lib/user-self-service";

import {
  type MediaAssetKey,
  type NoticeTone,
  toErrorMessage,
} from "../dashboard-shared-ui";
import {
  useWorkspaceRecoverCloudSync,
  useWorkspaceSyncEffect,
} from "../workspace-session-provider";
import { Button } from "../../ui/button";
import { useDashboardSharedMyStateCopy } from "./dashboard-shared-my-state-copy";
import { createDashboardSharedMyViewModel } from "./dashboard-shared-my-view-model";

export function useDashboardSharedMyState(initialData: CurrentUserBundle | null = null) {
  const router = useRouter();
  const { locale } = useLocale();
  const { copy, sharedCopy } = useDashboardSharedMyStateCopy();
  const supabase = getBrowserSupabaseClient();
  const recoverWorkspaceCloudSync = useWorkspaceRecoverCloudSync();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedInitialBundleRef = useRef(Boolean(initialData));

  const [bundle, setBundle] = useState<CurrentUserBundle | null>(initialData);
  const [loading, setLoading] = useState(initialData === null);
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

  const recoverCloudSync = useCallback(() => {
    setPageError(null);
    setPageNotice(null);
    setLoading(true);
    recoverWorkspaceCloudSync();
  }, [recoverWorkspaceCloudSync]);

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
    [router, sharedCopy, supabase],
  );

  useEffect(() => {
    if (initialData !== null || !supabase || hasLoadedInitialBundleRef.current) {
      return;
    }

    let mounted = true;
    hasLoadedInitialBundleRef.current = true;

    void loadBundle({
      isMounted: () => mounted,
      showLoading: true,
    });

    return () => {
      mounted = false;
    };
  }, [initialData, loadBundle, supabase]);

  useWorkspaceSyncEffect(({ isMounted, syncVersion }) => {
    if (syncVersion === 0 || !supabase) {
      return;
    }

    if (!hasLoadedInitialBundleRef.current) {
      hasLoadedInitialBundleRef.current = true;
    }

    return loadBundle({
      isMounted,
      showLoading: !bundle,
    });
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

  const {
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
  } = createDashboardSharedMyViewModel({
    bundle,
    copy,
    locale,
    sharedCopy,
  });

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

export type DashboardSharedMyState = ReturnType<typeof useDashboardSharedMyState>;
