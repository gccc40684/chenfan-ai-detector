/**
 * 端到端准确率测试脚本
 * 测试混合检测策略的综合准确率
 * 目标：综合准确率 >= 85%
 */

import { detectAI, type DetectionResult } from '../src/utils/detection/heuristicDetector';
import {
  sampleHumanChinese,
  sampleAIChinese,
  sampleHumanEnglish,
  sampleAIEnglish,
  additionalHumanChinese,
  additionalAIChinese,
  additionalHumanEnglish,
  additionalAIEnglish,
} from './data/testSamples';

// 测试样本类型
interface TestSample {
  text: string;
  expected: 'human' | 'ai';
  label: string;
}

// 测试结果
interface TestResult {
  sample: TestSample;
  result: DetectionResult;
  correct: boolean;
}

// 准确率报告
interface AccuracyReport {
  totalSamples: number;
  correctPredictions: number;
  accuracy: number;
  humanSamples: {
    total: number;
    correct: number;
    accuracy: number;
  };
  aiSamples: {
    total: number;
    correct: number;
    accuracy: number;
  };
  chineseSamples: {
    total: number;
    correct: number;
    accuracy: number;
  };
  englishSamples: {
    total: number;
    correct: number;
    accuracy: number;
  };
  details: TestResult[];
  timestamp: string;
}

// 准备测试数据
function prepareTestData(): TestSample[] {
  const samples: TestSample[] = [];

  // 中文人工文本
  sampleHumanChinese.forEach((text, i) => {
    samples.push({ text, expected: 'human', label: `中文人工-${i + 1}` });
  });
  additionalHumanChinese.forEach((text, i) => {
    samples.push({ text, expected: 'human', label: `中文人工附加-${i + 1}` });
  });

  // 中文 AI 文本
  sampleAIChinese.forEach((text, i) => {
    samples.push({ text, expected: 'ai', label: `中文AI-${i + 1}` });
  });
  additionalAIChinese.forEach((text, i) => {
    samples.push({ text, expected: 'ai', label: `中文AI附加-${i + 1}` });
  });

  // 英文人工文本
  sampleHumanEnglish.forEach((text, i) => {
    samples.push({ text, expected: 'human', label: `英文人工-${i + 1}` });
  });
  additionalHumanEnglish.forEach((text, i) => {
    samples.push({ text, expected: 'human', label: `英文人工附加-${i + 1}` });
  });

  // 英文 AI 文本
  sampleAIEnglish.forEach((text, i) => {
    samples.push({ text, expected: 'ai', label: `英文AI-${i + 1}` });
  });
  additionalAIEnglish.forEach((text, i) => {
    samples.push({ text, expected: 'ai', label: `英文AI附加-${i + 1}` });
  });

  return samples;
}

