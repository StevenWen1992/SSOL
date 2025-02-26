// scripts.js

// 从API获取数据
async function fetchExpertsFromNotion() {
  try {
    document.getElementById('loading-indicator').style.display = 'block';
    
    const response = await fetch('/api/experts');
    if (!response.ok) {
      throw new Error('获取数据失败');
    }
    
    const experts = await response.json();
    
    document.getElementById('loading-indicator').style.display = 'none';
    renderExperts(experts);
  } catch (error) {
    console.error('加载专家数据失败:', error);
    document.getElementById('loading-indicator').style.display = 'none';
    // 加载失败时使用本地数据作为备份
    renderExperts(expertsData);
  }
}

// 页面加载时获取数据
document.addEventListener('DOMContentLoaded', () => {
  fetchExpertsFromNotion();
  
  // 设置搜索和筛选功能
  setupSearchAndFilters();
});

// 其他函数保持不变...
