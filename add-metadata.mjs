import { readFile, writeFile, readdir } from "node:fs/promises";

const files = (await readdir(".")).filter((file) => file.endsWith(".html"));
for (const file of files) {
  let html = await readFile(file, "utf8");
  if (html.includes("data-site-metadata")) continue;
  const title = (html.match(/<title>(.*?)<\/title>/s) || [])[1]
    ?.replaceAll("&amp;", "&")
    .replace(/<[^>]+>/g, "") || "Simple Emergency & Survival Basics";
  const metadata = `
  <!-- Shared public and install metadata -->
  <link rel="icon" href="./favicon.svg" type="image/svg+xml" data-site-metadata>
  <link rel="manifest" href="./manifest.webmanifest">
  <meta property="og:site_name" content="Simple Emergency & Survival Basics">
  <meta property="og:image" content="./social-card.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Simple Emergency and Survival Basics, twelve essential preparedness skills">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title.replaceAll('"', "&quot;")}">
  <meta name="twitter:image" content="./social-card.png">
`;
  html = html.replace("</head>", metadata + "</head>");
  await writeFile(file, html);
}