// 运行测试
function runAccuracyTest(): AccuracyReport {
  const samples = prepareTestData();
  const results: TestResult[] = [];

  let correctCount = 0;
  let humanTotal = 0;
  let humanCorrect = 0;
  let aiTotal = 0;
  let aiCorrect = 0;
  let chineseTotal = 0;
  let chineseCorrect = 0;
  let englishTotal = 0;
  let englishCorrect = 0;

  console.log('🧪 开始端到端准确率测试...\n');

  for (const sample of samples) {
    const result = detectAI(sample.text);
    const predicted = result.isAI ? 'ai' : 'human';
    const correct = predicted === sample.expected;

    results.push({ sample, result, correct });

    if (correct) {
      correctCount++;
    }

    // 统计人工/AI
    if (sample.expected === 'human') {
      humanTotal++;
      if (correct) humanCorrect++;
    } else {
      aiTotal++;
      if (correct) aiCorrect++;
    }

    // 统计中英文
    if (sample.label.startsWith('中文')) {
      chineseTotal++;
      if (correct) chineseCorrect++;
    } else {
      englishTotal++;
      if (correct) englishCorrect++;
    }

    // 打印单个结果
    const status = correct ? '✅' : '❌';
    console.log(
      `${status} ${sample.label.padEnd(12)} | 预期: ${sample.expected.padEnd(5)} | 预测: ${predicted.padEnd(5)} | 置信度: ${(result.confidence * 100).toFixed(1)}% | 分数: ${(result.score * 100).toFixed(1)}%`
    );
  }

  console.log('\n' + '='.repeat(80));

  return {
    totalSamples: samples.length,
    correctPredictions: correctCount,
    accuracy: correctCount / samples.length,
    humanSamples: {
      total: humanTotal,
      correct: humanCorrect,
      accuracy: humanTotal > 0 ? humanCorrect / humanTotal : 0,
    },
    aiSamples: {
      total: aiTotal,
      correct: aiCorrect,
      accuracy: aiTotal > 0 ? aiCorrect / aiTotal : 0,
    },
    chineseSamples: {
      total: chineseTotal,
      correct: chineseCorrect,
      accuracy: chineseTotal > 0 ? chineseCorrect / chineseTotal : 0,
    },
    englishSamples: {
      total: englishTotal,
      correct: englishCorrect,
      accuracy: englishTotal > 0 ? englishCorrect / englishTotal : 0,
    },
    details: results,
    timestamp: new Date().toISOString(),
  };
}

// 打印报告
function printReport(report: AccuracyReport): void {
  console.log('\n📊 准确率测试报告');
  console.log('='.repeat(80));
  console.log(`测试时间: ${report.timestamp}`);
  console.log(`总样本数: ${report.totalSamples}`);
  console.log(`正确预测: ${report.correctPredictions}`);
  console.log(`综合准确率: ${(report.accuracy * 100).toFixed(2)}%`);
  console.log('');

  console.log('📈 分类统计');
  console.log('-'.repeat(80));
  console.log(
    `人工文本: ${report.humanSamples.correct}/${report.humanSamples.total} (${(report.humanSamples.accuracy * 100).toFixed(2)}%)`
  );
  console.log(
    `AI 文本:  ${report.aiSamples.correct}/${report.aiSamples.total} (${(report.aiSamples.accuracy * 100).toFixed(2)}%)`
  );
  console.log('');

  console.log(
    `中文样本: ${report.chineseSamples.correct}/${report.chineseSamples.total} (${(report.chineseSamples.accuracy * 100).toFixed(2)}%)`
  );
  console.log(
    `英文样本: ${report.englishSamples.correct}/${report.englishSamples.total} (${(report.englishSamples.accuracy * 100).toFixed(2)}%)`
  );
  console.log('');

  // 目标检查
  const targetAccuracy = 0.85;
  console.log('🎯 目标检查');
  console.log('-'.repeat(80));
  if (report.accuracy >= targetAccuracy) {
    console.log(
      `✅ 综合准确率达标！目标: ${(targetAccuracy * 100).toFixed(0)}%, 实际: ${(report.accuracy * 100).toFixed(2)}%`
    );
  } else {
    console.log(
      `❌ 综合准确率未达标。目标: ${(targetAccuracy * 100).toFixed(0)}%, 实际: ${(report.accuracy * 100).toFixed(2)}%`
    );
  }

  // 打印错误样本
  const errors = report.details.filter(r => !r.correct);
  if (errors.length > 0) {
    console.log('\n❌ 错误样本详情');
    console.log('-'.repeat(80));
    errors.forEach(({ sample, result }) => {
      console.log(`\n${sample.label}:`);
      console.log(`  预期: ${sample.expected}, 预测: ${result.isAI ? 'ai' : 'human'}`);
      console.log(
        `  分数: ${(result.score * 100).toFixed(1)}%, 置信度: ${(result.confidence * 100).toFixed(1)}%`
      );
      console.log(`  特征:`, result.features);
    });
  }

  console.log('\n' + '='.repeat(80));
}

