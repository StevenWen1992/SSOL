// api/experts.js
const { Client } = require('@notionhq/client');

module.exports = async (req, res) => {
  console.log("=== API调用开始 ===");
  console.log("请求方法:", req.method);
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Notion-Version');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    console.log("处理 OPTIONS 预检请求");
    res.status(200).end();
    return;
  }
  
  // 验证环境变量
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  
  console.log("环境变量检查:");
  console.log("- NOTION_API_KEY 存在:", !!apiKey);
  console.log("- NOTION_API_KEY 长度:", apiKey ? apiKey.length : 0);
  console.log("- NOTION_DATABASE_ID:", databaseId);
  
  if (!apiKey || !databaseId) {
    console.error("环境变量缺失");
    return res.status(500).json({ 
      error: '配置错误',
      message: '缺少必要的环境变量',
      missing: !apiKey ? 'NOTION_API_KEY' : 'NOTION_DATABASE_ID'
    });
  }
  
  try {
    console.log("初始化Notion客户端...");
    // 初始化Notion客户端，添加必要的请求头
    const notion = new Client({ 
      auth: apiKey,
      notionVersion: '2022-06-28' // 添加API版本
    });
    
    // 查询Notion数据库
    console.log("开始查询数据库...");
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    
    console.log("查询成功，获取到记录数:", response.results.length);
    
    if (response.results.length === 0) {
      console.log("数据库中没有记录");
      return res.status(200).json([]);
    }
    
    // 记录第一条记录的属性名，帮助调试
    const firstResult = response.results[0];
    console.log("第一条记录的属性名:", Object.keys(firstResult.properties).join(', '));
    
    // 处理响应数据
    console.log("开始处理数据...");
    const experts = response.results.map((page, index) => {
      const properties = page.properties;
      try {
        return {
          id: index + 1,
          name: getPropertyText(properties['姓名'], 'title', '未命名'),
          title: getPropertyText(properties['职位'], 'rich_text', ''),
          avatar: getPropertyUrl(properties['头像URL']) || '/api/placeholder/100/100',
          skills: getPropertyMultiSelect(properties['技能']),
          industries: getPropertyMultiSelect(properties['擅长行业']),
          totalDeals: getPropertyNumber(properties['累计成交金额'], 0),
          projectCount: getPropertyNumber(properties['项目数'], 0),
          successRate: getPropertyNumber(properties['成功率'], 0),
          availability: getPropertySelect(properties['状态'], 'unavailable'),
          rating: getPropertyNumber(properties['评分'], 0),
          contact: getPropertyText(properties['联系方式'], 'rich_text', ''),
          projects: getPropertyProjects(properties['项目经验'])
        };
      } catch (err) {
        console.error(`处理第${index+1}条记录时出错:`, err.message);
        // 返回基本信息但记录错误
        return {
          id: index + 1,
          name: getPropertyText(properties['姓名'], 'title', `记录 ${index+1}`),
          error: err.message,
          properties: Object.keys(properties)
        };
      }
    });
    
    console.log("数据处理完成，返回专家数量:", experts.length);
    res.status(200).json(experts);
    
  } catch (error) {
    console.error("获取Notion数据出错:", error);
    res.status(500).json({ 
      error: '获取数据失败', 
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
  
  console.log("=== API调用结束 ===");
};

// 工具函数: 获取属性文本
function getPropertyText(property, type, defaultValue = '') {
  if (!property) return defaultValue;
  
  try {
    if (type === 'title' && property.title && property.title.length > 0) {
      return property.title[0].plain_text;
    } else if (type === 'rich_text' && property.rich_text && property.rich_text.length > 0) {
      return property.rich_text[0].plain_text;
    }
  } catch (e) {
    console.warn(`读取${type}属性失败:`, e.message);
  }
  
  return defaultValue;
}

// 工具函数: 获取URL属性
function getPropertyUrl(property) {
  if (!property) return null;
  try {
    return property.url;
  } catch (e) {
    console.warn('读取URL属性失败:', e.message);
    return null;
  }
}

// 工具函数: 获取多选属性
function getPropertyMultiSelect(property) {
  if (!property || !property.multi_select) return [];
  
  try {
    return property.multi_select.map(item => item.name);
  } catch (e) {
    console.warn('读取多选属性失败:', e.message);
    return [];
  }
}

// 工具函数: 获取数字属性
function getPropertyNumber(property, defaultValue = 0) {
  if (!property) return defaultValue;
  
  try {
    return property.number !== null && property.number !== undefined ? property.number : defaultValue;
  } catch (e) {
    console.warn('读取数字属性失败:', e.message);
    return defaultValue;
  }
}

// 工具函数: 获取选择属性
function getPropertySelect(property, defaultValue = '') {
  if (!property || !property.select) return defaultValue;
  
  try {
    return property.select.name.toLowerCase();
  } catch (e) {
    console.warn('读取选择属性失败:', e.message);
    return defaultValue;
  }
}

// 工具函数: 解析项目经验JSON
function getPropertyProjects(property) {
  if (!property) return [];
  
  try {
    const projectsText = getPropertyText(property, 'rich_text', '[]');
    return JSON.parse(projectsText);
  } catch (e) {
    console.warn('解析项目经验JSON失败:', e.message);
    return [];
  }
}
