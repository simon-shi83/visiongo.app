import type { ResourceArticle } from '../types';
import type { SupportedLocale } from '../types/i18n';

const entries = [
  {
    slug: 'getting-started', title: ['Getting Started with VisionStudio and VisionRuntime', '开始使用 VisionStudio 与 VisionRuntime'],
    summary: ['Choose packages, connect the runtime and validate your first inspection workflow.', '从选择发行包、连接 Runtime 到验证第一个检测流程。'],
    content: [
`## 1. Choose compatible packages
Download VisionStudio and VisionRuntime packages for the operating systems and CPU architectures on your engineering workstation and execution device. Check the release notes and bundled installation instructions. Do not assume packages with different version numbers are compatible.

## 2. Prepare the local runtime
Install and start VisionRuntime following the instructions shipped with your release. Verify device permissions, drivers and runtime connectivity before connecting cameras or other production hardware.

## 3. Connect the engineering workspace
Open VisionStudio and configure the Runtime connection for your installation. Check the connection status. Resolve connection errors before running a workflow.

## 4. Build and inspect a workflow
In the workflow workspace, add the acquisition and processing steps required for your task. Use project samples to inspect node inputs and outputs. For shape matching, prepare a template and ROI in the template workspace and verify it against representative samples.

## 5. Validate before production
Check error paths, expected results and execution costs on your own hardware. Keep permission checks and operator confirmation in place when a workflow can control production devices. Treat a working sample as the start of validation, not a production acceptance test.

[Download software](https://visiongo.app/downloads)
`,
`## 1. 选择兼容的安装包
分别为工程工作站和执行设备选择适合操作系统、CPU 架构的 VisionStudio 与 VisionRuntime 安装包。阅读版本说明和随包安装文档，不要仅凭版本号推断兼容性。

## 2. 准备本地 Runtime
按照当前发行包文档安装并启动 VisionRuntime。在接入相机或生产设备前，检查设备权限、驱动和 Runtime 通信状态。

## 3. 连接工程工作台
打开 VisionStudio，根据当前安装环境配置 Runtime 连接并检查状态。连接异常应先排查，再执行工作流。

## 4. 编排并检查工作流
在流程工作区添加任务所需的采集与处理步骤，使用项目样本检查各节点输入、输出。形状匹配任务可在模板工作区准备模板与 ROI，再用代表性样本验证。

## 5. 投产前验证
在自己的硬件上检查异常路径、预期结果与执行耗时。涉及生产设备控制时保留权限检查与操作确认。样本运行成功只是验证的起点，不代表已经完成生产验收。

[前往下载](https://visiongo.app/zh/downloads)
`],
  },
  {
    slug: 'workflow-debugging', title: ['Debugging an Inspection Workflow', '调试检测工作流'],
    summary: ['Inspect node data, ROI settings and execution costs before changing a workflow.', '先检查节点数据、ROI 与执行耗时，再调整流程。'],
    content: [
`## Start with the input
Confirm that the image source is connected and that frames arrive as expected. Record sample conditions and distinguish acquisition faults from processing faults.

## Inspect each step
Work through the graph in order. Inspect inputs and outputs at the step where results first diverge from expectations. Check ROI, template and threshold settings against the actual image.

## Measure on your hardware
Use the profiler to examine processing costs with representative samples. Hardware, image size, operators and configuration all affect results. Keep the measured environment and software versions with your findings.

## Validate the change
Re-run normal and abnormal samples after adjusting a node. Confirm the expected results and failure behavior before using the workflow with production equipment.
`,
`## 从输入开始
确认图像来源已连接，且帧按预期到达。记录样本条件，区分采集异常与处理异常。

## 逐步检查
沿流程顺序检查各节点输入、输出，找到结果首次偏离预期的位置。结合实际图像核对 ROI、模板和阈值配置。

## 在实际硬件上测量
使用性能分析检查代表性样本的处理耗时。硬件、图像尺寸、算子和配置都会影响结果；记录测试环境与软件版本。

## 验证改动
调整节点后重新运行正常与异常样本，检查预期结果及失败行为，再用于生产设备。
`],
  },
  {
    slug: 'local-deployment', title: ['Planning a Local Deployment', '规划本地部署'],
    summary: ['Define execution, connectivity and control requirements for each station.', '为每个工位明确执行、联网与控制要求。'],
    content: [
`## Separate engineering and execution
VisionStudio is the engineering and interaction workspace. VisionRuntime handles detection, device communication and workflow execution. Connect them through the public SDK contracts rather than private application modules.

## List dependencies
Document OS and CPU architecture, camera drivers, optional compute backends and the enabled feature set. Confirm requirements against the release you deploy.

## Check connectivity requirements
Local execution and online features have different dependencies. Test the intended disconnected operation with your actual configuration. Online identity and cloud analysis require their respective services.

## Keep control boundaries
Record who can change a workflow, approve production actions and restore a known configuration. Keep validation and audit evidence for changes that affect production control.
`,
`## 分开工程与执行
VisionStudio 是工程与交互工作台；VisionRuntime 负责检测、设备通信与流程执行。两者通过 SDK 公共契约连接，不依赖对方私有模块。

## 列出依赖
记录系统、CPU 架构、相机驱动、可选计算后端及启用功能，并按实际部署版本确认要求。

## 检查联网需求
本地执行与在线功能的依赖不同。使用真实配置验证计划中的断网运行；在线身份认证与云端分析需要各自服务可用。

## 保留控制边界
明确谁能修改工作流、批准生产操作及恢复已知配置。涉及生产控制的变更保留验证与审计依据。
`],
  },
  {
    slug: 'sdk-contracts', title: ['Understanding SDK Contract Boundaries', '了解 SDK 契约边界'],
    summary: ['Understand the shared contract source and compatibility workflow.', '了解公共契约源与兼容性变更流程。'],
    content: [
`## A shared contract source
The SDK defines the public data contracts used across VISIONGO applications. C++ DTO headers are generated from JSON schemas. Applications consume the generated headers and do not edit them directly.

## Keep application boundaries
Applications communicate through public contracts and formal transports. They do not import each other's private source directories, headers or internal symbols.

## Change contracts first
Update the contract source, regenerate the bindings and run compatibility checks before updating producers and consumers. Prefer optional additions. Breaking changes require a protocol version change.

## Check consumers
Validate all affected producers and consumers, including error paths and older peers. A successful build alone does not prove wire compatibility.
`,
`## 公共契约源
SDK 定义 VISIONGO 应用之间的公共数据契约。C++ DTO 头文件由 JSON schema 生成，应用消费生成结果，不直接修改生成文件。

## 保持应用边界
应用通过公共契约与正式传输路径通信，不导入彼此私有源码目录、头文件或内部符号。

## 先变更契约
先修改契约源、重新生成绑定并完成兼容性检查，再更新生产者与消费者。新增字段优先使用 optional；破坏性变更需升级协议版本。

## 检查消费方
验证所有受影响的生产者和消费者，包括异常路径与旧版本对端。编译成功本身不能证明线上协议兼容。
`],
  },
];

export const getResourceArticles = (locale: SupportedLocale = 'en'): ResourceArticle[] => entries.map(entry => {
  const index = locale === 'zh' ? 1 : 0;
  return { id: entry.slug, slug: entry.slug, type: 'Tutorial', title: entry.title[index], summary: entry.summary[index], date: '2026-10-14', readTime: locale === 'zh' ? '约 3 分钟' : '3 min read', author: 'VISIONGO Engineering', tags: ['VisionStudio', 'VisionRuntime'], contentMarkdown: entry.content[index] };
});
export const RESOURCE_ARTICLES_EN = getResourceArticles('en');
export const RESOURCE_ARTICLES_ZH = getResourceArticles('zh');
