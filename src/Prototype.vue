<script setup lang="ts">
import { onMounted } from "vue";
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NGlobalStyle,
  zhCN,
  dateZhCN,
} from "naive-ui";
import { theme } from "./theme";
import EducationApp from "./EducationApp.vue";

// Share the configured Naive UI tokens with teleported dialogs and drawers.
onMounted(() => {
  document.documentElement.lang = "zh-CN";
  Object.entries(theme.common || {}).forEach(([name, value]) => {
    if (typeof value === "string") {
      document.documentElement.style.setProperty(
        `--${name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`,
        value,
      );
    }
  });
});
</script>

<template>
  <NConfigProvider :theme-overrides="theme" :locale="zhCN" :date-locale="dateZhCN">
    <NGlobalStyle />
    <NMessageProvider placement="top">
      <NDialogProvider><EducationApp /></NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
