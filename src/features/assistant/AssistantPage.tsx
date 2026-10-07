import { Bot, Sparkles } from "lucide-react";

export function AssistantPage() {
  return (
    <section className="ai">
      <div>
        <Bot size={42} />
      </div>
      <span>DIET ASSISTANT</span>
      <h1>AI 비서를 준비하고 있어요.</h1>
      <p>
        <span>내 식단 기록을 바탕으로 영양 균형과 메뉴를 제안하는</span>
        <span>AI 비서 기능이 곧 추가됩니다.</span>
      </p>
      <aside>
        <Sparkles size={17} /> 오늘 단백질 목표를 확인해 보세요
      </aside>
    </section>
  );
}
