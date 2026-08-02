export type BookingRow = {
  id: string;
  customer: string;
  offering: string;
  date: string;
  total: string;
  totalAmount: number;
  status: string;
};

export const bookings: BookingRow[] = [
  ["R-1049", "佐藤 健", "コワーキング 1日利用", "2026/06/24 09:30", "2,800円", 2800, "確定"],
  ["R-1042", "青山 美咲", "会議室利用プラン", "2026/06/25 10:00", "6,000円", 6000, "確定"],
  ["R-1041", "田中 直人", "個室ブース 60分", "2026/06/25 13:30", "3,500円", 3500, "承認待ち"],
  ["R-1048", "鈴木 悠", "商談スペース 90分", "2026/06/25 15:00", "4,200円", 4200, "確定"],
  ["R-1047", "高橋 葵", "個室ブース 120分", "2026/06/25 16:30", "5,400円", 5400, "承認待ち"],
  ["R-1046", "伊藤 蓮", "イベントスペース 下見", "2026/06/25 18:00", "7,500円", 7500, "確定"],
  ["R-1045", "渡辺 陽菜", "会議室利用プラン", "2026/06/26 11:00", "8,800円", 8800, "承認待ち"],
  ["R-1044", "小林 颯太", "月額メンバー", "2026/06/26 14:00", "10,000円", 10000, "確定"],
  ["R-1040", "山本 彩", "月額メンバー", "2026/06/26 09:00", "12,000円", 12000, "確定"],
  ["R-1043", "中村 翔", "イベントスペース 半日", "2026/06/27 13:00", "18,000円", 18000, "承認待ち"],
].map(([id, customer, offering, date, total, totalAmount, status]) => ({
  id: String(id),
  customer: String(customer),
  offering: String(offering),
  date: String(date),
  total: String(total),
  totalAmount: Number(totalAmount),
  status: String(status),
}));
