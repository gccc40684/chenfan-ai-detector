import { MainDetector } from './components/MainDetector';

function App() {
  return (
    <div className="min-h-screen bg-white">
      {/* 简洁导航栏 - GPTZero 风格 */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <svg 
                  className="w-5 h-5 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ width: '1.25rem', height: '1.25rem' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Detector
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button className="text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                登录
              </button>
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg">
                注册
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区域 - 添加顶部 padding 避免被固定导航栏遮挡 */}
      <div className="pt-16">
        {/* Hero 区域 - GPTZero 风格 */}
        <div className="pt-20 pb-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-8">
              <svg 
                className="w-4 h-4" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                style={{ width: '1rem', height: '1rem' }}
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              准确率 95%+
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              AI 内容检测器
            </h1>
            
            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              快速、准确地检测文本是否由 ChatGPT、Claude、Gemini 等 AI 生成
            </p>
          </div>
        </div>

        {/* 主检测区域 */}
        <main className="px-4 pb-20">
          <MainDetector />
        </main>

        {/* 页脚 - GPTZero 风格 */}
        <footer className="border-t border-gray-100 py-12 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg 
                    className="w-4 h-4 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ width: '1rem', height: '1rem' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">AI Detector</span>
              </div>
              <p className="text-sm text-gray-500">
                © 2024 AI Detector. 基于启发式算法和 LLM 技术的混合检测方案。
              </p>
              <div className="flex items-center gap-6">
                <a href="#" className="text-sm text-gray-500 hover:text-gray-700">隐私政策</a>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-700">使用条款</a>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-700">联系我们</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
