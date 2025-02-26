// api/experts.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 获取环境变量
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  
  if (!apiKey || !databaseId) {
    return res.status(500).json({ error: '环境变量缺失' });
  }
  
  try {
    // 直接向Notion API发送请求
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API返回错误: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // 处理结果
    const experts = data.results.map((page, index) => {
      const properties = page.properties;
      
      // 提取数据
      return {
        id: index + 1,
        name: extractTitle(properties['姓名']),
        title: extractRichText(properties['职位']),
        avatar: extractUrl(properties['头像URL']),
        skills: extractMultiSelect(properties['技能']),
        industries: extractMultiSelect(properties['擅长行业']),
        totalDeals: extractNumber(properties['累计成交金额']),
        projectCount: extractNumber(properties['项目数']),
        successRate: extractNumber(properties['成功率']),
        availability: extractSelect(properties['状态']),
        rating: extractNumber(properties['评分']),
        contact: extractRichText(properties['联系方式']),
        projects: extractProjects(properties['项目经验'])
      };
    });
    
    res.status(200).json(experts);
    
  } catch (error) {
    console.error('获取Notion数据失败:', error);
    res.status(500).json({ error: error.message });
  }
};

// 辅助函数
function extractTitle(property) {
  if (!property || !property.title || property.title.length === 0) return '未命名';
  return property.title[0].plain_text;
}

function extractRichText(property) {
  if (!property || !property.rich_text || property.rich_text.length === 0) return '';
  return property.rich_text[0].plain_text;
}

function extractUrl(property) {
  if (!property || !property.url) return '/api/placeholder/100/100';
  return property.url;
}

function extractMultiSelect(property) {
  if (!property || !property.multi_select) return [];
  return property.multi_select.map(item => item.name);
}

function extractNumber(property) {
  if (!property || property.number === null || property.number === undefined) return 0;
  return property.number;
}

function extractSelect(property) {
  if (!property || !property.select) return 'unavailable';
  return property.select.name.toLowerCase();
}

function extractProjects(property) {
  try {
    const projectsText = extractRichText(property);
    if (!projectsText) return [];
    return JSON.parse(projectsText);
  } catch (e) {
    console.warn('解析项目经验JSON失败:', e.message);
    return [];
  }
}
