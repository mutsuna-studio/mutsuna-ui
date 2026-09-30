import { projects as sourceProjects, type ProjectRow } from '../data-table-fixtures.js';

export type Range = { from: string; to: string; min?: number; max?: number };
export type Conditions = { query: string; statuses: string[]; owners: string[]; range: Range };
export const emptyRange = (): Range => ({ from: '', to: '' });
export const emptyConditions = (): Conditions => ({ query: '', statuses: [], owners: [], range: emptyRange() });
export const statusOptions = ['未着手', '進行中', 'レビュー待ち', '承認待ち', '保留', '完了', '中止'];
const otherStatuses = ['未着手', '進行中', '承認待ち', '保留', '完了', '中止'];
let statusIndex = 0;
export const projects = sourceProjects.map(row => ({ ...row, status: row.status === 'レビュー待ち' ? row.status : otherStatuses[statusIndex++] }));
export const ownerOptions = [...new Set(projects.map(row => row.owner))];
export const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase('ja').trim();
export const matchesQuery = (row: ProjectRow, query: string) => normalize(query).split(/\s+/).filter(Boolean)
  .every(term => normalize(`${row.id} ${row.project} ${row.owner}`).includes(term));
export function matchesDate(row: ProjectRow, range: Range) {
  const date = row.updatedAt.slice(0, 10).replaceAll('/', '-');
  return (!range.from || date >= range.from) && (!range.to || date <= range.to);
}
export const matchesAmount = (row: ProjectRow, range: Range) =>
  (range.min === undefined || row.totalAmount >= range.min) && (range.max === undefined || row.totalAmount <= range.max);
export const includesSelected = (value: string, selected: string[]) => !selected.length || selected.includes(value);
// 編集中の件数もData Tableと同じ条件で算出する。
export const countMatches = (conditions: Conditions) => projects.filter(row =>
  matchesQuery(row, conditions.query) && includesSelected(row.status, conditions.statuses) &&
  includesSelected(row.owner, conditions.owners) && matchesDate(row, conditions.range) && matchesAmount(row, conditions.range)
).length;
