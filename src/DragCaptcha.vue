<script setup lang="ts">
import { computed, onUnmounted, ref, useId, watch } from "vue";
import { NButton, NModal, NText } from "naive-ui";
import UiIcon from "./UiIcon.vue";

const show = defineModel<boolean>("show", { default: false });
const emit = defineEmits<{ verified: [] }>();
const track = ref<HTMLDivElement | null>(null);
const handle = ref<HTMLDivElement | null>(null);
const progress = ref(0);
const targetX = ref(190);
const phase = ref<"ready" | "dragging" | "error" | "success">("ready");
const pieceX = computed(() => 10 + progress.value * 244);
const piecePath = "M0 8H16C16-2 32-2 32 8H48V24C58 24 58 40 48 40V56H0V40C10 40 10 24 0 24Z";
const id = useId();
const artId = `captcha-art-${id}`;
const clipId = `captcha-clip-${id}`;
const status = computed(() =>
  phase.value === "success"
    ? "验证成功，正在发送验证码"
    : phase.value === "error"
      ? "未对准缺口，请重新拖动"
      : "按住滑块，拖动拼图块对准缺口",
);
let activePointer: number | null = null;
let startX = 0;
let startProgress = 0;
let completionTimer: ReturnType<typeof setTimeout> | undefined;

function releasePointer() {
  const pointer = activePointer;
  activePointer = null;
  if (pointer !== null && handle.value?.hasPointerCapture(pointer))
    handle.value.releasePointerCapture(pointer);
}
function clearCompletion() {
  clearTimeout(completionTimer);
  completionTimer = undefined;
}
function reset() {
  clearCompletion();
  releasePointer();
  progress.value = 0;
  phase.value = "ready";
  targetX.value = 158 + Math.floor(Math.random() * 84);
}
watch(
  show,
  (visible) => {
    if (visible) reset();
    else {
      clearCompletion();
      releasePointer();
    }
  },
  { flush: "sync", immediate: true },
);
onUnmounted(() => {
  clearCompletion();
  releasePointer();
});

