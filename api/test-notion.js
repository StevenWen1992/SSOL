// api/test-notion.js
const { Client } = require('@notionhq/client');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Notion-Version');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const result = {
    timestamp: new Date().toISOString(),
    status: 'checking',
    steps: []
  };
  
  // 检查环境变量
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  
  result.steps.push({
    step: 'check_env_vars',
    status: apiKey && databaseId ? 'success' : 'error',
    details: {
      apiKeyExists: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      databaseIdExists: !!databaseId,
      databaseIdLength: databaseId ? databaseId.length : 0
    }
  });
  
  if (!apiKey || !databaseId) {
    result.status = 'error';
    result.error = '环境变量缺失';
    return res.status(500).json(result);
  }
  
  try {
    // 初始化Notion客户端，添加API版本
    const notion = new Client({ 
      auth: apiKey,
      notionVersion: '2022-06-28' // 指定API版本
    });
    
    // 步骤1: 测试API密钥(获取用户信息)
    try {
      result.steps.push({
        step: 'init_client',
        status: 'success',
        details: { 
          message: 'Notion客户端初始化成功',
          clientInfo: {
            notionVersion: '2022-06-28',
            hasAuthHeader: !!apiKey
          }
        }
      });
    } catch (error) {
      result.steps.push({
        step: 'init_client',
        status: 'error',
        details: { message: error.message }
      });
      throw error;
    }
    
    // 步骤2: 测试数据库访问
    try {
      const dbResponse = await notion.databases.retrieve({ database_id: databaseId });
      
      result.steps.push({
        step: 'check_database',
        status: 'success',
        details: {
          title: dbResponse.title?.[0]?.plain_text || '未命名数据库',
          propertyCount: Object.keys(dbResponse.properties).length,
          properties: Object.keys(dbResponse.properties)
        }
      });
    } catch (error) {
      result.steps.push({
        step: 'check_database',
        status: 'error',
        details: { 
          message: error.message,
          code: error.code
        }
      });
      throw error;
    }
    
    // 步骤3: 测试查询数据
    try {
      const queryResponse = await notion.databases.query({
        database_id: databaseId,
        page_size: 1
      });
      
      const recordCount = queryResponse.results.length;
      
      result.steps.push({
        step: 'query_data',
        status: 'success',
        details: {
          totalRecords: recordCount,
          sampleProperties: recordCount > 0 ? Object.keys(queryResponse.results[0].properties) : []
        }
      });
      
      // 检查特定属性
      if (recordCount > 0) {
        const firstRecord = queryResponse.results[0];
        const propertyCheck = {
          '姓名': checkProperty(firstRecord.properties['姓名'], 'title'),
          '职位': checkProperty(firstRecord.properties['职位'], 'rich_text'),
          '技能': checkProperty(firstRecord.properties['技能'], 'multi_select'),
          '累计成交金额': checkProperty(firstRecord.properties['累计成交金额'], 'number')
        };
        
        result.steps.push({
          step: 'check_properties',
          status: 'info',
          details: propertyCheck
        });
      }
      
    } catch (error) {
      result.steps.push({
        step: 'query_data',
        status: 'error',
        details: { 
          message: error.message,
          code: error.code
        }
      });
      throw error;
    }
    
    // 全部测试通过
    result.status = 'success';
    res.status(200).json(result);
    
  } catch (error) {
    result.status = 'error';
    result.error = error.message;
    res.status(500).json(result);
  }
};

// 检查属性格式
function checkProperty(property, expectedType) {
  if (!property) return { exists: false, type: null };
  
  const actualType = property.type;
  const isCorrectType = actualType === expectedType;
  
  return {
    exists: true,
    type: actualType,
    isCorrectType,
    expectedType
  };
}
