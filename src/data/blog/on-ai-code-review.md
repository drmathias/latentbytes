---
title: "On AI Code Review"
author: "Adam Shirt"
pubDatetime: 2026-05-30T11:39:00Z
modDatetime: 2026-05-30T11:39:00Z
slug: on-ai-code-review
featured: false
draft: false
tags:
  - ci/cd
description: ""
---

Earlier this year OpenAI and Anthropic both released AI code review tools. Big-name tech companies like CloudFlare are coming out with blog posts about replacing code reviews with AI agents and CEOs are bragging about how much of their code is being written and reviewed by AI. The message is clear: if you’re still reviewing code in 2026, you’re a dinosaur.

It is understandable why we’re seeing so many attempts to cut the human out the loop. As Martin Fowler writes in his article on [Continuous Integration](https://www.martinfowler.com/articles/continuousIntegration.html):

> The pre-integration code review can be problematic for Continuous Integration because it usually adds significant friction to the integration process. Instead of an automated process that can be done within minutes, we have to find someone to do the code review, schedule their time, and wait for feedback before the review is accepted.

His take is that pre-integration review comes from the context of open-source, where contributions are impromptu, arguing that for a full-time team these processes should be reassessed. So why is it that code review is such a widespread standard for closed-source development teams? Simply put, it’s because it’s the most straightforward way to improve lower-quality output produced by individuals within a team.

Sometimes it’s because a team is stretched thin and developers work on projects outside their specialty. Having specialised in C#, when tasked with fixing a bug in a codebase written in Go, the Go code that I output is likely to be low-quality. Likewise when the Go developer jumps in to fix a bug on a C# project that I maintain, I would want them to ask me to review the code.

In a similar vein, junior developers are more likely to produce lower-quality output. Without the years of experience and slogging through the mud that the senior developer has done, the junior developer does not have the capability to consistently produce high-quality output to the same degree. Pull requests and code review are a good way to share this knowledge and quality-gate the mainline branch.

Thirdly, there’s those with a lack of incentive. Maybe they’re more incentivised to spend their time managing up than doing the work to a high standard, or perhaps there’s simply no meaningful reward for going above and beyond, so they don’t.

When you look closely at all three of these situations, there’s a common theme - code review creates a social contract. The expectation is that when you carry out some development work, the existing codebase is of a high-enough quality that you’re able to make your changes without running into too many problems. By sharing knowledge you’re not only making your own job easier in the future - you’re helping others get better and helping yourself too. Replacing the work of individuals with LLMs here destroys this social contract. 

There’s no doubt that LLMs can significantly help with certain aspects of code review. They’re fairly good at finding bugs, assessing code quality and highlighting deviations from agreed standards. They’re not perfect. Somewhat counter-intuitively they’re less good at knowledge sharing and collective product understanding. Where they may have some benefit is in providing a greater incentive for individuals to create documentation, which can be used as context to improve output, as without documentation they can be especially misleading in a domain.

Anecdotally, I find that the LLM code review tools I have tried are usually either very surface-level or overly-thorough. They miss things that skilled developers find and they lack nuance, finding things which have already been thought about. The tools are very useful where you lack knowledge, while adding unnecessary friction where you don’t. It makes sense that this is the case - they lack context on the individuals using them. More output looks better to the untrained eye and there’s no cost to additional output when you’re being paid for it. But more output also creates an illusion of a sorts. Developers reviewing a pull request that already has a review may not bother to spend their time reviewing it in detail themselves.

Ultimately, if you reduce the time a real, skilled individual is spending reviewing the code of others, or cut it out entirely, then you’re going to need to either accept or address the problems it creates. Before following the crowd and relying on AI code review, consider the trade-offs in your decision. 
