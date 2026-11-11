<script setup lang="ts">
import { computed, h, ref } from "vue";
import {
  NAlert,
  NAvatar,
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NDivider,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NForm,
  NFormItem,
  NH2,
  NH3,
  NInput,
  NModal,
  NPagination,
  NSelect,
  NSpace,
  NTab,
  NTabs,
  NTag,
  NText,
  useMessage,
  type DataTableColumns,
} from "naive-ui";
import UiIcon from "./UiIcon.vue";
import { announcements, type MessageItem } from "./data";
import {
  currentPage,
  navigate,
  state,
  todoCount,
  unreadCount,
  visibleMessages,
  visibleTodos,
  visibleAnnouncements,
} from "./store";
import { attachmentHref } from "./file-utils";

const toast = useMessage();
const isInbox = computed(() => state.path === "/messages/inbox");
const isTodo = computed(() => state.path === "/messages/todo");
const keyword = ref("");
const filterType = ref<string | null>(null);
const dateRange = ref<[number, number] | null>(null);
const applied = ref({
  keyword: "",
  type: null as string | null,
  date: null as [number, number] | null,
});
const tab = ref(isInbox.value ? state.inboxTab : "all");
const page = ref(1);
const pageSize = ref(8);
const selection = ref<Array<string | number>>([]);
const loading = ref(false);
const drawer = ref(false);
const detail = ref<MessageItem | (typeof announcements)[number] | null>(null);
const todoDetail = ref<(typeof state.todos)[number] | null>(null);
const todoShow = ref(false);
const todoJumpShow = ref(false);
const approval = ref("");
const approvalError = ref("");
const submitting = ref(false);

const types = computed(() =>
  (isInbox.value
    ? ["系统通知", "业务通知", "审批消息", "安全提醒", "待办提醒"]
    : isTodo.value
      ? ["资质审核", "方案备案", "研学备案", "业务协同"]
      : ["平台公告", "教育通知", "学校公告", "机构公告"]
  ).map((type) => ({ label: type, value: type })),
);
const rows = computed(() => {
  const source = isInbox.value
    ? visibleMessages.value
    : isTodo.value
      ? visibleTodos.value
      : visibleAnnouncements.value;
  return source.filter((item) => {
    const filter = applied.value;
    const text = `${item.title} ${"summary" in item ? item.summary : ""} ${"content" in item ? item.content : ""}`;
    const timestamp = new Date(item.date.replace(" ", "T")).getTime();
    return (
      (!filter.keyword || text.includes(filter.keyword)) &&
      (!filter.type || item.type === filter.type) &&
      (!filter.date ||
        (timestamp >= filter.date[0] && timestamp <= filter.date[1] + 86400000 - 1)) &&
      (tab.value === "all" ||
        (isInbox.value && "read" in item && (tab.value === "unread" ? !item.read : item.read)) ||
        (isTodo.value && "done" in item && (tab.value === "pending" ? !item.done : item.done)) ||
        (!isInbox.value &&
          !isTodo.value &&
          "scope" in item &&
          (tab.value === "platform" ? item.scope === "全平台" : item.scope !== "全平台")))
    );
  });
});
const paged = computed(() =>
  rows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
);
const typeTone = (type: string): "info" | "success" | "warning" | "error" | "default" =>
  (
    {
      系统通知: "info",
      业务通知: "success",
      审批消息: "warning",
      安全提醒: "error",
      待办提醒: "default",
      资质审核: "warning",
      方案备案: "info",
      研学备案: "success",
      业务协同: "default",
    } as const
  )[type] || "info";

