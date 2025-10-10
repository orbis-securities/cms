"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

interface EmojiRecommendationProps {
  content: string;
  onInsertEmoji: (emoji: string) => void;
}

// 키워드별 이모지 매핑
const emojiMap: Record<string, { emoji: string; keywords: string[] }[]> = {
  감정: [
    { emoji: '😊', keywords: ['행복', '기쁨', '웃음', '즐거움', '만족', '좋은'] },
    { emoji: '😢', keywords: ['슬픔', '눈물', '우울', '아픔', '슬픈', '우는'] },
    { emoji: '😡', keywords: ['화', '분노', '짜증', '화남', '화가', '열받'] },
    { emoji: '😍', keywords: ['사랑', '좋아', '연애', '애정', '좋아해', '사랑해'] },
    { emoji: '😮', keywords: ['놀람', '깜짝', '충격', '놀라움', '대박', '헐'] },
    { emoji: '🤔', keywords: ['생각', '고민', '궁금', '의문', '생각중', '고민중'] },
    { emoji: '😎', keywords: ['멋진', '쿨', '자신감', '최고', '멋짐', '간지'] },
    { emoji: '😴', keywords: ['피곤', '졸림', '잠', '수면', '졸려', '자고'] },
    { emoji: '😂', keywords: ['웃긴', '재밌', '재미', '웃겨', '킥킥', '빵터'] },
    { emoji: '🥰', keywords: ['귀여움', '사랑스러', '애교', '귀여워', '러블리'] },
    { emoji: '😭', keywords: ['울음', '서러움', '슬퍼', '흑흑', '엉엉'] },
    { emoji: '😤', keywords: ['화남', '빡침', '열받음', '짜증', '빡쳐'] },
    { emoji: '🤗', keywords: ['포옹', '안아', '따뜻', '위로', '격려'] },
    { emoji: '😱', keywords: ['무서움', '공포', '두려움', '겁', '무서워'] },
  ],
  활동: [
    { emoji: '💼', keywords: ['일', '업무', '회사', '직장', '비즈니스', '근무', '사무'] },
    { emoji: '📚', keywords: ['공부', '학습', '책', '교육', '독서', '배움', '수업'] },
    { emoji: '🏃', keywords: ['운동', '달리기', '건강', '피트니스', '조깅', '런닝'] },
    { emoji: '🍳', keywords: ['요리', '음식', '레시피', '식사', '요리하', '만들'] },
    { emoji: '✈️', keywords: ['여행', '관광', '휴가', '비행', '여행가', '해외'] },
    { emoji: '🎨', keywords: ['예술', '그림', '디자인', '창작', '미술', '작품'] },
    { emoji: '🎵', keywords: ['음악', '노래', '공연', '콘서트', '듣', '연주'] },
    { emoji: '🎮', keywords: ['게임', '플레이', '게이밍', '게임하', 'PC방'] },
    { emoji: '🛒', keywords: ['쇼핑', '구매', '장보', '사', '구입', '주문'] },
    { emoji: '🎬', keywords: ['영화', '시네마', '관람', '영화보', '극장'] },
    { emoji: '📸', keywords: ['사진', '촬영', '찍', '카메라', '인스타'] },
    { emoji: '🎤', keywords: ['노래방', '노래', '부르', '가창', '노래하'] },
  ],
  자연: [
    { emoji: '🌞', keywords: ['해', '태양', '날씨', '맑음', '햇빛', '화창'] },
    { emoji: '🌧️', keywords: ['비', '우천', '장마', '빗물', '비오', '우산'] },
    { emoji: '❄️', keywords: ['눈', '겨울', '추위', '한파', '눈오', '스키'] },
    { emoji: '🌸', keywords: ['봄', '꽃', '벚꽃', '개화', '꽃놀이', '봄꽃'] },
    { emoji: '🌊', keywords: ['바다', '파도', '해변', '물', '수영', '해수욕'] },
    { emoji: '🌲', keywords: ['나무', '숲', '자연', '산', '등산', '산책'] },
    { emoji: '⭐', keywords: ['별', '밤', '야경', '하늘', '별보', '천체'] },
    { emoji: '🌈', keywords: ['무지개', '희망', '다채로운', '빛깔', '컬러'] },
    { emoji: '🍃', keywords: ['바람', '시원', '산들', '바람불', '바람쐬'] },
    { emoji: '🌙', keywords: ['달', '밤', '달빛', '야간', '달구경'] },
    { emoji: '☁️', keywords: ['구름', '흐림', '구름낀', '흐린', '날씨'] },
    { emoji: '⚡', keywords: ['번개', '천둥', '폭풍', '낙뢰'] },
  ],
  음식: [
    { emoji: '🍕', keywords: ['피자', '치즈', '이탈리아', '피자먹', '배달'] },
    { emoji: '🍔', keywords: ['햄버거', '패스트푸드', '버거', '햄버거먹'] },
    { emoji: '🍜', keywords: ['라면', '국수', '면', '라멘', '우동', '쌀국수'] },
    { emoji: '🍣', keywords: ['초밥', '일식', '스시', '회', '일본음식', '횟집'] },
    { emoji: '🍰', keywords: ['케이크', '디저트', '달콤', '빵', '제과', '베이커리'] },
    { emoji: '☕', keywords: ['커피', '카페', '음료', '에스프레소', '아메리카노', '라떼'] },
    { emoji: '🍺', keywords: ['맥주', '술', '음주', '치맥', '맥주마', '한잔'] },
    { emoji: '🍎', keywords: ['사과', '과일', '건강', '신선', '과일먹'] },
    { emoji: '🍖', keywords: ['고기', '삼겹살', '구이', '고기먹', '고깃집', '바비큐'] },
    { emoji: '🍱', keywords: ['도시락', '점심', '식사', '밥', '런치'] },
    { emoji: '🍗', keywords: ['치킨', '닭', '후라이드', '양념', '치킨먹'] },
    { emoji: '🍝', keywords: ['파스타', '스파게티', '면요리', '이탈리안'] },
    { emoji: '🥗', keywords: ['샐러드', '채소', '야채', '다이어트', '건강식'] },
    { emoji: '🍦', keywords: ['아이스크림', '빙수', '디저트', '시원', '아이스'] },
  ],
  기술: [
    { emoji: '💻', keywords: ['컴퓨터', '코딩', '프로그래밍', '개발', 'IT', '개발자', '프로그램'] },
    { emoji: '📱', keywords: ['핸드폰', '스마트폰', '모바일', '폰', '아이폰', '갤럭시'] },
    { emoji: '🚀', keywords: ['로켓', '빠른', '성장', '스타트업', '혁신', '빠름', '급성장'] },
    { emoji: '💡', keywords: ['아이디어', '창의', '발명', '생각', '아이디어내', '떠오'] },
    { emoji: '🔧', keywords: ['도구', '수리', '개선', '문제해결', '고치', '수선'] },
    { emoji: '⚡', keywords: ['번개', '속도', '에너지', '전기', '빠름', '신속'] },
    { emoji: '🤖', keywords: ['로봇', 'AI', '인공지능', '자동화', '챗봇', '머신러닝'] },
    { emoji: '🔒', keywords: ['보안', '잠금', '안전', '보호', '비밀번호', '암호화'] },
    { emoji: '⌨️', keywords: ['키보드', '타이핑', '입력', '타자'] },
    { emoji: '🖥️', keywords: ['모니터', '화면', '컴퓨터', 'PC', '디스플레이'] },
    { emoji: '📡', keywords: ['통신', '네트워크', '인터넷', '무선', '와이파이'] },
    { emoji: '🔌', keywords: ['전원', '충전', '플러그', '배터리'] },
  ],
  성공: [
    { emoji: '🎯', keywords: ['목표', '타겟', '달성', '성취', '목표달성', '성공'] },
    { emoji: '🏆', keywords: ['우승', '상', '승리', '챔피언', '1등', '트로피'] },
    { emoji: '💰', keywords: ['돈', '재정', '투자', '수익', '돈벌', '부자'] },
    { emoji: '📈', keywords: ['성장', '증가', '상승', '발전', '성장하', '올라'] },
    { emoji: '✅', keywords: ['완료', '체크', '성공', '달성', '완료되', '끝'] },
    { emoji: '🌟', keywords: ['별', '특별', '우수', '뛰어남', '훌륭', '최고'] },
    { emoji: '👑', keywords: ['왕관', '최고', '리더', '1위', '왕', '정상'] },
    { emoji: '🎉', keywords: ['축하', '파티', '기념', '축하해', '생일', '기념일'] },
    { emoji: '💪', keywords: ['힘', '강한', '노력', '파이팅', '열심히', '힘내'] },
    { emoji: '🔥', keywords: ['불타', '열정', '핫', '인기', '대세', '뜨거'] },
  ],
  직업: [
    { emoji: '👨‍💼', keywords: ['직장인', '사무직', '회사원', '비즈니스맨'] },
    { emoji: '👨‍💻', keywords: ['개발자', '프로그래머', '엔지니어', '코더'] },
    { emoji: '👨‍⚕️', keywords: ['의사', '병원', '치료', '진료', '의료'] },
    { emoji: '👨‍🏫', keywords: ['선생님', '교사', '강사', '교수', '교육자'] },
    { emoji: '👨‍🎨', keywords: ['디자이너', '예술가', '아티스트', '창작자'] },
    { emoji: '👨‍🍳', keywords: ['요리사', '셰프', '요리', '주방장'] },
    { emoji: '🧑‍⚖️', keywords: ['변호사', '법률', '법', '변호', '소송'] },
  ],
  장소: [
    { emoji: '🏠', keywords: ['집', '가정', '홈', '집에', '주택'] },
    { emoji: '🏢', keywords: ['빌딩', '사무실', '회사', '오피스'] },
    { emoji: '🏫', keywords: ['학교', '교육', '캠퍼스', '학원'] },
    { emoji: '🏥', keywords: ['병원', '의원', '의료', '진료소'] },
    { emoji: '🏪', keywords: ['가게', '편의점', '상점', '마트'] },
    { emoji: '🏨', keywords: ['호텔', '숙박', '리조트', '펜션'] },
    { emoji: '🏛️', keywords: ['박물관', '미술관', '전시', '갤러리'] },
    { emoji: '⛪', keywords: ['교회', '성당', '사원', '종교'] },
  ],
  교통: [
    { emoji: '🚗', keywords: ['차', '자동차', '운전', '드라이브', '승용차'] },
    { emoji: '🚕', keywords: ['택시', '콜택시', '택시타'] },
    { emoji: '🚌', keywords: ['버스', '시내버스', '버스타'] },
    { emoji: '🚇', keywords: ['지하철', '전철', '메트로', '지하철타'] },
    { emoji: '🚄', keywords: ['기차', 'KTX', '열차', '기차타', '고속철'] },
    { emoji: '🚲', keywords: ['자전거', '자전거타', '사이클', '라이딩'] },
    { emoji: '🛵', keywords: ['오토바이', '배달', '스쿠터', '바이크'] },
  ],
  스포츠: [
    { emoji: '⚽', keywords: ['축구', '풋볼', '축구하', '축구경기'] },
    { emoji: '🏀', keywords: ['농구', '농구하', '농구경기', '슛'] },
    { emoji: '⚾', keywords: ['야구', '야구하', '야구경기', '타격'] },
    { emoji: '🎾', keywords: ['테니스', '테니스치', '라켓'] },
    { emoji: '🏐', keywords: ['배구', '배구하', '배구경기'] },
    { emoji: '🏊', keywords: ['수영', '수영하', '헤엄', '수영장'] },
    { emoji: '⛷️', keywords: ['스키', '스키타', '스키장', '눈'] },
    { emoji: '🥋', keywords: ['태권도', '무술', '격투', '도복'] },
  ],
  동물: [
    { emoji: '🐶', keywords: ['강아지', '개', '멍멍', '반려견', '애견'] },
    { emoji: '🐱', keywords: ['고양이', '냥', '고양이', '반려묘', '냥이'] },
    { emoji: '🐰', keywords: ['토끼', '토끼', '귀여', '깡총'] },
    { emoji: '🐻', keywords: ['곰', '곰돌', '베어', '테디'] },
    { emoji: '🦁', keywords: ['사자', '라이온', '맹수', '백수의왕'] },
    { emoji: '🐼', keywords: ['판다', '팬더', '중국', '대나무'] },
    { emoji: '🐨', keywords: ['코알라', '유칼립', '호주'] },
    { emoji: '🦋', keywords: ['나비', '날개', '예쁜', '변신'] },
  ],
  날씨시간: [
    { emoji: '🌅', keywords: ['일출', '새벽', '아침', '해돋이', 'sunrise'] },
    { emoji: '🌇', keywords: ['일몰', '저녁', '석양', '해질녘', 'sunset'] },
    { emoji: '🌃', keywords: ['밤', '야경', '밤하늘', '밤중', '심야'] },
    { emoji: '⏰', keywords: ['시계', '알람', '시간', '일어', '기상'] },
    { emoji: '⌚', keywords: ['손목시계', '시간확인', '워치'] },
  ],
  건강: [
    { emoji: '💊', keywords: ['약', '알약', '의약', '처방', '복용'] },
    { emoji: '💉', keywords: ['주사', '백신', '예방접종', '링거'] },
    { emoji: '🏋️', keywords: ['운동', '헬스', '근육', '헬스장', '웨이트'] },
    { emoji: '🧘', keywords: ['요가', '명상', '힐링', '스트레칭'] },
    { emoji: '😷', keywords: ['마스크', '감기', '아픔', '마스크쓰', '예방'] },
    { emoji: '🤒', keywords: ['열', '아파', '병', '감기', '몸살'] },
  ],
  경제금융: [
    { emoji: '💰', keywords: ['돈', '재정', '투자', '자산', '재산', '금융', '자금'] },
    { emoji: '💵', keywords: ['달러', '현금', '지폐', '달러화', '미국돈', '미화'] },
    { emoji: '💴', keywords: ['엔화', '일본', '엔', '일본돈', '일본화폐'] },
    { emoji: '💶', keywords: ['유로', '유럽', '유로화', '유럽돈'] },
    { emoji: '💷', keywords: ['파운드', '영국', '파운드화', '영국돈'] },
    { emoji: '💸', keywords: ['지출', '소비', '돈쓰', '낭비', '지갑'] },
    { emoji: '💳', keywords: ['카드', '결제', '신용카드', '체크카드', '카드결제'] },
    { emoji: '🟡', keywords: ['코인', '동전', '암호화폐', '비트코인', '가상화폐', '코인투자', '디지털화폐', '이더리움', '알트코인'] },
    { emoji: '💹', keywords: ['주가', '주식', '상승', '차트', '증시', '주식시장', '매수'] },
    { emoji: '📈', keywords: ['그래프', '상승', '성장', '증가', '오름', '급등', '성장세'] },
    { emoji: '📉', keywords: ['하락', '감소', '하락세', '내림', '급락', '손실', '마이너스'] },
    { emoji: '💱', keywords: ['환전', '환율', '외환', '외화', '환전소', '외환거래'] },
    { emoji: '🏦', keywords: ['은행', '금융', '저축', '예금', '은행가', '금융권'] },
    { emoji: '💎', keywords: ['다이아몬드', '가치', '귀금속', '보석', '귀중품', '고가'] },
    { emoji: '🤑', keywords: ['수익', '돈벌기', '부자', '돈많은', '대박', '부유'] },
    { emoji: '💲', keywords: ['가격', '비용', '값', '요금', '금액'] },
    { emoji: '🧾', keywords: ['영수증', '청구서', '계산서', '영수증', '세금'] },
    { emoji: '💼', keywords: ['비즈니스', '사업', '거래', '계약', '협상'] },
  ],
};

