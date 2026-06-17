# Simple User Story Template Skill

## Purpose
This skill provides instructions for formatting requirements as user stories using the Simple User Story Template format, suitable for importing into project management tools or maintaining as documentation.

## When to Use
- When creating or documenting requirements for a feature
- When the user requests user stories in template format
- When preparing requirements for stakeholder review or handoff
- When integrating with project management tools that use this format

## Template Structure

Each user story should follow this table format:

| Field | Content |
|-------|---------|
| **TITLE** | [Short, descriptive title for the user story] |
| **USER STORY** | As a [type of user], I want [an action or feature], so that [a benefit or value]. |
| **ACCEPTANCE CRITERIA** | [Numbered list of concise conditions that must be met, using EARS pattern when applicable]<br>1. [Criterion 1]<br>2. [Criterion 2]<br>3. [Criterion 3]<br>... |
| **PRIORITY** | [HIGH / MEDIUM / LOW] |
| **ESTIMATION** | [Story points or hours] |
| **DESCRIPTION** | [Additional details including background information, dependencies, technical context, implementation notes] |

## Guidelines

### Title
- Keep titles short and descriptive (under 60 characters)
- Use action-oriented language (e.g., "View Own Profile", "Edit User Details")
- Make it clear what the story accomplishes

### User Story
- Follow the standard format: "As a [role], I want [action], so that [benefit]"
- Be specific about the user role (e.g., "authenticated user", "administrator", "developer")
- State the desired action clearly
- Articulate the value or benefit to the user

### Acceptance Criteria
- Write 3-8 specific, testable conditions
- Use EARS pattern (Easy Approach to Requirements Syntax) when applicable:
  - **WHEN** [trigger] **THE** [system] **SHALL** [action]
  - **IF** [condition] **THEN THE** [system] **SHALL** [action]
  - **WHERE** [context] **THE** [system] **SHALL** [action]
  - **WHILE** [state] **THE** [system] **SHALL** [action]
  - **THE** [system] **SHALL** [action] (ubiquitous requirement)
- Include edge cases and error handling
- Specify validation rules, field constraints, and data requirements
- Separate multiple criteria with line breaks using `<br>` in markdown tables

### Priority
- **HIGH**: Critical feature, blocking other work, or core functionality
- **MEDIUM**: Important but not blocking, can be scheduled flexibly
- **LOW**: Nice-to-have, can be deferred

### Estimation
- Use story points (Fibonacci: 1, 2, 3, 5, 8, 13, 21) or hours
- Consider complexity, uncertainty, and effort
- Reference similar completed stories for calibration
- Typical ranges:
  - 1-3 points: Small, straightforward changes
  - 5-8 points: Medium complexity, multiple components
  - 13+ points: Large, complex, consider splitting

### Description
- Provide context and background
- List technical dependencies (APIs, components, libraries)
- Mention related features or stories
- Note any constraints or special considerations
- Include links to design docs, wireframes, or related resources

## Document Structure

When creating a complete user story document:

1. **Header**: Title with feature name
2. **Individual Stories**: One table per story, separated by horizontal rules
3. **Summary Section**: Include total estimation, feature priority, and consolidated dependencies

## Example Usage

```markdown
# Simple User Story Template

**User Story for:** [Feature Name]

---

## Story 1: [Story Title]

| Field | Content |
|-------|---------|
| **TITLE** | [Title] |
| **USER STORY** | As a [role], I want [action], so that [benefit]. |
| **ACCEPTANCE CRITERIA** | 1. [Criterion 1]<br>2. [Criterion 2]<br>3. [Criterion 3] |
| **PRIORITY** | HIGH |
| **ESTIMATION** | 5 story points |
| **DESCRIPTION** | [Details and context] |

---

## Story 2: [Story Title]

[Repeat table structure]

---

**Total Estimation:** [Sum] story points

**Feature Priority:** [HIGH/MEDIUM/LOW]

**Dependencies:**
- [Dependency 1]
- [Dependency 2]
```

## Integration with Spec Workflow

When working with the spec workflow:

1. **Requirements Phase**: Extract user stories from requirements.md and format them using this template
2. **Map Requirements to Stories**: Typically one requirement becomes one user story
3. **Preserve Acceptance Criteria**: Convert EARS-formatted acceptance criteria directly
4. **Add Estimation**: Provide story point estimates based on requirement complexity
5. **Extract Dependencies**: Pull from requirements.md glossary and introduction sections

## Quality Checklist

Before finalizing user stories in this format:

- [ ] Each story has a clear, testable "As a/I want/so that" structure
- [ ] Acceptance criteria are specific and measurable
- [ ] All edge cases and error scenarios are covered
- [ ] Dependencies are clearly listed
- [ ] Estimation reflects complexity and effort
- [ ] Priority aligns with business value and urgency
- [ ] Description provides sufficient context for implementation
- [ ] Technical constraints and implementation notes are documented

## Notes

- This format is based on the widely-used Simple User Story Template
- The format is compatible with tools like Smartsheet, Jira, Azure DevOps, and others
- When exporting to spreadsheet tools, each field becomes a column
- The `<br>` tag in acceptance criteria allows multiple criteria in a single table cell while maintaining readability
