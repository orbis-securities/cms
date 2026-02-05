"use client";

import { useEffect, useState } from 'react';

interface SEOAnalyzerProps {
  title: string;
  content: string;
  metaDescription: string;
}

interface Assessment {
  score: number;
  text: string;
}

export default function SEOAnalyzer({ title, content, metaDescription }: SEOAnalyzerProps) {
  const [overallScore, setOverallScore] = useState<number>(0);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    if (!title && !content) {
      setOverallScore(0);
      setAssessments([]);
      return;
    }

    try {
      // HTML 태그 제거
      const textContent = content.replace(/<[^>]*>/g, '').trim();

      // SEO 평가 (구글 정책 기반 + 한국어 최적화)
      const results: Assessment[] = [];
      let totalScore = 0;
      let count = 0;

      // 1. 제목 길이 체크 (한국어 최적화: 25-35자 권장)
      // 한글은 영문보다 픽셀 너비가 넓어서 더 짧게
      const titleLength = title.length;
      if (titleLength === 0) {
        results.push({ score: 0, text: '제목을 입력해주세요' });
      } else if (titleLength < 15) {
        results.push({ score: 3, text: `제목이 너무 짧습니다 (현재 ${titleLength}자, 25-35자 권장)` });
        totalScore += 3;
        count++;
      } else if (titleLength > 40) {
        results.push({ score: 6, text: `제목이 너무 깁니다 (현재 ${titleLength}자, 25-35자 권장)` });
        totalScore += 6;
        count++;
      } else if (titleLength >= 25 && titleLength <= 35) {
        results.push({ score: 9, text: `✓ 제목 길이가 이상적입니다 (${titleLength}자)` });
        totalScore += 9;
        count++;
      } else {
        results.push({ score: 7, text: `✓ 제목 길이가 적절합니다 (${titleLength}자)` });
        totalScore += 7;
        count++;
      }

      // 2. 메타 설명 길이 체크 (한국어: 80-110자 권장)
      const metaLength = metaDescription.length;
      if (metaLength === 0) {
        results.push({ score: 0, text: '메타 설명을 입력해주세요' });
      } else if (metaLength < 70) {
        results.push({ score: 6, text: `메타 설명이 너무 짧습니다 (현재 ${metaLength}자, 80-110자 권장)` });
        totalScore += 6;
        count++;
      } else if (metaLength > 120) {
        results.push({ score: 6, text: `메타 설명이 너무 깁니다 (현재 ${metaLength}자, 80-110자 권장)` });
        totalScore += 6;
        count++;
      } else {
        results.push({ score: 9, text: `✓ 메타 설명 길이가 적절합니다 (${metaLength}자)` });
        totalScore += 9;
        count++;
      }

      // 3. 본문 길이 체크 (한국어: 최소 300자, 권장 800자 이상)
      const charLength = textContent.length; // 한글 글자 수

      if (charLength < 300) {
        results.push({ score: 3, text: `본문이 너무 짧습니다 (현재 ${charLength}자, 최소 300자 권장)` });
        totalScore += 3;
        count++;
      } else if (charLength >= 800) {
        results.push({ score: 9, text: `✓ 본문 길이가 충분합니다 (${charLength}자) - 구글이 선호하는 길이` });
        totalScore += 9;
        count++;
      } else {
        results.push({ score: 7, text: `✓ 본문 길이가 적절합니다 (${charLength}자)` });
        totalScore += 7;
        count++;
      }

      // 4. 제목과 메타 설명 일치도 (너무 비슷하면 안좋음)
      if (title && metaDescription) {
        const similarity = title.toLowerCase() === metaDescription.toLowerCase();
        if (similarity) {
          results.push({ score: 4, text: '제목과 메타 설명이 동일합니다. 다르게 작성하세요' });
          totalScore += 4;
          count++;
        } else {
          results.push({ score: 9, text: '✓ 제목과 메타 설명이 적절히 구분되어 있습니다' });
          totalScore += 9;
          count++;
        }
      }

      // 5. 문단 구조 체크 (단락 나누기)
      const paragraphs = content.split(/<\/p>|<\/div>|<\/h[1-6]>/).filter(p => p.trim());
      if (paragraphs.length < 3) {
        results.push({ score: 5, text: '문단을 더 나누어 가독성을 높이세요 (3개 이상 권장)' });
        totalScore += 5;
        count++;
      } else {
        results.push({ score: 9, text: `✓ 문단이 적절히 구성되어 있습니다 (${paragraphs.length}개)` });
        totalScore += 9;
        count++;
      }

      // 6. 이미지 체크
      const hasImages = content.includes('<img');
      if (hasImages) {
        // 이미지 alt 속성 체크
        const imgMatches = content.match(/<img[^>]*>/g) || [];
        const missingAlt = imgMatches.some(img => !img.includes('alt='));
        if (missingAlt) {
          results.push({ score: 6, text: '일부 이미지에 alt 속성이 없습니다 (접근성 개선 필요)' });
          totalScore += 6;
          count++;
        } else {
          results.push({ score: 9, text: '✓ 이미지가 포함되어 있고 alt 속성도 있습니다' });
          totalScore += 9;
          count++;
        }
      } else {
        results.push({ score: 6, text: '이미지를 추가하면 사용자 경험이 개선됩니다' });
        totalScore += 6;
        count++;
      }

      // 7. 제목 태그 (H1, H2 등) 사용 체크
      const hasHeadings = /<h[1-6][^>]*>/i.test(content);
      if (hasHeadings) {
        results.push({ score: 9, text: '✓ 제목 태그(H1-H6)를 사용하여 구조화되어 있습니다' });
        totalScore += 9;
        count++;
      } else {
        results.push({ score: 5, text: '제목 태그(H1-H6)를 사용하여 내용을 구조화하세요' });
        totalScore += 5;
        count++;
      }

      // 전체 점수 계산 (0-100점)
      const finalScore = count > 0 ? Math.round((totalScore / (count * 9)) * 100) : 0;

      setOverallScore(finalScore);
      setAssessments(results);
    } catch (error) {
      console.error('SEO 분석 에러:', error);
      setOverallScore(0);
      setAssessments([{ score: 0, text: 'SEO 분석 중 오류가 발생했습니다' }]);
    }
  }, [title, content, metaDescription]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '좋음';
    if (score >= 60) return '보통';
    return '개선필요';
  };

  const getBulletColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 5) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">SEO 점수</h3>
        <div className="flex items-center gap-2">
          <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}
          </span>
          <span className="text-gray-500">/100</span>
          <span className={`text-sm ${getScoreColor(overallScore)}`}>
            {getScoreLabel(overallScore)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {assessments.map((assessment, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className={`w-2 h-2 rounded-full mt-1.5 ${getBulletColor(assessment.score)}`} />
            <p className="text-sm text-gray-700">{assessment.text}</p>
          </div>
        ))}
      </div>

      {assessments.length === 0 && (
        <p className="text-sm text-gray-500">제목과 내용을 입력하면 SEO 점수가 표시됩니다.</p>
      )}
    </div>
  );
}
