import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useT } from "../../i18n/useT";

/**
 * MlUnavailableModal — thông báo Module 3/4 chưa chạy được trên máy chủ này.
 *
 * Lý do là giới hạn phần cứng (máy chủ không đủ RAM/CPU để chạy mô hình học
 * sâu). Giao diện và nội dung lý thuyết vẫn xem được bình thường — chỉ phần
 * chạy mô hình bị khoá.
 */
export function MlUnavailableModal({
  open,
  onClose,
  moduleLabel,
}: {
  open: boolean;
  onClose: () => void;
  moduleLabel: string;
}) {
  const { t } = useT();

  return (
    <Modal open={open} onClose={onClose} labelledBy="ml-unavailable-title">
      <p className="eyebrow" style={{ margin: 0 }}>{t("ml.disabled.eyebrow")}</p>
      <h2 id="ml-unavailable-title" style={{ fontSize: "1.3rem", marginTop: "var(--space-2)" }}>
        {t("ml.disabled.title", { module: moduleLabel })}
      </h2>
      <p className="muted" style={{ marginTop: "var(--space-3)" }}>
        {t("ml.disabled.body")}
      </p>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        {t("ml.disabled.stillAvailable")}
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-4)" }}>
        <Button variant="secondary" size="md" onClick={onClose}>
          {t("common.close")}
        </Button>
      </div>
    </Modal>
  );
}
