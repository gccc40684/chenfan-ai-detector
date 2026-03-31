import { MainDetector } from './components/MainDetector';

function App() {
  return (
    <div className="min-h-screen bg-white">
      {/* 导航栏 */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">AI Detector</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">产品</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">定价</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">API</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">关于</a>
            </div>

            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">登录</button>
              <button className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                免费试用
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero 区域 */}
      <div className="pt-16 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            准确率 95%+
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            AI 内容检测器
          </h1>
          
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            快速、准确地检测文本是否由 ChatGPT、Claude、Gemini 等 AI 生成
          </p>
        </div>
      </div>

      {/* 主检测区域 */}
      <main className="px-4 pb-16">
        <MainDetector />
      </main>

      {/* 底部说明 */}
      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-400">
            © 2024 AI Detector. 基于启发式算法和 LLM 技术的混合检测方案。
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
