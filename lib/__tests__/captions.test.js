import { describe, it, expect } from "vitest";
import { parseTranscript, captionAt, captionToWordCues, buildCaptionBurn } from "../captions";

describe("parseTranscript", () => {
  it("parses SRT with explicit start/end", () => {
    const srt = `1
00:00:00,000 --> 00:00:02,000
Hello there

2
00:00:02,000 --> 00:00:05,000
General Kenobi`;
    const { cues, error } = parseTranscript(srt, 5);
    expect(error).toBeNull();
    expect(cues.length).toBeGreaterThanOrEqual(2);
    expect(cues[0].start).toBe(0);
    expect(captionAt(cues, 0.5)).toMatch(/Hello/);
    expect(captionAt(cues, 3)).toMatch(/Kenobi/);
  });

  it("parses NoteGPT range blocks and clamps end to the next block's start", () => {
    const t = `00:00:00 - 00:01:15
First line of narration here.

00:00:38 - 00:01:54
Second part of the narration continues.`;
    const { cues } = parseTranscript(t, 120);
    expect(cues.length).toBeGreaterThan(0);
    // First block's cues must not run past the second block's start (38s).
    const firstBlock = cues.filter((c) => c.start < 38);
    for (const c of firstBlock) expect(c.end).toBeLessThanOrEqual(38 + 0.001);
  });

  it("parses inline (m:ss) markers, including several per line", () => {
    const t = `(0:00) There was one quiet morning in a small mountain village. (0:03) A young man sat by his window.
(0:09) An old farmer passed by. (0:13) I have so little, he said.`;
    const { cues, error } = parseTranscript(t, 20);
    expect(error).toBeNull();
    expect(cues.length).toBeGreaterThanOrEqual(4);
    expect(cues[0].start).toBe(0);
    expect(captionAt(cues, 4)).toMatch(/young man/);
    expect(captionAt(cues, 10)).toMatch(/farmer/);
    expect(captionAt(cues, 14)).toMatch(/so little/);
  });

  it("parses inline [mm:ss] lines", () => {
    const t = `[0:00] one two three
[0:04] four five six`;
    const { cues, error } = parseTranscript(t, 8);
    expect(error).toBeNull();
    expect(cues[0].start).toBe(0);
    expect(captionAt(cues, 5)).toMatch(/four/);
  });

  it("splits a long segment into multiple shorter cues", () => {
    const long = Array(40).fill("word").join(" ");
    const { cues } = parseTranscript(`[0:00] ${long}`, 20);
    expect(cues.length).toBeGreaterThan(1);
    // cues are ordered and non-overlapping
    for (let i = 1; i < cues.length; i++) {
      expect(cues[i].start).toBeGreaterThanOrEqual(cues[i - 1].start);
    }
  });

  it("reports an error when there are no timestamps", () => {
    const { cues, error } = parseTranscript("just some plain text with no times", 10);
    expect(cues.length).toBe(0);
    expect(error).toBeTruthy();
  });

  it("returns empty text when nothing is showing", () => {
    const { cues } = parseTranscript(`[0:05] later line`, 10);
    expect(captionAt(cues, 0)).toBe("");
  });
});

describe("captionToWordCues ([MOD] word-by-word captions)", () => {
  const cue = (start, end, text) => ({ start, end, text });

  it("makes one cue per word, back to back, covering the whole cue", () => {
    const out = captionToWordCues([cue(2, 6, "one two three four")], 1);
    expect(out.map((c) => c.text)).toEqual(["one", "two", "three", "four"]);
    expect(out[0].start).toBe(2);
    expect(out[out.length - 1].end).toBe(6);
    for (let i = 1; i < out.length; i++) expect(out[i].start).toBeCloseTo(out[i - 1].end, 9);
  });

  it("gives longer words more time than shorter ones", () => {
    const [a, b] = captionToWordCues([cue(0, 10, "hi extraordinary")], 1);
    expect(b.end - b.start).toBeGreaterThan(a.end - a.start);
  });

  it("keeps a word on screen a bit longer when punctuation follows it", () => {
    const [a, b] = captionToWordCues([cue(0, 10, "well. well")], 1);
    expect(a.end - a.start).toBeGreaterThan(b.end - b.start);
  });

  it("groups words when asked (2 and 3 at a time)", () => {
    const two = captionToWordCues([cue(0, 5, "a b c d e")], 2);
    expect(two.map((c) => c.text)).toEqual(["a b", "c d", "e"]);
    expect(two[two.length - 1].end).toBe(5);
    const three = captionToWordCues([cue(0, 6, "a b c d e f")], 3);
    expect(three.map((c) => c.text)).toEqual(["a b c", "d e f"]);
  });

  it("flattens the line breaks the normal captions add", () => {
    const out = captionToWordCues([cue(0, 4, "first line\nsecond line")], 1);
    expect(out.map((c) => c.text)).toEqual(["first", "line", "second", "line"]);
  });

  it("keeps a word-level transcript (one word per cue) exactly as it is", () => {
    const src = [cue(0.5, 0.9, "Hello"), cue(1.1, 1.6, "world")];
    expect(captionToWordCues(src, 1)).toEqual(src);
  });

  it("works with parseTranscript output and never overlaps", () => {
    const srt = `1\n00:00:00,000 --> 00:00:03,000\nThe quick brown fox\n\n2\n00:00:03,500 --> 00:00:06,000\njumps over the dog`;
    const { cues } = parseTranscript(srt, 6);
    const out = captionToWordCues(cues, 1);
    expect(out).toHaveLength(8);
    for (let i = 1; i < out.length; i++) expect(out[i].start).toBeGreaterThanOrEqual(out[i - 1].end - 1e-9);
    expect(captionAt(out, 1.0)).toMatch(/^\w+$/); // exactly one word at a time
    expect(captionAt(out, 3.2)).toBe("");          // nothing during the gap between cues
  });

  it("handles empty / invalid input", () => {
    expect(captionToWordCues(null, 1)).toEqual([]);
    expect(captionToWordCues([], 1)).toEqual([]);
    expect(captionToWordCues([cue(0, 1, "   ")], 1)).toEqual([]);
    expect(captionToWordCues([cue(0, 2, "a b")], 0)).toHaveLength(2); // bad group size -> 1
  });
});

describe("caption burn timing ([MOD] end-exclusive)", () => {
  it("never shows two back-to-back cues in the same frame", () => {
    const words = captionToWordCues([{ start: 0, end: 3, text: "one two three" }], 1);
    const { filter } = buildCaptionBurn(words, "classic", 1280, 720, "md", 0, null, "none");
    // start is included, end is excluded (same rule as captionCueAt in the preview)
    expect(filter).not.toMatch(/between\(t/);
    expect(filter).toMatch(/enable=gte\(t\\?,[\d.]+\)\*lt\(t\\?,[\d.]+\)/);
    expect(filter.match(/drawtext=/g)).toHaveLength(3);
  });
});
