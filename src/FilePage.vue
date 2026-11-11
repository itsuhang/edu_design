<script setup lang="ts">
import { computed, h, onUnmounted, ref } from "vue";
import {
  NAlert,
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
  NImage,
  NInput,
  NModal,
  NPagination,
  NProgress,
  NSelect,
  NSpace,
  NTab,
  NTabs,
  NTag,
  NText,
  NUpload,
  NUploadDragger,
  useMessage,
  type DataTableColumns,
  type UploadFileInfo,
} from "naive-ui";
import UiIcon from "./UiIcon.vue";
import { type FileItem } from "./data";
import { attachmentHref } from "./file-utils";
import { state } from "./store";

const toast = useMessage();
const keyword = ref("");
const type = ref<string | null>(null);
const dates = ref<[number, number] | null>(null);
const applied = ref({
  keyword: "",
  type: null as string | null,
  dates: null as [number, number] | null,
});
const source = ref("all");
const page = ref(1);
const pageSize = ref(8);
const grid = ref(false);
const preview = ref(false);
const current = ref<FileItem | null>(null);
const upload = ref(false);
const pendingFiles = ref<UploadFileInfo[]>([]);
const busy = ref(false);
const expires = ref(300);
const urls = new Map<number, string>();
const timer = setInterval(() => {
  if (preview.value && expires.value > 0) expires.value--;
}, 1000);
onUnmounted(() => {
  clearInterval(timer);
  urls.forEach((url) => URL.revokeObjectURL(url));
});
const fileTypes = ["PDF", "Word", "Excel", "图片", "其他"].map((value) => ({
  label: value,
  value,
}));
const files = computed(() =>
  state.files.filter((file) => {
    const timestamp = new Date(file.date.replace(" ", "T")).getTime();
    return (
      (!applied.value.keyword || file.name.includes(applied.value.keyword)) &&
      (!applied.value.type || file.type === applied.value.type) &&
      (!applied.value.dates ||
        (timestamp >= applied.value.dates[0] &&
          timestamp <= applied.value.dates[1] + 86400000 - 1)) &&
      (source.value === "all" ||
        file.source === (source.value === "mine" ? "我的上传" : "授权文件"))
    );
  }),
);
const paged = computed(() =>
  files.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
);
const usedMB = computed(() =>
  state.files
    .filter((f) => f.source === "我的上传")
    .reduce(
      (sum, f) =>
        sum +
        (f.blob
          ? f.blob.size / 1048576
          : parseFloat(f.size) * (f.size.includes("KB") ? 1 / 1024 : 1)),
      0,
    ),
);
const typeIcon = (kind: string) =>
  ({ PDF: "FileText", Word: "FileText", Excel: "FileSpreadsheet", 图片: "FileImage" })[kind] ||
  "File";
const typeClass = (kind: string) =>
  ({ PDF: "red", Word: "blue", Excel: "green", 图片: "violet" })[kind] || "orange";
