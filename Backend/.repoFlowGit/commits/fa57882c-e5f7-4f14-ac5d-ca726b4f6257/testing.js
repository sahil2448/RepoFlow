async function decodeSecretMessage(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Could not fetch document: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();

  // Pull out every table row from the HTML
  const rowMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  const points = [];

  for (const row of rowMatches) {
    // Pull out the cells from this row
    const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(
      (match) => cleanText(match[1]).trim(),
    );

    // Skip the header row
    if (cells.length < 3) continue;

    const x = parseInt(cells[0], 10);
    const ch = cleanText(cells[1]);
    const y = parseInt(cells[2], 10);

    // If x or y is not a number, this is probably the header row
    if (Number.isNaN(x) || Number.isNaN(y)) continue;

    points.push({ x, y, ch });
  }

  if (points.length === 0) {
    console.log("");
    return;
  }

  const maxX = Math.max(...points.map((p) => p.x));
  const maxY = Math.max(...points.map((p) => p.y));

  // Start with a grid full of spaces
  const grid = Array.from({ length: maxY + 1 }, () =>
    Array(maxX + 1).fill(" "),
  );

  // Place each character in its correct position
  for (const { x, y, ch } of points) {
    grid[y][x] = ch;
  }

  // Print the final picture
  console.log(grid.map((row) => row.join("")).join("\n"));
}

function cleanText(text) {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)));
}

decodeSecretMessage(
  "https://docs.google.com/document/d/e/2PACX-1vSvM5gDlNvt7npYHhp_XfsJvuntUhq184By5xO_pA4b_gCWeXb6dM6ZxwN8rE6S4ghUsCj2VKR21oEP/pub",
).catch(console.error);
