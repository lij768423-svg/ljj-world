import { expect, test } from '@playwright/test';
import { blogPosts } from '../src/blog';
import { translatePortfolioText } from '../src/i18n/PortfolioLanguage';

test('rewritten copy has English text and stable section anchors', () => {
  expect(blogPosts).toHaveLength(5);
  for (const post of blogPosts) {
    expect(post.sections.every(section => section.anchor)).toBe(true);
    for (const text of [post.title, post.excerpt, post.intro, post.readingTime, ...post.sections.flatMap(section => [section.title, ...section.paragraphs])]) {
      expect(translatePortfolioText(text), text).not.toMatch(/[\u3400-\u9fff]/u);
    }
  }
});
