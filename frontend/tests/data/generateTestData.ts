/**
 * 测试数据生成脚本
 * 用于生成或收集测试文本样本
 */

import * as fs from 'fs';
import * as path from 'path';

// 测试数据目录
const DATA_DIR = path.join(__dirname);

// 示例人工文本（中文）
const sampleHumanChinese = [
  `今天天气真不错，我想出去散散步。不过话说回来，最近工作压力挺大的，有时候真觉得需要好好休息一下。
   你知道的，生活节奏太快了，大家都在拼命往前冲。我觉得吧，偶尔停下来看看周围的风景也挺好的。`,

  `昨天跟朋友聊天，他说最近在看一本书，叫《百年孤独》。说实话，我之前也翻过几页，但是没看下去。
   那种魔幻现实主义的风格，可能需要点耐心才能读进去。不过朋友极力推荐，说看完会有不一样的感受。`,

  `做饭这件事，我觉得挺有意思的。虽然手艺一般，但是每次尝试新菜谱的时候都很兴奋。
   有时候成功了，味道还不错；有时候失败了，就只能默默倒掉。不过这就是生活的乐趣嘛，不是吗？`,
];

// 示例 AI 文本（中文）- 模拟 AI 生成特征
const sampleAIChinese = [
  `人工智能是计算机科学的一个重要分支。它致力于创造能够模拟人类智能的系统。
   机器学习是人工智能的核心技术之一。深度学习是机器学习的一个子领域。
   神经网络是深度学习的基础架构。人工智能应用广泛，包括图像识别和自然语言处理。`,

  `环境保护是全球面临的重要挑战。气候变化对环境产生了深远影响。
   可持续发展是解决环境问题的关键途径。各国政府应该加强环境保护政策的制定。
   企业应该承担环境责任。个人也应该积极参与环保行动。`,

  `教育是社会发展的基石。优质教育能够促进社会进步。
   教育公平是社会公平的重要组成部分。现代教育技术的发展改变了传统的教学方式。
   在线教育为学习者提供了更多机会。终身学习理念日益深入人心。`,
];

// 示例人工文本（英文）
const sampleHumanEnglish = [
  `Hey, so I was thinking about that movie we watched last night. I mean, it was okay I guess?
   Not really my cup of tea though. The ending was kinda confusing, don't you think? 
   Anyway, wanna grab coffee sometime this week?`,

  `Ugh, Mondays am I right? I totally overslept today and had to rush to work.
   Spilled coffee on my shirt too. Classic me, haha. But hey, at least the weekend was fun!`,

  `I've been trying to learn guitar for like... six months now? Still can't play a proper F chord.
   My fingers hurt so much. But I'm not giving up! Maybe I should get a teacher though.`,
];

// 示例 AI 文本（英文）
const sampleAIEnglish = [
  `Artificial intelligence is a significant branch of computer science. 
   It focuses on creating systems that can simulate human intelligence.
   Machine learning is a core technology of artificial intelligence.
   Deep learning is a subfield of machine learning. 
   Neural networks form the foundation of deep learning.`,

  `Environmental protection is a crucial challenge facing the world today.
   Climate change has profound impacts on the environment.
   Sustainable development is essential for addressing environmental issues.
   Governments should strengthen environmental protection policies.
   Corporations must take environmental responsibility.`,

  `Education is the foundation of social development.
   Quality education promotes social progress.
   Educational equity is vital for social justice.
   Modern educational technology has transformed traditional teaching methods.
   Online education provides more opportunities for learners.`,
];

/**
 * 生成测试数据文件
 */
function generateTestData(): void {
  console.log('Generating test data...\n');

  // 创建目录结构
  const dirs = [
    path.join(DATA_DIR, 'human', 'chinese'),
    path.join(DATA_DIR, 'human', 'english'),
    path.join(DATA_DIR, 'ai', 'chinese'),
    path.join(DATA_DIR, 'ai', 'english'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });

  // 生成人工中文样本
  sampleHumanChinese.forEach((text, index) => {
    const filePath = path.join(DATA_DIR, 'human', 'chinese', `sample_${index + 1}.txt`);
    fs.writeFileSync(filePath, text);
    console.log(`Created: ${filePath}`);
  });

  // 生成 AI 中文样本
  sampleAIChinese.forEach((text, index) => {
    const filePath = path.join(DATA_DIR, 'ai', 'chinese', `sample_${index + 1}.txt`);
    fs.writeFileSync(filePath, text);
    console.log(`Created: ${filePath}`);
  });

  // 生成人工英文样本
  sampleHumanEnglish.forEach((text, index) => {
    const filePath = path.join(DATA_DIR, 'human', 'english', `sample_${index + 1}.txt`);
    fs.writeFileSync(filePath, text);
    console.log(`Created: ${filePath}`);
  });

  // 生成 AI 英文样本
  sampleAIEnglish.forEach((text, index) => {
    const filePath = path.join(DATA_DIR, 'ai', 'english', `sample_${index + 1}.txt`);
    fs.writeFileSync(filePath, text);
    console.log(`Created: ${filePath}`);
  });

  console.log('\nTest data generation complete!');
  console.log('\nStats:');
  console.log(`  Human Chinese: ${sampleHumanChinese.length} samples`);
  console.log(`  AI Chinese: ${sampleAIChinese.length} samples`);
  console.log(`  Human English: ${sampleHumanEnglish.length} samples`);
  console.log(`  AI English: ${sampleAIEnglish.length} samples`);
}

/**
 * 加载测试数据
 * @param type 'human' | 'ai'
 * @param language 'chinese' | 'english'
 * @returns 文本数组
 */
export function loadTestData(type: 'human' | 'ai', language: 'chinese' | 'english'): string[] {
  const dir = path.join(DATA_DIR, type, language);

  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt'));

  return files.map(file => {
    const filePath = path.join(dir, file);
    return fs.readFileSync(filePath, 'utf-8');
  });
}

/**
 * 加载所有测试数据
 * @returns 所有测试数据
 */
export function loadAllTestData(): {
  humanChinese: string[];
  humanEnglish: string[];
  aiChinese: string[];
  aiEnglish: string[];
} {
  return {
    humanChinese: loadTestData('human', 'chinese'),
    humanEnglish: loadTestData('human', 'english'),
    aiChinese: loadTestData('ai', 'chinese'),
    aiEnglish: loadTestData('ai', 'english'),
  };
}

// 如果直接运行此脚本
if (require.main === module) {
  generateTestData();
}