function query() {
  applied.value = { keyword: keyword.value.trim(), type: filterType.value, date: dateRange.value };
  page.value = 1;
  selection.value = [];
}
function reset() {
  keyword.value = "";
  filterType.value = null;
  dateRange.value = null;
  query();
}
function changeTab() {
  if (isInbox.value) state.inboxTab = tab.value;
  page.value = 1;
  selection.value = [];
}
async function refresh() {
  loading.value = true;
  await new Promise((resolve) => setTimeout(resolve, 400));
  loading.value = false;
  toast.success("消息列表已更新");
}
function markRead(all = false) {
  let count = 0;
  visibleMessages.value.forEach((item) => {
    if (!item.read && (all || selection.value.includes(item.id))) {
      item.read = true;
      count++;
    }
  });
  selection.value = [];
  page.value = Math.min(page.value, Math.max(1, Math.ceil(rows.value.length / pageSize.value)));
  toast.success(
    count ? `已将 ${count} 条消息标记为已读` : all ? "所有消息均已读" : "所选消息均已读",
  );
}
function openMessage(item: MessageItem | (typeof announcements)[number]) {
  detail.value = item;
  if ("read" in item) item.read = true;
  drawer.value = true;
}
function openTodo(item: (typeof state.todos)[number]) {
  todoDetail.value = item;
  approval.value = "";
  approvalError.value = "";
  todoShow.value = true;
}
async function approve() {
  if (!todoDetail.value || todoDetail.value.done) return;
  if (!approval.value.trim()) {
    approvalError.value = "请填写处理意见";
    return;
  }
  submitting.value = true;
  await new Promise((resolve) => setTimeout(resolve, 450));
  todoDetail.value.done = true;
  submitting.value = false;
  todoShow.value = false;
  toast.success("处理成功，该事项已移入已办事项");
}

const columns = computed<DataTableColumns<MessageItem>>(() => [
  { type: "selection", width: 42 },
  {
    title: "消息标题",
    key: "title",
    minWidth: 330,
    render: (row) =>
      h("div", { class: "message-title-cell" }, [
        h("span", { class: ["message-status-dot", { read: row.read }] }),
        h(
          NButton,
          {
            text: true,
            class: ["message-title", { "is-unread": !row.read }],
            onClick: () => openMessage(row),
          },
          { default: () => row.title },
        ),
      ]),
  },
  {
    title: "消息类型",
    key: "type",
    width: 108,
    render: (row) =>
      h(
        NTag,
        { type: typeTone(row.type), size: "small", bordered: false },
        { default: () => row.type },
      ),
  },
  { title: "发送方", key: "sender", width: 150, ellipsis: { tooltip: true } },
  {
    title: "状态",
    key: "read",
    width: 87,
    render: (row) =>
      h("span", { class: ["read-label", { unread: !row.read }] }, [
        h("span", { class: "read-indicator" }),
        row.read ? "已读" : "未读",
      ]),
  },
  {
    title: "发送时间",
    key: "date",
    width: 153,
    sorter: (a, b) => a.date.localeCompare(b.date),
    render: (row) => h("span", { class: "date-cell" }, row.date.slice(5)),
  },
  {
    title: "操作",
    key: "actions",
    width: 70,
    render: (row) =>
      h(
        NButton,
        { text: true, type: "primary", onClick: () => openMessage(row) },
        { default: () => "查看" },
      ),
  },
]);
const todoColumns = computed<DataTableColumns<(typeof state.todos)[number]>>(() => [
  {
    title: "待办事项",
    key: "title",
    minWidth: 300,
    render: (row) =>
      h("div", { class: "todo-title" }, [
        h(NButton, { text: true, onClick: () => openTodo(row) }, { default: () => row.title }),
        row.urgent && !row.done
          ? h(NTag, { type: "error", size: "small", bordered: false }, { default: () => "紧急" })
          : null,
      ]),
  },
  {
    title: "业务类型",
    key: "type",
    width: 110,
    render: (row) =>
      h(
        NTag,
        { type: typeTone(row.type), size: "small", bordered: false },
        { default: () => row.type },
      ),
  },
  { title: "发送方", key: "sender", width: 150 },
  {
    title: "状态",
    key: "done",
    width: 95,
    render: (row) =>
      h(
        NTag,
        { type: row.done ? "success" : "warning", size: "small", bordered: false },
        { default: () => (row.done ? "已处理" : "待处理") },
      ),
  },
  {
    title: "截止时间",
    key: "deadline",
    width: 125,
    render: (row) =>
      h("span", { class: row.urgent && !row.done ? "urgent-text" : "date-cell" }, row.deadline),
  },
  {
    title: "操作",
    key: "actions",
    width: 150,
    fixed: "right",
    render: (row) =>
      h(
        NSpace,
        { size: 16, wrap: false },
        {
          default: () => [
            h(
              NButton,
              { text: true, type: "primary", onClick: () => openTodo(row) },
              { default: () => (row.done ? "查看详情" : "去处理") },
            ),
            h(
              NButton,
              { text: true, type: "primary", onClick: () => (todoJumpShow.value = true) },
              { default: () => "跳转" },
            ),
          ],
        },
      ),
  },
]);
</script>

