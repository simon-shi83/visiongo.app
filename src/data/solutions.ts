import type { Solution } from '../types';
import type { SupportedLocale } from '../types/i18n';

export const getSolutions = (locale: SupportedLocale = 'en'): Solution[] => {
  const zh = locale === 'zh';
  return [
    { id: 'shape-matching', slug: 'shape-matching', title: zh ? '形状匹配与定位' : 'Shape matching and positioning', shortDescription: zh ? '从样本创建模板，在代表性图像上验证匹配与定位结果。' : 'Create templates from samples and validate matching and positioning on representative images.', fullDescription: zh ? '在 VisionStudio 模板工作区准备样本、ROI 与特征轮廓，然后将匹配配置用于检测流程。用项目中的正常与异常样本评估适用性。' : 'Prepare samples, ROI and feature contours in the VisionStudio template workspace, then use matching configuration in an inspection workflow. Evaluate fit with normal and abnormal project samples.', industry: zh ? '零件检测与工程定位' : 'Part inspection and engineering positioning', keyBenefits: zh ? ['模板训练与验证', 'ROI 与阈值配置', '流程节点输入输出检查'] : ['Template training and validation', 'ROI and threshold configuration', 'Node input and output inspection'], recommendedStack: ['VisionStudio', 'VisionRuntime'] },
    { id: 'measurement', slug: 'measurement', title: zh ? '尺寸测量工作流' : 'Measurement workflows', shortDescription: zh ? '组合图像处理与测量步骤，验证项目所需的几何量。' : 'Combine image processing and measurement steps to validate project geometry.', fullDescription: zh ? '根据对象、光学条件与标定环境配置测量流程。使用实际样本验证重复性与误差，精度和耗时以自己的硬件测量结果为准。' : 'Configure measurement workflows for the object, optics and calibration environment. Validate repeatability and error with real samples; accuracy and processing costs depend on measurements from your hardware.', industry: zh ? '工程测量与质量检查' : 'Engineering measurement and quality inspection', keyBenefits: zh ? ['处理与测量节点组合', '样本结果检查', '执行耗时分析'] : ['Processing and measurement composition', 'Sample result inspection', 'Execution profiling'], recommendedStack: ['VisionStudio', 'VisionRuntime'] },
    { id: 'region-analysis', slug: 'region-analysis', title: zh ? '区域与 Blob 分析' : 'Region and blob analysis', shortDescription: zh ? '使用滤波、区域分析和判定步骤组织检测任务。' : 'Organize inspection tasks with filtering, region analysis and decision steps.', fullDescription: zh ? '逐步检查图像、ROI 和区域分析结果，再根据任务要求配置判定逻辑。现场设备控制需保留权限、验证与操作确认。' : 'Inspect images, ROI and region-analysis results step by step, then configure decision logic for the task. Retain permissions, validation and operator confirmation for equipment control.', industry: zh ? '图像检测与区域分析' : 'Image inspection and region analysis', keyBenefits: zh ? ['滤波与区域分析', '逐步调试', '生产控制边界'] : ['Filtering and region analysis', 'Step-by-step debugging', 'Production control boundaries'], recommendedStack: ['VisionStudio', 'VisionRuntime'] },
  ];
};
export const SOLUTIONS_EN = getSolutions('en');
export const SOLUTIONS_ZH = getSolutions('zh');
export const SOLUTIONS = SOLUTIONS_EN;
