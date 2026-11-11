export interface MessageItem {
  id: number;
  title: string;
  summary: string;
  type: string;
  sender: string;
  read: boolean;
  date: string;
  content: string;
  attachment?: string;
}

const messageSeeds = [
  [
    "关于开展 2026 年秋季学期课后服务质量评估的通知",
    "请各学校按要求完成自评工作，并于规定时间内提交相关材料。",
    "业务通知",
    "杭州市教育局",
    "11-06 10:30",
    "2026 年秋季学期课后服务质量评估现已启动。请各学校认真开展自评，重点关注课程建设、师资配置、服务质量和家长满意度。\n\n一、评估时间\n2026 年 11 月 6 日至 11 月 20 日。\n\n二、工作要求\n请各学校对照评估指标，整理本学期课后服务开展情况，完成质量自评报告，并于 11 月 20 日前提交材料。\n\n三、联系方式\n如有疑问，请联系教育服务中心，电话：0571-8700 1234。",
    "课后服务质量评估实施方案.pdf",
  ],
  [
    "您的账号已成功绑定微信",
    "账号安全提醒：您的账号于今日完成微信绑定操作。",
    "安全提醒",
    "账号安全中心",
    "11-06 09:45",
    "您的账号已于 2026 年 11 月 6 日 09:45 成功绑定微信。\n\n您可以使用已绑定的微信扫码登录综合教育平台。如非本人操作，请立即修改密码，并在登录设备中退出其他会话。",
  ],
  [
    "「校园科学探索」研学活动备案审核已通过",
    "您提交的研学活动备案已通过审核，可前往查看详情。",
    "审批消息",
    "平台运营中心",
    "11-06 09:20",
    "您提交的「校园科学探索」研学活动备案已审核通过。\n\n活动日期：2026 年 11 月 18 日\n活动地点：杭州市科技馆\n参与对象：四至六年级学生\n\n请提前做好行前教育、安全检查及家校沟通工作。",
    "研学活动备案确认单.pdf",
  ],
  [
    "2026 年 11 月平台功能更新说明",
    "本次更新优化了消息中心、文件管理及身份切换体验。",
    "系统通知",
    "平台运营中心",
    "11-05 17:30",
    "为了提供更高效、更便捷的教育服务，综合教育平台已完成 11 月功能升级。\n\n1. 全新消息中心，重要通知集中查看。\n2. 文件中心支持按类型筛选与在线预览。\n3. 优化多身份切换体验，工作协作更顺畅。\n\n感谢您的理解与支持。",
  ],
  [
    "待办提醒：您有 2 条机构资质申请待审核",
    "请及时处理机构资质审核，保障业务正常开展。",
    "待办提醒",
    "审批工作流",
    "11-05 15:10",
    "您有 2 条机构资质申请等待审核，请前往我的待办查看申请材料。\n\n申请机构：杭州启明教育科技有限公司、杭州青禾艺术培训中心。\n\n请在收到提醒后的 3 个工作日内完成处理。",
  ],
  [
    "关于做好冬季校园安全工作的通知",
    "请各学校落实冬季校园安全排查，切实保障师生安全。",
    "业务通知",
    "杭州市教育局",
    "11-05 14:00",
    "为切实保障冬季校园安全，请各学校全面开展安全隐患排查。\n\n重点检查消防设施、用电安全、食品安全及校舍设施，完善应急预案，加强安全教育。请于 11 月 15 日前报送排查结果。",
    "冬季校园安全检查表.xlsx",
  ],
  [
    "您的文件「秋季学期教学计划.pdf」已上传成功",
    "文件已完成安全检测，可在我的文件中查看和使用。",
    "系统通知",
    "文件服务中心",
    "11-05 11:25",
    "您的文件「秋季学期教学计划.pdf」已上传成功，并通过安全检测。\n\n文件大小：2.4 MB\n文件权限：仅本人可见\n\n您可以前往文件中心预览和下载文件。",
  ],
  [
    "课后服务课程信息完善提醒",
    "部分课程信息尚未完善，请及时补充课程介绍及教学安排。",
    "待办提醒",
    "课后服务中心",
    "11-04 16:40",
    "经检查，您所属学校的部分课后服务课程信息尚未完善。\n\n请补充课程介绍、适用年级、师资信息及教学安排，以便家长准确了解课程内容。",
  ],
  [
    "关于举行秋季学期教学研讨会的通知",
    "教学研讨会将于 11 月 12 日举行，请相关人员按时参加。",
    "业务通知",
    "杭州市教育局",
    "11-04 10:00",
    "秋季学期教学研讨会定于 11 月 12 日举行。请各学校安排教学负责人参加，交流课程建设经验。",
  ],
  [
    "平台数据备份已完成",
    "11 月 4 日例行数据备份已完成，系统运行正常。",
    "系统通知",
    "平台运营中心",
    "11-04 08:00",
    "综合教育平台已完成例行数据备份与完整性检查，所有服务运行正常。",
  ],
  [
    "异地登录安全提醒",
    "您的账号最近在新设备上登录，请确认是否为本人操作。",
    "安全提醒",
    "账号安全中心",
    "11-03 17:20",
    "您的账号在新设备 Windows · Edge 登录。登录地点：浙江杭州。如非本人操作，请及时修改密码并退出异常设备。",
  ],
  [
    "教师培训报名审核结果通知",
    "您的教师培训报名已通过审核。",
    "审批消息",
    "平台运营中心",
    "11-03 15:00",
    "教师数字素养培训报名审核已通过，请关注后续课程安排。",
  ],
] as const;

