export const SITE = {
  website: "https://www.latentbytes.net/", // replace this with your deployed domain
  author: "Adam Shirt",
  profile: "https://cv.64815139.xyz",
  desc: "A personal blog about computing, software, and the occasional economics tangent.",
  title: "Latent Bytes",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: false,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: true,
    text: "Edit page",
    url: "https://github.com/drmathias/latentbytes/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "Europe/London", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
