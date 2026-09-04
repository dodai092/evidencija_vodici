// Reusable docx-js building blocks for operational guides.
// Copy this file into your build script's directory and `require("./docx-helpers")`.
// Built from three real internal guides (extension usage guide, monthly reporting
// process, an AI-prompt-driven correction workflow) — the goal is a clean,
// scannable "clean & functional" style: restrained color, clear hierarchy,
// no decorative flourishes. Override ACCENT/ORG_NAME per project as needed.

const {
  Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
  Table, TableRow, TableCell, WidthType, ShadingType,
  ExternalHyperlink, TableOfContents, PageBreak, Header, Footer,
  NumberingType, LevelFormat, convertInchesToTwip,
} = require("docx");

// Override these three per project if you want a different palette —
// keep it restrained. This is a reference/operational doc, not a pitch deck.
let ACCENT = "1F3B57"; // dark navy
let MUTED = "666666";
let RULE = "CCCCCC";

function setTheme({ accent, muted, rule } = {}) {
  if (accent) ACCENT = accent;
  if (muted) MUTED = muted;
  if (rule) RULE = rule;
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 4 } },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 32 })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 26 })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22 })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 21, ...opts })],
  });
}

// A quiet side-bordered aside — for context/behavior notes that support
// the main instructions but aren't a numbered step themselves.
function note(text) {
  return new Paragraph({
    spacing: { after: 160 },
    indent: { left: 260 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: RULE, space: 8 } },
    children: [new TextRun({ text, size: 20, italics: true, color: MUTED })],
  });
}

// Use for anything you genuinely don't know and shouldn't guess — a missing
// URL, an unconfirmed credential, a step you couldn't verify against the
// actual code/UI. Loud on purpose: it should be impossible to ship silently.
function todo(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: "[TO CONFIRM] " + text, bold: true, size: 21, color: "B33A3A" })],
  });
}

function link(text, url) {
  return new ExternalHyperlink({
    link: url,
    children: [new TextRun({ text, style: "Hyperlink", size: 21 })],
  });
}

function labeledLine(label, valueRuns) {
  const runs = [new TextRun({ text: label + ": ", bold: true, size: 21 })];
  return new Paragraph({ spacing: { after: 60 }, children: runs.concat(valueRuns) });
}

function numberedStep(n, text) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 260, hanging: 260 },
    children: [new TextRun({ text: `${n}.  `, bold: true, size: 21 }), new TextRun({ text, size: 21 })],
  });
}

// Plain bullet (not a checklist item) — for reference lists, "see also", etc.
function bullet(text) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 260, hanging: 260 },
    children: [new TextRun({ text: "•  " + text, size: 21 })],
  });
}

function check(text) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 260 },
    children: [new TextRun({ text: "☐  " + text, size: 21 })],
  });
}

function subcheck(text) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 520 },
    children: [new TextRun({ text: "☐  " + text, size: 20 })],
  });
}

// Shaded, bordered monospace block. Use for prompts (inlined verbatim, never
// paraphrased — see SKILL.md on why), formulas, code, or terminal commands.
// `size` is in half-points (16 = 8pt) — drop it for long prompt text so more
// fits per line without wrapping awkwardly.
function codeBlock(text, { size = 16, font = "Courier New" } = {}) {
  return new Paragraph({
    spacing: { after: 160 },
    shading: { type: ShadingType.CLEAR, fill: "F2F2F2" },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      left: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      right: { style: BorderStyle.SINGLE, size: 4, color: RULE },
    },
    children: text.split("\n").map((line, i) => new TextRun({ text: line, font, size, break: i > 0 ? 1 : 0 })),
  });
}

function titlePage(orgName, title, subtitle, meta) {
  return [
    new Paragraph({ spacing: { before: 2000 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: orgName, bold: true, size: 24, color: MUTED, allCaps: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 160 },
      children: [new TextRun({ text: title, bold: true, size: 56, color: ACCENT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: subtitle, size: 26, color: MUTED, italics: true })],
    }),
    ...meta.map(
      (m) =>
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: m, size: 20, color: MUTED })],
        })
    ),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// Word renders this as a real TOC field, but it shows up EMPTY until the
// reader updates the field (Word does this automatically on open in most
// configs; otherwise right-click -> Update Field, or F9). Don't treat an
// empty TOC in a LibreOffice-rendered preview as a bug — verify in Word,
// or skip the TOC entirely for short (under ~4 page) documents where it
// doesn't earn its place.
function tocPage(contentsLabel) {
  return [
    h1(contentsLabel),
    new TableOfContents(contentsLabel, { hyperlink: true, headingStyleRange: "1-3" }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// Two-column reference table (label / value). `v` can be a string or an
// array of Paragraph objects (e.g. when the value is a hyperlink).
function twoColTable(rows, widths = [3000, 6800]) {
  return new Table({
    width: { size: widths[0] + widths[1], type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map(
      ([k, v]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: widths[0], type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, fill: "F2F2F2" },
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 20 })] })],
            }),
            new TableCell({
              width: { size: widths[1], type: WidthType.DXA },
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              children: Array.isArray(v) ? v : [new Paragraph({ children: [new TextRun({ text: v, size: 20 })] })],
            }),
          ],
        })
    ),
  });
}

module.exports = {
  get ACCENT() { return ACCENT; }, get MUTED() { return MUTED; }, get RULE() { return RULE; },
  setTheme,
  h1, h2, h3, body, note, todo, link, labeledLine, numberedStep, bullet, check, subcheck, codeBlock,
  titlePage, tocPage, twoColTable,
  Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
  Table, TableRow, TableCell, WidthType, ShadingType,
  ExternalHyperlink, PageBreak, Header, Footer,
  NumberingType, LevelFormat, convertInchesToTwip,
};
