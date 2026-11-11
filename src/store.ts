import { computed, reactive } from "vue";
import { announcements, initialFiles, initialMessages, initialTodos, routePages } from "./data";

const initialPath = location.hash.slice(1) || location.pathname;
export const state = reactive({
  path: routePages.some((p) => p.path === initialPath) ? initialPath : "/messages/inbox",
  tabs: ["/messages/inbox"],
  collapsed: false,
  showTabs: true,
  inboxTab: "all",
  profile: { nickname: "林晓", phone: "13800138000", avatar: "", wechat: true },
  identity: "平台管理员",
  organization: "杭州市教育服务中心",
  demoPassword: "Edu@2026Demo",
  messages: initialMessages.map((item) => ({ ...item })),
  todos: initialTodos.map((item) => ({ ...item })),
  files: initialFiles.map((item) => ({ ...item })),
  sessions: [
    {
      id: 1,
      name: "MacBook Pro",
      system: "macOS 15.1 · Chrome 130",
      ip: "183.128.**.62",
      location: "浙江 · 杭州",
      time: "2026-11-06 10:45:26",
      current: true,
      active: true,
    },
    {
      id: 2,
      name: "iPhone 16 Pro",
      system: "iOS 18.1 · 微信",
      ip: "183.128.**.18",
      location: "浙江 · 杭州",
      time: "2026-11-06 08:30:12",
      current: false,
      active: true,
    },
    {
      id: 3,
      name: "Windows PC",
      system: "Windows 11 · Edge 130",
      ip: "115.236.**.93",
      location: "浙江 · 杭州",
      time: "2026-11-05 17:20:08",
      current: false,
      active: true,
    },
    {
      id: 4,
      name: "iPad Air",
      system: "iPadOS 18 · Safari",
      ip: "183.128.**.28",
      location: "浙江 · 杭州",
      time: "2026-11-01 14:10:35",
      current: false,
      active: false,
    },
  ],
});
// Demonstrate identity-scoped inboxes without implying client-side authorization.
export const visibleMessages = computed(() =>
  state.messages.filter((item) => {
    if (state.identity === "学校管理员") return item.id % 12 !== 5;
    if (state.identity === "教育局管理员") return ![3, 8, 0].includes(item.id % 12);
    return true;
  }),
);
export const visibleTodos = computed(() =>
  state.todos.filter((item) => {
    if (state.identity === "学校管理员") return ![1, 3].includes(item.id);
    if (state.identity === "教育局管理员") return item.id !== 5;
    return true;
  }),
);
export const visibleAnnouncements = computed(() =>
  announcements.filter((item) => {
    if (state.identity === "学校管理员") return item.type !== "机构公告";
    if (state.identity === "教育局管理员") return item.type !== "学校公告";
    return true;
  }),
);
export const unreadCount = computed(() => visibleMessages.value.filter((m) => !m.read).length);
export const todoCount = computed(() => visibleTodos.value.filter((t) => !t.done).length);
export const currentPage = computed(
  () => routePages.find((p) => p.path === state.path) || routePages[5],
);
export const maskedPhone = computed(() =>
  state.profile.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1 **** $2"),
);

export function navigate(path: string) {
  if (!routePages.some((p) => p.path === path)) return;
  state.path = path;
  location.hash = path;
  if (path !== "/login" && path !== "/select-identity" && !state.tabs.includes(path))
    state.tabs.push(path);
}

export function invalidateOtherSessions() {
  state.sessions.forEach((s) => {
    if (!s.current) s.active = false;
  });
}