export const initialMessages: MessageItem[] = Array.from({ length: 24 }, (_, i) => {
  const seed = messageSeeds[i % messageSeeds.length];
  return {
    id: i + 1,
    title: seed[0],
    summary: seed[1],
    type: seed[2],
    sender: seed[3],
    date: `2026-${i < 12 ? seed[4] : seed[4].replace("11-0", "10-2")}`,
    content: seed[5],
    attachment: seed.length > 6 ? seed[6] : undefined,
    read: i >= 8,
  };
});

export const initialTodos = [
  {
    id: 1,
    title: "杭州启明教育科技有限公司资质审核",
    type: "资质审核",
    sender: "平台运营中心",
    date: "2026-11-06 10:20",
    deadline: "11-09 18:00",
    urgent: true,
    done: false,
    detail: "机构提交了办学许可证、营业执照及师资资质文件，请核实材料完整性与有效期。",
  },
  {
    id: 2,
    title: "2026 年秋季课后服务方案备案",
    type: "方案备案",
    sender: "杭州市实验小学",
    date: "2026-11-06 09:30",
    deadline: "11-10 18:00",
    urgent: false,
    done: false,
    detail: "本学期共开设 28 门课后服务课程，覆盖 6 个年级，请审核课程安排与师资配备。",
  },
  {
    id: 3,
    title: "杭州青禾艺术培训中心资质审核",
    type: "资质审核",
    sender: "平台运营中心",
    date: "2026-11-05 16:10",
    deadline: "11-09 18:00",
    urgent: true,
    done: false,
    detail: "机构申请续期艺术培训资质，请核查新提交的资质材料。",
  },
  {
    id: 4,
    title: "「走进自然」秋季研学活动备案",
    type: "研学备案",
    sender: "杭州市育才小学",
    date: "2026-11-05 14:00",
    deadline: "11-12 18:00",
    urgent: false,
    done: false,
    detail: "计划组织五年级学生前往自然博物馆，已提交安全预案、活动方案及保险资料。",
  },
  {
    id: 5,
    title: "11 月课后服务课程信息完善",
    type: "业务协同",
    sender: "课后服务中心",
    date: "2026-11-04 11:30",
    deadline: "11-11 18:00",
    urgent: false,
    done: false,
    detail: "请完善科学实验、创意绘画课程的教学目标及每周教学安排。",
  },
  {
    id: 6,
    title: "冬季校园安全检查报告确认",
    type: "业务协同",
    sender: "杭州市教育局",
    date: "2026-11-04 09:00",
    deadline: "11-15 18:00",
    urgent: false,
    done: false,
    detail: "请检查本校冬季校园安全报告，确认检查结果与整改计划。",
  },
  {
    id: 7,
    title: "教师数字素养培训报名审核",
    type: "业务协同",
    sender: "教师发展中心",
    date: "2026-11-03 10:00",
    deadline: "11-05 18:00",
    urgent: false,
    done: true,
    detail: "教师数字素养培训报名审核已完成。",
  },
];