// 导出报告为 Markdown
function exportReportToMarkdown(report: AccuracyReport): string {
  const lines: string[] = [];

  lines.push('# AI 检测器准确率测试报告');
  lines.push('');
  lines.push(`**测试时间**: ${report.timestamp}`);
  lines.push(`**测试样本数**: ${report.totalSamples}`);
  lines.push('');

  lines.push('## 综合结果');
  lines.push('');
  lines.push('| 指标 | 数值 |');
  lines.push('|------|------|');
  lines.push(`| 综合准确率 | ${(report.accuracy * 100).toFixed(2)}% |`);
  lines.push(`| 正确预测 | ${report.correctPredictions}/${report.totalSamples} |`);
  lines.push(`| 目标达成 | ${report.accuracy >= 0.85 ? '✅ 达标' : '❌ 未达标'} (目标: 85%) |`);
  lines.push('');

  lines.push('## 分类统计');
  lines.push('');
  lines.push('| 类别 | 正确/总数 | 准确率 |');
  lines.push('|------|-----------|--------|');
  lines.push(
    `| 人工文本 | ${report.humanSamples.correct}/${report.humanSamples.total} | ${(report.humanSamples.accuracy * 100).toFixed(2)}% |`
  );
  lines.push(
    `| AI 文本 | ${report.aiSamples.correct}/${report.aiSamples.total} | ${(report.aiSamples.accuracy * 100).toFixed(2)}% |`
  );
  lines.push(
    `| 中文样本 | ${report.chineseSamples.correct}/${report.chineseSamples.total} | ${(report.chineseSamples.accuracy * 100).toFixed(2)}% |`
  );
  lines.push(
    `| 英文样本 | ${report.englishSamples.correct}/${report.englishSamples.total} | ${(report.englishSamples.accuracy * 100).toFixed(2)}% |`
  );
  lines.push('');

  const errors = report.details.filter(r => !r.correct);
  if (errors.length > 0) {
    lines.push('## 错误样本');
    lines.push('');
    lines.push('| 样本 | 预期 | 预测 | 分数 | 置信度 |');
    lines.push('|------|------|------|------|--------|');
    errors.forEach(({ sample, result }) => {
      lines.push(
        `| ${sample.label} | ${sample.expected} | ${result.isAI ? 'ai' : 'human'} | ${(result.score * 100).toFixed(1)}% | ${(result.confidence * 100).toFixed(1)}% |`
      );
    });
    lines.push('');
  }

  lines.push('## 详细结果');
  lines.push('');
  lines.push('| 样本 | 预期 | 预测 | 结果 | 分数 | 置信度 |');
  lines.push('|------|------|------|------|------|--------|');
  report.details.forEach(({ sample, result, correct }) => {
    const status = correct ? '✅' : '❌';
    lines.push(
      `| ${sample.label} | ${sample.expected} | ${result.isAI ? 'ai' : 'human'} | ${status} | ${(result.score * 100).toFixed(1)}% | ${(result.confidence * 100).toFixed(1)}% |`
    );
  });
  lines.push('');

  return lines.join('\n');
}

// 主函数
function main(): void {
  const report = runAccuracyTest();
  printReport(report);

  // 导出 Markdown 报告
  const markdown = exportReportToMarkdown(report);

  // 如果运行在 Node.js 环境，写入文件
  if (typeof process !== 'undefined' && process.stdout) {
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, '..', 'docs', 'ACCURACY_REPORT.md');

    // 确保目录存在
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(reportPath, markdown);
    console.log(`\n📝 报告已保存到: ${reportPath}`);
  }

  // 返回结果供测试框架使用
  return report;
}

// 导出函数供其他模块使用
export { runAccuracyTest, printReport, exportReportToMarkdown, prepareTestData };
export type { TestSample, TestResult, AccuracyReport };

// 如果直接运行此文件
if (require.main === module) {
  main();
}
