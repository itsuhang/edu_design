<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import {
  NAlert,
  NAvatar,
  NButton,
  NCheckbox,
  NForm,
  NFormItem,
  NH1,
  NH2,
  NH3,
  NInput,
  NModal,
  NP,
  NQrCode,
  NSpace,
  NTab,
  NTabs,
  NTag,
  NText,
  useMessage,
} from "naive-ui";
import UiIcon from "./UiIcon.vue";
import DragCaptcha from "./DragCaptcha.vue";
import { maskedPhone, navigate, state } from "./store";

const toast = useMessage();
const mode = ref("password");
const phone = ref("");
const password = ref("");
const otp = ref("");
const consent = ref(false);
const errors = ref<Record<string, string>>({});
const busy = ref(false);
const countdown = ref(0);
const sentAt = ref(0);
const captchaShow = ref(false);
let captchaPhone = "";
const qrSeconds = ref(120);
const qrVersion = ref(1);
const attempts = ref(0);
const locked = ref(0);
const agreement = ref("");
const passwordRecoveryReview = ref(false);
const identities = [
  {
    role: "平台管理员",
    organization: "杭州市教育服务中心",
    description: "平台运营与综合服务管理",
    icon: "LayoutGrid",
    tone: "blue",
    valid: true,
  },
  {
    role: "教育局管理员",
    organization: "杭州市教育局",
    description: "辖区教育业务与学校管理",
    icon: "House",
    tone: "violet",
    valid: true,
  },
  {
    role: "学校管理员",
    organization: "杭州市实验小学",
    description: "学校业务与家校协同管理",
    icon: "GraduationCap",
    tone: "green",
    valid: true,
  },
  {
    role: "机构教师",
    organization: "杭州启明教育科技有限公司",
    description: "该身份已停用，请联系组织管理员",
    icon: "UsersRound",
    tone: "gray",
    valid: false,
  },
];
const chosen = ref(
  Math.max(
    0,
    identities.findIndex((identity) => identity.role === state.identity),
  ),
);
const loginPage = computed(() => state.path === "/login");
const timer = setInterval(() => {
  if (countdown.value > 0) countdown.value--;
  if (qrSeconds.value > 0) qrSeconds.value--;
  if (locked.value > 0) locked.value--;
}, 1000);
onUnmounted(() => clearInterval(timer));
watch(
  phone,
  () => {
    captchaShow.value = false;
    sentAt.value = 0;
    countdown.value = 0;
    otp.value = "";
    delete errors.value.otp;
  },
  { flush: "sync" },
);
watch(
  [mode, () => state.path],
  () => {
    captchaShow.value = false;
  },
  { flush: "sync" },
);
function sendOtp() {
  if (countdown.value > 0 || mode.value !== "sms" || !loginPage.value || busy.value) return;
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    errors.value.phone = "请输入有效的 11 位手机号";
    return;
  }
  delete errors.value.phone;
  captchaPhone = phone.value;
  captchaShow.value = true;
}
function sendVerifiedOtp() {
  if (
    phone.value !== captchaPhone ||
    mode.value !== "sms" ||
    !loginPage.value ||
    countdown.value > 0
  )
    return;
  sentAt.value = Date.now();
  countdown.value = 60;
  otp.value = "";
  delete errors.value.otp;
  toast.info("演示验证码为 123456，5 分钟内有效，不会发送真实短信");
}
async function login(qr = false) {
  const validation: Record<string, string> = {};
  if (!consent.value) validation.consent = "请先阅读并同意用户协议和隐私政策";
  if (!qr) {
    if (!/^1[3-9]\d{9}$/.test(phone.value)) validation.phone = "请输入有效的 11 位手机号";
    if (mode.value === "password") {
      if (password.value.length < 10 || password.value.length > 64)
        validation.password = "密码长度应为 10–64 位";
      else if (password.value !== state.demoPassword || phone.value !== state.profile.phone)
        validation.password = "演示账号或密码错误，可点击下方填入演示账号";
    } else if (!sentAt.value) validation.otp = "请先获取验证码";
    else if (Date.now() - sentAt.value > 300000) validation.otp = "验证码已过期，请重新获取";
    else if (otp.value !== "123456") validation.otp = "验证码错误，演示验证码为 123456";
  } else if (qrSeconds.value <= 0) validation.qr = "二维码已过期，请刷新";
  errors.value = validation;
  if (Object.keys(validation).length) {
    if (validation.password && ++attempts.value >= 5) {
      locked.value = 30;
      attempts.value = 0;
    }
    return;
  }
  busy.value = true;
  await new Promise((resolve) => setTimeout(resolve, 450));
  busy.value = false;
  toast.success("演示登录成功，请选择工作身份");
  navigate("/select-identity");
}
function fillDemo() {
  phone.value = state.profile.phone;
  password.value = state.demoPassword;
  otp.value = "123456";
  consent.value = true;
  mode.value = "password";
  errors.value = {};
  toast.info("已填入演示账号，点击登录即可体验");
}
async function enterIdentity() {
  const identity = identities[chosen.value];
  if (!identity.valid) return;
  busy.value = true;
  await new Promise((resolve) => setTimeout(resolve, 350));
  state.identity = identity.role;
  state.organization = identity.organization;
  state.sessions[0].active = true;
  busy.value = false;
  toast.success(`已进入${identity.organization} · ${identity.role}`);
  navigate("/messages/inbox");
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-brand">
      <div class="brand-mark"><UiIcon name="GraduationCap" :size="28" /></div>
      <NText strong>综合教育平台</NText><span>EDU CONNECT</span>
    </div>
    <NButton quaternary class="auth-back" @click="navigate('/messages/inbox')"
      ><UiIcon name="ArrowLeft" :size="16" /> 返回原型预览</NButton
    >
    <div class="auth-main">
      <div class="auth-story">
        <div class="auth-eyebrow"><span></span> 连接教育的每一种可能</div>
        <NH1>让教育更有连接<br />让成长更有力量<span>。</span></NH1>
        <NP>一个平台，连接学校、教师、机构与家庭。<br />以高效协同，守护每一次成长。</NP>
        <div class="auth-art" aria-hidden="true">
          <div class="orbit orbit-one"></div>
          <div class="orbit orbit-two"></div>
          <div class="art-center"><UiIcon name="GraduationCap" :size="82" /></div>
          <div class="art-node art-node-one"><UiIcon name="BookOpen" :size="30" /></div>
          <div class="art-node art-node-two"><UiIcon name="UsersRound" :size="28" /></div>
          <div class="art-node art-node-three"><UiIcon name="ShieldCheck" :size="28" /></div>
          <div class="art-note">
            <div class="art-note-check"><UiIcon name="Check" :size="17" /></div>
            <span>协同共育，向新而行</span>
          </div>
        </div>
        <div class="auth-values">
          <div><UiIcon name="LayoutGrid" :size="19" /><span>一体化协同</span></div>
          <div><UiIcon name="UsersRound" :size="19" /><span>多角色管理</span></div>
          <div><UiIcon name="ShieldCheck" :size="19" /><span>全链路保障</span></div>
        </div>
      </div>
      <div class="auth-form-card" :class="{ 'identity-form-card': !loginPage }">
        <template v-if="loginPage">
          <div class="login-heading">
            <NH2>欢迎回来</NH2><NText depth="3">登录综合教育平台，开启高效工作的一天</NText>
          </div>
          <NTabs
            v-model:value="mode"
            type="line"
            justify-content="space-between"
            class="login-tabs"
            @update:value="errors = {}"
            ><NTab name="password">密码登录</NTab><NTab name="sms">验证码登录</NTab
            ><NTab name="wechat">微信扫码</NTab></NTabs
          >
          <NForm
            v-if="mode !== 'wechat'"
            label-placement="top"
            class="login-form"
            @submit.prevent="login()"
          >
            <NFormItem
              label="手机号"
              :feedback="errors.phone"
              :validation-status="errors.phone ? 'error' : undefined"
              ><NInput
                v-model:value="phone"
                size="large"
                placeholder="请输入手机号"
                :maxlength="11"
                @update:value="delete errors.phone"
                ><template #prefix><UiIcon name="Smartphone" :size="18" /></template></NInput
            ></NFormItem>
            <NFormItem
              v-if="mode === 'password'"
              label="密码"
              :feedback="errors.password"
              :validation-status="errors.password ? 'error' : undefined"
              ><NInput
                v-model:value="password"
                size="large"
                type="password"
                show-password-on="click"
                placeholder="请输入密码"
                :maxlength="64"
                @keydown.enter="login()"
                @update:value="delete errors.password"
                ><template #prefix><UiIcon name="LockKeyhole" :size="18" /></template></NInput
            ></NFormItem>
            <NFormItem
              v-else
              label="验证码"
              :feedback="errors.otp"
              :validation-status="errors.otp ? 'error' : undefined"
              ><div class="otp-input">
                <NInput
                  v-model:value="otp"
                  size="large"
                  placeholder="请输入 6 位验证码"
                  :maxlength="6"
                  @keydown.enter="login()"
                  @update:value="delete errors.otp"
                /><NButton
                  size="large"
                  :disabled="countdown > 0"
                  aria-haspopup="dialog"
                  :aria-expanded="captchaShow"
                  @click="sendOtp"
                  >{{ countdown ? `${countdown}s 后重试` : "发送验证码" }}</NButton
                >
              </div></NFormItem
            >
            <div v-if="mode === 'password'" class="forgot-row">
              <NText depth="3">安全登录，安心使用</NText
              ><NButton
                text
                type="primary"
                class="forgot-password-review"
                title="文档缺项：必要功能建议，待产品确认。点击查看对齐事项。"
                aria-haspopup="dialog"
                :aria-expanded="passwordRecoveryReview"
                @click="passwordRecoveryReview = true"
                ><span class="requirement-gap-marker"
                  ><NText strong>忘记密码？（缺！）</NText></span
                ></NButton
              >
            </div>
          </NForm>
          <div v-else class="qr-login">
            <div class="qr-code-wrap" :class="{ expired: qrSeconds <= 0 }">
              <NQrCode :value="`edu-connect-prototype-login-${qrVersion}`" :size="180" />
              <div v-if="qrSeconds <= 0" class="qr-expired">
                <NButton
                  type="primary"
                  @click="
                    qrSeconds = 120;
                    qrVersion++;
                  "
                  >刷新二维码</NButton
                >
              </div>
            </div>
            <NText>请使用微信扫一扫，安全快捷登录</NText
            ><NText depth="3"
              >演示二维码 · {{ qrSeconds > 0 ? `${qrSeconds} 秒后过期` : "已过期" }}</NText
            ><NText v-if="errors.qr" type="error">{{ errors.qr }}</NText>
          </div>
          <div class="consent-row">
            <NCheckbox v-model:checked="consent" @update:checked="delete errors.consent" /><NText
              depth="3"
              >我已阅读并同意
              <NButton text type="primary" @click="agreement = '用户协议'">《用户协议》</NButton> 和
              <NButton text type="primary" @click="agreement = '隐私政策'"
                >《隐私政策》</NButton
              ></NText
            >
          </div>
          <NText v-if="errors.consent" type="error" class="consent-error">{{
            errors.consent
          }}</NText>
          <NButton
            type="primary"
            size="large"
            block
            :loading="busy"
            :disabled="locked > 0"
            class="login-submit"
            @click="login(mode === 'wechat')"
            >{{
              locked > 0
                ? `请 ${locked} 秒后重试`
                : mode === "wechat"
                  ? "模拟扫码授权登录"
                  : "登 录"
            }}<UiIcon name="ArrowRight" :size="18"
          /></NButton>
          <div class="demo-login">
            <span>仅用于产品原型演示</span
            ><NButton text type="primary" @click="fillDemo">填入演示账号</NButton>
          </div>
          <div class="login-safe">
            <UiIcon name="ShieldCheck" :size="15" /> 您的信息将受到严格的安全保护
          </div>
        </template>
        <template v-else>
          <div class="identity-welcome">
            <NAvatar
              round
              :size="44"
              :src="state.profile.avatar || undefined"
              class="user-avatar"
              >{{ state.profile.nickname.slice(-1) }}</NAvatar
            >
            <div>
              <NText strong>你好，{{ state.profile.nickname }}</NText>
              <div>
                <NText depth="3">{{ maskedPhone }}</NText>
              </div>
            </div>
            <NButton text type="primary" @click="navigate('/login')">退出</NButton>
          </div>
          <NH2>选择您的工作身份</NH2><NText depth="3">您拥有多个身份，请选择本次使用的身份</NText>
          <div class="identity-list">
            <NButton
              v-for="(identity, index) in identities"
              :key="identity.role"
              block
              :disabled="!identity.valid"
              class="identity-card"
              :class="{ chosen: chosen === index }"
              @click="chosen = index"
              ><div class="identity-card-icon" :class="identity.tone">
                <UiIcon :name="identity.icon" :size="24" />
              </div>
              <div class="identity-card-copy">
                <div>
                  <NText strong>{{ identity.role }}</NText
                  ><NTag v-if="!identity.valid" size="small" :bordered="false">已停用</NTag
                  ><NTag
                    v-else-if="identity.role === state.identity"
                    size="small"
                    type="primary"
                    :bordered="false"
                    >最近使用</NTag
                  >
                </div>
                <NText depth="2">{{ identity.organization }}</NText
                ><NText depth="3">{{ identity.description }}</NText>
              </div>
              <div v-if="identity.valid" class="identity-radio">
                <UiIcon v-if="chosen === index" name="Check" :size="13" /></div
            ></NButton>
          </div>
          <NButton type="primary" size="large" block :loading="busy" @click="enterIdentity"
            >进入工作空间 <UiIcon name="ArrowRight" :size="18"
          /></NButton>
          <div class="identity-refresh">
            <NText depth="3">没有找到所需身份？</NText
            ><NButton
              text
              type="primary"
              @click="toast.success('身份列表已刷新，当前共有 3 个有效身份')"
              ><UiIcon name="RefreshCw" :size="14" />刷新身份</NButton
            >
          </div>
        </template>
      </div>
    </div>
    <footer class="auth-footer">
      © 2026 综合教育平台 <span>让教育管理更简单</span
      ><NButton text @click="toast.info('服务咨询：0571-8700 1234')">帮助与支持</NButton>
    </footer>
    <DragCaptcha v-model:show="captchaShow" @verified="sendVerifiedOtp" />
    <NModal
      v-model:show="passwordRecoveryReview"
      preset="card"
      title="产品待对齐：忘记密码"
      class="standard-modal password-recovery-review"
    >
      <NTag type="error" :bordered="false">文档缺项 · 建议补充 · 待产品确认</NTag>
      <NP>
        C01-01 登录文档未定义密码找回流程。C02-02「修改密码」需要原密码，页面清单中的
        P15-01「用户管理」提供管理员重置密码，但均不等同于登录页的自助找回。
      </NP>
      <NAlert type="warning" :bordered="false">
        此入口是原型中的必要功能建议，不代表已确认需求；当前未实现密码找回，也不会调用接口。
      </NAlert>
      <NH3>建议补充原因</NH3>
      <NP>用户忘记原密码时，需要明确的账号恢复路径，避免无法登录或误用「修改密码」。</NP>
      <NH3>待产品确认事项</NH3>
      <NP>1. 找回方式：手机号验证码验证后自助重置，还是由组织管理员协助？</NP>
      <NP>2. 安全规则：身份校验、验证码有效期与错误次数限制如何定义？</NP>
      <NP>3. 完成行为：密码强度要求、其他设备会话是否失效、是否返回登录？</NP>
      <NP>4. 需求补齐：确认适用角色、页面流程及接口契约，再补充到需求文档。</NP>
      <template #footer>
        <NSpace justify="end"
          ><NButton type="primary" @click="passwordRecoveryReview = false"
            >关闭提示</NButton
          ></NSpace
        >
      </template>
    </NModal>
    <NModal
      :show="!!agreement"
      preset="card"
      :title="agreement"
      class="standard-modal"
      @update:show="agreement = ''"
      ><NH3>综合教育平台{{ agreement }}（原型示意）</NH3
      ><NP>欢迎使用综合教育平台。平台提供教育业务协同、通知消息、账号管理和文件服务。</NP
      ><NP
        >我们将遵循合法、正当、必要原则处理您的账号信息，仅在您的身份权限范围内展示业务数据。请妥善保管账号，不得将平台信息用于未经授权的用途。</NP
      ><NP
        >当前为产品原型，所有数据仅用于演示，不会接入真实业务服务。正式上线的协议将以运营主体审核发布版本为准。</NP
      ><template #footer
        ><NSpace justify="end"
          ><NButton
            type="primary"
            @click="
              consent = true;
              agreement = '';
              delete errors.consent;
            "
            >阅读并同意</NButton
          ></NSpace
        ></template
      ></NModal
    >
  </div>
</template>
