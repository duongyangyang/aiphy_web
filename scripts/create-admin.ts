/**
 * create-admin — tạo tài khoản quản trị đầu tiên từ dòng lệnh.
 *
 * Vì hệ thống không gửi email, không có cách nào "quên mật khẩu" tự phục hồi;
 * tài khoản admin đầu tiên phải được tạo từ máy chủ.
 *
 * Cách dùng:
 *   npm run admin:create -- --email ban@example.com --name "Tên bạn"
 *   npm run admin:create -- --email ban@example.com --name "Tên bạn" --password matkhau123
 *
 * Nếu không truyền --password, một mật khẩu ngẫu nhiên được sinh và in ra
 * MỘT LẦN. Hãy lưu lại ngay.
 */
import { randomBytes } from "node:crypto";
import { findUserByEmail, hashPassword, insertUser } from "../server/auth";
import { DB_PATH } from "../server/db";

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function randomPassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(16);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function main(): Promise<void> {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim();
  const providedPassword = arg("password");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Thiếu hoặc sai --email. Ví dụ:");
    console.error('  npm run admin:create -- --email ban@example.com --name "Tên bạn"');
    process.exit(1);
  }
  if (!name || name.length < 2) {
    console.error("Thiếu --name (ít nhất 2 ký tự).");
    process.exit(1);
  }
  if (providedPassword !== undefined && providedPassword.length < 8) {
    console.error("--password phải có ít nhất 8 ký tự.");
    process.exit(1);
  }

  const existing = findUserByEmail(email);
  if (existing) {
    console.error(`Email ${email} đã tồn tại (vai trò hiện tại: ${existing.role}).`);
    console.error("Để cấp quyền admin cho tài khoản này, dùng dashboard hoặc sqlite3 trực tiếp.");
    process.exit(1);
  }

  const password = providedPassword ?? randomPassword();
  const passwordHash = await hashPassword(password);

  insertUser({ email, name, passwordHash, role: "admin" });

  console.log("");
  console.log("  ✓ Đã tạo tài khoản quản trị");
  console.log(`    Database : ${DB_PATH}`);
  console.log(`    Email    : ${email}`);
  console.log(`    Tên      : ${name}`);
  if (!providedPassword) {
    console.log(`    Mật khẩu : ${password}`);
    console.log("");
    console.log("  ⚠ Mật khẩu này chỉ hiển thị MỘT LẦN. Hãy lưu lại ngay.");
  }
  console.log("");
}

main().catch((err) => {
  console.error("Lỗi:", err instanceof Error ? err.message : err);
  process.exit(1);
});
