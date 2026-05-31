---
title: "Code Review Is About People"
author: "Adam Shirt"
pubDatetime: 2026-05-31T10:50:00Z
modDatetime: 2026-05-31T10:50:00Z
slug: code-review-is-about-people
featured: false
draft: false
tags:
  - ci/cd
description: "AI code review tools are gaining traction quickly, but the real costs are harder to see. Before jumping to implement a fully autonomous code review process, consider why we do it in the first place."
---

The race to automate software development is well under way. Earlier this year OpenAI and Anthropic both released AI code review tools. Big-name tech companies like Cloudflare are publishing blog posts describing their attempts to replace reviewers with AI agents. Tech CEOs boast about how much of their code is being written and reviewed by AI. The message is clear: if you're still reviewing code then you're a dinosaur.

It is understandable why we’re seeing so many attempts to cut the human out of the loop. As Martin Fowler writes in his article on [Continuous Integration](https://www.martinfowler.com/articles/continuousIntegration.html):

> The pre-integration code review can be problematic for Continuous Integration because it usually adds significant friction to the integration process. Instead of an automated process that can be done within minutes, we have to find someone to do the code review, schedule their time, and wait for feedback before the review is accepted.

His take is that pre-integration review comes from the context of open-source, where contributions are impromptu, arguing that for a full-time team these processes should be reassessed. It's a fair point — other techniques like pair programming are often not explored, as pre-integration review is the de facto standard. So why is it that code review is such a widespread standard for closed-source development teams? Simply put, the answer is that code review is the most straightforward way to keep a team aligned on high-quality output. There are broadly three reasons why individuals produce lower-quality output.

One reason output quality drops is because a team is stretched thin, leading developers to work on projects outside their specialty. Having specialised in C#, when adding a feature that requires a change in a codebase written in Go, the Go code that I output is likely to be low-quality. Likewise when the Go developer jumps in to make a change on a C# project, I would want to review the changes.

In a similar vein, junior developers are more likely to produce lower-quality output. Without the years of experience the senior developer has accumulated slogging through the mud, the junior developer does not have the capability to consistently produce high-quality output to the same degree. Pull requests and code review are a good way to share this knowledge and quality-gate the mainline branch.

Then there are those with a lack of incentive. Maybe they’re more incentivised to spend their time managing up than doing the work to a high standard, or perhaps there’s simply no meaningful reward for going above and beyond, so they don’t.

Across all three situations, there’s a common theme — code review creates a social contract. The expectation is that the existing codebase is of a high-enough quality that each developer is able to make changes without running into too many problems. By sharing knowledge you’re not only making your own job easier in the future; you’re giving your time to help others improve. Replacing individual reviewers with LLMs undermines this social contract. 

There’s no doubt that LLMs can significantly help with certain aspects of code review. They’re reasonably good at finding bugs, assessing code quality and highlighting deviations from agreed standards — they’re not perfect. Somewhat counter-intuitively, they’re less good at knowledge sharing and collective product understanding. Where they may have some benefit is in providing a greater incentive for individuals to create documentation, which serves as useful context to improve output. Without it, LLMs can be especially prone to misleading outputs within a domain.

Anecdotally, I find that the LLM code review tools I have tried are usually either very surface-level or overly thorough. They miss things that skilled developers catch, and they lack nuance — flagging issues that have already been considered. The tools are very useful where you lack knowledge, while adding unnecessary friction where you don’t. It makes sense that this is the case — they lack context on the individuals using them. More output looks better to the untrained eye, and there’s no cost to additional output when the user is paying for it. But more output also creates an illusion of sorts. Developers who see that a pull request already has what looks to be a thorough review may not bother to scrutinise it in detail themselves.

Ultimately, if you reduce or elimatinate the time an experienced individual is spending reviewing the code of others, then you’re going to need to either accept or address the problems that creates. Before following the crowd and relying on AI code review, consider the trade-offs. The tools may look impressive and catch subtle bugs more quickly, but the real costs are harder to see: developers improve more slowly, institutional knowledge goes unshared, and a team's collective understanding of its own codebase quietly erodes.