function query() {
  applied.value = { keyword: keyword.value.trim(), type: type.value, dates: dates.value };
  page.value = 1;
}
function reset() {
  keyword.value = "";
  type.value = null;
  dates.value = null;
  query();
}
function fileHref(file: FileItem) {
  if (!file.blob) return attachmentHref(file.name);
  if (!urls.has(file.id)) urls.set(file.id, URL.createObjectURL(file.blob));
  return urls.get(file.id)!;
}
function openFile(file: FileItem) {
  current.value = file;
  expires.value = 300;
  preview.value = true;
}
function openUpload() {
  pendingFiles.value = [];
  upload.value = true;
}
function beforeUpload({ file }: { file: UploadFileInfo }) {
  if (!file.file) return false;
  if (file.file.size > 20 * 1048576) {
    toast.error("单个文件不能超过 20 MB");
    return false;
  }
  if (pendingFiles.value.length >= 10) {
    toast.warning("每次最多选择 10 个文件");
    return false;
  }
  if (pendingFiles.value.some((f) => f.name === file.name && f.file?.size === file.file?.size)) {
    toast.warning("该文件已在待上传列表中");
    return false;
  }
  pendingFiles.value.push(file);
  return false;
}
async function submitFiles() {
  if (!pendingFiles.value.length) return;
  busy.value = true;
  await new Promise((resolve) => setTimeout(resolve, 500));
  pendingFiles.value.forEach((file, index) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const kind =
      extension === "pdf"
        ? "PDF"
        : ["doc", "docx"].includes(extension || "")
          ? "Word"
          : ["xls", "xlsx", "csv"].includes(extension || "")
            ? "Excel"
            : ["jpg", "jpeg", "png", "svg", "webp"].includes(extension || "")
              ? "图片"
              : "其他";
    const size = file.file?.size || 0;
    state.files.unshift({
      id: Date.now() + index,
      name: file.name,
      type: kind,
      size:
        size > 1048576
          ? `${(size / 1048576).toFixed(1)} MB`
          : `${Math.max(1, Math.round(size / 1024))} KB`,
      date: "2026-11-06 11:00",
      source: "我的上传",
      blob: file.file || undefined,
    });
  });
  busy.value = false;
  upload.value = false;
  source.value = "mine";
  reset();
  toast.success(`已添加 ${pendingFiles.value.length} 个文件至当前演示，刷新后恢复`);
}
const columns: DataTableColumns<FileItem> = [
  {
    title: "文件名称",
    key: "name",
    minWidth: 300,
    render: (row) =>
      h("div", { class: "file-name-cell" }, [
        h("div", { class: ["file-type-icon", typeClass(row.type)] }, [
          h(UiIcon, { name: typeIcon(row.type), size: 23 }),
        ]),
        h(
          NButton,
          { text: true, class: "file-name-button", onClick: () => openFile(row) },
          { default: () => row.name },
        ),
      ]),
  },
  { title: "文件类型", key: "type", width: 100 },
  { title: "文件大小", key: "size", width: 100 },
  {
    title: "来源",
    key: "source",
    width: 110,
    render: (row) =>
      h(
        NTag,
        { bordered: false, size: "small", type: row.source === "我的上传" ? "info" : "success" },
        { default: () => row.source },
      ),
  },
  {
    title: "上传 / 授权时间",
    key: "date",
    width: 175,
    sorter: (a, b) => a.date.localeCompare(b.date),
  },
  {
    title: "操作",
    key: "actions",
    width: 120,
    render: (row) =>
      h(
        NSpace,
        { size: 15 },
        {
          default: () => [
            h(
              NButton,
              { text: true, type: "primary", onClick: () => openFile(row) },
              { default: () => "预览" },
            ),
            h(
              NButton,
              { text: true, type: "primary", tag: "a", href: fileHref(row), download: row.name },
              { default: () => "下载" },
            ),
          ],
        },
      ),
  },
];
const spreadsheetRows = [
  { course: "科学探索", grade: "三至四年级", teacher: "陈老师", week: "周一", hours: "2 课时" },
  { course: "创意绘画", grade: "一至三年级", teacher: "王老师", week: "周二", hours: "2 课时" },
  { course: "趣味编程", grade: "四至六年级", teacher: "李老师", week: "周三", hours: "2 课时" },
  { course: "阅读与表达", grade: "三至六年级", teacher: "林老师", week: "周四", hours: "2 课时" },
];
const spreadsheetColumns = [
  { title: "课程名称", key: "course" },
  { title: "适用年级", key: "grade" },
  { title: "任课教师", key: "teacher" },
  { title: "时间", key: "week" },
  { title: "课时", key: "hours" },
];
</script>

