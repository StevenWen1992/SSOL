// api/experts.js
const { Client } = require('@notionhq/client');

// 初始化Notion客户端
const notion = new Client({ 
  auth: process.env.NOTION_API_KEY 
});
const databaseId = process.env.NOTION_DATABASE_ID;

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
  
  try {
    // 查询Notion数据库
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    
    // 处理响应数据
    const experts = response.results.map((page, index) => {
      const properties = page.properties;
      
      return {
        id: index + 1,
        name: properties['姓名']?.title[0]?.plain_text || '未命名',
        title: properties['职位']?.rich_text[0]?.plain_text || '',
        avatar: properties['头像URL']?.url || '/api/placeholder/100/100',
        skills: properties['技能']?.multi_select.map(item => item.name) || [],
        industries: properties['擅长行业']?.multi_select.map(item => item.name) || [],
        totalDeals: properties['累计成交金额']?.number || 0,
        projectCount: properties['项目数']?.number || 0,
        successRate: properties['成功率']?.number || 0,
        availability: properties['状态']?.select?.name?.toLowerCase() || 'unavailable',
        rating: properties['评分']?.number || 0,
        contact: properties['联系方式']?.rich_text[0]?.plain_text || '',
        projects: (() => {
          try {
            const projectsText = properties['项目经验']?.rich_text[0]?.plain_text || '[]';
            return JSON.parse(projectsText);
          } catch (e) {
            console.error('解析项目经验数据出错:', e);
            return [];
          }
        })()
      };
    });
    
    res.status(200).json(experts);
  } catch (error) {
    console.error('获取Notion数据出错:', error);
    res.status(500).json({ error: '获取数据失败', details: error.message });
  }
};
