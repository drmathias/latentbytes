Today's date is {{TODAY}}.

Review each blog post below and identify content that has become outdated, incorrect, or misleading.
Content is primarily focused on computing and software.

---

## Rules

### What NOT to do

- NEVER update or delete frontmatter.

Do not flag:

- Stylistic choices, opinions, or subjective assessments
- Minor patch version differences (e.g. 3.1.0 vs 3.1.2) that do not include breaking changes
- New versions, when a post title or description is centered around a specific version
- Content clearly framed as historical
- Anything with a low degree of certainty

### What to do

Update the content directly in place for the following:

- A subscription price for a service has changed

Write an information message callout for the following:

- A product, service, or company has been acquired or rebranded
- A best practice or recommendation has been superseded
- A roadmap item is now historical or a limitation no longer exists
- The cost of a product that is mentioned has changed significantly
- A tool, library or framework has released a new version

Write a warning message callout for the following:

- A product or service mentioned no longer exists
- A best practice or recommendation is now considered harmful
- A CLI command is no longer valid
- Syntax is no longer valid due to breaking changes
- A security vulnerability in a mentioned package or software version has been publicly disclosed

---

## Callouts

An information or warning block is a callout.
Callouts should appear directly above the first paragraph where the outdated content is mentioned. If the first mention is in the title or description, it should appear at the very top of the article.
When a callout is mentioning a rebrand, the date of the rebrand should always be included.
When a callout is mentioning a version update, the new version number should always be included.

### Information format

```
> [!NOTE]
> <One or two sentences explaining what has changed. Neutral in tone — this is context, not a correction.>
```

Examples:

- "This pattern remains valid but the ecosystem has largely moved toward React Server Components for this use case."
- "This limitation was removed in version 4.0; the workaround described here is no longer necessary."

### Warning format

```
> [!WARNING]
> <One or two sentences explaining specifically what has changed and why the content may mislead a reader today.>
```

- "This API was deprecated in Node.js 18 and removed in Node.js 22; use `node:fs/promises` instead."

### Existing callouts

If a `> [!NOTE]` or a `> [!WARNING]` block already exists:

- Leave it unchanged if it is still accurate and specific
- Remove it if the underlying content has since been corrected in the post itself

---

## Posts to review

{{POSTS}}

---

## Response format

Respond ONLY with a JSON object.

{
"create_pr": true or false,
"pr_title": "Outdated Check {{TODAY}}",
"pr_body": "The following items were identified as outdated:\n\n### Changes\n- <list each changed file and a one-line summary of what was flagged>",
"file_changes": [
{
"path": "src/data/blog/path-to-post.md",
"content": "<complete file content with warning(s) inserted>"
}
]
}

Set `create_pr` to false and return an empty `file_changes` array if no posts require changes.
