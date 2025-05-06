export type RawEvent = {
  event: string;
  tags: string[];
  url: string;
  title: string;
  ts: number; // seconds since Unix epoch
};
