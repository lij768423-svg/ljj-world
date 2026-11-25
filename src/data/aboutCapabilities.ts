// What backs each capability cell on /about. Ids are `projects` ids in src/App.tsx; a project is listed only with a
// public link (its site, or else its repository), never with its page on this site. A capability can also point at
// pages of this site: the server page, or a blog post by its slug (title and cover come from src/blog.ts).
export type AboutCapabilityId = "interface" | "ai" | "service" | "operations";

export type AboutCapabilityPage = { title: string; href: string; image: string } | { blogSlug: string };

export const aboutCapabilityLinks: Record<AboutCapabilityId, { projectIds: string[]; pages?: AboutCapabilityPage[] }> = {
  interface: { projectIds: ["408-web", "ioschat", "408-harmony"] },
  ai: { projectIds: ["ioschat", "travel-agent", "writing-studio"] },
  service: { projectIds: ["meshatlas", "grok-register-panel"] },
  operations: {
    projectIds: [],
    pages: [
      { title: "服务器", href: "/systems", image: "/assets/about-server.webp" },
      { blogSlug: "home-server-as-a-product" },
    ],
  },
};
