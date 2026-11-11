<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NH3,
  NInput,
  NModal,
  NQrCode,
  NSpace,
  NSteps,
  NStep,
  NText,
  useMessage,
} from "naive-ui";
import UiIcon from "./UiIcon.vue";
import { invalidateOtherSessions, maskedPhone, state } from "./store";

const props = defineProps<{ mode: string; show: boolean }>();
const emit = defineEmits<{ "update:show": [boolean] }>();
const toast = useMessage();
const phone = ref("");
const otp = ref("");
const step = ref(1);
const seconds = ref(0);
const sent = ref(false);
const sentAt = ref(0);
const verifiedPhone = ref("");
const error = ref("");
const busy = ref(false);
const authorized = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;
const title = computed(
  () =>
    ({ phone: "更换绑定手机号", bind: "绑定微信", unbind: "解绑微信", rebind: "更换绑定微信" })[
      props.mode
    ] || "安全验证",
);
watch(
  () => props.show,
  () => {
    phone.value = "";
    otp.value = "";
    step.value = 1;
    error.value = "";
    seconds.value = 0;
    sent.value = false;
    sentAt.value = 0;
    verifiedPhone.value = "";
    authorized.value = false;
    clearInterval(timer);
  },
);
function send() {
  if (props.mode === "phone" && step.value === 2 && !/^1[3-9]\d{9}$/.test(phone.value)) {
    error.value = "请输入有效的 11 位手机号";
    return;
  }
  sent.value = true;
  sentAt.value = Date.now();
  verifiedPhone.value =
    props.mode === "phone" && step.value === 2 ? phone.value : state.profile.phone;
  seconds.value = 60;
  error.value = "";
  toast.info("演示验证码为 123456，不会发送真实短信");
  timer = setInterval(() => {
    if (--seconds.value <= 0) clearInterval(timer);
  }, 1000);
}
async function submit() {
  if (props.mode === "bind") {
    if (!authorized.value) {
      error.value = "请先完成模拟微信授权";
      return;
    }
    state.profile.wechat = true;
  } else {
    if (!sent.value || otp.value !== "123456") {
      error.value = sent.value ? "验证码错误，演示验证码为 123456" : "请先获取验证码";
      return;
    }
    if (Date.now() - sentAt.value > 300000) {
      error.value = "验证码已过期，请重新获取";
      return;
    }
    if (props.mode === "phone" && step.value === 2 && verifiedPhone.value !== phone.value) {
      error.value = "手机号已变更，请重新获取验证码";
      return;
    }
    if (props.mode === "phone" && step.value === 1) {
      step.value = 2;
      otp.value = "";
      sent.value = false;
      seconds.value = 0;
      error.value = "";
      clearInterval(timer);
      return;
    }
    if (props.mode === "phone") {
      if (!/^1[3-9]\d{9}$/.test(phone.value)) {
        error.value = "请输入有效的 11 位手机号";
        return;
      }
      if (phone.value === state.profile.phone) {
        error.value = "新手机号不能与当前手机号相同";
        return;
      }
      state.profile.phone = phone.value;
    }
    if (props.mode === "unbind") state.profile.wechat = false;
    if (props.mode === "rebind" && !authorized.value) {
      error.value = "请先完成新微信授权";
      return;
    }
    invalidateOtherSessions();
  }
  busy.value = true;
  await new Promise((resolve) => setTimeout(resolve, 350));
  busy.value = false;
  emit("update:show", false);
  toast.success(`${title.value}成功${props.mode !== "bind" ? "，其他设备的会话已失效" : ""}`);
}
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="title"
    class="standard-modal"
    :mask-closable="!busy"
    @update:show="emit('update:show', $event)"
  >
    <NSteps v-if="mode === 'phone'" :current="step" size="small" class="phone-steps"
      ><NStep title="验证原手机" /><NStep title="绑定新手机"
    /></NSteps>
    <template v-if="mode === 'bind' || mode === 'rebind'">
      <div class="qr-block">
        <NQrCode value="edu-connect-prototype-wechat-authorization" :size="168" /><NH3>{{
          authorized
            ? "模拟授权成功"
            : mode === "rebind"
              ? "使用新的微信扫码授权"
              : "使用微信扫码绑定账号"
        }}</NH3
        ><NText depth="3">原型演示二维码，不会发起真实微信授权</NText
        ><NButton
          secondary
          :type="authorized ? 'success' : 'primary'"
          :disabled="authorized"
          @click="
            authorized = true;
            error = '';
          "
          ><template #icon
            ><UiIcon :name="authorized ? 'CircleCheck' : 'MessageCircle'" :size="17" /></template
          >{{ authorized ? "已授权" : "模拟微信授权" }}</NButton
        >
      </div>
    </template>
    <template v-if="mode !== 'bind'">
      <NAlert
        :type="mode === 'unbind' ? 'warning' : 'info'"
        :bordered="false"
        class="security-alert"
        >{{
          mode === "unbind"
            ? "解绑后将无法通过此微信登录。您仍可使用手机号登录，其他设备的会话将失效。"
            : mode === "phone" && step === 2
              ? "请填写新手机号并验证，变更后将用于接收通知和登录。"
              : `为保护账号安全，请验证当前绑定的手机号 ${maskedPhone}。`
        }}</NAlert
      >
      <NForm label-placement="top">
        <NFormItem v-if="mode === 'phone' && step === 2" label="新手机号" required
          ><NInput v-model:value="phone" :maxlength="11" placeholder="请输入新的 11 位手机号"
        /></NFormItem>
        <NFormItem v-else label="当前手机号"><NInput :value="maskedPhone" disabled /></NFormItem>
        <NFormItem label="验证码" required
          ><div class="otp-input">
            <NInput
              v-model:value="otp"
              :maxlength="6"
              placeholder="请输入 6 位验证码"
              @update:value="error = ''"
            /><NButton :disabled="seconds > 0" @click="send">{{
              seconds > 0 ? `${seconds}s 后重试` : "获取验证码"
            }}</NButton>
          </div></NFormItem
        >
      </NForm>
    </template>
    <NText v-if="error" type="error">{{ error }}</NText>
    <template #footer
      ><NSpace justify="end"
        ><NButton :disabled="busy" @click="emit('update:show', false)">取消</NButton
        ><NButton :type="mode === 'unbind' ? 'error' : 'primary'" :loading="busy" @click="submit">{{
          mode === "phone" && step === 1 ? "下一步" : "确认"
        }}</NButton></NSpace
      ></template
    >
  </NModal>
</template>