const EmojiRecommendation: React.FC<EmojiRecommendationProps> = ({ content, onInsertEmoji }) => {
  const [recommendedEmojis, setRecommendedEmojis] = useState<{ emoji: string; reason: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeContent = () => {
    setIsAnalyzing(true);

    // HTML 태그 제거
    const plainText = content.replace(/<[^>]*>/g, ' ').toLowerCase();

    const emojiScores: Record<string, { emoji: string; score: number; matchedKeywords: string[] }> = {};

    // 모든 카테고리의 이모지 검사
    Object.values(emojiMap).forEach(category => {
      category.forEach(item => {
        item.keywords.forEach(keyword => {
          if (plainText.includes(keyword)) {
            if (!emojiScores[item.emoji]) {
              emojiScores[item.emoji] = { emoji: item.emoji, score: 0, matchedKeywords: [] };
            }
            emojiScores[item.emoji].score += 1;
            if (!emojiScores[item.emoji].matchedKeywords.includes(keyword)) {
              emojiScores[item.emoji].matchedKeywords.push(keyword);
            }
          }
        });
      });
    });

    // 점수 기준으로 정렬하고 모든 관련 이모지 선택
    const sortedEmojis = Object.values(emojiScores)
      .sort((a, b) => b.score - a.score)
      .map(item => ({
        emoji: item.emoji,
        reason: `"${item.matchedKeywords.join(', ')}" 관련`,
      }));

    setRecommendedEmojis(sortedEmojis);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    if (content.trim()) {
      const timer = setTimeout(() => {
        analyzeContent();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setRecommendedEmojis([]);
    }
  }, [content]);

  if (recommendedEmojis.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Sparkles className="w-4 h-4 text-gray-400" />
      <span className="text-xs text-gray-500">추천:</span>
      {recommendedEmojis.slice(0, 8).map((item, index) => (
        <button
          key={index}
          onClick={() => onInsertEmoji(item.emoji)}
          className="p-1 hover:bg-gray-100 rounded transition-all"
          title={item.reason}
        >
          <div className="text-xl">{item.emoji}</div>
        </button>
      ))}
      {isAnalyzing && (
        <span className="text-xs text-gray-400 ml-auto">분석 중...</span>
      )}
    </div>
  );
};

export default EmojiRecommendation;
