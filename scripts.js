// 当前加载的专家数据
let currentExperts = [];

// 备用数据，当API调用失败时显示
const expertsData = [
    {
        id: 1,
        name: "张明",
        title: "高级解决方案架构师",
        avatar: "/api/placeholder/100/100",
        skills: ["方案设计", "需求分析", "项目管理", "技术规划"],
        industries: ["金融", "互联网", "保险"],
        totalDeals: 15600000,
        projectCount: 23,
        successRate: 92,
        availability: "available",
        rating: 4.8,
        contact: "zhangming@company.com",
        projects: [
            {
                title: "某大型银行核心系统升级",
                description: "负责整体技术方案设计，协助客户完成系统平滑迁移，保障业务零中断。"
            },
            {
                title: "互联网金融平台架构设计",
                description: "设计微服务架构，提升系统并发处理能力，支持千万级用户访问。"
            }
        ]
    },
    {
        id: 2,
        name: "李婷",
        title: "资深行业解决方案专家",
        avatar: "/api/placeholder/100/100",
        skills: ["行业分析", "POC实施", "价值咨询", "竞品分析"],
        industries: ["医疗", "教育", "政府"],
        totalDeals: 9200000,
        projectCount: 17,
        successRate: 89,
        availability: "busy",
        rating: 4.7,
        contact: "liting@company.com",
        projects: [
            {
                title: "某三甲医院智慧医疗项目",
                description: "提供行业分析和价值咨询，帮助客户明确数字化转型路径。"
            },
            {
                title: "教育集团信息化建设",
                description: "针对教育行业特点，设计一体化解决方案，助力教学管理现代化。"
            }
        ]
    },
    {
        id: 3,
        name: "王强",
        title: "技术专家",
        avatar: "/api/placeholder/100/100",
        skills: ["产品演示", "定制开发", "系统集成", "故障排查"],
        industries: ["制造业", "物流", "能源"],
        totalDeals: 12800000,
        projectCount: 19,
        successRate: 95,
        availability: "unavailable",
        rating: 4.9,
        contact: "wangqiang@company.com",
        projects: [
            {
                title: "大型制造企业数字化车间",
                description: "负责系统集成和定制开发，实现生产设备互联和数据可视化。"
            },
            {
                title: "能源企业远程监控平台",
                description: "设计开发设备监控平台，实现故障预警和远程诊断。"
            }
        ]
    }
];

// 显示错误消息
function showError(message) {
    const container = document.getElementById('experts-container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    container.innerHTML = '';
    container.appendChild(errorDiv);
}

// 从API获取数据
async function fetchExpertsFromNotion() {
    try {
        document.getElementById('loading-indicator').style.display = 'block';
        console.log("开始从Notion获取数据...");
        
        const startTime = new Date().getTime();
        const response = await fetch('/api/experts');
        const endTime = new Date().getTime();
        console.log(`API响应时间: ${endTime - startTime}ms`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("API响应错误:", response.status, errorText);
            throw new Error(`获取数据失败: HTTP ${response.status} - ${errorText}`);
        }
        
        const experts = await response.json();
        console.log("成功获取专家数据:", experts.length, "条记录");
        
        if (experts.error) {
            console.error("API返回错误:", experts.error, experts.details || '');
            throw new Error(experts.error);
        }
        
        currentExperts = experts; // 保存当前加载的数据
        
        document.getElementById('loading-indicator').style.display = 'none';
        renderExperts(experts);
    } catch (error) {
        console.error('加载专家数据失败:', error);
        document.getElementById('loading-indicator').style.display = 'none';
        
        // 显示错误信息
        showError(`无法加载数据: ${error.message}`);
        
        // 加载失败时使用本地数据作为备份
        console.log("使用备用数据展示...");
        renderExperts(expertsData);
        currentExperts = expertsData;
    }
}

// 格式化金额函数
function formatCurrency(amount) {
    return (amount / 10000).toFixed(0) + "万";
}

// 生成星级评分HTML
function generateRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<span class="star">★</span>';
    }
    
    if (hasHalfStar) {
        starsHTML += '<span class="star">☆</span>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<span class="star" style="color: #ddd;">☆</span>';
    }
    
    return starsHTML;
}

// 根据状态返回对应的样式和文本
function getAvailabilityInfo(status) {
    switch(status) {
        case 'available':
            return { class: 'available', text: '可用' };
        case 'busy':
            return { class: 'busy', text: '忙碌' };
        case 'unavailable':
            return { class: 'unavailable', text: '不可用' };
        default:
            return { class: '', text: '未知' };
    }
}

// 渲染专家卡片
function renderExperts(experts) {
    const container = document.getElementById('experts-container');
    container.innerHTML = '';
    
    if (!experts || experts.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">📊</div>
                <p>暂无售前专家数据</p>
                <p>请检查Notion数据库或点击刷新按钮重试</p>
            </div>
        `;
        return;
    }
    
    experts.forEach(expert => {
        const availInfo = getAvailabilityInfo(expert.availability);
        
        const expertCard = document.createElement('div');
        expertCard.className = 'expert-card';
        expertCard.setAttribute('data-expert-id', expert.id);
        
        expertCard.innerHTML = `
            <div class="card-banner">
                <div class="expert-avatar">
                    <img src="${expert.avatar}" alt="${expert.name}">
                </div>
                <div class="bounty-amount">${formatCurrency(expert.totalDeals)}</div>
            </div>
            <div class="card-content">
                <h3 class="expert-name">${expert.name}</h3>
                <p class="expert-title">${expert.title}</p>
                
                <div class="rating">
                    ${generateRatingStars(expert.rating)}
                    <span style="margin-left: 5px;">${expert.rating}</span>
                </div>
                
                <div class="skills-container">
                    ${expert.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
                
                <p class="industries-list">擅长行业: ${expert.industries.join(', ')}</p>
                
                <div class="expert-stats">
                    <div class="stat-item">
                        <div class="stat-value">${expert.projectCount}</div>
                        <div class="stat-label">项目数</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${expert.successRate}%</div>
                        <div class="stat-label">成功率</div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="contact-btn">申请支持</button>
                <div class="availability">
                    <div class="status-indicator ${availInfo.class}"></div>
                    <span>${availInfo.text}</span>
                </div>
            </div>
        `;
        
        container.appendChild(expertCard);
        
        // 为卡片添加点击事件，显示详情
        expertCard.addEventListener('click', function(e) {
            // 如果点击的是"申请支持"按钮，则不显示详情
            if (e.target.classList.contains('contact-btn')) {
                alert(`已向${expert.name}发送支持申请，联系方式：${expert.contact}`);
                return;
            }
            showExpertDetail(expert.id);
        });
    });
}

// 显示专家详情
function showExpertDetail(expertId) {
    // 从当前加载的专家数据中查找专家
    const expert = currentExp
