// Deterministic synthetic record generator. Same index => same record.
import Avtar from "../assets/test-user.svg";
const firstNames = [
  "Aarav","Vivaan","Aditya","Vihaan","Arjun","Karan","Rohan","Ananya","Saanvi","Ishaan",
  "Priya","Sneha","Arjun","Maya","Ravi","Kavya","Dev","Nisha","Rehan","Sara"
];
const lastNames = [
  "Shah","Verma","Singh","Kumar","Gupta","Agarwal","Patel","Jain","Mehta","Nair",
  "Reddy","Bose","Das","Chopra","Malhotra","Saxena","Trivedi","Khan","Ali","Roy"
];
function pick(array, idx) {
  return array[idx % array.length];
}

function genPhone(idx) {
  // Indian-like 10-digit
  const base = 9000000000 + (idx % 1000000000);
  return String(base).slice(0, 10);
}

function genEmail(name, idx) {
  return `${name.toLowerCase().replace(/\s+/g, ".")}${idx % 1000}@example.com`;
}

// Create one record for index `idx`.
export function generateRecord(idx) {
  const fn = pick(firstNames, idx);
  // different stride for last names to mix combinations
  const ln = pick(lastNames, Math.floor(idx / firstNames.length));
  const name = `${fn} ${ln}`;
  const email = genEmail(`${fn}.${ln}`, idx);
  const phone = genPhone(idx);
  const score = (idx * 37) % 101; // 0-100 deterministic
  const lastMessageAt = new Date(2024, 0, 1 + (idx % 365)).toISOString();
  const addedBy = pick(["admin", "system", "sales1", "sales2"], idx);
  const avatar = Avtar;
  return {
    id: idx + 1,
    name,
    email,
    phone,
    score,
    lastMessageAt,
    addedBy,
    avatar
  };
}
// Generate a page of size -"pageSize" at pageIndex (0-based)
export function generatePage(pageIndex, pageSize) {
  const start = pageIndex * pageSize;
  const arr = new Array(pageSize);
  for (let i = 0; i < pageSize; i++) {
    arr[i] = generateRecord(start + i);
  }
  return arr;
}

// Synthetic total number of records (used for pagination)
export const TOTAL_RECORDS = 1_000_000;
