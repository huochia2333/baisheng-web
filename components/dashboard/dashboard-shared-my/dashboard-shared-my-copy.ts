"use client";

import { useTranslations } from "next-intl";

export type DashboardMyCopy = {
  bundleUnavailable: string;
  bundleSyncDescription: string;
  bundleSyncTitle: string;
  retrySync: string;
  sectionNavigationLabel: string;
  personalCenterTitle: string;
  personalCenterDescription: string;
  accountCenterTitle: string;
  accountCenterDescription: string;
  profileInfoTitle: string;
  profileInfoDescription: string;
  accountVerificationTitle: string;
  accountVerificationDescription: string;
  editProfile: string;
  changePassword: string;
  copyInviteCode: string;
  refreshProfile: string;
  verificationTitle: string;
  verificationApproved: string;
  verificationPending: string;
  verificationEmpty: string;
  verificationApprovedDescription: string;
  verificationPendingDescription: string;
  verificationEmptyDescription: string;
  identityMediaTitle: string;
  copyright: string;
  privacy: string;
  terms: string;
  help: string;
  identitySubmit: string;
  identityLabel: string;
  identityPlaceholder: string;
  identityPendingDescription: string;
  identityApprovedDescription: string;
  retryEdit: string;
  passportSubmit: string;
  passportLabel: string;
  passportPlaceholder: string;
  passportPendingDescription: string;
  passportApprovedDescription: string;
  previewUnavailable: string;
  photoItem: (index: number) => string;
  delete: string;
  photoEmptyTitle: string;
  photoEmptyDescription: string;
  photoPendingDescription: string;
  photoApprovedDescription: string;
  videoEmptyTitle: string;
  videoEmptyDescription: string;
  videoPendingDescription: string;
  videoApprovedDescription: string;
  editProfileDescription: string;
  nameLabel: string;
  namePlaceholder: string;
  cityLabel: string;
  cityPlaceholder: string;
  saveProfile: string;
};

export function useDashboardMyCopy(): DashboardMyCopy {
  const t = useTranslations("DashboardMy");

  return {
    bundleUnavailable: t("bundleUnavailable"),
    bundleSyncDescription: t("bundleSyncDescription"),
    bundleSyncTitle: t("bundleSyncTitle"),
    retrySync: t("retrySync"),
    sectionNavigationLabel: t("sectionNavigationLabel"),
    personalCenterTitle: t("personalCenterTitle"),
    personalCenterDescription: t("personalCenterDescription"),
    accountCenterTitle: t("accountCenterTitle"),
    accountCenterDescription: t("accountCenterDescription"),
    profileInfoTitle: t("profileInfoTitle"),
    profileInfoDescription: t("profileInfoDescription"),
    accountVerificationTitle: t("accountVerificationTitle"),
    accountVerificationDescription: t("accountVerificationDescription"),
    editProfile: t("editProfile"),
    changePassword: t("changePassword"),
    copyInviteCode: t("copyInviteCode"),
    refreshProfile: t("refreshProfile"),
    verificationTitle: t("verificationTitle"),
    verificationApproved: t("verificationApproved"),
    verificationPending: t("verificationPending"),
    verificationEmpty: t("verificationEmpty"),
    verificationApprovedDescription: t("verificationApprovedDescription"),
    verificationPendingDescription: t("verificationPendingDescription"),
    verificationEmptyDescription: t("verificationEmptyDescription"),
    identityMediaTitle: t("identityMediaTitle"),
    copyright: t("copyright"),
    privacy: t("privacy"),
    terms: t("terms"),
    help: t("help"),
    identitySubmit: t("identitySubmit"),
    identityLabel: t("identityLabel"),
    identityPlaceholder: t("identityPlaceholder"),
    identityPendingDescription: t("identityPendingDescription"),
    identityApprovedDescription: t("identityApprovedDescription"),
    retryEdit: t("retryEdit"),
    passportSubmit: t("passportSubmit"),
    passportLabel: t("passportLabel"),
    passportPlaceholder: t("passportPlaceholder"),
    passportPendingDescription: t("passportPendingDescription"),
    passportApprovedDescription: t("passportApprovedDescription"),
    previewUnavailable: t("previewUnavailable"),
    photoItem: (index: number) => t("photoItem", { index }),
    delete: t("delete"),
    photoEmptyTitle: t("photoEmptyTitle"),
    photoEmptyDescription: t("photoEmptyDescription"),
    photoPendingDescription: t("photoPendingDescription"),
    photoApprovedDescription: t("photoApprovedDescription"),
    videoEmptyTitle: t("videoEmptyTitle"),
    videoEmptyDescription: t("videoEmptyDescription"),
    videoPendingDescription: t("videoPendingDescription"),
    videoApprovedDescription: t("videoApprovedDescription"),
    editProfileDescription: t("editProfileDescription"),
    nameLabel: t("nameLabel"),
    namePlaceholder: t("namePlaceholder"),
    cityLabel: t("cityLabel"),
    cityPlaceholder: t("cityPlaceholder"),
    saveProfile: t("saveProfile"),
  };
}
