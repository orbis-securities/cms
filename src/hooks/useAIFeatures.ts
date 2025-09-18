import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { toast } from 'sonner';

export function useAIFeatures(editor: Editor | null, selectedBlog?: string, getDesignSettings?: (blogId: string) => Promise<any>) {
  const [showAICompletion, setShowAICompletion] = useState(false);
  const [showAIDropdown, setShowAIDropdown] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [aiCommand, setAiCommand] = useState('');
  const [aiMode, setAiMode] = useState<'selected' | 'full'>('selected');

  // 블로그 디자인 설정을 AI 프롬프트에 포함하는 함수
  const getDesignPrompt = useCallback(async (targetBlogId: string) => {
    console.log('🎨 디자인 설정 로드 시작:', targetBlogId);

    if (!getDesignSettings || !targetBlogId) {
      console.warn('getDesignSettings 또는 targetBlogId 없음:', { getDesignSettings: !!getDesignSettings, targetBlogId });
      return '';
    }

    try {
      const settings = await getDesignSettings(targetBlogId);
      console.log('📋 로드된 설정:', settings);

      if (!settings?.design) {
        console.warn('디자인 설정 없음:', settings);
        return '';
      }

      const design = settings.design;
      const prompt = `
스타일 가이드:
- 폰트: ${design.fontFamily} 사용
- 제목: ${design.heading?.fontSize || '28px'} 크기, ${design.heading?.color || '#1F2937'} 색상으로
- 부제목: ${design.subheading?.fontSize || '22px'} 크기, ${design.subheading?.color || '#374151'} 색상으로
- 목록: ${design.list?.fontSize || '16px'} 크기로 작성
- 하이라이트: 중요 부분은 ${design.highlight?.color || '#FBBF24'} 색상으로 강조
- 톤: ${design.textTone === 'professional' ? '전문적이고 격식 있는' : design.textTone === 'casual' ? '친근하고 편안한' : '기술적이고 정확한'} 톤으로
`;
      console.log('✅ 생성된 디자인 프롬프트:', prompt);
      return prompt;
    } catch (error) {
      console.error('❌ 디자인 설정 로드 실패:', error);
      return '';
    }
  }, [getDesignSettings]);

  // 전체 본문 보강
  const handleFullContentAI = useCallback(async (fullContent: string, command?: string) => {
    if (!selectedBlog) return;

    setShowAICompletion(true);
    try {
      const designPrompt = await getDesignPrompt(selectedBlog);

      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: fullContent,
          command: (command || '전체적으로 보강해줘') + (designPrompt ? '\n\n' + designPrompt : ''),
          context: `블로그 ID: ${selectedBlog}, 금융/투자 전문 블로그`
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        editor?.commands.setContent(data.enhanced);
        setShowAIDropdown(false);
        toast.success('본문이 AI로 보강되었습니다!');
      } else {
        throw new Error(data.error || 'AI 보강 실패');
      }
    } catch (error) {
      console.error('❌ AI 보강 오류:', error);
      toast.error('AI 본문 보강에 실패했습니다.');
    } finally {
      setShowAICompletion(false);
    }
  }, [editor, selectedBlog, getDesignPrompt]);

  // 선택 텍스트 리라이팅
  const handleSelectedTextAI = useCallback(async (command: string) => {
    if (!selectedText.trim() || !command.trim() || !selectedBlog) return;

    setShowAICompletion(true);
    try {
      const fullContent = editor?.getHTML();
      const designPrompt = await getDesignPrompt(selectedBlog);

      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          command: command + (designPrompt ? '\n\n' + designPrompt : ''),
          fullContext: fullContent,
          context: `블로그 ID: ${selectedBlog}, 금융/투자 전문 블로그`
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { from, to } = editor?.state.selection || { from: 0, to: 0 };
        editor?.chain().focus().deleteRange({ from, to }).insertContent(data.result).run();
        setShowAIDropdown(false);
        toast.success('텍스트가 AI로 개선되었습니다!');
      } else {
        throw new Error(data.error || 'AI 리라이팅 실패');
      }
    } catch (error) {
      console.error('❌ AI 리라이팅 오류:', error);
      toast.error('AI 리라이팅에 실패했습니다.');
    } finally {
      setShowAICompletion(false);
    }
  }, [selectedText, editor, selectedBlog, getDesignPrompt]);

  // AI 버튼 클릭 핸들러
  const handleAIButtonClick = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedContent = editor.state.doc.textBetween(from, to);

    if (selectedContent.trim()) {
      setAiMode('selected');
      setSelectedText(selectedContent);
      setAiCommand('');
      setShowAIDropdown(true);
    } else {
      setAiMode('full');
      setSelectedText('');
      setAiCommand('');
      setShowAIDropdown(true);
    }
  }, [editor]);

  return {
    showAICompletion,
    showAIDropdown,
    setShowAIDropdown,
    selectedText,
    aiCommand,
    setAiCommand,
    aiMode,
    handleFullContentAI,
    handleSelectedTextAI,
    handleAIButtonClick
  };
}