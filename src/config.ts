export const SITE = {
  website: "https://www.latentbytes.net",
  author: "Adam Shirt",
  profile: "https://cv.64815139.xyz",
  desc: "A personal blog about computing, software, and the occasional economics tangent.",
  title: "Latent Bytes",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: false,
  showBackButton: true,
  editPost: {
    enabled: true,
    text: "Edit page",
    url: "https://github.com/drmathias/latentbytes/edit/main/",
  },
  ogImage: undefined,
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "en",
  timezone: "Europe/London", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
