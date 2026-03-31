/**
 * 失败案例分析脚本
 */

import { detectAI } from '../src/utils/detection/heuristicDetector';
import { analyzeBurstiness } from '../src/utils/detection/calculateBurstiness';
import { analyzeDiversity } from '../src/utils/detection/calculateDiversity';
import { detectAIPatterns } from '../src/utils/detection/detectAIPatterns';

const humanFailures = [
  { id: 3, text: `刚看完那场球赛，太精彩了！最后几分钟真的是心跳加速。
   虽然支持的球队输了，但比赛过程真的很刺激。下次一定要现场看一次。` },
  { id: 5, text: `周末去爬山了，腿现在还酸着呢。山顶的风景确实值得，空气也清新。
   就是下山的时候差点滑倒，吓出一身冷汗。` },
];

const aiBorderline = [
  { id: 0, text: `Artificial intelligence is a significant branch of computer science.
   It focuses on creating systems that can simulate human intelligence.
   Machine learning is a core technology of artificial intelligence.
   Deep learning is a subfield of machine learning.
   Neural networks form the foundation of deep learning.` },
  { id: 4, text: `Economic growth depends on multiple factors. Innovation drives productivity improvements.
   Workforce development is essential. Infrastructure investment supports commerce.
   Trade policies affect global markets. Fiscal responsibility ensures stability.` },
];

function analyze(label: string, text: string) {
  const result = detectAI(text);
  const burst = analyzeBurstiness(text);
  const div = analyzeDiversity(text);
  const pat = detectAIPatterns(text);

  console.log(`\n=== ${label} ===`);
  console.log('Score:', result.score.toFixed(3), 'isAI:', result.isAI);
  console.log('Features:', {
    burstiness: result.features.burstiness.toFixed(3),
    diversity: result.features.diversity.toFixed(3),
    repetition: result.features.repetition.toFixed(3),
    sentenceVariation: result.features.sentenceVariation.toFixed(3),
    patternDensity: result.features.patternDensity.toFixed(3),
  });
  console.log('Raw burstiness:', {
    cv: burst.burstiness.toFixed(3),
    avg: burst.avgLength.toFixed(1),
    range: (burst.maxLength - burst.minLength),
    sentences: burst.sentenceCount,
  });
  console.log('Raw diversity:', {
    ttr: div.ttr.toFixed(3),
    mtld: div.mtld.toFixed(1),
    repetitionRate: div.repetitionRate.toFixed(3),
  });
  console.log('Raw patterns:', {
    density: pat.density.toFixed(3),
    patterns: pat.patterns,
    score: pat.score.toFixed(3),
  });
}

humanFailures.forEach((item, i) => analyze(`Human Failure ${item.id}`, item.text));
aiBorderline.forEach((item, i) => analyze(`AI Borderline ${item.id}`, item.text));
