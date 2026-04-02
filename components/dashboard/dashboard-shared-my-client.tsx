"use client";

import {
  BadgeCheck,
  Copy,
  FileBadge2,
  KeyRound,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  EmptyState,
  formatFileSize,
  InputCard,
  LoadingState,
  PageBanner,
  StatusChip,
  statusBadgeClass,
  StatusNotice,
  ValueCard,
} from "./dashboard-shared-ui";
import { DashboardDialog } from "./dashboard-dialog";
import { Button } from "../ui/button";
import { useDashboardSharedMyState } from "./dashboard-shared-my/use-dashboard-shared-my-state";

export function DashboardSharedMyClient() {
  const {
    activeDialog,
    assets,
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
  } = useDashboardSharedMyState();

  if (!supabase) {
    return <LoadingState />;
  }

  if (loading) {
    return <LoadingState />;
  }

  if (!bundle) {
    return (
      <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-6">
        <PageBanner tone="error">
          {pageError ?? "云端资料暂时不可用，请刷新页面后重试。"}
        </PageBanner>
        <section className="rounded-[28px] border border-white/85 bg-white/72 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <EmptyState
            description="当前页面依赖云端登录态和资料查询。刚从闲置状态恢复时，如果同步请求没有返回，现在会直接提示失败，你可以重新同步而不是一直停留在加载中。"
            icon={<Search className="size-6" />}
            title="资料同步没有完成"
          />
          <div className="mt-6 flex justify-center">
            <Button
              className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
              disabled={busyKey !== null}
              onClick={recoverCloudSync}
            >
              {busyKey === "refresh" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              重新同步资料
            </Button>
          </div>
        </section>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-[1320px] flex-col gap-8">
        {pageError ? (
          <PageBanner tone="error">{pageError}</PageBanner>
        ) : pageNotice ? (
          <PageBanner tone={pageNotice.tone}>{pageNotice.message}</PageBanner>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className="rounded-[28px] border border-white/90 bg-[#f4f3f1]/92 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.08)] xl:col-span-9 xl:p-8">
            <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <span className="inline-flex rounded-full bg-[#dff0e4] px-3 py-1 text-xs font-semibold text-[#487155]">
                  {membershipLabel}
                </span>
                <h2 className="mt-4 text-4xl font-bold tracking-tight text-[#1f2a32]">
                  {displayName}
                </h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-[#66727d]">
                  <MapPin className="size-4" />
                  {displayCity}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  className="h-12 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
                  disabled={busyKey !== null}
                  onClick={openProfileDialog}
                  variant="outline"
                >
                  <MapPin className="size-4" />
                  编辑个人资料
                </Button>
                <Button
                  className="h-12 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
                  disabled={busyKey !== null}
                  onClick={() => void sendPasswordReset()}
                >
                  {busyKey === "password" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <KeyRound className="size-4" />
                  )}
                  修改密码
                </Button>
                <Button
                  className="h-12 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
                  onClick={() => void copyInviteCode()}
                  variant="outline"
                >
                  <Copy className="size-4" />
                  复制邀请码
                </Button>
                <Button
                  className="h-12 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
                  disabled={busyKey !== null}
                  onClick={() => void refreshBundle({ quiet: false })}
                  variant="outline"
                >
                  {busyKey === "refresh" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  刷新资料
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2">
              {profileStats.map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="font-label text-[11px] font-semibold tracking-[0.22em] text-[#7d8890] uppercase">
                    {item.label}
                  </p>
                  {"accent" in item && item.accent === "success" ? (
                    <p className="flex items-center gap-2 text-lg font-medium text-[#4c7259]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#4c7259]" />
                      {item.value}
                    </p>
                  ) : (
                    <p
                      className={cn(
                        "text-lg font-medium text-[#486782]",
                        "mono" in item && item.mono && "tracking-[0.18em]",
                      )}
                    >
                      {item.value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <aside className="xl:col-span-3">
            <section
              className={cn(
                "rounded-[24px] border p-6 shadow-[0_12px_30px_rgba(96,113,128,0.06)]",
                certified
                  ? "border-[#d9e8dc] bg-[#edf5ef]"
                  : verificationStatus === "pending"
                    ? "border-[#ecdcb1] bg-[#fbf5e6]"
                    : "border-[#ebdfd2] bg-[#fbf6ef]",
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full text-white",
                    certified
                      ? "bg-[#4c7259]"
                      : verificationStatus === "pending"
                        ? "bg-[#b7892f]"
                        : "bg-[#b07a4f]",
                  )}
                >
                  {certified ? (
                    <BadgeCheck className="size-5" />
                  ) : verificationStatus === "pending" ? (
                    <ShieldAlert className="size-5" />
                  ) : (
                    <ShieldAlert className="size-5" />
                  )}
                </div>
                <div>
                  <p
                    className={cn(
                      "text-xs font-semibold tracking-[0.16em] uppercase",
                      certified
                        ? "text-[#4c7259]"
                        : verificationStatus === "pending"
                          ? "text-[#87631e]"
                          : "text-[#8b6240]",
                    )}
                  >
                    实名认证状态
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-lg font-bold",
                      certified
                        ? "text-[#355443]"
                        : verificationStatus === "pending"
                          ? "text-[#6f5318]"
                          : "text-[#704d31]",
                    )}
                  >
                    {certified
                      ? "通过认证"
                      : verificationStatus === "pending"
                        ? "审核中"
                        : "未认证"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#6e7780]">
                {certified
                  ? "身份证资料已经通过审核，当前账号已完成实名认证。"
                  : verificationStatus === "pending"
                    ? "身份证资料已提交，当前正在审核中。"
                    : "身份证资料通过审核后，这里会显示通过认证。"}
              </p>
            </section>
          </aside>
        </div>

        <section className="rounded-[28px] border border-white/85 bg-white/68 p-6 shadow-[0_18px_45px_rgba(96,113,128,0.06)] xl:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e6edf2] text-[#486782]">
              <BadgeCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-[#486782]">
                身份证明与多媒体
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {assets.map((asset) => (
              <button
                key={asset.key}
                className="group rounded-[24px] border border-[#efede9] bg-white p-4 text-left shadow-[0_10px_24px_rgba(96,113,128,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(96,113,128,0.12)] active:scale-[0.985]"
                onClick={() => openDialog(asset.key)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2b3942]">
                      {asset.title}
                    </p>
                  </div>
                  <span className={statusBadgeClass(asset.tone)}>{asset.status}</span>
                </div>
                <div className="relative mt-4 aspect-[1.58/1] overflow-hidden rounded-[18px] bg-[#ece9e4]">
                  {asset.body}
                  <div className="absolute inset-0 flex items-center justify-center bg-[rgba(72,103,130,0.18)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-[#486782]">
                      <Search className="size-5" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-[#e4e2de] px-1 pt-8 text-xs text-[#8a949b] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 柏盛管理系统</p>
          <div className="flex items-center gap-6">
            <a className="transition-colors hover:text-[#486782]" href="#">
              隐私政策
            </a>
            <a className="transition-colors hover:text-[#486782]" href="#">
              服务条款
            </a>
            <a className="transition-colors hover:text-[#486782]" href="#">
              帮助中心
            </a>
          </div>
        </footer>
      </section>

      <input
        ref={photoInputRef}
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) {
            void uploadPhotos(files);
          }
        }}
        type="file"
      />
      <input
        ref={videoInputRef}
        accept="video/*"
        className="hidden"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) {
            void uploadVideos(files);
          }
        }}
        type="file"
      />

      <DashboardDialog
        actions={dialogActions}
        description={dialogDescription}
        onOpenChange={closeDialog}
        open={activeDialog !== null}
        title={dialogTitle}
      >
        {dialogNotice ? (
          <div className="mb-5">
            <PageBanner tone={dialogNotice.tone}>{dialogNotice.message}</PageBanner>
          </div>
        ) : null}

        {activeDialog === "identity" ? (
          identityStatus === "empty" || identityEditing ? (
            <InputCard
              actionLabel="提交身份证号"
              busy={busyKey === "identity"}
              icon={<FileBadge2 className="size-5" />}
              label="身份证号"
              onAction={() => void submitIdentity()}
              onChange={setIdentityDraft}
              placeholder="请填写身份证号"
              value={identityDraft}
            />
          ) : (
            <div className="space-y-5">
              <StatusNotice
                description={
                  identityStatus === "pending"
                    ? "身份证号已提交，当前状态为待审核。"
                    : "身份证号已审核通过。"
                }
                status={identityStatus}
              />
              <ValueCard
                icon={<FileBadge2 className="size-5" />}
                label="身份证号"
                value={identityValue}
              />
              {identityStatus === "approved" ? (
                <div className="flex justify-end">
                  <Button
                    className="h-11 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
                    onClick={() => {
                      setIdentityEditing(true);
                      setIdentityDraft(identityValue);
                    }}
                    variant="outline"
                  >
                    重新填写
                  </Button>
                </div>
              ) : null}
            </div>
          )
        ) : activeDialog === "passport" ? (
          passportStatus === "empty" || passportEditing ? (
            <InputCard
              actionLabel="提交护照号码"
              busy={busyKey === "passport"}
              icon={<FileBadge2 className="size-5" />}
              label="护照号码"
              onAction={() => void submitPassport()}
              onChange={setPassportDraft}
              placeholder="请上传护照号码"
              value={passportDraft}
            />
          ) : (
            <div className="space-y-5">
              <StatusNotice
                description={
                  passportStatus === "pending"
                    ? "护照号码已提交，当前状态为待审核。"
                    : "护照号码已审核通过。"
                }
                status={passportStatus}
              />
              <ValueCard
                icon={<FileBadge2 className="size-5" />}
                label="护照号码"
                value={passportValue}
              />
              {passportStatus === "approved" ? (
                <div className="flex justify-end">
                  <Button
                    className="h-11 rounded-full border-[#d4d8dc] bg-white px-5 text-[#486782] hover:bg-[#f2f4f6]"
                    onClick={() => {
                      setPassportEditing(true);
                      setPassportDraft(passportValue);
                    }}
                    variant="outline"
                  >
                    重新填写
                  </Button>
                </div>
              ) : null}
            </div>
          )
        ) : activeDialog === "photos" ? (
          photoAssets.length ? (
            <div className="space-y-6">
              <StatusNotice
                description={
                  photoStatus === "pending"
                    ? "至少有一张个人照片正在等待审核。"
                    : "个人照片已审核通过。"
                }
                status={photoStatus}
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {photoAssets.map((photo, index) => (
                  <article
                    key={photo.id}
                    className="rounded-[24px] border border-[#ebe7e1] bg-white p-3 shadow-[0_10px_24px_rgba(96,113,128,0.05)]"
                  >
                    <div className="aspect-[4/5] overflow-hidden rounded-[18px] bg-[#ece9e4]">
                      {photo.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={photo.original_name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          src={photo.previewUrl}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-[#7d8890]">
                          无法预览
                        </div>
                      )}
                    </div>
                    <div className="mt-3 space-y-3 px-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#2b3942]">
                            个人照片 {index + 1}
                          </p>
                          <p className="truncate text-xs text-[#7d8890]">
                            {photo.original_name}
                          </p>
                        </div>
                        <StatusChip status={photo.status} />
                      </div>
                      <button
                        className="inline-flex h-9 items-center gap-1 rounded-full bg-[#fceaea] px-3 text-xs font-medium text-[#c43d3d]"
                        disabled={busyKey !== null}
                        onClick={() => void deletePhotoAssets([photo])}
                        type="button"
                      >
                        <Trash2 className="size-3.5" />
                        删除
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              description="上传后会进入待审核，审核完成后会在这里展示全部照片。"
              icon={<FileBadge2 className="size-6" />}
              title="请上传个人照片"
            />
          )
        ) : activeDialog === "videos" ? (
          videoAssets.length ? (
            <div className="space-y-6">
              <StatusNotice
                description={
                  videoStatus === "pending"
                    ? "至少有一条个人视频正在等待审核。"
                    : "个人视频已审核通过。"
                }
                status={videoStatus}
              />
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {videoAssets.map((video) => (
                  <article
                    key={video.id}
                    className="rounded-[24px] border border-[#ebe7e1] bg-white p-3 shadow-[0_10px_24px_rgba(96,113,128,0.05)]"
                  >
                    <div className="overflow-hidden rounded-[18px] bg-[#172029]">
                      {video.previewUrl ? (
                        <video
                          className="aspect-video w-full bg-[#172029] object-cover"
                          controls
                          preload="metadata"
                          src={video.previewUrl}
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center text-sm text-white/72">
                          无法预览
                        </div>
                      )}
                    </div>
                    <div className="mt-3 space-y-3 px-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#2b3942]">
                            {video.original_name}
                          </p>
                          <p className="truncate text-xs text-[#7d8890]">
                            {formatFileSize(video.file_size_bytes)}
                          </p>
                        </div>
                        <StatusChip status={video.status} />
                      </div>
                      <button
                        className="inline-flex h-9 items-center gap-1 rounded-full bg-[#fceaea] px-3 text-xs font-medium text-[#c43d3d]"
                        disabled={busyKey !== null}
                        onClick={() => void deleteVideoAssets([video])}
                        type="button"
                      >
                        <Trash2 className="size-3.5" />
                        删除
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              description="上传后会进入待审核，审核完成后会在这里展示全部视频。"
              icon={<Video className="size-6" />}
              title="请上传个人视频"
            />
          )
        ) : null}
      </DashboardDialog>

      <DashboardDialog
        description="注册完成后可以在这里补充城市信息，保存后会同步更新“我的”页展示。"
        onOpenChange={closeProfileDialog}
        open={profileDialogOpen}
        title="编辑个人资料"
      >
        {profileDialogNotice ? (
          <div className="mb-5">
            <PageBanner tone={profileDialogNotice.tone}>
              {profileDialogNotice.message}
            </PageBanner>
          </div>
        ) : null}

        <div className="rounded-[24px] border border-[#ece8e1] bg-white p-6 shadow-[0_10px_24px_rgba(96,113,128,0.06)]">
          <div className="flex items-center gap-3 text-[#486782]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef3f6]">
              <MapPin className="size-5" />
            </div>
            <div>
              <p className="font-label text-[11px] font-semibold tracking-[0.18em] text-[#7d8890] uppercase">
                所在城市
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <input
              className="h-13 w-full rounded-[18px] border border-[#e1ddd7] bg-[#fbfaf8] px-4 text-[15px] text-[#23313a] outline-none transition focus:border-[#bfd2e1] focus:ring-4 focus:ring-[#bfd2e1]/30"
              onChange={(event) => setProfileCityDraft(event.target.value)}
              placeholder="请填写所在城市"
              value={profileCityDraft}
            />
            <div className="flex justify-end">
              <Button
                className="h-11 rounded-full bg-[#486782] px-5 text-white hover:bg-[#3e5f79]"
                disabled={!profileCityDraft.trim() || busyKey === "profile-save"}
                onClick={() => void saveProfileCity()}
              >
                {busyKey === "profile-save" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                保存城市
              </Button>
            </div>
          </div>
        </div>
      </DashboardDialog>
    </>
  );
}
