import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

execFileSync("python3", ["scripts/generate-samples.py"], { stdio: "inherit" });

// Embed a real CJK font so previews never depend on the reader's language packs.
const font = (await readFile("public/fonts/noto-sans-sc-400.ttf")).toString("base64");
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
    @font-face{font-family:Sample;src:url(data:font/ttf;base64,${font}) format('truetype')}
    *{box-sizing:border-box}body{margin:0;color:#26334d;font:14px Sample,sans-serif}
    .brand{background:#4e73f8;color:white;padding:22px 42px;letter-spacing:3px;font-size:15px}
    .content{padding:45px 42px}.title{font-size:28px;margin-bottom:12px}
    .meta{color:#96a0b1;font-size:12px;padding-bottom:24px;border-bottom:1px solid #e9edf4}
    .section{font-size:18px;margin:32px 0 14px;color:#4e73f8}
    p{line-height:2.1;margin:9px 0;color:#5e6b82}
    .course{display:flex;padding:13px 12px;border-bottom:1px solid #e9edf4}
    .course span{width:25%}.course.header{background:#f5f7fb;color:#96a0b1;font-size:12px}
    .footer{position:fixed;bottom:28px;left:42px;right:42px;color:#96a0b1;font-size:11px}
  </style></head><body>
    <div class="brand">EDU CONNECT · 综合教育平台</div>
    <div class="content"><div class="title">2026 年秋季学期教学计划</div>
    <div class="meta">杭州市实验小学 · 2026 年 11 月 · 原型演示</div>
    <div class="section">一、教学目标</div>
    <p>丰富课程内容，提升课后服务质量，促进学生全面发展。</p>
    <p>关注课程建设、师资配置、服务质量和家长满意度。</p>
    <div class="section">二、课程安排</div>
    <div class="course header"><span>课程名称</span><span>适用年级</span><span>任课教师</span><span>时间</span></div>
    <div class="course"><span>科学探索</span><span>三至四年级</span><span>陈老师</span><span>周一</span></div>
    <div class="course"><span>创意绘画</span><span>一至三年级</span><span>王老师</span><span>周二</span></div>
    <div class="course"><span>趣味编程</span><span>四至六年级</span><span>李老师</span><span>周三</span></div>
    <div class="course"><span>阅读与表达</span><span>三至六年级</span><span>林老师</span><span>周四</span></div>
    <div class="section">三、工作要求</div>
    <p>加强组织领导，落实安全保障，关注学生参与情况，及时总结活动经验。</p></div>
    <div class="footer">本文件为通用演示样本，不包含真实业务数据。</div>
  </body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: "public/samples/education-sample.pdf",
    format: "A4",
    printBackground: true,
    margin: { bottom: "20mm" },
  });
} finally {
  await browser.close();
}
