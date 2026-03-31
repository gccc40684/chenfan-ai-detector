import { useRef } from 'react';
import { HeroSection } from './components/HeroSection';
import { TextInput, TextInputRef } from './components/TextInput';
import { FileUpload } from './components/FileUpload';

function App() {
  const textInputRef = useRef<TextInputRef>(null);

  const handleFileParsed = (parsedText: string) => {
    textInputRef.current?.setText(parsedText);
  };

  const handleSubmit = (text: string) => {
    console.log('Submitting text for detection:', text);
    // TODO: 调用 API 进行检测
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <HeroSection title="AI 内容检测器" subtitle="快速检测文本是否由 AI 生成" />

        {/* 文件上传区域 */}
        <div className="mb-6">
          <FileUpload onFileParsed={handleFileParsed} />
        </div>

        {/* 文本输入区域 */}
        <TextInput ref={textInputRef} maxWords={5000} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

export default App;
