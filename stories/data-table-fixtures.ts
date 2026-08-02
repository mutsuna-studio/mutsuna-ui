export type ProjectRow = {
  id: string;
  project: string;
  owner: string;
  updatedAt: string;
  total: string;
  totalAmount: number;
  status: string;
};

export const projects: ProjectRow[] = [
  ["PRJ-1049", "Webサイトリニューアル", "佐藤 健", "2026/06/24 09:30", "2,800円", 2800, "進行中"],
  ["PRJ-1042", "モバイルアプリ改善", "青山 美咲", "2026/06/25 10:00", "6,000円", 6000, "進行中"],
  ["PRJ-1041", "オンボーディング改善", "田中 直人", "2026/06/25 13:30", "3,500円", 3500, "レビュー待ち"],
  ["PRJ-1048", "デザインシステム整備", "鈴木 悠", "2026/06/25 15:00", "4,200円", 4200, "進行中"],
  ["PRJ-1047", "通知設定の見直し", "高橋 葵", "2026/06/25 16:30", "5,400円", 5400, "レビュー待ち"],
  ["PRJ-1046", "イベントLP制作", "伊藤 蓮", "2026/06/25 18:00", "7,500円", 7500, "進行中"],
  ["PRJ-1045", "アクセシビリティ監査", "渡辺 陽菜", "2026/06/26 11:00", "8,800円", 8800, "レビュー待ち"],
  ["PRJ-1044", "分析ダッシュボード", "小林 颯太", "2026/06/26 14:00", "10,000円", 10000, "進行中"],
  ["PRJ-1040", "コンテンツ移行", "山本 彩", "2026/06/26 09:00", "12,000円", 12000, "進行中"],
  ["PRJ-1043", "パフォーマンス改善", "中村 翔", "2026/06/27 13:00", "18,000円", 18000, "レビュー待ち"],
].map(([id, project, owner, updatedAt, total, totalAmount, status]) => ({
  id: String(id),
  project: String(project),
  owner: String(owner),
  updatedAt: String(updatedAt),
  total: String(total),
  totalAmount: Number(totalAmount),
  status: String(status),
}));