function startDrag(event: PointerEvent) {
  if (phase.value === "success" || activePointer !== null || event.button !== 0) return;
  event.preventDefault();
  startX = event.clientX;
  startProgress = progress.value;
  activePointer = event.pointerId;
  handle.value?.setPointerCapture(event.pointerId);
  phase.value = "dragging";
}
function moveDrag(event: PointerEvent) {
  if (activePointer !== event.pointerId || !track.value || !handle.value) return;
  const travel = track.value.clientWidth - handle.value.offsetWidth;
  if (travel <= 0) return;
  progress.value = Math.min(1, Math.max(0, startProgress + (event.clientX - startX) / travel));
}
function verify() {
  if (phase.value === "success") return;
  if (Math.abs(pieceX.value - targetX.value) > 6) {
    progress.value = 0;
    phase.value = "error";
    return;
  }
  progress.value = (targetX.value - 10) / 244;
  phase.value = "success";
  completionTimer = setTimeout(() => {
    if (!show.value) return;
    emit("verified");
    show.value = false;
  }, 650);
}
function finishDrag(event: PointerEvent) {
  if (activePointer !== event.pointerId) return;
  moveDrag(event);
  releasePointer();
  verify();
}
function cancelDrag(event: PointerEvent) {
  if (activePointer !== event.pointerId) return;
  releasePointer();
  progress.value = 0;
  phase.value = "ready";
}
function onKeydown(event: KeyboardEvent) {
  if (phase.value === "success") return;
  const delta = { ArrowLeft: -0.01, ArrowRight: 0.01, PageDown: -0.1, PageUp: 0.1 }[event.key];
  if (delta !== undefined || ["Home", "End", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    if (event.key === "Enter" || event.key === " ") verify();
    else {
      phase.value = "ready";
      progress.value =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? 1
            : Math.min(1, Math.max(0, progress.value + (delta ?? 0)));
    }
  }
}
</script>

<template>
  <NModal v-model:show="show" preset="card" title="安全验证" class="captcha-modal">
    <div class="captcha-intro">
      <div class="captcha-shield"><UiIcon name="ShieldCheck" :size="21" /></div>
      <div>
        <NText strong>请完成拖拽验证</NText>
        <div><NText depth="3">拖动下方滑块，使拼图块与缺口重合</NText></div>
      </div>
    </div>
    <svg
      class="captcha-scene"
      viewBox="0 0 320 160"
      role="img"
      aria-label="将左侧拼图块拖到右侧缺口"
    >
      <defs>
        <g :id="artId">
          <rect width="320" height="160" fill="#e9f0ff" />
          <circle cx="265" cy="34" r="19" fill="#ffdb9b" />
          <path d="M0 103Q54 43 116 104Q168 53 231 96Q283 65 320 99V160H0Z" fill="#c5d8f2" />
          <path d="M0 128Q90 76 160 119Q254 80 320 118V160H0Z" fill="#9fbebd" />
          <path
            d="M52 141V70H115V141M114 141V49H208V141M207 141V83H269V141"
            fill="#fbfcff"
            stroke="#b6c9e7"
            stroke-width="2"
          />
          <path d="M104 49L161 22L218 49Z" fill="#6b8bd1" />
          <path
            d="M65 84H76M90 84H101M65 101H76M90 101H101M65 118H76M90 118H101M130 65H142M154 65H167M179 65H191M130 83H142M154 83H167M179 83H191M130 101H142M154 101H167M179 101H191M222 96H234M248 96H258M222 114H234M248 114H258"
            stroke="#8eafda"
            stroke-width="7"
          />
          <path d="M149 141V119H172V141" fill="#6b8bd1" />
          <path d="M0 142H320V160H0Z" fill="#83a7a1" />
          <path d="M143 160L150 142H171L182 160Z" fill="#dce5e0" />
          <path d="M29 76V143M291 86V143" stroke="#7e9c98" stroke-width="4" />
          <circle cx="29" cy="87" r="20" fill="#85b0a5" />
          <circle cx="291" cy="99" r="20" fill="#85b0a5" />
          <path
            d="M23 35H56M40 27H70M226 52H252"
            stroke="#fff"
            stroke-width="7"
            stroke-linecap="round"
          />
        </g>
        <clipPath :id="clipId">
          <path :d="piecePath" :transform="`translate(${targetX} 48)`" />
        </clipPath>
      </defs>
      <use :href="`#${artId}`" />
      <path
        class="captcha-target"
        :d="piecePath"
        :transform="`translate(${targetX} 48)`"
        fill="#26334d"
        fill-opacity=".5"
        stroke="#fff"
        stroke-opacity=".9"
        stroke-width="1.5"
      />
      <g :transform="`translate(${pieceX - targetX} 0)`">
        <g :clip-path="`url(#${clipId})`"><use :href="`#${artId}`" /></g>
        <path
          class="captcha-piece"
          :d="piecePath"
          :transform="`translate(${targetX} 48)`"
          fill="none"
          stroke="#fff"
          stroke-width="2"
        />
      </g>
    </svg>
    <div ref="track" class="captcha-track" :class="`is-${phase}`">
      <div
        class="captcha-track-fill"
        :style="{ width: `calc(${progress * 100}% + ${(1 - progress) * 44}px)` }"
      ></div>
      <span class="captcha-track-label">{{
        phase === "success" ? "验证通过" : "向右拖动滑块"
      }}</span>
      <div
        ref="handle"
        class="captcha-handle"
        role="slider"
        tabindex="0"
        aria-label="拖动滑块完成拼图验证"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="Math.round(progress * 100)"
        :aria-valuetext="`${Math.round(progress * 100)}%，${status}`"
        :aria-disabled="phase === 'success'"
        :style="{ left: `calc(${progress * 100}% - ${progress * 44}px)` }"
        @pointerdown="startDrag"
        @pointermove="moveDrag"
        @pointerup="finishDrag"
        @pointercancel="cancelDrag"
        @lostpointercapture="cancelDrag"
        @keydown="onKeydown"
      >
        <UiIcon :name="phase === 'success' ? 'Check' : 'ArrowRight'" :size="21" />
      </div>
    </div>
    <div class="captcha-status-row">
      <span role="status" aria-live="polite" class="captcha-status" :class="`is-${phase}`">
        <UiIcon v-if="phase === 'success'" name="CircleCheck" :size="15" />{{ status }}
      </span>
      <NButton text :disabled="phase === 'success'" aria-label="刷新拼图" @click="reset"
        ><UiIcon name="RefreshCw" :size="16"
      /></NButton>
    </div>
    <NText depth="3" class="captcha-demo-note"
      >原型演示：仅模拟拖拽验证，不具备真实人机识别能力，不会发送真实短信。</NText
    >
  </NModal>
</template>

<style scoped>
.captcha-intro {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}
.captcha-intro > div > div {
  font-size: 12px;
  margin-top: 3px;
}
.captcha-shield {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex: none;
  color: var(--primary-color);
  background: var(--blue-soft);
  border-radius: 12px;
}
.captcha-scene {
  display: block;
  width: 100%;
  border-radius: 7px;
  border: 1px solid var(--border-color);
}
.captcha-piece {
  filter: drop-shadow(0 2px 3px rgb(38 51 77 / 30%));
}
.captcha-track {
  height: 46px;
  position: relative;
  margin-top: 18px;
  background: var(--hover-color);
  border: 1px solid var(--border-color);
  border-radius: 7px;
  user-select: none;
}
.captcha-track-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--blue-soft);
  border-radius: 6px;
}
.captcha-track-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  font-size: 12px;
  color: var(--text-color-3);
}
.captcha-handle {
  position: absolute;
  top: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--card-color);
  color: var(--primary-color);
  box-shadow: 0 1px 6px rgb(38 51 77 / 13%);
  cursor: grab;
  touch-action: none;
}
.is-dragging .captcha-handle {
  cursor: grabbing;
}
.captcha-track.is-success {
  border-color: var(--success-color);
}
.is-success .captcha-track-fill {
  background: var(--green-soft);
}
.is-success .captcha-handle,
.is-success .captcha-track-label,
.captcha-status.is-success {
  color: var(--success-color);
}
.captcha-status.is-error {
  color: var(--error-color);
}
.captcha-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 42px;
}
.captcha-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-color-2);
  font-size: 12px;
}
.captcha-demo-note {
  display: block;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
  font-size: 11px;
  line-height: 1.8;
}
</style>
