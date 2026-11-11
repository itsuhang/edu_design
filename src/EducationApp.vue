<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref, watch } from "vue";
import {
  NAvatar,
  NBadge,
  NBreadcrumb,
  NBreadcrumbItem,
  NButton,
  NDivider,
  NDrawer,
  NDrawerContent,
  NDropdown,
  NEl,
  NH3,
  NInput,
  NMenu,
  NModal,
  NSpace,
  NSwitch,
  NTag,
  NText,
  NTooltip,
  useMessage,
  type MenuOption,
} from "naive-ui";
import UiIcon from "./UiIcon.vue";
import MessagePages from "./MessagePages.vue";
import AccountPages from "./AccountPages.vue";
import AuthPages from "./AuthPages.vue";
import { routePages } from "./data";
import { currentPage, navigate, state, todoCount, unreadCount } from "./store";

const message = useMessage();
const settings = ref(false);
const mobileMenu = ref(false);
const search = ref(false);
const help = ref(false);
const searchValue = ref("");
const expanded = ref(["messages", "account"]);
const isAuth = computed(() => ["/login", "/select-identity"].includes(state.path));
watch(
  () => state.path,
  () => {
    document.title = `${currentPage.value.name} · 综合教育平台`;
  },
  { immediate: true },
);
const searchResults = computed(() =>
  routePages.filter((p) => `${p.name}${p.id}${p.group}`.includes(searchValue.value)),
);
const icon = (name: string) => () => h(UiIcon, { name, size: 19 });
const menuOptions = computed<MenuOption[]>(() => [
  {
    label: "个人中心",
    key: "account",
    icon: icon("UserRound"),
    children: [
      { label: "个人资料", key: "/account/profile", icon: icon("UserRound") },
      { label: "修改密码", key: "/account/password", icon: icon("LockKeyhole") },
      { label: "登录设备", key: "/account/sessions", icon: icon("Monitor") },
    ],
  },
  {
    label: "消息中心",
    key: "messages",
    icon: icon("MessageCircle"),
    extra: () => h(NBadge, { value: unreadCount.value, max: 99 }),
    children: [
      {
        label: "收件箱",
        key: "/messages/inbox",
        icon: icon("Inbox"),
        extra: () => h("span", { class: "nav-count" }, unreadCount.value || ""),
      },
      {
        label: "我的待办",
        key: "/messages/todo",
        icon: icon("ListTodo"),
        extra: () => h("span", { class: "nav-count muted-count" }, todoCount.value || ""),
      },
      { label: "公告", key: "/messages/announcements", icon: icon("Megaphone") },
    ],
  },
]);
const userOptions = [
  { label: "个人资料", key: "/account/profile", icon: icon("UserRound") },
  { label: "切换身份", key: "/select-identity", icon: icon("UsersRound") },
  { type: "divider", key: "divider" },
  { label: "退出登录", key: "/login", icon: icon("LogOut") },
];

function closeTab(path: string) {
  if (state.tabs.length === 1) return;
  state.tabs = state.tabs.filter((p) => p !== path);
  if (state.path === path) navigate(state.tabs[state.tabs.length - 1]);
}
function toggleNavigation() {
  if (window.matchMedia("(max-width: 760px)").matches) mobileMenu.value = true;
  else state.collapsed = !state.collapsed;
}
function onHashChange() {
  const path = location.hash.slice(1);
  if (routePages.some((p) => p.path === path)) navigate(path);
}
function onKey(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === "k") {
    event.preventDefault();
    search.value = !search.value;
  }
}
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    message.info("当前预览环境不支持全屏，可使用浏览器全屏功能");
  }
}
onMounted(() => {
  if (!state.tabs.includes(state.path) && !isAuth.value) state.tabs.push(state.path);
  window.addEventListener("hashchange", onHashChange);
  window.addEventListener("keydown", onKey);
});
onUnmounted(() => {
  window.removeEventListener("hashchange", onHashChange);
  window.removeEventListener("keydown", onKey);
});
</script>