export const announcements = [
  {
    id: 101,
    title: "关于开展 2026 年秋季学期课后服务质量评估的通知",
    type: "教育通知",
    sender: "杭州市教育局",
    date: "2026-11-06 10:30",
    summary: "进一步规范课后服务管理，全面提升课后服务质量，促进学生全面发展。",
    scope: "全部学校",
    pinned: true,
    content: messageSeeds[0][5],
    attachment: "课后服务质量评估实施方案.pdf",
  },
  {
    id: 102,
    title: "综合教育平台 11 月系统维护公告",
    type: "平台公告",
    sender: "平台运营中心",
    date: "2026-11-05 17:00",
    summary: "平台将于 11 月 8 日 00:00—02:00 进行例行维护，请合理安排使用时间。",
    scope: "全平台",
    pinned: true,
    content:
      "综合教育平台计划于 2026 年 11 月 8 日 00:00—02:00 进行系统维护。\n\n维护期间部分服务将暂时不可用，您的数据不受影响。请提前保存工作，合理安排业务办理时间。\n\n感谢您的理解与支持。",
  },
  {
    id: 103,
    title: "关于做好冬季校园安全工作的通知",
    type: "教育通知",
    sender: "杭州市教育局",
    date: "2026-11-05 14:00",
    summary: "加强校园安全管理，落实冬季安全防范措施，切实保障广大师生安全。",
    scope: "全部学校",
    pinned: false,
    content: messageSeeds[5][5],
    attachment: "冬季校园安全检查表.xlsx",
  },
  {
    id: 104,
    title: "2026 年秋季学期家校共育活动安排",
    type: "学校公告",
    sender: "杭州市实验小学",
    date: "2026-11-04 15:30",
    summary: "携手家校，共育未来。欢迎各位家长积极参与本学期家校共育系列活动。",
    scope: "本校师生",
    pinned: false,
    content: "本学期将开展家长开放日、家庭教育讲座及亲子阅读活动。请关注各班通知，积极报名参与。",
  },
  {
    id: 105,
    title: "关于开展教育机构年度资质复核的公告",
    type: "机构公告",
    sender: "平台运营中心",
    date: "2026-11-03 09:00",
    summary: "请各合作机构及时更新资质信息，按要求完成年度资质复核。",
    scope: "合作机构",
    pinned: false,
    content:
      "年度资质复核工作现已启动。请各合作机构于 11 月 30 日前提交最新营业执照、办学许可证与师资证明。",
  },
];

export interface FileItem {
  id: number;
  name: string;
  type: string;
  size: string;
  date: string;
  source: string;
  blob?: File;
}

export const initialFiles: FileItem[] = [
  {
    id: 1,
    name: "秋季学期教学计划.pdf",
    type: "PDF",
    size: "2.4 MB",
    date: "2026-11-05 11:25",
    source: "我的上传",
  },
  {
    id: 2,
    name: "课后服务质量评估实施方案.pdf",
    type: "PDF",
    size: "1.8 MB",
    date: "2026-11-06 10:30",
    source: "授权文件",
  },
  {
    id: 3,
    name: "冬季校园安全检查表.xlsx",
    type: "Excel",
    size: "256 KB",
    date: "2026-11-05 14:00",
    source: "授权文件",
  },
  {
    id: 4,
    name: "2026 年秋季课程安排.xlsx",
    type: "Excel",
    size: "420 KB",
    date: "2026-11-04 15:20",
    source: "我的上传",
  },
  {
    id: 5,
    name: "校园文化活动方案.docx",
    type: "Word",
    size: "1.2 MB",
    date: "2026-11-03 09:40",
    source: "我的上传",
  },
  {
    id: 6,
    name: "校园开放日海报.svg",
    type: "图片",
    size: "84 KB",
    date: "2026-11-02 16:00",
    source: "我的上传",
  },
  {
    id: 7,
    name: "研学活动备案确认单.pdf",
    type: "PDF",
    size: "890 KB",
    date: "2026-11-01 11:00",
    source: "授权文件",
  },
];

export const routePages = [
  { path: "/login", name: "登录", id: "C01-01", group: "登录与身份", icon: "LogIn" },
  {
    path: "/select-identity",
    name: "选择身份",
    id: "C01-02",
    group: "登录与身份",
    icon: "UsersRound",
  },
  {
    path: "/account/profile",
    name: "个人资料",
    id: "C02-01",
    group: "个人中心",
    icon: "UserRound",
  },
  {
    path: "/account/password",
    name: "修改密码",
    id: "C02-02",
    group: "个人中心",
    icon: "LockKeyhole",
  },
  { path: "/account/sessions", name: "登录设备", id: "C02-03", group: "个人中心", icon: "Monitor" },
  { path: "/messages/inbox", name: "收件箱", id: "C03-01", group: "消息中心", icon: "Inbox" },
  { path: "/messages/todo", name: "我的待办", id: "C03-02", group: "消息中心", icon: "ListTodo" },
  {
    path: "/messages/announcements",
    name: "公告",
    id: "C03-03",
    group: "消息中心",
    icon: "Megaphone",
  },
];
