// In-memory record of questions and answers. It is wiped whenever the server restarts.
export type QuestionRecord = {
  name: string;
  question: string;
  answer: string;
  askedAt: string;
};

const globalStore = globalThis as unknown as { officeHoursLog?: QuestionRecord[] };
const log = (globalStore.officeHoursLog ??= []);

export function saveQuestion(record: QuestionRecord) {
  log.push(record);
}
