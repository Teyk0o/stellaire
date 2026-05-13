<div align="center">
  <img src="public/icon.png" alt="Stellaire" width="80" height="80">
  <h1>Stellaire</h1>
  <p><strong>Self-hosted interactive course framework for math and physics</strong></p>
  <p>
    <a href="#features">Features</a> &middot;
    <a href="#getting-started">Getting Started</a> &middot;
    <a href="#writing-courses">Writing Courses</a> &middot;
    <a href="#architecture">Architecture</a>
  </p>
</div>

---

Stellaire is an open-source, self-hosted web application for studying mathematics and physics through interactive courses written in Markdown. It renders custom directive syntax into exercises, visualizations, and callouts, tracks progress per user, and generates verifiable competency reports.

Built with Next.js 16, TypeScript, Tailwind CSS, KaTeX, D3.js, and Recharts.

## Features

### Interactive Course Rendering

Courses are plain Markdown files with YAML frontmatter. The rendering pipeline parses custom `:::directive` syntax into React components through a remark plugin, with full KaTeX support for mathematical notation.

**14 interactive components** are available out of the box:

| Component | Directive | Description |
|-----------|-----------|-------------|
| Multiple Choice | `:::qcm` | Single-answer quiz with immediate feedback |
| Multiple Select | `:::qcm-multi` | Multi-answer quiz with validation |
| Numeric Input | `:::numeric` | Free-form numeric answer with tolerance |
| True / False | `:::true-false` | Binary choice with feedback |
| Fill in the Blanks | `:::fill-blanks` | Inline input fields within formulas |
| Ordering | `:::order` | Drag-and-reorder exercise |
| Spoiler | `:::spoiler` | Collapsible content reveal |
| Callouts | `:::info` `:::tip` `:::attention` `:::spatial` | Styled information blocks |
| Recap Card | `:::recap` | Collapsible summary card |
| Function Graph | `:::graph` | Interactive Recharts plot |
| Unit Circle | `:::unit-circle` | Interactive trigonometric circle (D3) |
| Vector Decomposition | `:::vector` | Interactive vector component visualization (D3) |
| Projectile Motion | `:::projectile` | Trajectory simulation with adjustable parameters (D3) |
| Orbit Simulation | `:::orbit` | Animated Keplerian orbit with adjustable eccentricity (D3) |

### Spaced Repetition

Completed courses are automatically scheduled for review using a modified SM-2 algorithm. The system tracks per-exercise difficulty and prioritizes weak areas during revision sessions.

- Intervals: J+1, J+3, J+7, J+14, J+30
- Failed reviews reset to J+1
- Revision quizzes pull 5 questions, 80% pass threshold
- Per-exercise ease factor adapts to individual performance

### Quick Sessions and Exams

- **Quick Session**: 10 mixed questions across all active courses, prioritized by SM-2 urgency. Designed for 5-minute phone sessions.
- **Mock Exam**: 20 timed questions with no feedback during the exam. Results include per-question timing breakdown.

### Multi-Profile Support

Multiple users can share the same instance. Each profile has isolated progress data, revision schedules, and exam history. Profile selection uses DiceBear avatars with customizable styles and colors.

### Competency Reports

Server-generated reports with SHA-256 integrity verification. Reports include:

- Personal identification (name, email, date of birth, address)
- Completion statistics and mastery rates per subject
- Activity timeline chart
- Mock exam history with scores and duration
- Hardest exercises mastered (by attempt count)
- QR code linking to a live verification page
- Print-optimized layout with repeating header and footer

The verification page confirms whether the report data has been modified since generation. The source code is public and auditable.

### PWA

Installable on iOS and Android. Service worker caches course pages for offline access. Safe-area insets for notched devices.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Installation

```bash
git clone https://github.com/Teyk0o/stellaire.git
cd stellaire
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Create a profile to get started.

### Production

```bash
pnpm build
pnpm start
```

Course pages are statically generated at build time. API routes for progress tracking run server-side.

### Adding Content

Create Markdown files in the `content/` directory:

```
content/
  phase-1/
    math/
      01-operations.md
      02-fractions.md
    physics/
      01-units.md
  phase-2/
    ...
```

The `content/` directory is gitignored. Courses are not included in this repository.

## Writing Courses

Each course file requires YAML frontmatter:

```yaml
---
title: "Order of Operations"
phase: 1
subject: math        # math | physics | chemistry
order: 1
tags: [arithmetic]
prerequisites: []    # slugs of prerequisite courses
---
```

### Directive Syntax

Directives use the `:::name{attributes}` syntax from [remark-directive](https://github.com/remarkjs/remark-directive).

**Quiz (single answer):**

```markdown
:::qcm{correct=2}
What is $\sqrt{144}$?
- [ ] $14$
- [ ] $11$
- [ ] $12$
- [ ] $13$
:::
```

**Numeric input:**

```markdown
:::numeric{answer=3.14 tolerance=0.01}
Approximate $\pi$ to two decimal places.
:::
```

**Function graph:**

```markdown
:::graph{fn="sin(x)" range="[-6.28,6.28]"}
:::
```

**Orbit simulation:**

```markdown
:::orbit{a="150" e="0.4"}
:::
```

See the full directive reference in [CLAUDE.md](CLAUDE.md).

## Architecture

```
src/
  app/
    (app)/              Pages with sidebar (courses, revision, reports)
    (auth)/             Pages without sidebar (profile selection)
    api/                REST API routes (progress, revision, profiles, reports)
  components/
    directives/         Interactive markdown components
    layout/             Sidebar, content shell
    revision/           Quiz components (RevisionQuiz, MixedQuiz)
    rapport/            Report components (timeline, QR code, actions)
  lib/
    markdown/           Remark plugin + component map
    courses.ts          Filesystem course reader with Zod validation
    progress.ts         Per-profile JSON storage with atomic writes
    revision.ts         SM-2 spaced repetition algorithm
    exercises.ts        Exercise extraction from markdown AST
    report.ts           Report generation with SHA-256 hashing
  proxy.ts              Route guard (redirects to /profils if no active profile)
```

### Data Storage

All data is stored as JSON files on disk. No database required.

```
data/
  profiles.json                     Profile index
  profiles/
    p-abc123.json                   Per-profile progress, exams, reports
```

Progress writes are atomic (temp file + rename) to prevent corruption from concurrent access.

### Markdown Pipeline

```
.md file
  -> gray-matter (frontmatter extraction + Zod validation)
  -> MDXRemote
       remarkPlugins: [remarkDirective, remarkDirectiveToMdx, remarkMath]
       rehypePlugins: [rehypeKatex]
       components: { Spoiler, QCM, NumericInput, ... }
```

The custom `remarkDirectiveToMdx` plugin transforms directive AST nodes into `mdxJsxFlowElement` nodes at the remark level, before rehype processing. This ensures directive children (including LaTeX) pass through the full pipeline. QCM options are extracted as raw text and serialized as JSON props; the component renders LaTeX client-side via `katex.renderToString()`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Math rendering | KaTeX (server + client) |
| Markdown | remark + rehype + next-mdx-remote |
| Charts | Recharts |
| Visualizations | D3.js |
| Icons | lucide-react |
| Avatars | DiceBear API |
| QR codes | qrcode.react |
| Validation | Zod |

## License

MIT
