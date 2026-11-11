<script setup lang="ts">
import { computed, h, ref } from "vue";
import {
  NAlert,
  NAvatar,
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NForm,
  NFormItem,
  NH2,
  NH3,
  NInput,
  NModal,
  NP,
  NProgress,
  NSpace,
  NTag,
  NText,
  NUpload,
  useDialog,
  useMessage,
  type DataTableColumns,
  type UploadFileInfo,
} from "naive-ui";
import UiIcon from "./UiIcon.vue";
import SecurityDialog from "./SecurityDialog.vue";
import { currentPage, invalidateOtherSessions, maskedPhone, navigate, state } from "./store";

const toast = useMessage();
const dialog = useDialog();
const editShow = ref(false);
const draftName = ref("");
const draftAvatar = ref("");
const editError = ref("");
const saving = ref(false);
const securityShow = ref(false);
const securityMode = ref("phone");
const oldPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const passwordErrors = ref<Record<string, string>>({});
const passwordBusy = ref(false);
const reason = ref("");
const isProfile = computed(() => state.path === "/account/profile");
const isPassword = computed(() => state.path === "/account/password");
const activeSessions = computed(() => state.sessions.filter((s) => s.active).length);
const passwordChecks = computed(() => [
  {
    label: "长度为 10–64 位",
    valid: newPassword.value.length >= 10 && newPassword.value.length <= 64,
  },
  {
    label: "包含大写字母、小写字母、数字、特殊符号中的至少 3 类",
    valid:
      [/[A-Z]/, /[a-z]/, /\d/, /[^a-zA-Z0-9]/].filter((r) => r.test(newPassword.value)).length >= 3,
  },
  {
    label: "新密码不能与原密码相同",
    valid: !!newPassword.value && newPassword.value !== oldPassword.value,
  },
]);
const strength = computed(() => passwordChecks.value.filter((c) => c.valid).length * 33.34);
const accountLinks = [
  { path: "/account/profile", label: "个人资料", icon: "UserRound" },
  { path: "/account/password", label: "修改密码", icon: "LockKeyhole" },
  { path: "/account/sessions", label: "登录设备", icon: "Monitor" },
];
function edit() {
  draftName.value = state.profile.nickname;
  draftAvatar.value = state.profile.avatar;
  editError.value = "";
  editShow.value = true;
}
async function save() {
  if (draftName.value.trim().length < 2 || draftName.value.trim().length > 30) {
    editError.value = "昵称长度应为 2–30 个字符";
    return;
  }
  saving.value = true;
  await new Promise((resolve) => setTimeout(resolve, 350));
  state.profile.nickname = draftName.value.trim();
  state.profile.avatar = draftAvatar.value;
  saving.value = false;
  editShow.value = false;
  toast.success("个人资料已更新，全局生效");
}
function avatarUpload({ file }: { file: UploadFileInfo }) {
  if (!file.file) return false;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.file.type)) {
    toast.error("请选择 JPG、PNG 或 WebP 图片");
    return false;
  }
  if (file.file.size > 5 * 1024 * 1024) {
    toast.error("头像图片不能超过 5 MB");
    return false;
  }
  const reader = new FileReader();
  reader.onload = () => {
    draftAvatar.value = String(reader.result);
  };
  reader.readAsDataURL(file.file);
  return false;
}
function openSecurity(mode: string) {
  securityMode.value = mode;
  securityShow.value = true;
}
async function changePassword() {
  const errors: Record<string, string> = {};
  if (oldPassword.value !== state.demoPassword)
    errors.old = "原密码不正确；初始演示密码为 Edu@2026Demo，修改后请使用新密码";
  if (!passwordChecks.value.every((c) => c.valid)) errors.new = "新密码不符合安全要求";
  if (confirmPassword.value !== newPassword.value || !confirmPassword.value)
    errors.confirm = "两次输入的密码不一致";
  passwordErrors.value = errors;
  if (Object.keys(errors).length) return;
  passwordBusy.value = true;
  await new Promise((resolve) => setTimeout(resolve, 450));
  state.demoPassword = newPassword.value;
  invalidateOtherSessions();
  oldPassword.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  passwordBusy.value = false;
  toast.success("密码修改成功，其他设备的登录会话已失效（演示）");
}
function logoutSession(session?: (typeof state.sessions)[number], all = false) {
  reason.value = "";
  dialog.warning({
    title: all ? "退出所有登录设备？" : `退出 ${session?.name}？`,
    content: () =>
      h("div", { class: "logout-dialog-body" }, [
        h(NP, null, {
          default: () =>
            all
              ? "此操作将使所有会话（包括当前设备）失效，您需要重新登录。"
              : session?.current
                ? "当前设备将退出登录，您需要重新登录后继续使用。"
                : "退出后，该设备需要重新登录才能继续访问平台。",
        }),
        h(NInput, {
          value: reason.value,
          "onUpdate:value": (v: string) => {
            reason.value = v;
          },
          placeholder: "退出原因（选填）",
          maxlength: 100,
        }),
      ]),
    positiveText: "确认退出",
    negativeText: "取消",
    onPositiveClick: () => {
      if (all)
        state.sessions.forEach((s) => {
          s.active = false;
        });
      else if (session) session.active = false;
      toast.success("设备已退出登录");
      if (all || session?.current) navigate("/login");
    },
  });
}
const sessionColumns: DataTableColumns<(typeof state.sessions)[number]> = [
  {
    title: "设备",
    key: "name",
    minWidth: 230,
    render: (row) =>
      h("div", { class: "device-cell" }, [
        h("div", { class: ["device-icon", { inactive: !row.active }] }, [
          h(UiIcon, {
            name: row.name.includes("iPhone")
              ? "Smartphone"
              : row.name.includes("iPad")
                ? "Smartphone"
                : "Laptop",
            size: 24,
          }),
        ]),
        h("div", null, [
          h(NText, { strong: true }, { default: () => row.name }),
          h("div", { class: "device-system" }, row.system),
        ]),
      ]),
  },
  {
    title: "登录 IP / 地点",
    key: "ip",
    minWidth: 160,
    render: (row) =>
      h("div", null, [h("div", null, row.ip), h("div", { class: "device-system" }, row.location)]),
  },
  { title: "最近活动时间", key: "time", width: 190 },
  {
    title: "状态",
    key: "active",
    width: 110,
    render: (row) =>
      h(
        NTag,
        {
          type: row.current && row.active ? "success" : row.active ? "info" : "default",
          bordered: false,
          size: "small",
        },
        {
          default: () =>
            row.current && row.active ? "当前设备" : row.active ? "登录中" : "已失效",
        },
      ),
  },
  {
    title: "操作",
    key: "action",
    width: 90,
    render: (row) =>
      h(
        NButton,
        { text: true, type: "error", disabled: !row.active, onClick: () => logoutSession(row) },
        { default: () => "退出" },
      ),
  },
];
</script>