<template>
  <NEl class="prototype-root">
    <AuthPages v-if="isAuth" />
    <div v-else class="app-shell" :class="{ 'sidebar-collapsed': state.collapsed }">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark"><UiIcon name="GraduationCap" :size="28" /></div>
          <div v-if="!state.collapsed" class="brand-copy">
            <NText strong>综合教育平台</NText><span>EDU CONNECT</span>
          </div>
        </div>
        <div class="sidebar-scroll" role="navigation" aria-label="工作空间导航" tabindex="0">
          <div v-if="!state.collapsed" class="workspace-card">
            <div class="workspace-symbol"><UiIcon name="Grid2X2" :size="17" /></div>
            <div>
              <NText strong>公共工作空间</NText>
              <div class="workspace-sub">连接教育 · 协同共进</div>
            </div>
            <NTooltip
              ><template #trigger
                ><NButton text aria-label="切换工作身份" @click="navigate('/select-identity')"
                  ><UiIcon name="ChevronDown" :size="15" /></NButton></template
              >切换工作身份</NTooltip
            >
          </div>
          <div v-if="!state.collapsed" class="nav-section-label">工作空间</div>
          <NMenu
            :value="state.path"
            v-model:expanded-keys="expanded"
            :options="menuOptions"
            :collapsed="state.collapsed"
            :collapsed-width="76"
            :collapsed-icon-size="21"
            :indent="20"
            @update:value="navigate"
          />
          <div class="sidebar-bottom">
            <div v-if="!state.collapsed" class="sidebar-help">
              <div class="help-book">
                <UiIcon name="BookOpen" :size="28" /><span class="help-spark">+</span>
              </div>
              <NText strong>让教育管理，更简单</NText>
              <div>高效协同，专注每一次成长</div>
              <NButton size="small" secondary type="primary" block @click="help = true"
                >了解平台 <UiIcon name="ArrowRight" :size="14"
              /></NButton>
            </div>
            <NButton text class="help-center-button" @click="help = true"
              ><UiIcon name="CircleHelp" :size="18" /><span v-if="!state.collapsed"
                >帮助与支持</span
              ></NButton
            >
            <div v-if="!state.collapsed" class="sidebar-version">
              <span class="status-dot"></span>系统运行正常<span>v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>
      <div class="main-shell">
        <header class="topbar">
          <NButton quaternary circle aria-label="折叠导航" @click="toggleNavigation"
            ><UiIcon :name="state.collapsed ? 'Menu' : 'PanelLeftClose'" :size="20"
          /></NButton>
          <NBreadcrumb class="breadcrumb">
            <NBreadcrumbItem @click="navigate('/messages/inbox')"
              ><UiIcon name="House" :size="15"
            /></NBreadcrumbItem>
            <NBreadcrumbItem>{{ currentPage.group }}</NBreadcrumbItem>
            <NBreadcrumbItem>{{ currentPage.name }}</NBreadcrumbItem>
          </NBreadcrumb>
          <div class="topbar-right">
            <NTag size="small" :bordered="false" type="success" class="environment-tag"
              ><span class="status-dot"></span>演示环境</NTag
            >
            <NTooltip
              ><template #trigger
                ><NButton quaternary circle aria-label="搜索页面" @click="search = true"
                  ><UiIcon name="Search" /></NButton></template
              >搜索页面 ⌘ K</NTooltip
            >
            <NTooltip
              ><template #trigger
                ><NButton quaternary circle aria-label="全屏" @click="fullscreen"
                  ><UiIcon name="Maximize" :size="19" /></NButton></template
              >全屏</NTooltip
            >
            <NBadge dot :show="unreadCount > 0"
              ><NButton quaternary circle aria-label="未读消息" @click="navigate('/messages/inbox')"
                ><UiIcon name="Bell" /></NButton
            ></NBadge>
            <NButton quaternary circle aria-label="界面设置" @click="settings = true"
              ><UiIcon name="Settings2" :size="19"
            /></NButton>
            <div class="topbar-separator"></div>
            <NButton text class="identity-top" @click="navigate('/select-identity')"
              ><span>{{ state.identity }}</span
              ><UiIcon name="ChevronDown" :size="13"
            /></NButton>
            <NDropdown :options="userOptions" @select="navigate">
              <NButton text class="user-trigger"
                ><NAvatar
                  round
                  :size="34"
                  :src="state.profile.avatar || undefined"
                  class="user-avatar"
                  >{{ state.profile.nickname.slice(-1) }}</NAvatar
                ><span>{{ state.profile.nickname }}</span
                ><UiIcon name="ChevronDown" :size="13"
              /></NButton>
            </NDropdown>
          </div>
        </header>
        <div v-if="state.showTabs" class="page-tabs">
          <NButton
            quaternary
            size="small"
            class="home-tab"
            aria-label="消息中心首页"
            @click="navigate('/messages/inbox')"
            ><UiIcon name="House" :size="16"
          /></NButton>
          <div
            v-for="path in state.tabs"
            :key="path"
            class="page-tab"
            :class="{ active: path === state.path }"
          >
            <NButton text @click="navigate(path)"
              ><UiIcon
                :name="routePages.find((p) => p.path === path)?.icon || 'File'"
                :size="15"
              />{{ routePages.find((p) => p.path === path)?.name }}</NButton
            >
            <NButton
              v-if="state.tabs.length > 1"
              text
              :aria-label="`关闭${routePages.find((p) => p.path === path)?.name}`"
              @click="closeTab(path)"
              ><UiIcon name="X" :size="12"
            /></NButton>
            <span v-else class="tab-active-dot"></span>
          </div>
          <NButton
            quaternary
            size="small"
            class="tabs-refresh"
            aria-label="刷新当前视图"
            @click="message.success('已刷新，当前数据为原型演示数据')"
            ><UiIcon name="RefreshCw" :size="15"
          /></NButton>
        </div>
        <main class="page-content">
          <MessagePages v-if="state.path.startsWith('/messages')" :key="state.path" />
          <AccountPages v-else-if="state.path.startsWith('/account')" :key="state.path" />
        </main>
        <footer class="app-footer">
          <span
            >© 2026 综合教育平台
            <span class="footer-divider">|</span> 用科技连接教育，让成长更有力量</span
          ><span class="footer-right"
            ><UiIcon name="ShieldCheck" :size="14" /> 安全可信 · 高效协同</span
          >
        </footer>
      </div>
    </div>

    <NModal v-model:show="search" preset="card" title="快速前往" class="search-modal">
      <NInput
        v-model:value="searchValue"
        autofocus
        clearable
        placeholder="搜索页面名称或页面编号，如 C03"
        @keydown.enter="searchResults[0] && (navigate(searchResults[0].path), (search = false))"
        ><template #prefix><UiIcon name="Search" :size="18" /></template
      ></NInput>
      <div class="search-results">
        <NButton
          v-for="page in searchResults"
          :key="page.id"
          quaternary
          block
          class="search-result"
          @click="
            navigate(page.path);
            search = false;
          "
          ><UiIcon :name="page.icon" :size="18" /><span>{{ page.name }}</span
          ><NText depth="3">{{ page.group }} · {{ page.id }}</NText
          ><UiIcon name="ArrowRight" :size="15"
        /></NButton>
        <NText v-if="!searchResults.length" depth="3">没有找到匹配页面</NText>
      </div>
    </NModal>
    <NDrawer v-model:show="mobileMenu" :width="280" placement="left" class="navigation-drawer"
      ><NDrawerContent title="工作空间" :native-scrollbar="true" closable
        ><NMenu
          :value="state.path"
          :options="menuOptions"
          :default-expanded-keys="['account', 'messages']"
          @update:value="
            (path) => {
              navigate(path);
              mobileMenu = false;
            }
          " /></NDrawerContent
    ></NDrawer>
    <NDrawer v-model:show="settings" :width="340"
      ><NDrawerContent title="界面设置" closable>
        <NH3>布局偏好</NH3>
        <div class="setting-row">
          <NText>紧凑导航</NText><NSwitch v-model:value="state.collapsed" />
        </div>
        <div class="setting-row">
          <NText>显示多页签</NText><NSwitch v-model:value="state.showTabs" />
        </div>
        <NDivider /><NH3>原型页面导航</NH3
        ><NText depth="3">本期覆盖 C01-01 至 C03-03，共 8 个页面；文件管理暂不开放。</NText>
        <div class="search-results">
          <NButton
            v-for="page in routePages"
            :key="page.id"
            quaternary
            block
            class="search-result"
            @click="
              navigate(page.path);
              settings = false;
            "
            ><UiIcon :name="page.icon" :size="17" /><span>{{ page.name }}</span
            ><NText depth="3">{{ page.id }}</NText></NButton
          >
        </div>
      </NDrawerContent></NDrawer
    >
    <NModal v-model:show="help" preset="card" title="关于综合教育平台" class="standard-modal">
      <div class="about-symbol"><UiIcon name="GraduationCap" :size="38" /></div>
      <NH3>连接教育，协同共进</NH3>
      <NText depth="2">面向平台、教育局、学校、机构、教师与家长的一体化教育服务平台。</NText>
      <NDivider />
      <NH3>当前原型说明</NH3>
      <NText
        >已实现登录与身份、个人中心和消息中心，文件管理暂不开放。所有操作仅改变本次预览中的演示数据，刷新后恢复，不会发送短信、发起微信授权或调用业务接口。</NText
      >
      <NDivider /><NSpace justify="space-between"
        ><NText depth="3">服务咨询：0571-8700 1234</NText
        ><NButton type="primary" @click="help = false">我知道了</NButton></NSpace
      >
    </NModal>
  </NEl>
</template>