<template>
  <div class="page-enter">
    <div class="page-heading">
      <div>
        <NH2>我的文件</NH2><NText depth="3">集中管理上传与授权文件，让教学资料触手可及。</NText>
      </div>
      <NButton type="primary" @click="openUpload"
        ><template #icon><UiIcon name="CloudUpload" :size="18" /></template>上传文件</NButton
      >
    </div>
    <div class="file-overview-grid">
      <NCard
        v-for="item in [
          {
            label: '全部文件',
            icon: 'FolderOpen',
            count: state.files.length,
            tone: 'blue',
            kind: null,
          },
          {
            label: '文档资料',
            icon: 'FileText',
            count: state.files.filter((f) => ['PDF', 'Word', 'Excel'].includes(f.type)).length,
            tone: 'violet',
            kind: 'PDF',
          },
          {
            label: '图片文件',
            icon: 'FileImage',
            count: state.files.filter((f) => f.type === '图片').length,
            tone: 'orange',
            kind: '图片',
          },
        ]"
        :key="item.label"
        :bordered="false"
        class="file-stat-card"
        ><div class="stat-icon" :class="item.tone"><UiIcon :name="item.icon" :size="25" /></div>
        <div>
          <NText depth="3">{{ item.label }}</NText>
          <div class="stat-number">{{ item.count }}<span>个</span></div>
        </div></NCard
      >
      <NCard :bordered="false" class="storage-card"
        ><div class="storage-top">
          <NText>我的存储空间</NText><UiIcon name="HardDrive" :size="18" />
        </div>
        <div>
          <NText strong>{{ usedMB.toFixed(1) }} MB</NText><NText depth="3"> / 1 GB</NText>
        </div>
        <NProgress
          type="line"
          :percentage="Math.min(100, usedMB / 10.24)"
          :show-indicator="false"
        /><NText depth="3" class="small-text">仅计算本次演示中的上传文件</NText></NCard
      >
    </div>
    <NCard :bordered="false" class="filter-card"
      ><NForm label-placement="left" :show-feedback="false" class="filter-form"
        ><NFormItem label="文件名称"
          ><NInput
            v-model:value="keyword"
            :maxlength="50"
            clearable
            placeholder="搜索文件名称"
            @keydown.enter="query"
            ><template #prefix><UiIcon name="Search" :size="16" /></template></NInput></NFormItem
        ><NFormItem label="文件类型"
          ><NSelect
            v-model:value="type"
            :options="fileTypes"
            clearable
            placeholder="全部类型" /></NFormItem
        ><NFormItem label="上传时间" class="date-filter"
          ><NDatePicker
            v-model:value="dates"
            type="daterange"
            clearable
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="yyyy-MM-dd" /></NFormItem
        ><NSpace :size="10"
          ><NButton type="primary" @click="query"
            ><template #icon><UiIcon name="Search" :size="16" /></template>查询</NButton
          ><NButton @click="reset"
            ><template #icon><UiIcon name="RefreshCw" :size="15" /></template>重置</NButton
          ></NSpace
        ></NForm
      ></NCard
    >
    <NCard :bordered="false" class="message-list-card" content-class="message-list-content"
      ><div class="list-toolbar">
        <NTabs v-model:value="source" type="line" class="message-tabs" @update:value="page = 1"
          ><NTab name="all"
            >全部文件 <span class="tab-count">{{ state.files.length }}</span></NTab
          ><NTab name="mine">我的上传</NTab><NTab name="authorized">授权文件</NTab></NTabs
        >
        <div class="view-toggle">
          <NButton
            :type="!grid ? 'primary' : 'default'"
            :secondary="!grid"
            :bordered="false"
            size="small"
            aria-label="列表视图"
            @click="grid = false"
            ><UiIcon name="List" :size="17" /></NButton
          ><NButton
            :type="grid ? 'primary' : 'default'"
            :secondary="grid"
            :bordered="false"
            size="small"
            aria-label="网格视图"
            @click="grid = true"
            ><UiIcon name="LayoutGrid" :size="17"
          /></NButton>
        </div>
      </div>
      <NDataTable
        v-if="!grid"
        :columns="columns"
        :data="paged"
        :row-key="(row) => row.id"
        :bordered="false"
        :scroll-x="920"
      />
      <div v-else class="file-grid">
        <NCard v-for="file in paged" :key="file.id" class="file-grid-card" size="small"
          ><div class="file-grid-art" :class="typeClass(file.type)">
            <UiIcon :name="typeIcon(file.type)" :size="46" />
          </div>
          <NButton text class="grid-file-title" @click="openFile(file)">{{ file.name }}</NButton>
          <div class="grid-file-meta">
            <NText depth="3">{{ file.size }}</NText
            ><NText depth="3">{{ file.source }}</NText>
          </div>
          <div class="grid-file-actions">
            <NButton text type="primary" @click="openFile(file)">预览</NButton
            ><NButton tag="a" :href="fileHref(file)" :download="file.name" text type="primary"
              >下载</NButton
            >
          </div></NCard
        ><NEmpty v-if="!paged.length" description="暂无符合条件的文件" />
      </div>
      <div class="pagination-row">
        <NText depth="3">共 {{ files.length }} 个文件</NText
        ><NPagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :item-count="files.length"
          :page-sizes="[8, 16, 24]"
          show-size-picker
          @update:page-size="page = 1"
        />
      </div>
    </NCard>
    <div class="list-footnote">
      <UiIcon name="ShieldCheck" :size="14" /><span
        >文件仅对授权用户可见。预览与下载链接有效期为 5 分钟，请勿向他人分享。</span
      >
    </div>
  </div>
  <NModal
    v-model:show="upload"
    preset="card"
    title="上传文件"
    class="standard-modal"
    :mask-closable="!busy"
  >
    <NAlert type="info" :bordered="false" class="security-alert"
      >演示文件仅保留在当前浏览器内存中，不会上传到服务器。</NAlert
    >
    <NUpload multiple :show-file-list="false" :on-before-upload="beforeUpload"
      ><NUploadDragger
        ><div class="upload-cloud"><UiIcon name="CloudUpload" :size="42" /></div>
        <NH3>点击或拖拽文件到此处</NH3
        ><NText depth="3">单个文件不超过 20 MB，每次最多 10 个</NText></NUploadDragger
      ></NUpload
    >
    <div class="pending-files">
      <div v-for="file in pendingFiles" :key="file.id" class="pending-file">
        <UiIcon name="File" :size="18" /><NText>{{ file.name }}</NText
        ><NButton
          text
          :aria-label="`移除${file.name}`"
          @click="pendingFiles = pendingFiles.filter((f) => f.id !== file.id)"
          ><UiIcon name="X" :size="16"
        /></NButton>
      </div>
    </div>
    <template #footer
      ><NSpace justify="end"
        ><NButton :disabled="busy" @click="upload = false">取消</NButton
        ><NButton
          type="primary"
          :disabled="!pendingFiles.length"
          :loading="busy"
          @click="submitFiles"
          >确认添加{{ pendingFiles.length ? `（${pendingFiles.length}）` : "" }}</NButton
        ></NSpace
      ></template
    >
  </NModal>
  <NDrawer v-model:show="preview" :width="780" class="file-preview-drawer"
    ><NDrawerContent title="文件预览" closable>
      <template v-if="current"
        ><div class="preview-heading">
          <div class="file-type-icon" :class="typeClass(current.type)">
            <UiIcon :name="typeIcon(current.type)" :size="28" />
          </div>
          <div>
            <NH3>{{ current.name }}</NH3
            ><NText depth="3">{{ current.size }} · {{ current.source }} · {{ current.date }}</NText>
          </div>
        </div>
        <NAlert :type="expires ? 'info' : 'warning'" :bordered="false" class="preview-expiry"
          >{{
            expires
              ? `此访问链接将在 ${Math.floor(expires / 60)} 分 ${expires % 60} 秒后失效`
              : "访问链接已过期，请刷新授权后继续预览或下载"
          }}
          <div class="alert-action">
            <NButton
              text
              type="primary"
              @click="
                expires = 300;
                toast.success('已重新生成演示访问链接');
              "
              >刷新授权</NButton
            >
          </div></NAlert
        >
        <div v-if="expires" class="file-preview-area">
          <iframe
            v-if="current.type === 'PDF'"
            :src="fileHref(current)"
            title="PDF 文件预览"
            class="pdf-frame"
          ></iframe
          ><NImage
            v-else-if="current.type === '图片'"
            :src="fileHref(current)"
            :alt="current.name"
            class="preview-image"
          /><template v-else-if="!current.blob"
            ><div class="document-preview">
              <NTag size="small" type="info" :bordered="false">演示内容预览</NTag
              ><NH2>{{ current.name.replace(/\.[^.]+$/, "") }}</NH2
              ><NText depth="3">2026 年秋季学期 · 杭州市实验小学</NText><NDivider /><template
                v-if="current.type === 'Excel'"
                ><NDataTable
                  :columns="spreadsheetColumns"
                  :data="spreadsheetRows"
                  :bordered="false"
                  :single-line="false" /></template
              ><template v-else
                ><NH3>一、活动目标</NH3
                ><NText
                  >丰富校园文化生活，促进学生全面发展，营造积极向上、健康文明的校园文化氛围。</NText
                ><NH3>二、活动安排</NH3
                ><NText
                  >本学期将围绕科学探索、创意绘画、趣味编程与阅读表达等主题，组织丰富多彩的校园活动。</NText
                ><NH3>三、工作要求</NH3
                ><NText
                  >加强组织领导，落实安全保障，关注学生参与情况，及时总结活动经验。</NText
                ></template
              >
            </div></template
          ><NEmpty v-else description="此格式暂不支持在线预览，请下载后查看" class="empty-block" />
        </div>
        <NEmpty v-else description="文件访问授权已过期" class="empty-block"
          ><template #extra
            ><NButton type="primary" @click="expires = 300">重新获取授权</NButton></template
          ></NEmpty
        > </template
      ><template #footer
        ><NSpace
          ><NButton @click="preview = false">关闭</NButton
          ><NButton
            v-if="current"
            tag="a"
            type="primary"
            :disabled="!expires"
            :href="expires ? fileHref(current) : undefined"
            :download="current.name"
            ><template #icon><UiIcon name="ArrowDownToLine" :size="17" /></template
            >下载文件</NButton
          ></NSpace
        ></template
      >
    </NDrawerContent></NDrawer
  >
</template>
