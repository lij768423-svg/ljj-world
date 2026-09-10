import { optimizedCovers } from "./assets/optimizedCovers";

export type BlogSection = {
  title: string;
  paragraphs: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  date: string;
  readingTime: string;
  excerpt: string;
  image: string;
  srcSet?: string;
  imageAlt: string;
  imagePosition?: string;
  intro: string;
  sections: BlogSection[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "grok-register-panel",
    title: "把批量注册做成可运维产品：Grok Register Panel",
    category: "开发者工具",
    date: "2026.08.07",
    readingTime: "9 分钟阅读",
    excerpt: "脚本能跑通一次不算完成。真正难的是把并发、出口、邮箱、风控和补录，收敛成一套可以长期操作的系统。",
    ...optimizedCovers["grok-register-panel"],
    imageAlt: "Grok Register Panel 控制台界面封面",
    imagePosition: "center top",
    intro: "我最初只想稳定完成一批 Grok 账号注册。很快发现，真正消耗时间的不是单次流程，而是失败后的判断：是代理差、邮箱被拒、还是风控提前结束了 OAuth。于是我把注册引擎和 Live 面板做成同一套产品，让启停、观察和恢复都发生在一个界面里。",
    sections: [
      {
        title: "从一次性脚本到可操作面板",
        paragraphs: [
          "上游 AaronL725/grok-register 已经把 Camoufox 注册链路搭了起来。我需要的是继续往前走：多轮 batch、实时成功率、失败补录，以及在风控累积时停下来分析 ASN，而不是盲目重试。",
          "面板不是装饰。它把 workers、batch 数量、再跑 N、风控阈值和黑名单状态写成可读写的控制面。命令行仍然可用，但日常决策更适合发生在看得见进度的地方。",
        ],
      },
      {
        title: "出口质量决定上限",
        paragraphs: [
          "注册成功率往往先被出口卡住。我在启动前解析出口 IP 与 ASN，命中黑名单直接换口；网络异常进入短冷却，注册风控进入长冷却，避免同一坏口反复浪费浏览器会话。",
          "外部代理池支持导入、去重、探活和启停。API 只返回脱敏端点，不回显账号密码。一个账号从注册到 SSO、OAuth 固定同一出口，避免中途换线把会话状态搅乱。",
        ],
      },
      {
        title: "邮箱与域名也是资源池",
        paragraphs: [
          "多邮箱后端（Cloudflare Worker 邮、DuckMail、YYDS、MailNest、CloudMail、MoeMail）解决的是「能收到验证码」。域名轮换解决的是「这个域还被接受吗」。",
          "只有 xAI 明确拒绝邮箱域名时才累计连续失败并自动拉黑；邮箱 API 故障或验证码超时不处罚域名。这样基础设施抖动不会被误判成域名质量问题。",
        ],
      },
      {
        title: "风控要早停，失败要可补录",
        paragraphs: [
          "当服务端给出 botFlagSource=1 且 policy=deny 时，继续走 OAuth 只是消耗配额。早停让编排器把注意力转到 ASN 分析和冷却，而不是空转。",
          "成功路径写入 CPA / Grok2API auth；失败路径留下可消费的 SSO pending 与 accounts 文本。面板上的账号补录会跳过已有邮箱，成功一条立即出队，把「半成品」重新接回主链路。",
        ],
      },
      {
        title: "安全是面板的默认配置",
        paragraphs: [
          "写接口必须 MONITOR_TOKEN；绑定失败不会偷偷回退到 0.0.0.0；原始日志尾默认关闭。代理池、域名池、账号与运行状态文件使用 owner-only 权限。",
          "停止任务只匹配当前项目根目录下的进程，避免在同机多项目环境里误杀。开源仓库刻意不提交 config、accounts、cpa_auth 和真实 stickies。",
        ],
      },
      {
        title: "我从这件事里带走的",
        paragraphs: [
          "批量自动化如果只追求「跑得动」，很容易变成不可观察的黑盒。把它当成产品来设计之后，边界变得清楚：注册机负责执行，面板负责决策，代理与邮箱是可替换资源，风控信号是停止条件而不是噪音。",
          "仓库在 GitHub 开源：https://github.com/lij768423-svg/grok-register-panel 。它基于 MIT 上游扩展，适合自有环境联调与流程研究；使用时请遵守服务条款与当地法律。",
        ],
      },
    ],
  },

  {
    slug: "home-server-as-a-product",
    title: "我为什么把个人服务器当成长期产品",
    category: "自建基础设施",
    date: "2026.08.05",
    readingTime: "6 分钟阅读",
    excerpt: "自建的价值不在容器数量，而在于把服务边界、维护节奏和恢复路径真正掌握在自己手里。",
    image: "/assets/project-covers/home-lab.webp",
    imageAlt: "自建服务器与工具箱概念封面",
    imagePosition: "center top",
    intro: "我的服务器不是一次装完就结束的收藏柜。它更像一个需要持续设计、交付和维护的个人产品，服务对象首先是每天都在使用它的自己。",
    sections: [
      {
        title: "先确定服务边界",
        paragraphs: [
          "我先区分公开服务、仅内网访问的工具和承载个人数据的系统，再决定域名、鉴权、网络路径与备份方式。边界清楚之后，新增容器才不会变成新的风险入口。",
          "Homepage 负责入口，Tailscale 负责可信设备之间的访问，反向代理只接收确实需要公开的服务。每一层都承担明确职责。",
        ],
      },
      {
        title: "把维护纳入日常",
        paragraphs: [
          "监控、备份和维护记录不是部署后的附加项。服务上线时，它们就应该一起出现。我会记录异常、变更和恢复结果，让下一次处理问题时有真实上下文。",
          "每日 AI 维护负责汇总状态和发现异常，人仍然决定是否执行影响数据或网络的操作。这种分工比完全自动化更适合个人基础设施。",
        ],
      },
      {
        title: "自建真正带来的东西",
        paragraphs: [
          "服务器最终提供的不是更多软件，而是一套可迁移的工作方式。开发环境、照片、笔记、自动化任务和公开产品都能在同一套可观察、可恢复的基础设施上继续生长。",
        ],
      },
    ],
  },
  {
    slug: "ai-study-workflow",
    title: "考研、开发与 AI，如何共享同一套工作流",
    category: "学习产品",
    date: "2026.08.02",
    readingTime: "7 分钟阅读",
    excerpt: "把错题、解释和复习安排连接起来，比再做一个聊天框更接近 AI 在学习中的真实价值。",
    image: "/assets/project-covers/408-web.webp",
    imageAlt: "408 学习产品概念封面",
    imagePosition: "center center",
    intro: "备考和开发看似争夺时间，但它们也可以共享同一种问题解决方式：记录输入，拆分状态，缩短反馈，再把有效结果沉淀为可以复用的资产。",
    sections: [
      {
        title: "从一次答错开始",
        paragraphs: [
          "一道题答错之后，最重要的不是立刻看完解释，而是保留错误答案、知识点、原因和下一次出现时间。结构化记录让复盘从模糊印象变成可以继续处理的任务。",
        ],
      },
      {
        title: "让 AI 承接解释",
        paragraphs: [
          "AI 适合根据题目、选项和当前疑问生成针对性解释，但它不应该替代题库、答案和复习计划。模型负责展开理解，产品负责保证流程连续。",
          "解释完成后，有价值的内容继续写入 Markdown 知识库。这样一次对话不会在关闭窗口后消失。",
        ],
      },
      {
        title: "把学习反馈给产品",
        paragraphs: [
          "真实备考会不断暴露搜索、标记、复习节奏和内容组织上的问题。作为使用者和开发者，我可以当天发现问题，当天修改，再在下一轮学习中验证。",
        ],
      },
    ],
  },
  {
    slug: "two-desk-setups",
    title: "两套桌搭，不是同一套审美的复制",
    category: "工作空间",
    date: "2026.07.29",
    readingTime: "5 分钟阅读",
    excerpt: "学校的暖色学习工位和家里的冷色硬件空间，分别服务两种完全不同的使用状态。",
    image: "/assets/desk-setup/desk-2026-current-1600.webp",
    imageAlt: "学校的暖色学习工位与桌面设备",
    imagePosition: "center center",
    intro: "我没有让两套桌搭保持相同风格。学校需要快速进入学习与开发，家里则承担硬件实验、影音和更长时间的沉浸使用。",
    sections: [
      {
        title: "学校强调收束",
        paragraphs: [
          "暖色灯光、有限设备和固定收纳让桌面更容易恢复到可以开始学习的状态。它不追求设备完整，而是减少每次坐下前的准备成本。",
        ],
      },
      {
        title: "家里保留展开空间",
        paragraphs: [
          "冷色环境更适合主机、音频设备和硬件拆装。显示器、网络与供电都留出扩展空间，视觉上的克制来自线材和设备层级，而不是减少功能。",
        ],
      },
      {
        title: "桌搭是工作流的外壳",
        paragraphs: [
          "设备只有在降低切换成本时才有价值。两套空间最终都围绕同一件事设计：让当前任务更快开始，也更容易在结束后恢复秩序。",
        ],
      },
    ],
  },
  {
    slug: "solo-delivery-boundaries",
    title: "一个人交付网站，我如何控制项目边界",
    category: "独立开发",
    date: "2026.07.24",
    readingTime: "8 分钟阅读",
    excerpt: "从内容结构到部署维护，个人交付需要更清楚的边界，而不是把每一个想法都塞进首个版本。",
    image: "/assets/project-covers/law-site.webp",
    imageAlt: "律师事务所数字站概念封面",
    imagePosition: "center top",
    intro: "个人开发者可以覆盖设计、前端、后端和部署，但覆盖范围越广，越需要在开始时明确什么必须完成，什么应该等待真实使用反馈。",
    sections: [
      {
        title: "先把内容模型确定下来",
        paragraphs: [
          "机构网站首先是信息系统。服务、案例、文章、人员和咨询入口的关系确定后，视觉设计才有稳定的对象，后台也能围绕真实更新方式建立。",
        ],
      },
      {
        title: "交互只解决明确问题",
        paragraphs: [
          "在线咨询、AI 摘要和人工接管都有具体使用场景。只有当状态切换、失败处理和后续维护路径清楚时，这些功能才进入交付范围。",
          "无法说明谁会使用、如何恢复的功能，即使视觉上吸引人，也应该先留在实验环境。",
        ],
      },
      {
        title: "上线只是维护的开始",
        paragraphs: [
          "部署之后仍要处理内容更新、日志、备份和服务可用性。把这些工作提前写进交付结构，项目才不会在首屏完成后失去生命力。",
        ],
      },
    ],
  },
];

export function getBlogPost(slug?: string) {
  return blogPosts.find((post) => post.slug === slug);
}
