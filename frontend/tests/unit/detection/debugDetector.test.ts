/**
 * 调试检测器 - 查看各特征分数
 */

import { describe, it } from 'vitest';
import { detectAI } from '../../../src/utils/detection/heuristicDetector';
import { analyzeBurstiness } from '../../../src/utils/detection/calculateBurstiness';
import { analyzeDiversity } from '../../../src/utils/detection/calculateDiversity';
import { detectAIPatterns } from '../../../src/utils/detection/detectAIPatterns';

const humanSample = `今天天气真不错，我想出去散散步。不过话说回来，最近工作压力挺大的，有时候真觉得需要好好休息一下。
你知道的，生活节奏太快了，大家都在拼命往前冲。我觉得吧，偶尔停下来看看周围的风景也挺好的。`;

const aiSample = `人工智能是计算机科学的一个重要分支。它致力于创造能够模拟人类智能的系统。
机器学习是人工智能的核心技术之一。深度学习是机器学习的一个子领域。
神经网络是深度学习的基础架构。人工智能应用广泛，包括图像识别和自然语言处理。`;

const humanEnglish = `Hey, so I was thinking about that movie we watched last night. I mean, it was okay I guess?
Not really my cup of tea though. The ending was kinda confusing, don't you think?
Anyway, wanna grab coffee sometime this week?`;

const aiEnglish = `Artificial intelligence is a significant branch of computer science.
It focuses on creating systems that can simulate human intelligence.
Machine learning is a core technology of artificial intelligence.
Deep learning is a subfield of machine learning.
Neural networks form the foundation of deep learning.`;

describe('Debug Detector', () => {
  it('should show feature breakdown for human Chinese text', () => {
    console.log('\n=== Human Chinese Text ===');
    const result = detectAI(humanSample);
    console.log('Score:', result.score.toFixed(3));
    console.log('isAI:', result.isAI);
    console.log('Features:', {
      burstiness: result.features.burstiness.toFixed(3),
      diversity: result.features.diversity.toFixed(3),
      repetition: result.features.repetition.toFixed(3),
      sentenceVariation: result.features.sentenceVariation.toFixed(3),
      patternDensity: result.features.patternDensity.toFixed(3),
    });
    console.log('Details:', {
      burstiness: result.details.burstiness.toFixed(3),
      ttr: result.details.ttr.toFixed(3),
      mtld: result.details.mtld.toFixed(3),
    });

    const burstiness = analyzeBurstiness(humanSample);
    const diversity = analyzeDiversity(humanSample);
    const patterns = detectAIPatterns(humanSample);

    console.log('\nRaw burstiness:', burstiness);
    console.log('Raw diversity:', diversity);
    console.log('Raw patterns:', patterns);
  });

  it('should show feature breakdown for AI Chinese text', () => {
    console.log('\n=== AI Chinese Text ===');
    const result = detectAI(aiSample);
    console.log('Score:', result.score.toFixed(3));
    console.log('isAI:', result.isAI);
    console.log('Features:', {
      burstiness: result.features.burstiness.toFixed(3),
      diversity: result.features.diversity.toFixed(3),
      repetition: result.features.repetition.toFixed(3),
      sentenceVariation: result.features.sentenceVariation.toFixed(3),
      patternDensity: result.features.patternDensity.toFixed(3),
    });
    console.log('Details:', {
      burstiness: result.details.burstiness.toFixed(3),
      ttr: result.details.ttr.toFixed(3),
      mtld: result.details.mtld.toFixed(3),
    });

    const burstiness = analyzeBurstiness(aiSample);
    const diversity = analyzeDiversity(aiSample);
    const patterns = detectAIPatterns(aiSample);

    console.log('\nRaw burstiness:', burstiness);
    console.log('Raw diversity:', diversity);
    console.log('Raw patterns:', patterns);
  });

  it('should show feature breakdown for human English text', () => {
    console.log('\n=== Human English Text ===');
    const result = detectAI(humanEnglish);
    console.log('Score:', result.score.toFixed(3));
    console.log('isAI:', result.isAI);
    console.log('Features:', {
      burstiness: result.features.burstiness.toFixed(3),
      diversity: result.features.diversity.toFixed(3),
      repetition: result.features.repetition.toFixed(3),
      sentenceVariation: result.features.sentenceVariation.toFixed(3),
      patternDensity: result.features.patternDensity.toFixed(3),
    });

    const patterns = detectAIPatterns(humanEnglish);
    console.log('Raw patterns:', patterns);
  });

  it('should show feature breakdown for AI English text', () => {
    console.log('\n=== AI English Text ===');
    const result = detectAI(aiEnglish);
    console.log('Score:', result.score.toFixed(3));
    console.log('isAI:', result.isAI);
    console.log('Features:', {
      burstiness: result.features.burstiness.toFixed(3),
      diversity: result.features.diversity.toFixed(3),
      repetition: result.features.repetition.toFixed(3),
      sentenceVariation: result.features.sentenceVariation.toFixed(3),
      patternDensity: result.features.patternDensity.toFixed(3),
    });

    const patterns = detectAIPatterns(aiEnglish);
    console.log('Raw patterns:', patterns);
  });
});
