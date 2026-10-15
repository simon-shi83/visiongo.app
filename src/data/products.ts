import type { Product } from '../types';
import type { SupportedLocale } from '../types/i18n';

function createProduct(id: Product['id'], locale: SupportedLocale): Product {
  const zh = locale === 'zh';
  const definitions = {
    visionstudio: { name: 'VisionStudio', action: 'Build', color: '#34d399', role: zh ? '可视化工程工作台' : 'Engineering workspace', summary: zh ? '编排检测流程，检查节点数据，制作形状模板并分析运行结果。' : 'Design inspection workflows, inspect node data, prepare shape templates and analyze results.', features: zh ? ['节点式流程编排与调试', '形状模板训练与识别验证', 'ROI 编辑与执行耗时分析'] : ['Node-based workflow design and debugging', 'Shape template training and matching validation', 'ROI editing and execution profiling'], deployment: zh ? '工程工作站；系统与架构以发行包为准' : 'Engineering workstation; OS and architecture depend on the package' },
    visionruntime: { name: 'VisionRuntime', action: 'Run', color: '#22d3ee', role: zh ? '现场执行引擎' : 'Local execution runtime', summary: zh ? '在执行设备上运行检测工作流，处理图像与设备通信，通过 SDK 契约与工作台连接。' : 'Execute inspection workflows on the local device, process images and communicate with equipment, connected to the workspace through SDK contracts.', features: zh ? ['图像处理与检测流程执行', '设备控制与通信边界', '公共 SDK 契约与工作台集成'] : ['Image processing and inspection workflow execution', 'Device control and communication boundaries', 'Workspace integration through public SDK contracts'], deployment: zh ? '现场执行设备；驱动与计算后端按实际配置确认' : 'Local execution device; confirm drivers and compute backends for your configuration' },
    visionedge: { name: 'VisionEdge', action: 'Assist', color: '#a78bfa', role: zh ? '边缘网关' : 'Edge gateway', summary: zh ? 'VISIONGO 架构中的边缘网关与本地控制边界。具体能力与部署要求按实际发行版本确认。' : 'The edge gateway and local control boundary in the VISIONGO architecture. Confirm capabilities and deployment requirements for the release you use.', features: zh ? ['边缘网关角色', '本地控制边界', '通过公共契约与其他应用通信'] : ['Edge gateway role', 'Local control boundary', 'Communication through public contracts'], deployment: zh ? '现场边缘设备；部署条件请咨询工程团队' : 'On-site edge device; consult engineering about deployment requirements' },
    visioncloud: { name: 'VisionCloud', action: 'Extend', color: '#fbbf24', role: zh ? '云端建议与分析' : 'Cloud advice and analysis', summary: zh ? '为联网场景提供可选的云端建议与分析服务，生产控制保留现场验证与审批边界。' : 'Optional cloud advice and analysis for connected deployments, with production control retaining on-site validation and approval boundaries.', features: zh ? ['可选云端建议', '联网分析服务', '现场控制权限与审批边界'] : ['Optional cloud advice', 'Connected analysis services', 'On-site control permissions and approval boundaries'], deployment: zh ? '在线服务，无本地安装包' : 'Online service, no local installer' },
  };
  const definition = definitions[id];
  return { id, slug: id, name: definition.name, shortAction: definition.action as Product['shortAction'], positioning: definition.role, tagline: definition.role, summary: definition.summary, description: definition.summary, accentColor: definition.color, badge: zh ? '产品介绍' : 'Product overview', highlights: definition.features, keyCapabilities: definition.features.map((title, index) => ({ title, description: zh ? '可用性与具体配置以当前版本及随包文档为准。' : 'Availability and configuration depend on the current release and bundled documentation.', icon: ['Workflow', 'Cpu', 'Shield'][index] })), architectureRole: definition.role, deploymentTarget: definition.deployment, connectivityRequirement: zh ? '按启用功能确认；在线登录与云端功能需要相应服务' : 'Depends on enabled features; online sign-in and cloud features require their services' };
}
const ids = ['visionstudio', 'visionruntime', 'visionedge', 'visioncloud'] as const;
export const PRODUCTS_EN: Record<string, Product> = Object.fromEntries(ids.map(id => [id, createProduct(id, 'en')]));
export const PRODUCTS_ZH: Record<string, Product> = Object.fromEntries(ids.map(id => [id, createProduct(id, 'zh')]));
export const getProducts = (locale: SupportedLocale = 'en'): Product[] => ids.map(id => createProduct(id, locale));
export const getProduct = (slug: string, locale: SupportedLocale = 'en'): Product => (locale === 'zh' ? PRODUCTS_ZH : PRODUCTS_EN)[slug] || createProduct('visionstudio', locale);
export const PRODUCTS = PRODUCTS_EN;
export const PRODUCT_LIST = getProducts();