<template>
  <div class="page-enter">
    <div class="page-heading">
      <div>
        <NH2>{{ isInbox ? "消息中心" : currentPage.name }}</NH2
        ><NText depth="3">{{
          isInbox
            ? "汇聚重要通知，高效协同每一天。"
            : isTodo
              ? "聚合工作事项，让每一项任务有序推进。"
              : "及时了解平台动态，不错过每一条重要通知。"
        }}</NText>
      </div>
      <div class="heading-date">
        <UiIcon name="CalendarDays" :size="16" />2026 年 11 月 6 日 <span>星期五</span>
      </div>
    </div>
    <div v-if="isInbox" class="message-welcome">
      <div class="welcome-text">
        <div class="welcome-eyebrow"><span></span> 消息即达 · 协作无间</div>
        <NH3>每一条消息，都让教育更有连接</NH3
        ><NText>通知、审批与提醒，一处掌握，重要信息不再错过。</NText>
      </div>
      <div class="mail-illustration" aria-hidden="true">
        <div class="illustration-ring ring-one"></div>
        <div class="illustration-ring ring-two"></div>
        <div class="illustration-paper">
          <i></i><i></i><i></i><UiIcon name="CheckCheck" :size="22" />
        </div>
        <div class="illustration-envelope"><UiIcon name="Mail" :size="72" /></div>
        <div class="illustration-bell"><UiIcon name="Bell" :size="20" /><span></span></div>
        <span class="illustration-star star-one">+</span
        ><span class="illustration-star star-two">+</span>
        <div class="illustration-dot"></div>
      </div>
    </div>
    <NCard :bordered="false" class="filter-card">
      <NForm label-placement="left" :show-feedback="false" class="filter-form">
        <NFormItem label="关键词"
          ><NInput
            v-model:value="keyword"
            :maxlength="50"
            placeholder="搜索标题或内容"
            clearable
            @keydown.enter="query"
            ><template #prefix><UiIcon name="Search" :size="16" /></template></NInput
        ></NFormItem>
        <NFormItem :label="isTodo ? '业务类型' : '消息类型'"
          ><NSelect v-model:value="filterType" :options="types" placeholder="全部类型" clearable
        /></NFormItem>
        <NFormItem label="发送时间" class="date-filter"
          ><NDatePicker
            v-model:value="dateRange"
            type="daterange"
            clearable
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="yyyy-MM-dd"
        /></NFormItem>
        <NSpace :size="10"
          ><NButton type="primary" @click="query"
            ><template #icon><UiIcon name="Search" :size="16" /></template>查询</NButton
          ><NButton @click="reset"
            ><template #icon><UiIcon name="RefreshCw" :size="15" /></template>重置</NButton
          ></NSpace
        >
      </NForm>
    </NCard>
    <NCard :bordered="false" class="message-list-card" content-class="message-list-content">
      <div class="list-toolbar">
        <NTabs v-model:value="tab" type="line" class="message-tabs" @update:value="changeTab">
          <template v-if="isInbox"
            ><NTab name="all"
              ><span>全部消息</span
              ><span class="tab-count">{{ visibleMessages.length }}</span></NTab
            ><NTab name="unread"
              ><span>未读消息</span><span class="tab-count">{{ unreadCount }}</span></NTab
            ><NTab name="read"
              ><span>已读消息</span
              ><span class="tab-count">{{ visibleMessages.length - unreadCount }}</span></NTab
            ></template
          >
          <template v-else-if="isTodo"
            ><NTab name="all"
              >全部事项 <span class="tab-count">{{ visibleTodos.length }}</span></NTab
            ><NTab name="pending"
              >待处理 <span class="tab-count">{{ todoCount }}</span></NTab
            ><NTab name="done"
              >已处理 <span class="tab-count">{{ visibleTodos.length - todoCount }}</span></NTab
            ></template
          >
          <template v-else
            ><NTab name="all"
              >全部公告 <span class="tab-count">{{ visibleAnnouncements.length }}</span></NTab
            ><NTab name="platform">平台公告</NTab
            ><NTab name="organization">学校与机构</NTab></template
          >
        </NTabs>
        <div class="list-tools">
          <NButton v-if="isInbox" size="small" :disabled="!selection.length" @click="markRead()"
            ><template #icon><UiIcon name="Check" :size="15" /></template>标记已读</NButton
          ><NButton v-if="isInbox" size="small" @click="markRead(true)"
            ><template #icon><UiIcon name="CheckCheck" :size="16" /></template>全部已读</NButton
          >
        </div>
        <NButton quaternary size="small" aria-label="刷新列表" :loading="loading" @click="refresh"
          ><UiIcon name="RefreshCw" :size="16"
        /></NButton>
      </div>
      <div v-if="selection.length && isInbox" class="selection-notice">
        <NText
          >已选择 <NText type="primary">{{ selection.length }}</NText> 条消息</NText
        ><NButton text type="primary" @click="selection = []">取消选择</NButton>
      </div>
      <NDataTable
        v-if="isInbox"
        v-model:checked-row-keys="selection"
        :columns="columns"
        :data="paged as MessageItem[]"
        :row-key="(row: MessageItem) => row.id"
        :bordered="false"
        :loading="loading"
        :scroll-x="990"
      />
      <NDataTable
        v-else-if="isTodo"
        :columns="todoColumns"
        :data="paged"
        :row-key="(row: { id: number }) => row.id"
        :bordered="false"
        :loading="loading"
        :scroll-x="960"
      />
      <div v-else class="announcement-list">
        <div
          v-for="item in paged as typeof announcements"
          :key="item.id"
          class="announcement-item"
          @click="openMessage(item)"
        >
          <div class="announcement-icon" :class="{ pinned: item.pinned }">
            <UiIcon name="Megaphone" :size="24" />
          </div>
          <div class="announcement-body">
            <div class="announcement-title">
              <NTag v-if="item.pinned" size="small" type="error" :bordered="false">置顶</NTag
              ><NButton text @click.stop="openMessage(item)">{{ item.title }}</NButton
              ><NTag size="small" :bordered="false" type="info">{{ item.type }}</NTag>
            </div>
            <NText depth="3">{{ item.summary }}</NText>
            <div class="announcement-meta">
              <span>{{ item.sender }}</span
              ><span>{{ item.date }}</span
              ><span>发布范围：{{ item.scope }}</span>
            </div>
          </div>
          <UiIcon name="ChevronRight" :size="18" />
        </div>
        <NEmpty v-if="!paged.length" description="暂无符合条件的公告" class="empty-block"
          ><template #extra
            ><NButton size="small" @click="reset">重置筛选</NButton></template
          ></NEmpty
        >
      </div>
      <div class="pagination-row">
        <NText depth="3"
          >共 {{ rows.length }} 条<span v-if="selection.length"
            >，已选择 {{ selection.length }} 条</span
          ></NText
        ><NPagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :item-count="rows.length"
          :page-sizes="[8, 16, 24]"
          show-size-picker
          show-quick-jumper
          @update:page-size="
            page = 1;
            selection = [];
          "
        />
      </div>
    </NCard>
    <div class="list-footnote">
      <UiIcon name="ShieldCheck" :size="14" /><span
        >消息根据当前身份与权限范围展示，切换身份后可查看对应消息。</span
      >
    </div>
  </div>

  <NDrawer v-model:show="drawer" :width="600" class="message-detail-drawer"
    ><NDrawerContent :title="isInbox ? '消息详情' : '公告详情'" closable>
      <template v-if="detail"
        ><NSpace align="center"
          ><NTag size="small" type="info" :bordered="false">{{ detail.type }}</NTag
          ><NText v-if="'read' in detail" depth="3"
            ><UiIcon name="CheckCheck" :size="14" /> 已读</NText
          ></NSpace
        ><NH2 class="detail-title">{{ detail.title }}</NH2>
        <div class="detail-sender">
          <NAvatar round :size="34" class="sender-avatar"
            ><UiIcon name="GraduationCap" :size="21"
          /></NAvatar>
          <div>
            <NText>{{ detail.sender }}</NText>
            <div>
              <NText depth="3">{{ detail.date }}</NText>
            </div>
          </div>
        </div>
        <NDivider />
        <div class="detail-body">{{ detail.content }}</div>
        <div v-if="detail.attachment" class="attachment-box">
          <div class="attachment-icon"><UiIcon name="FileText" :size="24" /></div>
          <div>
            <NText>{{ detail.attachment }}</NText>
            <div><NText depth="3">演示附件 · 仅限授权用户访问</NText></div>
          </div>
          <NButton
            tag="a"
            :href="attachmentHref(detail.attachment)"
            :download="detail.attachment"
            text
            type="primary"
            aria-label="下载附件"
            ><UiIcon name="ArrowDownToLine" :size="20"
          /></NButton>
        </div>
        <NAlert
          v-if="detail.type === '待办提醒'"
          type="info"
          :bordered="false"
          class="detail-action"
          >该消息包含待处理事项，请前往我的待办查看。
          <div class="alert-action">
            <NButton
              text
              type="primary"
              @click="
                drawer = false;
                navigate('/messages/todo');
              "
              >前往处理 →</NButton
            >
          </div></NAlert
        ></template
      >
      <template #footer><NButton @click="drawer = false">关闭</NButton></template>
    </NDrawerContent></NDrawer
  >
  <NModal
    v-model:show="todoJumpShow"
    preset="card"
    title="跳转提示"
    class="standard-modal todo-jump-modal"
  >
    <NText>目标页面跳转待实现</NText>
    <template #footer>
      <NSpace justify="end">
        <NButton type="primary" @click="todoJumpShow = false">我知道了</NButton>
      </NSpace>
    </template>
  </NModal>
  <NModal
    v-model:show="todoShow"
    preset="card"
    :title="todoDetail?.done ? '已办事项详情' : '处理待办事项'"
    class="todo-modal"
    :mask-closable="!submitting"
  >
    <template v-if="todoDetail"
      ><NSpace
        ><NTag :bordered="false" :type="todoDetail.done ? 'success' : 'warning'">{{
          todoDetail.done ? "已处理" : "待处理"
        }}</NTag
        ><NTag :bordered="false">{{ todoDetail.type }}</NTag></NSpace
      ><NH3 class="detail-title">{{ todoDetail.title }}</NH3>
      <div class="todo-detail-meta">
        <span>发起方：{{ todoDetail.sender }}</span
        ><span>发起时间：{{ todoDetail.date }}</span
        ><span>截止时间：2026-{{ todoDetail.deadline }}</span>
      </div>
      <NDivider />
      <div class="detail-body">{{ todoDetail.detail }}</div>
      <NAlert type="info" :bordered="false" class="detail-action"
        >这里是对应业务待办中心的原型演示，提交后仅更新当前预览数据。</NAlert
      ><NForm v-if="!todoDetail.done" class="approval-form"
        ><NFormItem
          label="处理意见"
          required
          :feedback="approvalError"
          :validation-status="approvalError ? 'error' : undefined"
          ><NInput
            v-model:value="approval"
            type="textarea"
            placeholder="请输入核验结果或处理意见"
            :maxlength="500"
            show-count
            :autosize="{ minRows: 3 }"
            @update:value="approvalError = ''" /></NFormItem></NForm
      ><NAlert v-else type="success" :bordered="false" class="detail-action"
        >该事项已处理完成，无需重复提交。</NAlert
      ></template
    >
    <template #footer
      ><NSpace justify="end"
        ><NButton :disabled="submitting" @click="todoShow = false">取消</NButton
        ><NButton v-if="!todoDetail?.done" type="primary" :loading="submitting" @click="approve"
          >确认处理</NButton
        ><NButton v-else type="primary" @click="todoShow = false">完成</NButton></NSpace
      ></template
    >
  </NModal>
</template>
