(() => {
  'use strict';

  const STORAGE = {
    brand: 'zhiyuan_brand_memory',
    experience: 'zhiyuan_experience_memory',
    campaign: 'zhiyuan_campaigns',
    performance: 'zhiyuan_performance',
    versions: 'zhiyuan_versions',
    migrated: 'zhiyuan_storage_migrated_v1'
  };

  const GOALS = {
    awareness: '曝光',
    engagement: '互动',
    consideration: '种草',
    traffic: '引流',
    conversion: '转化'
  };

  const EXPLORATION_RATE = 0.2;
  const MIN_BASELINE_PEERS = 3;

  const CHANNEL_PROFILES = {
    xiaohongshu: {
      id: 'xiaohongshu', name: '小红书', shortName: '小红书', contentType: '图文笔记', role: '种草 · 搜索承接', color: '#e9475f',
      tone: ['生活方式表达', '场景化', '第一人称或用户视角', '减少生硬销售话术'],
      structure: ['标题吸引点', '正文', '话题', '配图建议'],
      outputFields: [{key:'title',label:'标题',title:true},{key:'body',label:'正文'},{key:'hashtags',label:'话题',format:'hashtags'},{key:'visualSuggestion',label:'配图建议'}],
      formatRule: { type:'arrayLength', field:'hashtags', min:3, max:6, term:'话题数量', label:'小红书平台格式', message:'小红书建议使用 3–6 个相关话题。', suggestion:'调整话题数量后再定稿。' },
      rules: ['标题要有明确吸引点', '适量使用表情符号', '使用 3–6 个相关话题', '强调可收藏、可分享的信息'],
      availableMetrics: ['impressions', 'likes', 'collects', 'comments', 'shares'],
      goalMetrics: { awareness: 'impressions', engagement: 'engagement_rate', consideration: 'collect_rate', traffic: 'ctr', conversion: 'conversion_rate' }
    },
    douyin: {
      id: 'douyin', name: '抖音', shortName: '抖音', contentType: '短视频', role: '曝光 · 场景展示', color: '#222831',
      tone: ['口语化', '节奏快', '视频视觉优先', '一条内容只表达一个核心卖点'],
      structure: ['视频开场', '15–30 秒脚本', '发布文案', '推荐话题', '拍摄建议'],
      outputFields: [{key:'hook',label:'视频开场',title:true},{key:'script',label:'15–30 秒短视频脚本'},{key:'caption',label:'发布文案'},{key:'hashtags',label:'推荐话题',format:'hashtags'},{key:'shootingSuggestion',label:'拍摄建议'}],
      formatRule: { type:'requiredText', requiredFields:['hook'], field:'script', includes:'0–3s', term:'视频开场', label:'抖音平台格式', message:'短视频缺少前 3 秒吸引点。', suggestion:'补充 0–3 秒镜头与口播。' },
      rules: ['前 3 秒必须有明确吸引点', '产品尽早出现', '行动引导简洁', '镜头围绕一个卖点展开'],
      availableMetrics: ['plays', 'likes', 'comments', 'shares', 'completion_rate'],
      goalMetrics: { awareness: 'plays', engagement: 'engagement_rate', consideration: 'completion_rate', traffic: 'ctr', conversion: 'conversion_rate' }
    },
    wechat: {
      id: 'wechat', name: '微信公众号', shortName: '微信', contentType: '文章', role: '沉淀 · 长期经营', color: '#15975d',
      tone: ['结构化', '品牌故事完整', '事实描述充分', '情绪表达克制'],
      structure: ['标题', '摘要', '正文结构', '完整正文', '行动引导', '封面建议'],
      outputFields: [{key:'title',label:'标题',title:true},{key:'summary',label:'摘要'},{key:'outline',label:'正文结构'},{key:'body',label:'完整正文'},{key:'cta',label:'行动引导'},{key:'coverSuggestion',label:'封面建议'}],
      formatRule: { type:'minLength', field:'body', min:280, term:'正文长度', label:'微信公众号平台格式', message:'公众号正文信息量不足。', suggestion:'补充结构、产品事实与使用场景。' },
      rules: ['正文信息完整', '段落层级清楚', '行动引导清晰', '产品事实不做延伸推断'],
      availableMetrics: ['reads', 'shares', 'completion_rate'],
      goalMetrics: { awareness: 'reads', engagement: 'share_rate', consideration: 'completion_rate', traffic: 'ctr', conversion: 'conversion_rate' }
    }
  };

  const CHANNEL_ADAPTERS = {
    xiaohongshu: generateXiaohongshuContent,
    douyin: generateDouyinContent,
    wechat: generateWechatContent
  };

  const DEFAULT_BRAND_MEMORY = {
    brand: {
      intro: '润心食品是一家以豆制品与中式甜品为核心业务的食品品牌演示案例。本资料仅用于展示内容工作流。',
      positioning: '提供适合日常家庭与轻松分享场景的豆制品和中式甜品。',
      voice: '自然、亲切、生活化；用具体食用场景表达产品价值，避免生硬销售话术。',
      audience: '关注日常饮食体验、家庭分享和地方风味的消费者。',
      values: '尊重产品事实、重视地方饮食文化、让传统风味更自然地进入现代生活。',
      forbidden: '禁止医疗、营养功效、减肥、养生、绝对化排名及无法由资料支持的食品宣传表述。',
      source: '演示资料'
    },
    products: [
      {
        id: 'product-red-bean-tofu-pudding', name: '客家婆红豆冰糖豆腐花', category: '豆腐花 / 中式甜品',
        description: '红豆与冰糖风味的即食豆腐花演示产品，适合冷藏后作为早餐、下午茶或家庭分享甜品。',
        sellingPoints: ['红豆与冰糖风味', '豆腐花口感细腻', '冷藏后食用更适合夏季场景'],
        specification: '待补充', serving: '开盖即食；可冷藏后食用', scenarios: ['早餐', '下午茶', '夏季消暑场景', '家庭分享'],
        usableFacts: ['红豆冰糖风味', '豆腐花', '可冷藏后食用', '适合早餐与下午茶场景'],
        forbiddenInference: ['高营养', '减肥', '养生', '治疗或改善身体问题', '零添加'], source: '演示数据'
      },
      {
        id: 'product-mountain-tofu-pudding', name: '山水豆腐花', category: '豆腐花 / 中式甜品',
        description: '突出豆香与细腻口感的豆腐花演示产品。', sellingPoints: ['细腻口感', '自然豆香', '开盖即食'],
        specification: '待补充', serving: '开盖即食；按个人喜好冷藏后食用', scenarios: ['早餐', '下午茶', '家庭分享'],
        usableFacts: ['豆腐花', '细腻口感', '开盖即食'], forbiddenInference: ['蛋白含量', '保健功效', '低糖', '无防腐剂'], source: '演示数据'
      },
      {
        id: 'product-mountain-tofu', name: '山水豆腐', category: '豆制品 / 豆腐',
        description: '适合家庭日常烹饪的豆腐演示产品。', sellingPoints: ['适合多种家常做法', '豆香自然', '方便搭配日常菜式'],
        specification: '待补充', serving: '建议充分加热后，按菜谱烹饪', scenarios: ['家庭正餐', '家常烹饪', '朋友聚餐'],
        usableFacts: ['豆腐', '适合家常烹饪', '可搭配多种菜式'], forbiddenInference: ['补钙', '高蛋白', '减脂', '适合特定疾病人群'], source: '演示数据'
      },
      {
        id: 'product-mountain-yuba', name: '山水腐竹', category: '豆制品 / 腐竹',
        description: '用于家常烹饪与火锅场景的腐竹演示产品。', sellingPoints: ['豆香风味', '适合焖煮与火锅', '便于家庭常备'],
        specification: '待补充', serving: '按包装说明泡发后充分烹饪', scenarios: ['家庭正餐', '火锅', '焖煮菜式'],
        usableFacts: ['腐竹', '适合焖煮与火锅', '食用前需按说明处理'], forbiddenInference: ['高蛋白', '健身食品', '减脂', '养生功效'], source: '演示数据'
      }
    ],
    customFacts: []
  };

  const DEFAULT_EXPERIENCES = [
    {
      id: 'exp-xhs-scene-001', platform: 'xiaohongshu', product_category: '豆腐花 / 中式甜品', campaign_goal: 'consideration',
      content_pattern: '地域文化 + 明确食用场景', insight: '在豆腐花种草内容中，用地域身份切入，再快速落到冰镇与分享场景，收藏表现更好。',
      source_content_id: 'seed-xhs-scene', source_campaign: '夏日冰豆腐花经验样本', metric_name: 'collect_rate', metric_value: 6.8, baseline_value: 4.7, lift: 45, learned_at: '2026-08-30'
    },
    {
      id: 'exp-dy-product-001', platform: 'douyin', product_category: '豆制品 / 豆腐', campaign_goal: 'awareness',
      content_pattern: '成品画面前置 + 单一卖点', insight: '视频前 3 秒先展示成品和产品，再用一个家常场景解释卖点，更有利于播放完成。',
      source_content_id: 'seed-dy-product', source_campaign: '家常豆腐经验样本', metric_name: 'plays', metric_value: 87000, baseline_value: 70000, lift: 24, learned_at: '2026-08-27'
    }
  ];

  const DEFAULT_PERFORMANCE = [
    { id:'perf-xhs-001', title:'广东人的夏天少不了这一口', platform:'xiaohongshu', product:'客家婆红豆冰糖豆腐花', product_category:'豆腐花 / 中式甜品', goal:'consideration', published_at:'2026-08-28T16:30:00+08:00', source:'demo', metrics:{impressions:18200,likes:980,collects:1240,comments:136,shares:218}, pattern:{hook:'地域身份 + 夏季消费场景',structure:'场景 → 产品 → 食用方式 → 收藏引导',expression:'生活方式分享感强，直接销售表达较少',scope:'豆腐花 / 即食食品 / 夏季场景种草'} },
    { id:'perf-xhs-002', title:'下班回家先冰上一碗豆腐花', platform:'xiaohongshu', product:'客家婆红豆冰糖豆腐花', product_category:'豆腐花 / 中式甜品', goal:'consideration', published_at:'2026-08-24T18:00:00+08:00', source:'demo', metrics:{impressions:15000,likes:790,collects:870,comments:102,shares:165}, pattern:{hook:'下班情绪 + 冰镇动作',structure:'情绪 → 食用动作 → 产品 → 分享建议',expression:'第一人称体验自然',scope:'即食甜品 / 上班族 / 夏季'} },
    { id:'perf-xhs-003', title:'周末下午茶的简单搭配', platform:'xiaohongshu', product:'山水豆腐花', product_category:'豆腐花 / 中式甜品', goal:'consideration', published_at:'2026-08-18T15:00:00+08:00', source:'demo', metrics:{impressions:14100,likes:620,collects:508,comments:71,shares:95}, pattern:{hook:'周末下午茶',structure:'场景 → 搭配 → 产品',expression:'轻松但产品出现偏晚',scope:'豆腐花 / 下午茶'} },
    { id:'perf-xhs-004', title:'早餐加一份细腻豆香', platform:'xiaohongshu', product:'山水豆腐花', product_category:'豆腐花 / 中式甜品', goal:'consideration', published_at:'2026-08-12T08:10:00+08:00', source:'demo', metrics:{impressions:13300,likes:510,collects:479,comments:58,shares:77}, pattern:{hook:'早餐场景',structure:'产品 → 口感 → 早餐',expression:'信息清楚但记忆点较弱',scope:'豆腐花 / 早餐'} },
    { id:'perf-dy-001', title:'今晚豆腐这样做', platform:'douyin', product:'山水豆腐', product_category:'豆制品 / 豆腐', goal:'awareness', published_at:'2026-08-26T19:15:00+08:00', source:'demo', metrics:{plays:87000,likes:4100,comments:326,shares:812,completion_rate:43}, pattern:{hook:'成品近景 + 今晚吃什么',structure:'成品 → 产品 → 三步烹饪 → 行动引导',expression:'口语短句，单一做法',scope:'豆腐 / 家常菜 / 短视频'} },
    { id:'perf-dy-002', title:'一盘家常豆腐的20秒做法', platform:'douyin', product:'山水豆腐', product_category:'豆制品 / 豆腐', goal:'awareness', published_at:'2026-08-22T17:40:00+08:00', source:'demo', metrics:{plays:72000,likes:3500,comments:284,shares:620,completion_rate:40}, pattern:{hook:'20秒做法承诺',structure:'产品 → 步骤 → 成品',expression:'节奏清楚',scope:'豆腐 / 菜谱'} },
    { id:'perf-dy-003', title:'腐竹下锅前别忘了这一步', platform:'douyin', product:'山水腐竹', product_category:'豆制品 / 腐竹', goal:'awareness', published_at:'2026-08-16T12:20:00+08:00', source:'demo', metrics:{plays:68000,likes:2780,comments:310,shares:706,completion_rate:38}, pattern:{hook:'操作提醒',structure:'问题 → 处理方式 → 成品',expression:'实用信息明确',scope:'腐竹 / 烹饪技巧'} },
    { id:'perf-dy-004', title:'火锅里的腐竹怎么搭', platform:'douyin', product:'山水腐竹', product_category:'豆制品 / 腐竹', goal:'awareness', published_at:'2026-08-10T20:10:00+08:00', source:'demo', metrics:{plays:59000,likes:2210,comments:174,shares:402,completion_rate:34}, pattern:{hook:'火锅场景',structure:'场景 → 产品 → 搭配',expression:'画面明确但 开场吸引点 较弱',scope:'腐竹 / 火锅'} },
    { id:'perf-wx-001', title:'一碗豆腐花里的客家味', platform:'wechat', product:'客家婆红豆冰糖豆腐花', product_category:'豆腐花 / 中式甜品', goal:'engagement', published_at:'2026-08-20T10:00:00+08:00', source:'demo', metrics:{reads:12600,shares:428,completion_rate:64}, pattern:{hook:'地方风味故事',structure:'记忆 → 风味 → 产品事实 → 分享引导',expression:'克制叙事，情绪与事实平衡',scope:'食品品牌故事 / 地方文化'} },
    { id:'perf-wx-002', title:'夏日甜品也可以很简单', platform:'wechat', product:'山水豆腐花', product_category:'豆腐花 / 中式甜品', goal:'engagement', published_at:'2026-08-15T10:00:00+08:00', source:'demo', metrics:{reads:11200,shares:325,completion_rate:59}, pattern:{hook:'生活方式问题',structure:'场景 → 食用建议 → 产品',expression:'实用清晰',scope:'甜品 / 夏季'} },
    { id:'perf-wx-003', title:'家常豆腐的三种打开方式', platform:'wechat', product:'山水豆腐', product_category:'豆制品 / 豆腐', goal:'engagement', published_at:'2026-08-08T10:00:00+08:00', source:'demo', metrics:{reads:9800,shares:235,completion_rate:56}, pattern:{hook:'方法数量',structure:'总述 → 三种做法 → 产品事实',expression:'信息密度高',scope:'豆腐 / 家常烹饪'} },
    { id:'perf-wx-004', title:'从一桌家常菜说起', platform:'wechat', product:'山水腐竹', product_category:'豆制品 / 腐竹', goal:'engagement', published_at:'2026-08-02T10:00:00+08:00', source:'demo', metrics:{reads:8900,shares:160,completion_rate:50}, pattern:{hook:'家庭餐桌',structure:'故事 → 产品 → 做法',expression:'叙事偏长，分享动机不足',scope:'腐竹 / 家庭餐桌'} }
  ];

  const DEFAULT_CAMPAIGN = {
    id: 'campaign-summer-tofu-pudding', name: '夏日冰豆腐花种草', productId: 'product-red-bean-tofu-pudding', task: '产品推广',
    brief: '夏季推广豆腐花，突出冰镇食用场景、客家风味和家庭分享，希望内容生活化，不要写成硬广告。',
    audience: '广东地区年轻家庭消费者、上班族', channels: ['xiaohongshu', 'douyin'], goal: 'consideration', status: 'draft',
    outputs: {}, references: null, qa: { checks: [], issues: [] }, updatedAt: null
  };

  let brandMemory = loadJSON(STORAGE.brand, DEFAULT_BRAND_MEMORY);
  let experienceMemory = loadJSON(STORAGE.experience, DEFAULT_EXPERIENCES);
  let performanceData = loadJSON(STORAGE.performance, DEFAULT_PERFORMANCE);
  let campaign = loadJSON(STORAGE.campaign, DEFAULT_CAMPAIGN);
  let versions = loadJSON(STORAGE.versions, {});
  let activeRoute = 'create';
  let activeMemoryTab = 'brand';
  let activePlatform = campaign.channels?.[0] || 'xiaohongshu';
  let selectedWinnerId = null;
  let selectedPerformanceId = null;
  let activeImportTab = 'manual';

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function loadJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value && typeof value === 'object' ? value : clone(fallback);
    } catch (_) { return clone(fallback); }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (_) { toast('本地存储不可用，本次修改仅在当前页面保留'); }
  }
  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  }
  function formatDate(value, withTime = false) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const options = withTime ? { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false } : { month:'2-digit', day:'2-digit' };
    return new Intl.DateTimeFormat('zh-CN', options).format(date);
  }
  function dateTimeLocalValue(date = new Date()) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
  function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  function uid(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }
  function median(values) {
    const sorted = values.filter(Number.isFinite).sort((a,b) => a-b);
    if (!sorted.length) return null;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle-1] + sorted[middle]) / 2;
  }
  function percentile(values, percentileValue) {
    const sorted = values.filter(Number.isFinite).sort((a,b) => a-b);
    if (!sorted.length) return null;
    const index = (sorted.length - 1) * percentileValue;
    const lower = Math.floor(index), upper = Math.ceil(index);
    return lower === upper ? sorted[lower] : sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }

  function migrateLegacyStorage() {
    if (localStorage.getItem(STORAGE.migrated)) return;
    ['ai_mops_kb', 'ai_mops_campaign_draft', 'ai_mops_campaigns', 'ai_mops_last_import'].forEach(key => {
      try { if (localStorage.getItem(key)) localStorage.setItem(`${key}_legacy_backup`, localStorage.getItem(key)); } catch (_) {}
    });
    try { localStorage.setItem(STORAGE.migrated, new Date().toISOString()); } catch (_) {}
  }

  function getProduct(productId = campaign.productId) {
    return brandMemory.products.find(product => product.id === productId) || brandMemory.products[0];
  }
  function persistCampaign() {
    campaign.updatedAt = new Date().toISOString();
    saveJSON(STORAGE.campaign, campaign);
    saveJSON(STORAGE.versions, versions);
  }

  function normalizeLoadedState() {
    if (!brandMemory || typeof brandMemory !== 'object') brandMemory = clone(DEFAULT_BRAND_MEMORY);
    brandMemory = {
      ...clone(DEFAULT_BRAND_MEMORY), ...brandMemory,
      brand:{ ...clone(DEFAULT_BRAND_MEMORY.brand), ...(brandMemory.brand || {}) },
      products:Array.isArray(brandMemory.products) && brandMemory.products.length ? brandMemory.products : clone(DEFAULT_BRAND_MEMORY.products),
      customFacts:Array.isArray(brandMemory.customFacts) ? brandMemory.customFacts : []
    };
    brandMemory.products = brandMemory.products.map((product, index) => ({
      id:product.id || `product-local-${index}`, name:product.name || '未命名产品', category:product.category || '待补充', description:product.description || '待补充',
      sellingPoints:Array.isArray(product.sellingPoints) ? product.sellingPoints : asArray(product.sellingPoints), specification:product.specification || '待补充', serving:product.serving || '待补充',
      scenarios:Array.isArray(product.scenarios) ? product.scenarios : asArray(product.scenarios), usableFacts:Array.isArray(product.usableFacts) ? product.usableFacts : asArray(product.usableFacts),
      forbiddenInference:Array.isArray(product.forbiddenInference) ? product.forbiddenInference : asArray(product.forbiddenInference), source:product.source || '用户数据'
    }));
    if (!Array.isArray(experienceMemory)) experienceMemory = clone(DEFAULT_EXPERIENCES);
    if (!Array.isArray(performanceData)) performanceData = clone(DEFAULT_PERFORMANCE);
    if (!versions || typeof versions !== 'object' || Array.isArray(versions)) versions = {};
    campaign = { ...clone(DEFAULT_CAMPAIGN), ...(campaign && typeof campaign === 'object' ? campaign : {}) };
    campaign.brief = String(campaign.brief || '');
    campaign.audience = String(campaign.audience || '');
    if (!GOALS[campaign.goal]) campaign.goal = DEFAULT_CAMPAIGN.goal;
    if (!brandMemory.products.some(product => product.id === campaign.productId)) campaign.productId = brandMemory.products[0].id;
    if (!campaign.outputs || typeof campaign.outputs !== 'object' || Array.isArray(campaign.outputs)) campaign.outputs = {};
    if (!campaign.qa || !Array.isArray(campaign.qa.checks) || !Array.isArray(campaign.qa.issues)) campaign.qa = { checks:[], issues:[] };
    if (!['draft','final','published'].includes(campaign.status)) campaign.status = 'draft';
    campaign.channels = (Array.isArray(campaign.channels) ? campaign.channels : []).filter(id => CHANNEL_PROFILES[id]);
    if (!campaign.channels.length) campaign.channels = ['xiaohongshu', 'douyin'];
    if (Object.keys(campaign.outputs).length && campaign.channels.some(channel => !campaign.outputs[channel])) {
      campaign.outputs = {}; campaign.references = null; campaign.qa = { checks:[], issues:[] }; campaign.status = 'draft';
    }
    if (!CHANNEL_PROFILES[activePlatform] || !campaign.channels.includes(activePlatform)) activePlatform = campaign.channels[0];
  }

  function init() {
    migrateLegacyStorage(); normalizeLoadedState(); bindEvents(); renderProductOptions(); renderChannelOptions(); hydrateBriefForm(); routeFromHash();
    renderCampaignState(); renderGeneration(); renderMemory(); renderPerformance(); updateMemoryCounts();
  }

  function bindEvents() {
    document.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.route)));
    window.addEventListener('hashchange', routeFromHash);
    document.getElementById('mobileMenuButton').addEventListener('click', toggleMobileMenu);
    document.getElementById('briefForm').addEventListener('submit', handleGenerate);
    document.getElementById('loadDemoButton').addEventListener('click', restoreDemoBrief);
    document.getElementById('briefInput').addEventListener('input', event => { document.getElementById('briefCharCount').textContent = event.target.value.length; saveBriefDraft(); });
    ['productInput','taskInput','goalInput'].forEach(id => document.getElementById(id).addEventListener('change', saveBriefDraft));
    document.getElementById('audienceInput').addEventListener('input', saveBriefDraft);
    document.getElementById('toggleReferencesButton').addEventListener('click', toggleReferences);
    document.getElementById('exportButton').addEventListener('click', exportContent);
    document.getElementById('finalizeButton').addEventListener('click', finalizeCampaign);
    document.getElementById('publishButton').addEventListener('click', openPublishModal);
    document.getElementById('publishForm').addEventListener('submit', confirmPublish);
    document.getElementById('performanceForm').addEventListener('submit', savePerformanceEntry);
    document.getElementById('savePerformanceButton').addEventListener('click', savePerformanceEntry);
    document.getElementById('performanceCsvFile').addEventListener('change', importPerformanceCSV);
    document.querySelectorAll('[data-memory-tab]').forEach(button => button.addEventListener('click', () => { activeMemoryTab = button.dataset.memoryTab; renderMemory(); }));
    document.getElementById('addMaterialButton').addEventListener('click', prepareMaterialModal);
    document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => closeDialog(button.dataset.closeDialog)));
    document.getElementById('learnExperienceButton').addEventListener('click', learnSelectedWinner);
    document.querySelectorAll('[data-import-tab]').forEach(button => button.addEventListener('click', () => switchImportTab(button.dataset.importTab)));
    document.getElementById('materialFile').addEventListener('change', event => { document.getElementById('materialFileName').textContent = event.target.files[0]?.name || '尚未选择文件'; });
    document.getElementById('saveMaterialButton').addEventListener('click', saveMaterial);
    document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close', syncModalBackdrop));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') document.getElementById('sidebar').classList.remove('is-open'); });
  }

  function navigate(route) {
    if (!['create','memory','performance'].includes(route)) route = 'create';
    if (location.hash !== `#${route}`) location.hash = route; else showRoute(route);
  }
  function routeFromHash() { showRoute(location.hash.replace('#','') || 'create'); }
  function showRoute(route) {
    activeRoute = ['create','memory','performance'].includes(route) ? route : 'create';
    document.querySelectorAll('[data-page]').forEach(page => page.classList.toggle('is-active', page.dataset.page === activeRoute));
    document.querySelectorAll('[data-route]').forEach(button => button.classList.toggle('is-active', button.dataset.route === activeRoute));
    document.getElementById('sidebar').classList.remove('is-open');
    document.getElementById('mobileMenuButton').setAttribute('aria-expanded','false');
    if (activeRoute === 'memory') renderMemory();
    if (activeRoute === 'performance') renderPerformance();
    window.scrollTo({ top:0, behavior:'smooth' });
  }
  function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const open = sidebar.classList.toggle('is-open');
    document.getElementById('mobileMenuButton').setAttribute('aria-expanded', String(open));
  }

  function renderProductOptions() {
    document.getElementById('productInput').innerHTML = brandMemory.products.map(product => `<option value="${escapeHTML(product.id)}">${escapeHTML(product.name)}</option>`).join('');
  }
  function renderChannelOptions() {
    document.getElementById('channelOptions').innerHTML = Object.values(CHANNEL_PROFILES).map(profile => `
      <label class="channel-option"><input type="checkbox" value="${profile.id}" ${campaign.channels.includes(profile.id) ? 'checked' : ''}>
      <span class="channel-logo" style="color:${profile.color}">${escapeHTML(profile.shortName.slice(0,1))}</span><span><strong>${escapeHTML(profile.name)}</strong><small>${escapeHTML(profile.role)}</small></span></label>`).join('');
    document.querySelectorAll('#channelOptions input').forEach(input => input.addEventListener('change', saveBriefDraft));
  }
  function hydrateBriefForm() {
    document.getElementById('productInput').value = campaign.productId;
    document.getElementById('taskInput').value = campaign.task;
    document.getElementById('briefInput').value = campaign.brief;
    document.getElementById('audienceInput').value = campaign.audience;
    document.getElementById('goalInput').value = campaign.goal;
    document.getElementById('briefCharCount').textContent = campaign.brief.length;
  }
  function readBriefForm() {
    return {
      productId:document.getElementById('productInput').value,
      task:document.getElementById('taskInput').value,
      brief:document.getElementById('briefInput').value.trim(),
      audience:document.getElementById('audienceInput').value.trim(),
      goal:document.getElementById('goalInput').value,
      channels:[...document.querySelectorAll('#channelOptions input:checked')].map(input => input.value)
    };
  }
  function saveBriefDraft() {
    const draft = readBriefForm();
    const before = JSON.stringify([campaign.productId,campaign.task,campaign.brief,campaign.audience,campaign.goal,campaign.channels]);
    const after = JSON.stringify([draft.productId,draft.task,draft.brief,draft.audience,draft.goal,draft.channels]);
    if (before !== after && Object.keys(campaign.outputs || {}).length) {
      campaign.outputs = {}; campaign.references = null; campaign.qa = { checks:[], issues:[] }; campaign.status = 'draft'; versions = {};
      renderCampaignState(); renderGeneration();
    }
    Object.assign(campaign, draft); persistCampaign(); document.getElementById('briefCharCount').textContent = draft.brief.length;
  }
  function restoreDemoBrief() {
    const preserved = { id:campaign.id, outputs:{}, references:null, qa:{checks:[],issues:[]} };
    campaign = { ...clone(DEFAULT_CAMPAIGN), ...preserved }; activePlatform = campaign.channels[0];
    renderProductOptions(); renderChannelOptions(); hydrateBriefForm(); renderCampaignState(); renderGeneration(); persistCampaign(); toast('已恢复演示简报');
  }

  function handleGenerate(event) {
    event.preventDefault();
    const brief = readBriefForm();
    if (!brief.channels.length) { toast('请至少选择一个目标平台'); return; }
    if (!brief.brief || !brief.audience) { toast('请补充核心简报和目标人群'); return; }
    Object.assign(campaign, brief);
    const product = getProduct(brief.productId);
    const relevantExperiences = retrieveExperiences(brief, product);
    const exploration = Math.random() < EXPLORATION_RATE;
    const usedExperiences = exploration ? [] : relevantExperiences.slice(0, 3);

    campaign.outputs = {};
    campaign.channels.forEach(channel => {
      campaign.outputs[channel] = generateChannelContent(channel, brief, product, usedExperiences, exploration);
      versions[channel] = []; addVersion(channel, exploration ? '智能初稿 · 探索' : '智能初稿');
    });
    campaign.references = { productId:product.id, channels:[...campaign.channels], experienceIds:usedExperiences.map(item => item.id), exploration, generatedAt:new Date().toISOString() };
    campaign.qa = runQualityChecks(campaign.outputs, product); campaign.status = 'draft'; activePlatform = campaign.channels[0]; persistCampaign();
    renderCampaignState(); renderGeneration(); document.getElementById('generationArea').scrollIntoView({ behavior:'smooth', block:'start' });
    if (exploration) toast('内容已生成：本轮为探索模式，不引用历史创作经验');
    else toast(usedExperiences.length ? `内容已生成，并参考 ${usedExperiences.length} 条相关创作经验` : '内容已生成，发布前检查已完成');
  }

  function retrieveExperiences(brief, product) {
    const text = `${product.name} ${product.category} ${brief.brief} ${brief.audience}`.toLowerCase();
    const tokens = [...new Set(text.split(/[\s，。、“”/｜]+/).filter(token => token.length >= 2))];
    return experienceMemory.map(item => {
      let score = 0;
      const platformMatch = Boolean(item.platform && brief.channels.includes(item.platform));
      const categoryMatch = item.product_category === product.category || (product.category !== '待补充' && item.product_category?.includes(product.category.split(' / ')[0]));
      const goalMatch = item.campaign_goal === brief.goal;
      if (platformMatch) score += 8;
      if (item.product_category === product.category) score += 6; else if (categoryMatch) score += 3;
      if (goalMatch) score += 5;
      const haystack = `${item.content_pattern} ${item.insight} ${item.source_campaign}`.toLowerCase();
      const topicMatches = tokens.filter(token => haystack.includes(token)).length; score += topicMatches;
      return { ...item, relevance:score, platformMatch, categoryMatch, goalMatch, topicMatches };
    }).filter(item => item.platformMatch && item.categoryMatch && (item.goalMatch || item.topicMatches > 0)).sort((a,b) => b.relevance - a.relevance || b.lift - a.lift);
  }
  function experienceHint(experiences, channel) { return experiences.find(item => item.platform === channel)?.content_pattern || ''; }

  function buildCampaignContext(brief, product) {
    const briefText = String(brief.brief || '').replace(/\s+/g, ' ').trim();
    const focusClauses = briefText.split(/[，,。；;]/).map(item => item.trim()).filter(item => item && !/^(希望|不要|避免|请勿|不能)/.test(item)).map(item => item.replace(/^围绕/, '').replace(/^突出/, '').replace(/推广/g, '').trim()).filter(Boolean);
    const focus = (focusClauses.slice(0,3).join('、') || `围绕${product.name}展开内容`).slice(0,56);
    const audience = String(brief.audience || brandMemory.brand.audience || '日常消费者').trim();
    const productScenes = (product.scenarios || []).filter(scene => scene && scene !== '待补充');
    const sceneKeywords = ['早餐','下午茶','夏季','消暑','家庭','分享','正餐','烹饪','聚餐','火锅','焖煮'];
    const rankedScenes = productScenes.map(scene => {
      const exactIndex = briefText.indexOf(scene);
      const keywordIndexes = sceneKeywords.filter(keyword => scene.includes(keyword)).map(keyword => briefText.indexOf(keyword)).filter(index => index >= 0);
      return { scene, index:exactIndex >= 0 ? exactIndex : (keywordIndexes.length ? Math.min(...keywordIndexes) : Number.POSITIVE_INFINITY) };
    }).sort((a,b) => a.index - b.index);
    const primaryScene = rankedScenes[0]?.index < Number.POSITIVE_INFINITY ? rankedScenes[0].scene : productScenes[0] || '日常饮食';
    const taskPrefix = brief.task && brief.task !== '产品推广' ? `${brief.task}｜` : '';
    const audienceLabel = audience.split(/[、，,]/)[0].slice(0,12);
    const goal行动引导 = {
      awareness:`如果这个场景也让你觉得熟悉，可以先记住 ${product.name}。`,
      engagement:`你会把 ${product.name} 放进哪个日常场景？欢迎分享自己的安排。`,
      consideration:`如果你也在找${primaryScene}的实用安排，可以先收藏，按需要再回来看看。`,
      traffic:'想继续了解，可以从品牌已公开的产品资料与实际渠道开始。',
      conversion:'如果它正好符合你的日常需要，可以通过实际购买渠道进一步了解。'
    };
    return { focus, audience, audienceLabel, primaryScene, taskPrefix, cta:goal行动引导[brief.goal] || goal行动引导.consideration };
  }

  function buildExperienceCue(hint, product, context) {
    if (!hint) return { lead:'', videoHook:'', videoOpening:'' };
    if (/(地域|地方|客家|家乡)/.test(hint)) return { lead:`先从${context.audienceLabel}熟悉的${context.primaryScene}记忆说起。`, videoHook:`“${context.audienceLabel}熟悉的这一口，放进${context.primaryScene}是什么感觉？”`, videoOpening:`先给出带有地方生活感的${product.name}成品近景` };
    if (/(成品|画面前置|近景|视觉)/.test(hint)) return { lead:`先把 ${product.name} 的成品与真实使用场景放到前面。`, videoHook:`“先看成品：${product.name}放进${context.primaryScene}可以怎么安排？”`, videoOpening:`${product.name}成品特写先于说明出现` };
    if (/(方法|步骤|提醒|问题)/.test(hint)) return { lead:`先回答${context.primaryScene}里一个具体、可执行的问题。`, videoHook:`“${context.primaryScene}怎么做更顺手？先看这一步。”`, videoOpening:'先展示用户最关心的操作结果' };
    return { lead:`先用${context.primaryScene}建立熟悉感，再自然带出 ${product.name}。`, videoHook:`“从${context.primaryScene}开始，看看 ${product.name} 的日常用法。”`, videoOpening:`${context.primaryScene}画面先出现，再带出产品` };
  }

  function generateChannelContent(channel, brief, product, experiences, exploring = false) {
    const profile = CHANNEL_PROFILES[channel];
    if (!profile) throw new Error(`未找到平台配置：${channel}`);
    const productScenes = (product.scenarios || []).filter(item => item && item !== '待补充');
    const scene = productScenes.slice(0,3).join('、') || '日常饮食';
    const context = buildCampaignContext(brief, product);
    const usableFacts = (product.usableFacts || []).filter(item => item && item !== '待补充');
    const sellingPoints = (product.sellingPoints || []).filter(item => item && item !== '待补充');
    const heroFact = usableFacts[0] || (product.category !== '待补充' ? product.category : product.name);
    const secondFact = usableFacts[1] || sellingPoints[0] || '具体食用场景';
    const serving = product.serving && product.serving !== '待补充' ? product.serving : '请按产品实际说明准备';
    const topicCategory = product.category && product.category !== '待补充' ? product.category.split(' / ')[0] : product.name;
    const isRedBeanPudding = product.id === 'product-red-bean-tofu-pudding';
    const hint = experienceHint(experiences, channel);
    const experienceCue = buildExperienceCue(hint, product, context);
    const freshAngle = exploring ? '探索模式：本轮仅使用品牌、产品与平台规则，不引用历史创作经验。' : '';
    const input = { profile, product, productScenes, scene, context, usableFacts, heroFact, secondFact, serving, topicCategory, isRedBeanPudding, hint, experienceCue, freshAngle };
    return (CHANNEL_ADAPTERS[channel] || generateProfileFallback)(input);
  }

  function generateXiaohongshuContent(input) {
    const { product, scene, context, heroFact, secondFact, serving, topicCategory, isRedBeanPudding, hint, experienceCue, freshAngle } = input;
    const primaryScene = context.primaryScene;
    return {
      title:isRedBeanPudding ? `${context.taskPrefix}${context.audience.includes('广东') ? '广东人的夏天' : `${context.audienceLabel}的${primaryScene}`}，冰箱里总想留一碗豆腐花` : `${context.taskPrefix}${product.name}｜${primaryScene}可以这样安排`,
      body:`${experienceCue.lead ? `${experienceCue.lead}\n\n` : ''}这次想和${context.audience}分享的重点是：${context.focus}。\n\n最近在安排${primaryScene}时，又想起了 ${product.name}。${heroFact}和${secondFact}，是产品资料里已经确认、也最值得说清楚的特点。${product.category.includes('豆腐花') ? '🍧' : '🥢'}\n\n我更喜欢把它放进具体的一餐里：${scene}都可以自然出现。${serving}，照着已经确认的方式准备就好。\n\n没有复杂搭配，也不用把它说得多厉害。对我来说，它的价值就是让${primaryScene}多一个简单、好执行的选择，也方便和家人一起分享。\n\n${context.cta}`,
      hashtags:[...new Set([topicCategory, primaryScene, '家庭分享', '日常饮食', isRedBeanPudding ? '客家风味' : product.name])].slice(0,5),
      visualSuggestion:`自然光下的${product.name}成品近景；带出${heroFact}与${primaryScene}环境，保留家庭餐桌局部，避免过度棚拍感。`,
      appliedExperience:hint || null, strategyNote:freshAngle
    };
  }
  function generateDouyinContent(input) {
    const { product, productScenes, context, heroFact, serving, topicCategory, isRedBeanPudding, hint, experienceCue, freshAngle } = input;
    const primaryScene = context.primaryScene;
    return {
      hook:experienceCue.videoHook || (isRedBeanPudding ? `“${context.taskPrefix}给${context.audience}的冰豆腐花场景。”` : `“${context.taskPrefix}${primaryScene}不知道怎么安排？先看 ${product.name} 这个做法。”`),
      script:`0–3s\n${experienceCue.videoOpening || `${product.name}成品近景`}，字幕与口播直接出现开场吸引点。\n\n3–8s\n产品包装或成品入镜，突出“${heroFact}”，不叠加其他卖点。\n\n8–15s\n围绕“${context.focus}”切换${productScenes.slice(0,2).join('和') || primaryScene}场景，用动作展示：${serving}。\n\n15–20s\n产品与成品同框，字幕：“${context.cta}”`,
      caption:`面向${context.audience}，用 ${product.name} 回应“${context.focus}”。重点说清楚${heroFact}和实际准备方式，一条视频只讲一个卖点。`,
      hashtags:[...new Set([topicCategory, primaryScene, '家常美食', '日常饮食'])],
      shootingSuggestion:`竖屏 9:16；前 3 秒直接给${product.name}成品特写；自然光、快切，产品在第 5 秒前出现。`,
      appliedExperience:hint || null, strategyNote:freshAngle
    };
  }
  function generateWechatContent(input) {
    const { product, scene, context, usableFacts, heroFact, serving, hint, experienceCue, freshAngle } = input;
    const primaryScene = context.primaryScene;
    return {
      title:`${context.taskPrefix}${product.name}：让${primaryScene}的分享简单一点`,
      summary:`面向${context.audience}，围绕“${context.focus}”说明 ${product.name} 已确认的产品事实、准备方式，以及它在${scene}中的日常位置。`,
      outline:`一、${primaryScene}里熟悉的一口\n二、${heroFact}与实际准备方式\n三、从一个人的一餐到一家人的分享\n四、把简单风味留在日常`,
      body:`${experienceCue.lead ? `${experienceCue.lead}\n\n` : ''}这次内容的重点，是“${context.focus}”。对${context.audience}来说，${primaryScene}的味觉记忆，往往不是一道复杂的大菜，而是一份容易准备、可以安心说清楚的日常食品。${product.name}可以出现在${scene}，关键不是为它增加夸张意义，而是把真实的使用方式讲明白。\n\n产品资料里最明确的信息，是${usableFacts.join('、') || heroFact}。我们不为它添加资料之外的营养或功效想象，只把注意力放回已经确认的产品特点和真实食用体验。\n\n实际准备时，可以按照“${serving}”来处理。一个人用餐不需要准备太多，和家人分享时也自然。${scene}，都是它可以出现的具体场景。\n\n熟悉的风味进入今天的生活，不一定需要宏大的讲述。有时只是忙完一天以后，坐下来完成一顿简单的饭；或是在周末，把这一份递给身边的人。产品的意义，也正是在这些具体的小场景里被感受到。\n\n关于食品，我们更愿意保持克制：说清楚已经确认的产品事实，也尊重每个人不同的口味偏好。真正值得留下的，不是夸张承诺，而是一次简单、可信、容易复现的分享。`,
      cta:context.cta,
      coverSuggestion:`横版封面：${product.name}成品置于浅色家庭餐桌，呈现${heroFact}，标题留白清楚、色彩克制。`,
      appliedExperience:hint || null, strategyNote:freshAngle
    };
  }
  function generateProfileFallback(input) {
    const { profile, product, context, heroFact, serving, topicCategory, hint, experienceCue, freshAngle } = input;
    const values = {
      title:`${context.taskPrefix}${product.name}｜${context.primaryScene}`, hook:`${context.primaryScene}如何安排？从 ${product.name} 开始。`,
      summary:`面向${context.audience}，围绕“${context.focus}”说明${heroFact}。`, body:`${experienceCue.lead ? `${experienceCue.lead} ` : ''}${context.focus}。${product.name}已经确认的产品信息包括${heroFact}。${serving}。${context.cta}`,
      script:`开场呈现 ${product.name}，围绕${context.primaryScene}说明${heroFact}，结尾使用简洁行动建议。`, outline:'场景 → 产品事实 → 使用方式 → 行动引导',
      caption:`${product.name}与${context.primaryScene}的日常内容。`, cta:context.cta, hashtags:[topicCategory, context.primaryScene, '日常饮食'],
      visualSuggestion:`围绕${product.name}与${context.primaryScene}呈现自然、真实的画面。`, shootingSuggestion:`优先呈现产品、${context.primaryScene}与真实使用动作。`, coverSuggestion:`使用${product.name}成品与${context.primaryScene}作为封面主体。`
    };
    const output = {}; profile.outputFields.forEach(field => { output[field.key] = values[field.key] ?? `${field.label}待补充`; });
    output.appliedExperience = hint || null; output.strategyNote = freshAngle; return output;
  }

  function flattenOutput(output) {
    return Object.entries(output).filter(([key]) => !['appliedExperience','strategyNote'].includes(key)).map(([,value]) => Array.isArray(value) ? value.join(' ') : value).join('\n');
  }

  function buildEvidencePool(product) {
    const values = [
      ...(product.usableFacts || []), ...(product.sellingPoints || []), product.description,
      product.specification && product.specification !== '待补充' ? product.specification : '',
      product.serving && product.serving !== '待补充' ? product.serving : '', ...(product.scenarios || [])
    ];
    return [...new Set(values.map(value => String(value || '').trim()).filter(value => value && value !== '待补充'))];
  }
  function findSupportingEvidence(sentence, evidencePool) {
    const compactSentence = String(sentence).replace(/\s/g,'').toLowerCase();
    return evidencePool.find(fact => {
      const compactFact = fact.replace(/\s/g,'').toLowerCase();
      return compactFact.length >= 2 && compactSentence.includes(compactFact);
    }) || null;
  }

  function classifyClaims(content, product) {
    const riskyPattern = /(最有效|第一品牌|绝对|百分之百|100%|治疗|治愈|降血糖|减肥|增强免疫|改善疾病)/;
    const unsupportedPattern = /(高营养|高蛋白|低糖|零添加|无防腐剂|有机认证|富含[^，。；\n]{0,10}|有助于[^，。；\n]{0,12}|能够改善[^，。；\n]{0,12})/;
    const concreteAssertionPattern = /(\d+(?:\.\d+)?\s*(?:克|千克|公斤|毫升|升|g|kg|ml|元|%|天|个月)|净含量|保质期|进口|原产|产地|配料|原料|认证|获奖|专利|销量|领先|行业首|全省|全国)/i;
    const objectiveProductClaimPattern = /(?:产品|本品|豆腐花|豆腐|腐竹|红豆|冰糖|它|其).{0,20}(?:采用|选用|使用|含有|含|添加|不含|来自|源自|产自|制成|制作|经过|属于|是|为|支持|适合|可以|可|需要|无需|建议|提供|具备|冷藏|即食|加热|泡发)/;
    const subjectivePattern = /(喜欢|口感|风味|感觉|仪式感|清凉|轻松|简单|熟悉|想起|更愿意|对我来说|我更喜欢|自然|日常|分享)/;
    const evidencePool = buildEvidencePool(product);
    return content.split(/[。！？!？\n，,；;]+/).map(sentence => sentence.trim()).filter(sentence => sentence.length > 3).map(sentence => {
      const risky = sentence.match(riskyPattern);
      if (risky) return { text:sentence, term:risky[0], classification:'Risky', evidence:null };
      const forbiddenTerm = (product.forbiddenInference || []).find(term => term && sentence.includes(term));
      if (forbiddenTerm) return { text:sentence, term:forbiddenTerm, classification:'Risky', evidence:null };
      const unsupported = sentence.match(unsupportedPattern);
      if (unsupported) return { text:sentence, term:unsupported[0], classification:'Unsupported', evidence:null };
      const evidence = findSupportingEvidence(sentence, evidencePool);
      const concreteAssertion = sentence.match(concreteAssertionPattern);
      if (concreteAssertion) return evidence ? { text:sentence, term:sentence, classification:'Supported', evidence } : { text:sentence, term:concreteAssertion[0], classification:'Unsupported', evidence:null };
      if (objectiveProductClaimPattern.test(sentence)) return evidence ? { text:sentence, term:sentence, classification:'Supported', evidence } : { text:sentence, term:sentence, classification:'Unsupported', evidence:null };
      if (evidence) return { text:sentence, term:sentence, classification:'Supported', evidence };
      if (subjectivePattern.test(sentence)) return { text:sentence, term:sentence, classification:'Subjective', evidence:null };
      return { text:sentence, term:sentence, classification:'Subjective', evidence:null };
    });
  }

  function runQualityChecks(outputs, product) {
    const content = Object.values(outputs).map(flattenOutput).join('\n');
    const issues = [];
    const claimResults = classifyClaims(content, product);
    claimResults.filter(claim => ['Unsupported','Risky'].includes(claim.classification)).forEach(claim => {
      if (issues.some(issue => issue.term === claim.term && issue.type === claim.classification.toLowerCase())) return;
      issues.push({ id:uid('qa'), type:claim.classification.toLowerCase(), term:claim.term, claimText:claim.text, label:claim.classification === 'Risky' ? '绝对化或食品功效表达' : '产品资料未支持的具体宣称', status:'open', message:`“${claim.term}”在当前品牌或产品资料中没有可核验依据。`, suggestion:'使用具体产品事实替代，或补充相应产品资料。' });
    });
    Object.entries(outputs).forEach(([channel, output]) => { const issue = getProfileFormatIssue(channel, output); if (issue) issues.push(issue); });
    const hardSellPattern = /(立即下单|赶紧买|错过不再|最后机会|闭眼入|冲就完了|必须买|全网最低|买它|抢购|不要犹豫|不买后悔|限时秒杀)/;
    const hardSell = content.match(hardSellPattern);
    if (hardSell) issues.push({ id:uid('qa'), type:'brand', term:hardSell[0], label:'品牌表达偏差', status:'open', message:`“${hardSell[0]}”偏离自然、亲切、克制的品牌表达。`, suggestion:'改为基于具体场景的中性行动建议。' });
    return {
      checks:[
        {id:'facts',label:'产品事实',pass:!issues.some(item => item.type === 'unsupported')},
        {id:'brand',label:'品牌表达',pass:!issues.some(item => item.type === 'brand')},
        {id:'compliance',label:'食品宣传合规',pass:!issues.some(item => item.type === 'risky')},
        {id:'format',label:'平台格式',pass:!issues.some(item => item.type === 'format')}
      ],
      issues, claimSummary:claimResults.reduce((summary, claim) => { summary[claim.classification] = (summary[claim.classification] || 0) + 1; return summary; }, {}), productId:product.id, checkedAt:new Date().toISOString()
    };
  }
  function getProfileFormatIssue(channel, output) {
    const rule = CHANNEL_PROFILES[channel]?.formatRule; if (!rule) return null;
    let failed = false;
    if (rule.type === 'arrayLength') { const value = output[rule.field]; failed = !Array.isArray(value) || value.length < rule.min || value.length > rule.max; }
    else if (rule.type === 'requiredText') failed = (rule.requiredFields || []).some(field => !String(output[field] || '').trim()) || !String(output[rule.field] || '').includes(rule.includes);
    else if (rule.type === 'minLength') failed = String(output[rule.field] || '').length < rule.min;
    return failed ? { id:uid('qa'), type:'format', channel, term:rule.term, label:rule.label, status:'open', message:rule.message, suggestion:rule.suggestion } : null;
  }

  function addVersion(channel, label) {
    if (!campaign.outputs[channel]) return;
    versions[channel] = versions[channel] || [];
    versions[channel].push({ id:uid('version'), number:versions[channel].length + 1, label, savedAt:new Date().toISOString(), content:clone(campaign.outputs[channel]) });
    saveJSON(STORAGE.versions, versions);
  }
  function renderCampaignState() {
    const labels = { draft:'草稿', final:'已定稿', published:'已发布' };
    const badge = document.getElementById('campaignStateBadge'); badge.dataset.state = campaign.status; badge.innerHTML = `<span></span>${labels[campaign.status] || '草稿'}`;
    const current = campaign.status === 'published' ? 3 : campaign.status === 'final' ? 2 : Object.keys(campaign.outputs || {}).length ? 1 : 0;
    document.querySelectorAll('[data-workflow]').forEach((step,index) => { step.classList.toggle('is-current', index === current); step.classList.toggle('is-done', index < current); });
  }
  function renderGeneration() {
    const area = document.getElementById('generationArea');
    if (!campaign.outputs || !Object.keys(campaign.outputs).length) { area.hidden = true; return; }
    area.hidden = false; renderReferences(); renderPlatformOutputs(); renderQA(); renderFinalActions();
  }
  function renderReferences() {
    const product = getProduct(campaign.references?.productId);
    const experienceItems = (campaign.references?.experienceIds || []).map(id => experienceMemory.find(item => item.id === id)).filter(Boolean);
    const exploring = Boolean(campaign.references?.exploration);
    document.getElementById('referenceSummary').textContent = exploring
      ? `品牌资料 · ${product.name}产品资料 · ${campaign.channels.length} 个平台规则 · 探索模式（本轮不引用历史经验）`
      : `品牌资料 · ${product.name}产品资料 · ${campaign.channels.length} 个平台规则${experienceItems.length ? ` · ${experienceItems.length} 条历史经验` : ''}`;
    document.getElementById('referenceDetails').innerHTML = `<div class="reference-grid">
      <div class="reference-item"><strong>品牌资料</strong><p>${escapeHTML(brandMemory.brand.voice)}</p></div>
      <div class="reference-item"><strong>${escapeHTML(product.name)}产品资料</strong><p>${escapeHTML(product.usableFacts.join('；'))}</p></div>
      ${campaign.channels.map(channel => `<div class="reference-item"><strong>${escapeHTML(CHANNEL_PROFILES[channel].name)}内容规则</strong><p>${escapeHTML(CHANNEL_PROFILES[channel].rules.join('；'))}</p></div>`).join('')}
      <div class="reference-item"><strong>${exploring ? '探索策略' : `历史经验 ${experienceItems.length} 条`}</strong>${exploring ? '<p>本轮主动不读取历史创作经验，只使用品牌事实、产品事实与平台规则，用于保留新表达空间。</p>' : experienceItems.length ? experienceItems.map(item => `<div class="experience-reference"><b>${escapeHTML(item.content_pattern)}</b><span>${escapeHTML(item.insight)}</span></div>`).join('') : '<p>尚未找到与当前产品、平台和内容目标同时匹配的经验。</p>'}</div>
    </div>`;
  }
  function getOutputFields(channel, output) {
    return (CHANNEL_PROFILES[channel]?.outputFields || []).map(field => { const raw = output[field.key]; const value = field.format === 'hashtags' ? (raw || []).map(tag => `#${tag}`).join(' ') : raw; return [field.key,field.label,value,Boolean(field.title)]; });
  }
  function renderPlatformOutputs() {
    if (!campaign.channels.includes(activePlatform)) activePlatform = campaign.channels[0];
    document.getElementById('platformTabs').innerHTML = campaign.channels.map(channel => `<button class="platform-tab ${channel === activePlatform ? 'is-active' : ''}" type="button" role="tab" data-platform-tab="${channel}">${escapeHTML(CHANNEL_PROFILES[channel].name)} <span>· ${escapeHTML(CHANNEL_PROFILES[channel].contentType)}</span></button>`).join('');
    document.getElementById('platformPanels').innerHTML = campaign.channels.map(channel => renderPlatformCard(channel)).join('');
    document.querySelectorAll('[data-platform-tab]').forEach(button => button.addEventListener('click', () => { activePlatform = button.dataset.platformTab; renderPlatformOutputs(); }));
    document.querySelectorAll('[data-content-action]').forEach(button => button.addEventListener('click', () => handleContentAction(button.dataset.contentAction, button.dataset.channel)));
  }
  function renderPlatformCard(channel) {
    const profile = CHANNEL_PROFILES[channel], output = campaign.outputs[channel], fields = getOutputFields(channel, output), history = versions[channel] || [];
    return `<article class="platform-panel ${channel === activePlatform ? 'is-active' : ''}" data-platform-panel="${channel}"><div class="platform-card">
      <header class="platform-card-head"><div class="platform-identity"><span class="platform-dot" style="background:${profile.color}"></span><strong>${escapeHTML(profile.name)}</strong><small>${escapeHTML(profile.contentType)}</small></div><div class="platform-actions">
      <button class="button button-ghost" type="button" data-content-action="edit" data-channel="${channel}">编辑</button><button class="button button-ghost" type="button" data-content-action="regenerate" data-channel="${channel}">重新生成</button><button class="button button-ghost" type="button" data-content-action="copy" data-channel="${channel}">复制</button><button class="button button-ghost" type="button" data-content-action="save-version" data-channel="${channel}">保存当前版本</button></div></header>
      <div class="content-layout"><div class="content-fields">${fields.map(([key,label,value,isTitle]) => `<div class="content-field"><span class="content-label">${escapeHTML(label)}</span><p class="content-value ${isTitle ? 'title-value' : ''}" data-output-field="${key}">${escapeHTML(value)}</p></div>`).join('')}</div>
      <aside class="content-side"><div class="content-side-block"><h3>平台表达重点</h3><p>${escapeHTML(profile.tone.join(' · '))}</p></div><div class="content-side-block"><h3>历史版本</h3><div class="version-list">${history.slice().reverse().map(version => `<div class="version-row"><b>v${version.number}</b><span>${escapeHTML(version.label)}</span><span>${formatDate(version.savedAt,true)}</span></div>`).join('') || '<p>尚无历史版本</p>'}</div></div>${output.appliedExperience ? `<div class="content-side-block"><h3>已使用创作经验</h3><p>${escapeHTML(output.appliedExperience)}</p></div>` : output.strategyNote ? `<div class="content-side-block"><h3>生成策略</h3><p>${escapeHTML(output.strategyNote)}</p></div>` : ''}</aside></div>
      <div class="editing-actions" data-editing-actions="${channel}" hidden><button class="button button-primary" type="button" data-content-action="save-edit" data-channel="${channel}">保存修改并检查</button></div>
    </div></article>`;
  }
  function handleContentAction(action, channel) {
    if (action === 'copy') return copyChannel(channel);
    if (action === 'regenerate') return regenerateChannel(channel);
    if (action === 'save-version') { addVersion(channel,'手动保存'); persistCampaign(); renderPlatformOutputs(); toast(`${CHANNEL_PROFILES[channel].name}当前版本已保存`); return; }
    if (action === 'edit') return startEditing(channel);
    if (action === 'save-edit') return saveEdits(channel);
  }
  function startEditing(channel) {
    const panel = document.querySelector(`[data-platform-panel="${channel}"]`); panel.querySelectorAll('[data-output-field]').forEach(field => field.setAttribute('contenteditable','true')); panel.querySelector(`[data-editing-actions="${channel}"]`).hidden = false; panel.querySelector('[data-output-field]')?.focus(); toast('已进入编辑模式');
  }
  function saveEdits(channel) {
    const panel = document.querySelector(`[data-platform-panel="${channel}"]`);
    panel.querySelectorAll('[data-output-field]').forEach(field => { const key = field.dataset.outputField, value = field.textContent.trim(); campaign.outputs[channel][key] = key === 'hashtags' ? value.split(/\s+/).map(tag => tag.replace(/^#/,'')).filter(Boolean).slice(0,8) : value; field.removeAttribute('contenteditable'); });
    addVersion(channel,'用户修改'); campaign.qa = runQualityChecks(campaign.outputs,getProduct()); campaign.status = 'draft'; persistCampaign(); renderCampaignState(); renderGeneration(); toast('修改已保存，并重新完成发布前检查');
  }
  function regenerateChannel(channel) {
    const product = getProduct();
    const relevant = retrieveExperiences(campaign, product).filter(item => item.platform === channel).slice(0,3);
    campaign.outputs[channel] = generateChannelContent(channel, campaign, product, relevant, false);
    addVersion(channel,'智能重新生成'); campaign.qa = runQualityChecks(campaign.outputs,product); campaign.status = 'draft'; persistCampaign(); renderCampaignState(); renderGeneration(); toast(`${CHANNEL_PROFILES[channel].name}已重新生成`);
  }
  async function copyChannel(channel) {
    const profile = CHANNEL_PROFILES[channel], output = campaign.outputs[channel];
    const text = `${profile.name}\n\n${getOutputFields(channel,output).map(([,label,value]) => `${label}\n${value}`).join('\n\n')}`;
    try { await navigator.clipboard.writeText(text); toast(`${profile.name}内容已复制`); }
    catch (_) { const area = document.createElement('textarea'); area.value = text; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove(); toast(`${profile.name}内容已复制`); }
  }

  function renderQA() {
    const qa = campaign.qa || {checks:[],issues:[]}, openIssues = qa.issues.filter(issue => issue.status === 'open'), card = document.getElementById('qaCard');
    card.classList.toggle('has-issues', openIssues.length > 0); document.getElementById('qaIcon').textContent = openIssues.length ? '!' : '✓';
    document.getElementById('qaSummary').textContent = openIssues.length ? `发现 ${openIssues.length} 个需要确认的问题` : '产品事实、品牌表达、食品宣传合规和平台格式均已检查，可以进入定稿。';
    document.getElementById('qaChecks').innerHTML = qa.checks.map(check => `<span class="qa-check ${check.pass ? '' : 'is-warning'}">${escapeHTML(check.label)}</span>`).join('');
    document.getElementById('qaIssues').innerHTML = openIssues.map(issue => `<div class="qa-issue"><div><strong>${escapeHTML(issue.label)} · ${escapeHTML(issue.term)}</strong><p>${escapeHTML(issue.message)}<br>建议：${escapeHTML(issue.suggestion)}</p></div><div class="qa-issue-actions"><button class="button button-secondary" type="button" data-qa-action="adopt" data-issue="${issue.id}">采纳修改</button><button class="button button-ghost" type="button" data-qa-action="ignore" data-issue="${issue.id}">忽略并继续</button></div></div>`).join('');
    document.querySelectorAll('[data-qa-action]').forEach(button => button.addEventListener('click', () => resolveQAIssue(button.dataset.issue,button.dataset.qaAction)));
  }
  function resolveQAIssue(issueId, action) {
    const issue = campaign.qa.issues.find(item => item.id === issueId); if (!issue) return;
    if (action === 'adopt') {
      if (issue.type === 'format') applyFormatFix(issue);
      else {
        const replacement = issue.type === 'brand' ? '可以按自己的日常需要进一步了解' : (getProduct().usableFacts[0] || '已确认的产品特点');
        const target = issue.claimText || issue.term;
        Object.keys(campaign.outputs).forEach(channel => Object.keys(campaign.outputs[channel]).forEach(key => { const value = campaign.outputs[channel][key]; if (typeof value === 'string') campaign.outputs[channel][key] = value.split(target).join(replacement); if (Array.isArray(value)) campaign.outputs[channel][key] = value.map(item => String(item).split(target).join(replacement)); }));
      }
      issue.status = 'adopted'; issue.resolvedAt = new Date().toISOString(); campaign.qa = runQualityChecks(campaign.outputs,getProduct()); Object.keys(campaign.outputs).forEach(channel => addVersion(channel,'采纳检查建议')); toast('已采纳修改并重新检查');
    } else {
      issue.status = 'ignored'; issue.resolvedAt = new Date().toISOString();
      campaign.qa.checks = campaign.qa.checks.map(check => ({...check,pass:!campaign.qa.issues.some(item => item.status === 'open' && (item.type === check.id || (check.id === 'facts' && item.type === 'unsupported') || (check.id === 'compliance' && item.type === 'risky')))})); toast('已记录忽略状态，可继续定稿');
    }
    persistCampaign(); renderGeneration();
  }
  function applyFormatFix(issue) {
    const product = getProduct(), output = campaign.outputs[issue.channel], profile = CHANNEL_PROFILES[issue.channel], rule = profile?.formatRule; if (!output || !rule) return;
    if (rule.type === 'arrayLength') {
      const fallbacks = [product.category.split(' / ')[0],product.scenarios[0],'家庭分享','日常饮食']; output[rule.field] = [...new Set([...(Array.isArray(output[rule.field]) ? output[rule.field] : []),...fallbacks])].filter(Boolean).slice(0,rule.max); while (output[rule.field].length < rule.min) output[rule.field].push(`内容灵感${output[rule.field].length+1}`);
    } else {
      const safe = generateChannelContent(issue.channel,campaign,product,retrieveExperiences(campaign,product).filter(item => item.platform === issue.channel).slice(0,3),false);
      if (rule.type === 'requiredText') { (rule.requiredFields || []).forEach(field => { if (!String(output[field] || '').trim()) output[field] = safe[field]; }); if (!String(output[rule.field] || '').includes(rule.includes)) output[rule.field] = safe[rule.field]; }
      else if (rule.type === 'minLength' && String(output[rule.field] || '').length < rule.min) output[rule.field] = safe[rule.field];
    }
  }

  function renderFinalActions() {
    const openIssues = campaign.qa?.issues?.filter(issue => issue.status === 'open') || [], finalize = document.getElementById('finalizeButton'), publish = document.getElementById('publishButton');
    finalize.hidden = ['final','published'].includes(campaign.status); publish.hidden = campaign.status !== 'final'; finalize.disabled = openIssues.length > 0;
    if (campaign.status === 'published') { document.getElementById('nextActionTitle').textContent = '内容已标记发布'; document.getElementById('nextActionCopy').textContent = '前往效果复盘查看状态；暂无数据时不会自动补充指标。'; }
    else if (campaign.status === 'final') { document.getElementById('nextActionTitle').textContent = '内容已定稿'; document.getElementById('nextActionCopy').textContent = '确认实际发布信息后，标记为已发布。'; }
    else if (openIssues.length) { document.getElementById('nextActionTitle').textContent = '请先处理发布前检查问题'; document.getElementById('nextActionCopy').textContent = '采纳修改或记录忽略状态后，才能确认定稿。'; }
    else { document.getElementById('nextActionTitle').textContent = '内容已准备好进入定稿'; document.getElementById('nextActionCopy').textContent = '确认后仍可查看历史版本。'; }
  }
  function finalizeCampaign() {
    if (campaign.qa.issues.some(issue => issue.status === 'open')) { toast('请先处理发布前检查中的问题'); return; }
    campaign.status = 'final'; Object.keys(campaign.outputs).forEach(channel => addVersion(channel,'最终定稿')); persistCampaign(); renderCampaignState(); renderGeneration(); toast('内容已确认定稿');
  }
  function toggleReferences() {
    const details = document.getElementById('referenceDetails'), button = document.getElementById('toggleReferencesButton'); details.hidden = !details.hidden; button.setAttribute('aria-expanded',String(!details.hidden)); button.textContent = details.hidden ? '查看依据' : '收起依据';
  }
  function exportContent() {
    if (!campaign.outputs || !Object.keys(campaign.outputs).length) return;
    const product = getProduct(), text = [`# ${campaign.name || '内容创作'}\n`,`推广产品：${product.name}`,`内容目标：${GOALS[campaign.goal]}`,`目标人群：${campaign.audience}\n`];
    campaign.channels.forEach(channel => { const profile = CHANNEL_PROFILES[channel]; text.push(`## ${profile.name}\n`); getOutputFields(channel,campaign.outputs[channel]).forEach(([,label,value]) => text.push(`### ${label}\n${value}\n`)); });
    const blob = new Blob([text.join('\n')],{type:'text/markdown;charset=utf-8'}), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `${product.name}-平台内容.md`; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000); toast('内容已导出');
  }

  function openPublishModal() {
    document.getElementById('publishChannelList').innerHTML = campaign.channels.map(channel => `<label><input type="checkbox" name="publishChannel" value="${channel}" checked>${escapeHTML(CHANNEL_PROFILES[channel].name)}</label>`).join('');
    document.getElementById('publishTimeInput').value = dateTimeLocalValue(); document.getElementById('publishUrlInput').value = ''; openDialog('publishModal');
  }
  function confirmPublish(event) {
    event.preventDefault(); if (event.submitter && event.submitter.id !== 'confirmPublishButton') return;
    const channels = [...document.querySelectorAll('input[name="publishChannel"]:checked')].map(input => input.value); if (!channels.length) { toast('请至少选择一个已发布平台'); return; }
    const publishedAt = document.getElementById('publishTimeInput').value, url = document.getElementById('publishUrlInput').value.trim(), source = document.querySelector('input[name="dataSource"]:checked')?.value || 'manual', product = getProduct();
    channels.forEach(channel => { const output = campaign.outputs[channel]; performanceData.unshift({ id:uid('published'), title:output.title || output.hook || campaign.name, platform:channel, product:product.name, product_category:product.category, goal:campaign.goal, published_at:new Date(publishedAt).toISOString(), source, url, metrics:null, status:'waiting', campaign_id:campaign.id, pattern:derivePublishedPattern(channel,output,product) }); });
    campaign.status = 'published'; saveJSON(STORAGE.performance,performanceData); persistCampaign(); closeDialog('publishModal'); renderCampaignState(); renderGeneration(); renderPerformance(); toast(`已记录 ${channels.length} 个平台的发布内容，当前等待表现数据`);
  }
  function derivePublishedPattern(channel, output, product) {
    const profile = CHANNEL_PROFILES[channel]; return { hook:output.title || output.hook || campaign.name || product.name, structure:(profile?.structure || []).join(' → ') || '按平台内容结构展开', expression:(profile?.tone || []).join('、') || brandMemory.brand.voice, scope:`${product.category} / ${buildCampaignContext(campaign,product).primaryScene} / ${campaign.goal}` };
  }
  function ensureRecordPattern(record) {
    const placeholder = !record.pattern || Object.values(record.pattern).some(value => String(value).includes('等待表现数据后分析')); if (!placeholder) return;
    const product = brandMemory.products.find(item => item.name === record.product) || {name:record.product,category:record.product_category,scenarios:['日常饮食']};
    const output = record.campaign_id === campaign.id ? campaign.outputs?.[record.platform] : null; record.pattern = derivePublishedPattern(record.platform,output || {title:record.title},product);
  }

  function openDialog(id) { const dialog = document.getElementById(id); document.getElementById('modalBackdrop').hidden = false; if (!dialog.open && typeof dialog.showModal === 'function') dialog.showModal(); else if (!dialog.open) dialog.setAttribute('open',''); }
  function closeDialog(id) { const dialog = document.getElementById(id); if (dialog.open && typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open'); if (![...document.querySelectorAll('dialog')].some(item => item.open)) document.getElementById('modalBackdrop').hidden = true; }
  function syncModalBackdrop() { if (![...document.querySelectorAll('dialog')].some(item => item.open)) document.getElementById('modalBackdrop').hidden = true; }

  function updateMemoryCounts() { document.getElementById('memoryCount').textContent = `${experienceMemory.length} 条创作经验`; document.getElementById('experienceTabCount').textContent = experienceMemory.length; }
  function renderMemory() {
    document.querySelectorAll('[data-memory-tab]').forEach(button => button.classList.toggle('is-active',button.dataset.memoryTab === activeMemoryTab));
    const content = document.getElementById('memoryContent');
    if (activeMemoryTab === 'brand') {
      const brand = brandMemory.brand, entries = [['品牌介绍',brand.intro,brand.source],['品牌定位',brand.positioning,brand.source],['品牌表达风格',brand.voice,brand.source],['目标消费者',brand.audience,brand.source],['核心价值',brand.values,brand.source],['禁止表达',brand.forbidden,brand.source],...(brandMemory.customFacts || []).map(item => [item.title,item.content,item.source || '用户导入'])];
      content.innerHTML = `<div class="memory-panel"><div class="memory-note">ℹ 这里保存稳定的品牌事实。历史内容表现不会写入品牌资料，而是进入“创作经验”。</div><div class="brand-grid">${entries.map(([title,value,source]) => `<article class="memory-card"><h3>${escapeHTML(title)}</h3><p>${escapeHTML(value)}</p><small>${escapeHTML(source || '演示资料')}</small></article>`).join('')}</div></div>`; return;
    }
    if (activeMemoryTab === 'products') {
      content.innerHTML = `<div class="memory-panel product-grid">${brandMemory.products.map(product => `<article class="product-card"><header class="product-card-head"><h3>${escapeHTML(product.name)}</h3><span>${escapeHTML(product.source)}</span></header><div class="product-card-body"><dl class="fact-list"><dt>产品类别</dt><dd>${escapeHTML(product.category)}</dd><dt>产品介绍</dt><dd>${escapeHTML(product.description)}</dd><dt>主要卖点</dt><dd>${escapeHTML(product.sellingPoints.join('；'))}</dd><dt>规格</dt><dd>${escapeHTML(product.specification)}</dd><dt>食用方式</dt><dd>${escapeHTML(product.serving)}</dd><dt>适用场景</dt><dd>${escapeHTML(product.scenarios.join('；'))}</dd><dt>可使用事实</dt><dd>${escapeHTML(product.usableFacts.join('；'))}</dd><dt>禁止推断</dt><dd>${escapeHTML(product.forbiddenInference.join('；'))}</dd></dl></div></article>`).join('')}</div>`; return;
    }
    content.innerHTML = `<div class="memory-panel"><div class="memory-note">✦ 创作经验回答“过去什么创作方式表现较好”，生成时会按平台、产品类别、内容目标和主题相关性匹配。</div>${experienceMemory.length ? `<div class="experience-list">${experienceMemory.slice().sort((a,b) => new Date(b.learned_at)-new Date(a.learned_at)).map(item => `<article class="experience-card"><div><div class="experience-platform">${escapeHTML(CHANNEL_PROFILES[item.platform]?.name || item.platform)} · 高表现经验</div><h3>${escapeHTML(item.content_pattern)}</h3><p>${escapeHTML(item.insight)}</p><small>来源：${escapeHTML(item.source_campaign)} · 学习于 ${formatDate(item.learned_at)}</small></div><div class="experience-evidence"><strong>+${Math.round(item.lift)}%</strong><small>${escapeHTML(metricLabel(item.metric_name))} 相比历史基线</small><small>${formatMetricValue(item.metric_name,item.metric_value)} / 历史基线 ${formatMetricValue(item.metric_name,item.baseline_value)}</small></div></article>`).join('')}</div>` : '<div class="empty-state"><strong>还没有创作经验</strong>前往效果复盘，从高表现内容中加入第一条经验。</div>'}</div>`;
  }

  function deriveMetric(record, metric) {
    if (!record.metrics) return null; const m = record.metrics; if (Number.isFinite(m[metric])) return m[metric];
    const base = record.platform === 'xiaohongshu' ? m.impressions : record.platform === 'douyin' ? m.plays : m.reads; if (!base) return null;
    if (metric === 'collect_rate') return (m.collects || 0) / base * 100;
    if (metric === 'share_rate') return (m.shares || 0) / base * 100;
    if (metric === 'engagement_rate') return ((m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.collects || 0)) / base * 100;
    return null;
  }
  function analyzePerformance(record) {
    const profile = CHANNEL_PROFILES[record.platform], metric = profile?.goalMetrics?.[record.goal], value = metric ? deriveMetric(record,metric) : null;
    if (!Number.isFinite(value)) return { metric, value:null, baseline:null, top20:null, lift:null, baselineCount:0, status:'waiting' };
    const peerValues = performanceData
      .filter(item => item.id !== record.id && item.platform === record.platform && item.goal === record.goal)
      .map(item => deriveMetric(item,metric)).filter(Number.isFinite);
    const baselineCount = peerValues.length;
    const baseline = median(peerValues), top20 = percentile(peerValues,.8);
    if (baselineCount < MIN_BASELINE_PEERS || !Number.isFinite(baseline)) return { metric, value, baseline, top20, lift:null, baselineCount, status:'insufficient' };
    const lift = baseline > 0 ? (value - baseline) / baseline * 100 : 0;
    const status = (lift >= 20 || (top20 !== null && value >= top20 && lift > 0)) ? 'winner' : lift < -10 ? 'review' : 'normal';
    return { metric, value, baseline, top20, lift, baselineCount, status };
  }
  function metricLabel(metric) { return ({impressions:'曝光量',plays:'播放量',reads:'阅读量',likes:'点赞',collects:'收藏',comments:'评论',shares:'分享',collect_rate:'收藏率',share_rate:'分享率',engagement_rate:'互动率',completion_rate:'完播率',ctr:'点击率',conversion_rate:'转化率'})[metric] || metric || '核心指标'; }
  function formatMetricValue(metric, value) { if (!Number.isFinite(value)) return '—'; if (['impressions','plays','reads'].includes(metric)) return new Intl.NumberFormat('zh-CN').format(Math.round(value)); return `${value.toFixed(1)}%`; }
  function formatLift(analysis) { return Number.isFinite(analysis.lift) ? `${analysis.lift >= 0 ? '+' : ''}${Math.round(analysis.lift)}%` : '—'; }

  function renderPerformance() {
    const analyzed = performanceData.map(record => ({record,analysis:analyzePerformance(record)}));
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate()-30);
    const recent = analyzed.filter(item => new Date(item.record.published_at) >= thirtyDaysAgo).length, winners = analyzed.filter(item => item.analysis.status === 'winner').length, platformWinnerCounts = {};
    analyzed.filter(item => item.analysis.status === 'winner').forEach(item => { platformWinnerCounts[item.record.platform] = (platformWinnerCounts[item.record.platform] || 0) + 1; });
    const bestPlatform = Object.entries(platformWinnerCounts).sort((a,b) => b[1]-a[1])[0]?.[0], currentMonthKey = localDateKey().slice(0,7), learnedThisMonth = experienceMemory.filter(item => String(item.learned_at).startsWith(currentMonthKey)).length;
    const dataNote = performanceData.some(item => item.source !== 'demo') ? '演示数据 / 用户数据' : '演示数据'; document.getElementById('performanceSourceBadge').textContent = dataNote;
    const kpis = [['近30天发布',recent,dataNote],['高表现内容',winners,dataNote],['高表现内容最多平台',CHANNEL_PROFILES[bestPlatform]?.shortName || '—',dataNote],['本月新学经验',learnedThisMonth,dataNote]];
    document.getElementById('kpiGrid').innerHTML = kpis.map(([label,value,note]) => `<article class="kpi-card"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong><small>${escapeHTML(note)}</small></article>`).join('');
    document.getElementById('performanceTableBody').innerHTML = analyzed.map(({record,analysis}) => performanceRow(record,analysis)).join('');
    document.getElementById('mobilePerformanceList').innerHTML = analyzed.map(({record,analysis}) => mobilePerformanceCard(record,analysis)).join('');
    document.querySelectorAll('[data-view-winner]').forEach(button => button.addEventListener('click', () => openWinnerDetail(button.dataset.viewWinner)));
    document.querySelectorAll('[data-enter-performance]').forEach(button => button.addEventListener('click', () => openPerformanceEntry(button.dataset.enterPerformance)));
  }
  function performanceRow(record, analysis) {
    const labels = {winner:'高表现',normal:'正常',review:'待复盘',waiting:'等待数据',insufficient:'样本不足'}, statusClass = analysis.status;
    const compareText = analysis.status === 'insufficient' ? `仅 ${analysis.baselineCount} 条可比历史` : formatLift(analysis);
    return `<tr><td class="content-title-cell"><strong>${escapeHTML(record.title)}</strong><small>${escapeHTML(record.product)} · ${record.source === 'demo' ? '演示数据' : '用户数据'}</small></td><td><span class="platform-pill">${escapeHTML(CHANNEL_PROFILES[record.platform]?.shortName || record.platform)}</span></td><td>${formatDate(record.published_at)}</td><td>${analysis.value === null ? '—' : `${metricLabel(analysis.metric)} ${formatMetricValue(analysis.metric,analysis.value)}`}</td><td class="${Number.isFinite(analysis.lift) && analysis.lift > 0 ? 'lift-up' : Number.isFinite(analysis.lift) && analysis.lift < 0 ? 'lift-down' : ''}">${compareText}</td><td><span class="status-pill ${statusClass}">${labels[analysis.status]}</span></td><td>${analysis.status === 'waiting' ? `<button class="button button-ghost" type="button" data-enter-performance="${record.id}">录入表现</button>` : `<button class="button button-ghost" type="button" data-view-winner="${record.id}">${analysis.status === 'winner' ? '查看复盘' : '查看详情'}</button>`}</td></tr>`;
  }
  function mobilePerformanceCard(record, analysis) {
    const labels = {winner:'高表现',normal:'正常',review:'待复盘',waiting:'等待数据',insufficient:'样本不足'};
    const compareText = analysis.status === 'insufficient' ? `仅 ${analysis.baselineCount} 条可比历史` : `${formatLift(analysis)} 相对基线`;
    return `<article class="mobile-perf-card"><div><strong>${escapeHTML(record.title)}</strong><span class="status-pill ${analysis.status}">${labels[analysis.status]}</span></div><p>${escapeHTML(CHANNEL_PROFILES[record.platform]?.name || record.platform)} · ${formatDate(record.published_at)} · ${analysis.value === null ? '等待数据' : `${metricLabel(analysis.metric)} ${formatMetricValue(analysis.metric,analysis.value)}`}</p><footer><span class="${Number.isFinite(analysis.lift) && analysis.lift > 0 ? 'lift-up' : Number.isFinite(analysis.lift) && analysis.lift < 0 ? 'lift-down' : ''}">${compareText}</span>${analysis.status === 'waiting' ? `<button class="button button-ghost" type="button" data-enter-performance="${record.id}">录入</button>` : `<button class="button button-ghost" type="button" data-view-winner="${record.id}">查看</button>`}</footer></article>`;
  }

  function openPerformanceEntry(recordId) {
    const record = performanceData.find(item => item.id === recordId), profile = record && CHANNEL_PROFILES[record.platform]; if (!record || !profile) return;
    selectedPerformanceId = recordId; document.getElementById('performanceEntryMeta').textContent = `${record.title} · ${profile.name}`;
    document.getElementById('metricEntryFields').innerHTML = performanceEntryMetrics(record,profile).map(metric => `<label class="field"><span>${escapeHTML(metricLabel(metric))}${metric === profile.goalMetrics[record.goal] ? ' · 核心' : ''}</span><input type="number" min="0" ${metric.includes('rate') ? 'max="100"' : ''} step="${metric.includes('rate') ? '0.1' : '1'}" name="metric-${metric}" value="${Number.isFinite(record.metrics?.[metric]) ? record.metrics[metric] : ''}" placeholder="未提供"></label>`).join(''); openDialog('performanceModal');
  }
  function performanceEntryMetrics(record, profile) { return [...new Set([...profile.availableMetrics,profile.goalMetrics[record.goal]].filter(Boolean))]; }
  function parsePerformanceMetric(metric, raw) {
    if (raw === undefined || raw === null || raw === '') return null; const value = Number(raw), isRate = metric.includes('rate') || metric === 'ctr';
    if (!Number.isFinite(value) || value < 0 || (isRate && value > 100) || (!isRate && !Number.isInteger(value))) throw new Error(`${metricLabel(metric)}的数据格式无效${isRate ? '，比例应在 0–100 之间' : '，数量应为非负整数'}`); return value;
  }
  function savePerformanceEntry(event) {
    event.preventDefault(); const record = performanceData.find(item => item.id === selectedPerformanceId), profile = record && CHANNEL_PROFILES[record.platform]; if (!record || !profile) return;
    const metrics = {}; let entered = 0;
    try { performanceEntryMetrics(record,profile).forEach(metric => { const value = document.querySelector(`[name="metric-${metric}"]`).value; metrics[metric] = parsePerformanceMetric(metric,value); if (Number.isFinite(metrics[metric])) entered++; }); }
    catch (error) { toast(error.message); return; }
    if (!entered) { toast('请至少录入一个实际指标'); return; }
    record.metrics = metrics; record.source = 'manual'; ensureRecordPattern(record); saveJSON(STORAGE.performance,performanceData); closeDialog('performanceModal'); renderPerformance(); toast('内容表现已保存，已重新计算同平台同目标历史基线');
  }
  async function importPerformanceCSV(event) {
    const file = event.target.files[0]; if (!file) return;
    try {
      const rows = parseCSV(await file.text()), updates = [];
      rows.forEach(row => {
        const aliases = {小红书:'xiaohongshu',抖音:'douyin',微信:'wechat',微信公众号:'wechat'};
        const record = performanceData.find(item => item.id === row.id) || performanceData.find(item => item.title === row.title && item.platform === (aliases[row.platform] || row.platform)); if (!record || !CHANNEL_PROFILES[record.platform]) return;
        const metrics = {}; let hasMetric = false;
        performanceEntryMetrics(record,CHANNEL_PROFILES[record.platform]).forEach(metric => { metrics[metric] = parsePerformanceMetric(metric,row[metric]); if (Number.isFinite(metrics[metric])) hasMetric = true; }); if (hasMetric) updates.push({record,metrics});
      });
      if (!updates.length) throw new Error('没有匹配到可更新的内容。请提供内容编号，或同时提供标题与平台。');
      updates.forEach(({record,metrics}) => { record.metrics = metrics; record.source = 'csv'; ensureRecordPattern(record); }); saveJSON(STORAGE.performance,performanceData); renderPerformance(); toast(`已通过数据表更新 ${updates.length} 条内容表现`);
    } catch (error) { toast(error.message || '数据表导入失败'); }
    finally { event.target.value = ''; }
  }

  function openWinnerDetail(recordId) {
    const record = performanceData.find(item => item.id === recordId); if (!record) return; ensureRecordPattern(record); selectedWinnerId = recordId;
    const analysis = analyzePerformance(record); document.getElementById('winnerKicker').textContent = analysis.status === 'winner' ? '高表现内容详情' : '内容详情'; document.getElementById('winnerTitle').textContent = record.title;
    document.getElementById('winnerMeta').textContent = `${CHANNEL_PROFILES[record.platform].name} · ${GOALS[record.goal]} · ${record.source === 'demo' ? '演示数据' : '用户数据'}`;
    const baselineNote = analysis.status === 'waiting' ? '尚未录入可用于当前目标的核心表现指标。' : analysis.status === 'insufficient' ? `当前仅有 ${analysis.baselineCount} 条“同平台 + 相同内容目标”的其他历史内容；至少需要 ${MIN_BASELINE_PEERS} 条才判断为高表现内容，因此不会写入创作经验。` : `基线使用 ${analysis.baselineCount} 条“同平台 + 相同内容目标”的其他历史内容计算，中位数与前 20% 分位均明确排除当前内容本身。`;
    document.getElementById('winnerBody').innerHTML = `<div class="winner-metrics"><div class="winner-metric"><span>${metricLabel(analysis.metric)}</span><strong>${formatMetricValue(analysis.metric,analysis.value)}</strong></div><div class="winner-metric"><span>历史中位数</span><strong>${formatMetricValue(analysis.metric,analysis.baseline)}</strong></div><div class="winner-metric"><span>相比历史</span><strong class="${Number.isFinite(analysis.lift) && analysis.lift >= 0 ? 'lift-up' : Number.isFinite(analysis.lift) ? 'lift-down' : ''}">${formatLift(analysis)}</strong></div></div><div class="analysis-block"><h3>比较口径</h3><p>${escapeHTML(baselineNote)}</p></div><div class="analysis-block"><h3>内容规律拆解</h3><div class="analysis-grid"><div class="analysis-item"><b>开场方式</b><p>${escapeHTML(record.pattern.hook)}</p></div><div class="analysis-item"><b>内容结构</b><p>${escapeHTML(record.pattern.structure)}</p></div><div class="analysis-item"><b>表达方式</b><p>${escapeHTML(record.pattern.expression)}</p></div><div class="analysis-item"><b>适用范围</b><p>${escapeHTML(record.pattern.scope)}</p></div></div></div>`;
    const learned = experienceMemory.some(item => item.source_content_id === record.id), button = document.getElementById('learnExperienceButton'); button.disabled = learned || analysis.status !== 'winner';
    button.textContent = learned ? '已学习' : analysis.status === 'winner' ? '加入创作经验' : analysis.status === 'insufficient' ? '样本不足，暂不沉淀经验' : '仅高表现内容可加入经验'; openDialog('winnerModal');
  }
  function learnSelectedWinner() {
    const record = performanceData.find(item => item.id === selectedWinnerId); if (!record || experienceMemory.some(item => item.source_content_id === record.id)) return;
    const analysis = analyzePerformance(record); if (analysis.status !== 'winner') return;
    experienceMemory.unshift({ id:uid('experience'), platform:record.platform, product_category:record.product_category, campaign_goal:record.goal, content_pattern:record.pattern.hook, insight:`${record.pattern.structure}；${record.pattern.expression}。在同平台、相同内容目标下表现较好。`, source_content_id:record.id, source_campaign:record.title, metric_name:analysis.metric, metric_value:analysis.value, baseline_value:analysis.baseline, lift:Math.round(analysis.lift), baseline_count:analysis.baselineCount, learned_at:localDateKey() });
    saveJSON(STORAGE.experience,experienceMemory); updateMemoryCounts(); renderMemory(); renderPerformance(); openWinnerDetail(record.id); toast('已加入创作经验，下次生成相似内容时会自动参考');
  }

  function switchImportTab(tab) { activeImportTab = tab; document.querySelectorAll('[data-import-tab]').forEach(button => button.classList.toggle('is-active',button.dataset.importTab === tab)); document.querySelectorAll('[data-import-panel]').forEach(panel => panel.classList.toggle('is-active',panel.dataset.importPanel === tab)); document.getElementById('importFeedback').hidden = true; }
  function prepareMaterialModal() { switchImportTab('manual'); ['materialTitle','materialText','pastedMaterial'].forEach(id => { document.getElementById(id).value = ''; }); document.getElementById('materialFile').value = ''; document.getElementById('materialFileName').textContent = '尚未选择文件'; const feedback = document.getElementById('importFeedback'); feedback.hidden = true; feedback.removeAttribute('style'); openDialog('materialModal'); }
  async function saveMaterial() {
    try {
      let records = [];
      if (activeImportTab === 'manual') { const type = document.getElementById('materialType').value, title = document.getElementById('materialTitle').value.trim(), content = document.getElementById('materialText').value.trim(); if (!title || !content) throw new Error('请填写标题和内容'); records = [{type,title,content}]; }
      else if (activeImportTab === 'paste') { const text = document.getElementById('pastedMaterial').value.trim(); if (!text) throw new Error('请先粘贴资料'); try { const parsed = JSON.parse(text); records = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.records) ? parsed.records : [parsed]); } catch (_) { records = [{type:'brand',title:'粘贴资料',content:text}]; } }
      else { const file = document.getElementById('materialFile').files[0]; if (!file) throw new Error('请选择 JSON 或 CSV 文件'); const text = await file.text(); if (file.name.toLowerCase().endsWith('.json')) { const parsed = JSON.parse(text); records = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.records) ? parsed.records : [parsed]); } else records = parseCSV(text); }
      const count = importRecords(records); if (!count) throw new Error('没有识别到可导入的资料'); saveJSON(STORAGE.brand,brandMemory); saveJSON(STORAGE.experience,experienceMemory); renderProductOptions(); renderMemory(); updateMemoryCounts(); const feedback = document.getElementById('importFeedback'); feedback.hidden = false; feedback.textContent = `已保存 ${count} 条资料。`; toast(`已保存 ${count} 条资料`); setTimeout(() => closeDialog('materialModal'),500);
    } catch (error) { const feedback = document.getElementById('importFeedback'); feedback.hidden = false; feedback.style.background = 'var(--danger-soft)'; feedback.style.color = 'var(--danger)'; feedback.textContent = error.message; }
  }
  function importRecords(records) {
    let count = 0;
    records.forEach(record => {
      const type = String(record.type || record.category || 'brand').toLowerCase();
      if (type === 'product' && (record.name || record.title)) {
        const name = record.name || record.title; brandMemory.products.push({ id:uid('product'), name, category:record.product_category || record.productCategory || '待补充', description:record.description || record.content || record.value || '待补充', sellingPoints:asArray(record.sellingPoints || record.selling_points), specification:record.specification || '待补充', serving:record.serving || '待补充', scenarios:asArray(record.scenarios), usableFacts:asArray(record.usableFacts || record.usable_facts || record.content || record.value), forbiddenInference:asArray(record.forbiddenInference || record.forbidden_inference || '医疗、营养及绝对化功效'), source:record.source || '用户导入' }); count++;
      } else if (type === 'experience' && (record.content_pattern || record.title)) {
        const metricValue = Number(record.metric_value), baselineValue = Number(record.baseline_value), lift = Number.isFinite(Number(record.lift)) ? Number(record.lift) : (baselineValue > 0 ? (metricValue-baselineValue)/baselineValue*100 : 0);
        if (CHANNEL_PROFILES[record.platform] && record.product_category && record.campaign_goal && metricValue > baselineValue && baselineValue > 0 && lift > 0) { experienceMemory.unshift({ id:uid('experience'), platform:record.platform, product_category:record.product_category, campaign_goal:record.campaign_goal, content_pattern:record.content_pattern || record.title, insight:record.insight || record.content || record.value || '用户导入的创作经验', source_content_id:record.source_content_id || uid('import-source'), source_campaign:record.source_campaign || '用户导入', metric_name:record.metric_name || CHANNEL_PROFILES[record.platform].goalMetrics[record.campaign_goal], metric_value:metricValue, baseline_value:baselineValue, lift, learned_at:record.learned_at || localDateKey() }); count++; }
      } else {
        const title = record.title || record.key || record.name, content = record.content || record.value || record.description; if (title && content) { brandMemory.customFacts = brandMemory.customFacts || []; brandMemory.customFacts.push({id:uid('brand-fact'),title,content,source:record.source || '用户导入'}); count++; }
      }
    }); return count;
  }
  function asArray(value) { if (Array.isArray(value)) return value; return String(value || '待补充').split(/[|；;]/).map(item => item.trim()).filter(Boolean); }
  function parseCSV(text) { const lines = text.trim().split(/\r?\n/).filter(Boolean); if (lines.length < 2) return []; const headers = parseCSVLine(lines[0]); return lines.slice(1).map(line => { const values = parseCSVLine(line); return Object.fromEntries(headers.map((header,index) => [header.trim(),values[index]?.trim() || ''])); }); }
  function parseCSVLine(line) { const values = []; let current = '', quoted = false; for (let index=0; index<line.length; index++) { const char = line[index]; if (char === '"' && line[index+1] === '"' && quoted) { current += '"'; index++; } else if (char === '"') quoted = !quoted; else if (char === ',' && !quoted) { values.push(current); current = ''; } else current += char; } values.push(current); return values; }
  function toast(message) { const region = document.getElementById('toastRegion'); const element = document.createElement('div'); element.className = 'toast'; element.textContent = message; region.appendChild(element); setTimeout(() => element.remove(),2800); }

  document.addEventListener('DOMContentLoaded', init);
})();