<template>
  <div class="page-enter">
    <div class="page-heading">
      <div>
        <NH2>个人中心</NH2><NText depth="3">管理个人资料与账号安全，安心使用每一项服务。</NText>
      </div>
      <NTag :bordered="false" type="success"
        ><UiIcon name="ShieldCheck" :size="14" /> 账号状态正常</NTag
      >
    </div>
    <div class="account-nav">
      <NButton
        v-for="link in accountLinks"
        :key="link.path"
        :type="state.path === link.path ? 'primary' : 'default'"
        :secondary="state.path === link.path"
        :bordered="false"
        @click="navigate(link.path)"
        ><template #icon><UiIcon :name="link.icon" :size="18" /></template>{{ link.label }}</NButton
      >
    </div>
    <div v-if="isProfile" class="profile-grid">
      <NCard :bordered="false" class="profile-summary">
        <div class="profile-cover">
          <div></div>
          <span></span>
        </div>
        <NAvatar round :size="88" :src="state.profile.avatar || undefined" class="profile-avatar">{{
          state.profile.nickname.slice(-1)
        }}</NAvatar>
        <NH2>{{ state.profile.nickname }}</NH2
        ><NTag type="primary" size="small" :bordered="false">{{ state.identity }}</NTag>
        <div class="profile-org"><UiIcon name="House" :size="16" />{{ state.organization }}</div>
        <NDivider />
        <div class="profile-info-line">
          <NText depth="3">账号 ID</NText><NText>EDU202600128</NText>
        </div>
        <div class="profile-info-line">
          <NText depth="3">注册时间</NText><NText>2026-09-01</NText>
        </div>
        <div class="profile-info-line">
          <NText depth="3">最近登录</NText><NText>今天 10:45</NText>
        </div>
        <div class="profile-safe">
          <UiIcon name="ShieldCheck" :size="18" />
          <div>
            <NText strong>您的账号已受到保护</NText>
            <div>
              {{ state.profile.wechat ? "手机号与微信双重安全保障" : "已绑定手机号，建议绑定微信" }}
            </div>
          </div>
        </div>
      </NCard>
      <div class="profile-main">
        <NCard :bordered="false" title="基本资料"
          ><template #header-extra
            ><NButton type="primary" secondary size="small" @click="edit"
              >编辑资料</NButton
            ></template
          ><NDescriptions :column="2" label-placement="top" class="profile-descriptions"
            ><NDescriptionsItem label="昵称">{{ state.profile.nickname }}</NDescriptionsItem
            ><NDescriptionsItem label="手机号">{{ maskedPhone }}</NDescriptionsItem
            ><NDescriptionsItem label="当前身份">{{ state.identity }}</NDescriptionsItem
            ><NDescriptionsItem label="所属组织">{{ state.organization }}</NDescriptionsItem
            ><NDescriptionsItem label="账号状态"
              ><NTag type="success" size="small" :bordered="false">正常</NTag></NDescriptionsItem
            ><NDescriptionsItem label="资料作用范围">全部身份共享</NDescriptionsItem></NDescriptions
          ></NCard
        >
        <NCard :bordered="false" title="账号绑定"
          ><template #header-extra
            ><NText depth="3" class="small-text">登录与安全验证方式</NText></template
          >
          <div class="binding-row">
            <div class="binding-icon blue"><UiIcon name="Smartphone" :size="24" /></div>
            <div class="binding-copy">
              <NText strong>手机号</NText>
              <div>
                <NText depth="3">已绑定 {{ maskedPhone }}，用于登录与接收安全提醒</NText>
              </div>
            </div>
            <NTag :bordered="false" type="success" size="small">已绑定</NTag
            ><NButton text type="primary" @click="openSecurity('phone')">更换手机号</NButton>
          </div>
          <div class="binding-row">
            <div class="binding-icon green"><UiIcon name="MessageCircle" :size="24" /></div>
            <div class="binding-copy">
              <NText strong>微信</NText>
              <div>
                <NText depth="3">{{
                  state.profile.wechat
                    ? "已绑定微信，可使用微信扫码快捷登录"
                    : "绑定微信，享受更便捷的扫码登录体验"
                }}</NText>
              </div>
            </div>
            <NTag
              :bordered="false"
              :type="state.profile.wechat ? 'success' : 'default'"
              size="small"
              >{{ state.profile.wechat ? "已绑定" : "未绑定" }}</NTag
            ><NSpace v-if="state.profile.wechat" :size="14"
              ><NButton text type="primary" @click="openSecurity('rebind')">换绑</NButton
              ><NButton text @click="openSecurity('unbind')">解绑</NButton></NSpace
            ><NButton v-else text type="primary" @click="openSecurity('bind')">立即绑定</NButton>
          </div>
          <NAlert type="info" :bordered="false" class="binding-note"
            >个人资料在全部身份中共享。更换或解绑登录方式时，至少保留一种有效登录方式。</NAlert
          >
        </NCard>
      </div>
    </div>
    <div v-else-if="isPassword" class="password-grid">
      <NCard :bordered="false" title="修改密码">
        <NAlert type="info" :bordered="false" class="password-alert"
          >修改密码后，其他设备的登录会话将失效，当前设备保持登录。</NAlert
        >
        <NForm class="password-form" label-placement="top" @submit.prevent="changePassword">
          <NFormItem
            label="原密码"
            required
            :feedback="passwordErrors.old"
            :validation-status="passwordErrors.old ? 'error' : undefined"
            ><NInput
              v-model:value="oldPassword"
              type="password"
              show-password-on="click"
              placeholder="请输入当前密码"
              :maxlength="64"
              @update:value="delete passwordErrors.old"
          /></NFormItem>
          <NFormItem
            label="新密码"
            required
            :feedback="passwordErrors.new"
            :validation-status="passwordErrors.new ? 'error' : undefined"
            ><NInput
              v-model:value="newPassword"
              type="password"
              show-password-on="click"
              placeholder="请输入 10–64 位新密码"
              :maxlength="64"
              @update:value="delete passwordErrors.new"
          /></NFormItem>
          <div v-if="newPassword" class="password-strength">
            <NProgress
              type="line"
              :percentage="strength"
              :show-indicator="false"
              :status="strength > 99 ? 'success' : 'warning'"
            /><NText depth="3"
              >密码强度：{{ strength > 99 ? "强" : strength > 60 ? "中" : "弱" }}</NText
            >
          </div>
          <NFormItem
            label="确认新密码"
            required
            :feedback="passwordErrors.confirm"
            :validation-status="passwordErrors.confirm ? 'error' : undefined"
            ><NInput
              v-model:value="confirmPassword"
              type="password"
              show-password-on="click"
              placeholder="请再次输入新密码"
              :maxlength="64"
              @update:value="delete passwordErrors.confirm"
              @keydown.enter="changePassword"
          /></NFormItem>
          <NSpace
            ><NButton type="primary" :loading="passwordBusy" @click="changePassword"
              >确认修改</NButton
            ><NButton
              @click="
                oldPassword = '';
                newPassword = '';
                confirmPassword = '';
                passwordErrors = {};
              "
              >重置</NButton
            ></NSpace
          >
        </NForm>
      </NCard>
      <NCard :bordered="false" class="security-guide"
        ><div class="security-guide-icon"><UiIcon name="ShieldCheck" :size="44" /></div>
        <NH3>好密码，是安全的第一步</NH3
        ><NText depth="3">定期更新密码，为您的教育数据保驾护航。</NText><NDivider />
        <div
          v-for="check in passwordChecks"
          :key="check.label"
          class="password-check"
          :class="{ passed: check.valid }"
        >
          <UiIcon :name="check.valid ? 'CircleCheck' : 'Check'" :size="17" /><span>{{
            check.label
          }}</span>
        </div>
        <div class="demo-credential">
          <NText depth="3">初始演示密码（修改后请使用新密码）</NText>
          <div>Edu@2026Demo</div>
          <NText depth="3">请勿输入真实账号密码</NText>
        </div></NCard
      >
    </div>
    <template v-else>
      <div class="sessions-overview">
        <div class="session-overview-icon"><UiIcon name="Monitor" :size="32" /></div>
        <div>
          <NH3>当前有 {{ activeSessions }} 台设备处于登录状态</NH3
          ><NText depth="3">以下设备可访问您的账号。如发现异常设备，请及时退出并修改密码。</NText>
        </div>
        <NButton type="error" secondary @click="logoutSession(undefined, true)"
          ><template #icon><UiIcon name="LogOut" :size="17" /></template>全部退出</NButton
        >
      </div>
      <NCard :bordered="false" :title="currentPage.name" class="sessions-card"
        ><template #header-extra
          ><NText depth="3">共 {{ state.sessions.length }} 台设备</NText></template
        ><NDataTable
          :columns="sessionColumns"
          :data="state.sessions"
          :row-key="(row) => row.id"
          :bordered="false"
          :scroll-x="820"
        />
        <div class="session-note">
          <UiIcon name="ShieldCheck" :size="15" />登录 IP
          已脱敏展示。退出设备后，该设备的访问权限立即失效。
        </div></NCard
      >
    </template>
  </div>
  <NModal
    v-model:show="editShow"
    preset="card"
    title="编辑个人资料"
    class="standard-modal"
    :mask-closable="!saving"
  >
    <NForm label-placement="top"
      ><NFormItem label="头像"
        ><div class="edit-avatar">
          <NAvatar round :size="72" :src="draftAvatar || undefined" class="user-avatar">{{
            draftName.slice(-1)
          }}</NAvatar>
          <div>
            <NUpload
              :show-file-list="false"
              :on-before-upload="avatarUpload"
              accept="image/png,image/jpeg,image/webp"
              ><NButton>更换头像</NButton></NUpload
            ><NText depth="3">JPG、PNG、WebP 格式，不超过 5 MB</NText>
          </div>
        </div></NFormItem
      ><NFormItem
        label="昵称"
        required
        :feedback="editError"
        :validation-status="editError ? 'error' : undefined"
        ><NInput
          v-model:value="draftName"
          :maxlength="30"
          show-count
          placeholder="请输入 2–30 个字符"
          @update:value="editError = ''" /></NFormItem></NForm
    ><NAlert type="info" :bordered="false">修改后的昵称与头像将在您的所有身份中同步显示。</NAlert>
    <template #footer
      ><NSpace justify="end"
        ><NButton :disabled="saving" @click="editShow = false">取消</NButton
        ><NButton type="primary" :loading="saving" @click="save">保存修改</NButton></NSpace
      ></template
    >
  </NModal>
  <SecurityDialog :mode="securityMode" v-model:show="securityShow" />
</template>
