/**
 * run-phantom — điểm chạy terminal cho module MRI Simulator (bước 1).
 * Chạy: `npm run sim:phantom`
 *
 * File này chỉ import + gọi testPhantom(); không được import vào app,
 * nên không tăng bundle production.
 */
import { testPhantom } from "./phantom";

testPhantom(128);
