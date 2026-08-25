/**
 * siteInfo — thông tin cơ bản của website.
 *
 * File này là chỗ người dùng tự điền nội dung sau (theo `overall-design.md`,
 * phần "Các thông tin cơ bản"). Shape đơn giản để sau này có thể chuyển sang
 * JSON / CMS / API mà không phải sửa component.
 *
 * Các trường nội dung là `LocalizedString` ({vi,en,zh}); `email` là chuỗi cố
 * định (không cần dịch). Tên thương hiệu (磁影智析 / Ciying Zhixi) và tên đội
 * (智影寰宇 / Zhiying Huanyu) là tên riêng: ở bản zh giữ nguyên chữ Hán, ở bản
 * vi/en dùng dạng Latinh (pinyin, không dấu) — không trộn chữ Hán vào văn
 * xuôi tiếng Việt/tiếng Anh. Tham chiếu `module1-thiet-ke.md`/`overall-design.md`.
 */
import type { LocalizedString } from "../i18n/types";

export interface SiteInfo {
  name: LocalizedString;
  tagline: LocalizedString;
  heroHeadline: LocalizedString;
  heroSubcopy: LocalizedString;
  researchGroup: {
    name: LocalizedString;
    blurb: LocalizedString;
    blurbShort: LocalizedString;
  };
  contact: {
    email: string;
    affiliation: LocalizedString;
  };
}

export const siteInfo: SiteInfo = {
  name: {
    vi: "Ciying Zhixi",
    en: "Ciying Zhixi",
    zh: "磁影智析",
  },
  tagline: {
    vi: "Học MRI qua thí nghiệm số",
    en: "Learn MRI through digital experiments",
    zh: "通过数字实验学习 MRI",
  },
  heroHeadline: {
    vi: "Giúp học sinh/sinh viên tiếp cận thí nghiệm MRI qua nền tảng số",
    en: "Helping students reach MRI experiments through a digital platform",
    zh: "帮助学生通过数字平台接触 MRI 实验",
  },
  heroSubcopy: {
    vi: "Ciying Zhixi biến quy trình vận hành máy MRI thành các bài học tương tác chạy ngay trên trình duyệt — kéo tham số, nhìn tín hiệu, hiểu vật lý.",
    en: "Ciying Zhixi turns operating an MRI scanner into interactive lessons that run right in the browser — drag parameters, watch the signal, understand the physics.",
    zh: "磁影智析 将操作 MRI 扫描仪的流程变成可直接在浏览器中运行的互动课程——拖动参数、观察信号、理解物理。",
  },
  researchGroup: {
    name: {
      vi: "Zhiying Huanyu",
      en: "Zhiying Huanyu",
      zh: "智影寰宇",
    },
    blurb: {
      vi: "Zhiying Huanyu quy tụ bốn con người đến từ bốn quốc gia, bốn múi giờ, bốn lăng kính — mỗi người giữ một lĩnh vực, một chuyên ngành riêng: Trí tuệ nhân tạo, Kỹ thuật Xây dựng, Kỹ thuật Điện, và Khoa học dữ liệu & Dữ liệu lớn. Chúng tôi không gặp nhau vì giống nhau, mà vì cùng tin rằng thứ phức tạp nhất của vật lý chỉ trở nên giản dị khi được kể bằng đúng ngôn ngữ. Bốn cái đầu tản mác khắp địa cầu, bốn tiếng mẹ đẻ trùng điệp, nhưng cùng hướng về một điểm duy nhất: đưa MRI ra khỏi phòng máy lạnh lẽo, để bất kỳ giảng đường nào cũng nhìn thấy được tín hiệu cộng hưởng.",
      en: "Zhiying Huanyu gathers four people from four countries, four time zones, four lenses — each holding a different field, a different discipline: Artificial Intelligence, Civil Engineering, Electrical Engineering, and Data Science & Big Data. We did not meet because we are alike, but because we share a belief: that physics grows simplest only when told in the right language. Four minds scattered across the globe, four mother tongues overlapping, yet aimed at a single point — to lift MRI out of the cold scanner room so that any classroom can see the resonance signal.",
      zh: "智影寰宇 汇聚四人，来自四个国度、四个时区、四种视角——各执一门领域、一项专长：人工智能、土木工程、电气工程、数据科学与大数据技术。我们并非因相似而相遇，而是因同信一事——物理之至繁，唯有以恰切的语言道来，方得至简。四颗头脑散落天涯，四种母语彼此交叠，却共同朝向唯一一点：让 MRI 走出冷寂的扫描室，让任何一间课堂都能看见共振之信号。",
    },
    blurbShort: {
      vi: "Bốn người, bốn nước, bốn chuyên ngành — mang MRI đến lớp học.",
      en: "Four people, four nations, four fields — MRI for all classrooms.",
      zh: "四人，四国，四专业——把 MRI 带进每间课堂。",
    },
  },
  contact: {
    email: "lienhe@aiphys.example",
    affiliation: {
      vi: "Đơn vị công tác — cập nhật sau",
      en: "Affiliation — to be updated",
      zh: "所属单位 — 待更新",
    },
  },
};
