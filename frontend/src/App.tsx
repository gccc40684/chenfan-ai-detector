import { HeroSection } from './components/HeroSection';
import { TextInput } from './components/TextInput';

function App() {
  const handleTextChange = (text: string) => {
    console.log('Text changed:', text);
  };

  const handleSubmit = (text: string) => {
    console.log('Submitting text for detection:', text);
    // TODO: 调用 API 进行检测
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <HeroSection
          title="AI 内容检测器"
          subtitle="快速检测文本是否由 AI 生成"
        />
        <TextInput
          maxWords={5000}
          onTextChange={handleTextChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

export default App;
