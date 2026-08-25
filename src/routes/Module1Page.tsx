import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Routes, Route, useParams, Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ProgressRail } from "../components/ui/ProgressRail";
import { LessonTabs } from "../components/learning/LessonTabs";
import { LessonKnowledgeModal } from "../components/learning/LessonKnowledgeModal";
import { LessonPlaceholder } from "../components/learning/LessonPlaceholder";
import Lesson1Fid from "./module1/Lesson1Fid";
import Lesson2FieldStability from "./module1/Lesson2FieldStability";
import Lesson3Shimming from "./module1/Lesson3Shimming";
import Lesson4AutoGain from "./module1/Lesson4AutoGain";
import Lesson5HardPulse from "./module1/Lesson5HardPulse";
import Lesson6SoftPulse from "./module1/Lesson6SoftPulse";
import Lesson7Prescan from "./module1/Lesson7Prescan";
import Lesson8SpinEchoFov from "./module1/Lesson8SpinEchoFov";
import Lesson9Weighting from "./module1/Lesson9Weighting";
import Lesson10T1Ir from "./module1/Lesson10T1Ir";
import Lesson11T2Cpmg from "./module1/Lesson11T2Cpmg";
import { module1Lessons, phaseLabels, getLesson } from "../data/module1Lessons";
import { getModule } from "../data/modules";
import { getLessonKnowledge } from "../data/lessonKnowledge";
import { useT } from "../i18n/useT";

const BASE_PATH = "/module-1/lesson";

/** Props chung mọi lesson component. */
interface LessonProps {
  locked: boolean;
  onReopenKnowledge: () => void;
}

/**
 * Bảng dispatch lessonId → component. Thêm bài mới chỉ cần thêm 1 dòng.
 */
const lessonComponents: Record<string, ComponentType<LessonProps>> = {
  "lesson-1-fid": Lesson1Fid,
  "lesson-2-field-stability": Lesson2FieldStability,
  "lesson-3-shimming": Lesson3Shimming,
  "lesson-4-auto-gain": Lesson4AutoGain,
  "lesson-5-hard-pulse": Lesson5HardPulse,
  "lesson-6-soft-pulse": Lesson6SoftPulse,
  "lesson-7-prescan": Lesson7Prescan,
  "lesson-8-spin-echo-fov": Lesson8SpinEchoFov,
  "lesson-9-weighting": Lesson9Weighting,
  "lesson-10-t1-ir": Lesson10T1Ir,
  "lesson-11-t2-cpmg": Lesson11T2Cpmg,
};

/**
 * Module1Page — shell Module 1 (layout Card).
 *
 * Routing:
 *   /module-1            → Bài 1
 *   /module-1/lesson/:id → bài tương ứng
 *
 * Bố cục: tiêu đề module → thanh tab bài học (sticky, cố định) → thanh tiến độ
 * (dưới tab) → nội dung bài. Modal kiến thức bắt buộc cho bài khả dụng.
 * Tiến độ client-state.
 */
export default function Module1Page() {
  return (
    <section className="container" style={{ padding: "var(--space-6) var(--space-5) var(--space-8)" }}>
      <Routes>
        <Route index element={<Module1Intro />} />
        <Route path="lesson/:lessonId" element={<LessonRoute />} />
        <Route path="*" element={<Module1Intro />} />
      </Routes>
    </section>
  );
}

/**
 * Module1Intro — block giới thiệu Module 1, hiện khi lần đầu vào /module-1.
 * Nút "Đã hiểu, bắt đầu học tập" dẫn vào Bài 1 (nơi hộp kiến thức Bài 1 mở ra).
 */
function Module1Intro() {
  const { t, tr } = useT();
  const firstLesson = module1Lessons[0];
  const mod = getModule("module-1");
  return (
    <div style={{ display: "grid", gap: "var(--space-5)" }}>
      <Card>
        <p className="eyebrow">{t("module1.eyebrow")}</p>
        <h1 style={{ fontSize: "1.8rem", marginTop: "var(--space-2)" }}>{mod ? tr(mod.title) : ""}</h1>
        <p className="muted" style={{ fontSize: "1.02rem", maxWidth: "60ch" }}>
          {t("module1.introPara")}
        </p>
        <ul style={{ display: "grid", gap: "var(--space-2)", marginTop: "var(--space-3)", maxWidth: "60ch" }}>
          <li className="muted">{t("module1.phase1")}</li>
          <li className="muted">{t("module1.phase2")}</li>
          <li className="muted">{t("module1.phase3")}</li>
          <li className="muted">{t("module1.phase4")}</li>
        </ul>
        <div style={{ marginTop: "var(--space-5)", display: "flex", justifyContent: "flex-start" }}>
          <Link to={`${BASE_PATH}/${firstLesson.id}`}>
            <Button variant="primary" size="lg">{t("module1.start")}</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function LessonRoute() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const id = lessonId ?? "lesson-1-fid";
  return <Module1Shell lessonId={id} />;
}

function Module1Shell({ lessonId }: { lessonId: string }) {
  const { t, tr } = useT();
  const lesson = getLesson(lessonId) ?? module1Lessons[0];
  const lessonExists = getLesson(lessonId) !== undefined;

  const [started, setStarted] = useState<Set<string>>(() => new Set());
  const [knowledgeOpen, setKnowledgeOpen] = useState(true);

  useEffect(() => {
    setKnowledgeOpen(true);
  }, [lessonId]);

  const completed = started.size;
  const currentIndex = module1Lessons.findIndex((l) => l.id === lesson.id);

  const knowledge = useMemo(() => getLessonKnowledge(lesson.id), [lesson.id]);
  const isAvailable = lesson.status === "available";
  const LessonComponent = isAvailable ? lessonComponents[lesson.id] : undefined;

  const handleStart = () => {
    setStarted((prev) => new Set(prev).add(lesson.id));
    setKnowledgeOpen(false);
  };

  return (
    <div style={{ display: "grid", gap: "var(--space-4)", minWidth: 0 }}>
      <LessonTabs lessons={module1Lessons} currentId={lesson.id} basePath={BASE_PATH} />

      <Card style={{ padding: "var(--space-3) var(--space-4)" }}>
        <ProgressRail
          total={module1Lessons.length}
          completed={completed}
          current={currentIndex}
          label={t("module1.progressLabel", { done: completed, total: module1Lessons.length })}
        />
      </Card>

      {knowledge && isAvailable && (
        <LessonKnowledgeModal open={knowledgeOpen} knowledge={knowledge} onStart={handleStart} />
      )}

      {!lessonExists ? (
        <LessonPlaceholder title={t("module1.lessonNotFound")} objective={t("module1.checkPath")} phase={t("notFound.title")} />
      ) : LessonComponent ? (
        <LessonComponent locked={knowledgeOpen} onReopenKnowledge={() => setKnowledgeOpen(true)} />
      ) : (
        <LessonPlaceholder
          title={tr(lesson.title)}
          objective={tr(lesson.objective)}
          phase={tr(phaseLabels[lesson.phase])}
        />
      )}
    </div>
  );
}
