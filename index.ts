import axios, { AxiosError } from "axios";
import { JSDOM } from 'jsdom';
import { promises as fs } from 'fs';

function fetchPage(url: string): Promise<string | undefined> {
  const HTMLData = axios
    .get(url)
    .then(res => res.data)
    .catch((error: AxiosError) => {
      console.error(`There was an error with ${error.config?.url}.`);
      console.error(error.toJSON());
    });

  return HTMLData;
}

const baseUrl = 'http://www.paulgraham.com/';
const articlesUrl = `${baseUrl}articles.html`;

async function getArticles() {
  const page = await fetchPage(articlesUrl);
  const dom = new JSDOM(page);
  const doc = dom.window.document;
  const tables = doc.getElementsByTagName('table');
  const thirdTable = tables[2];
  const rows = thirdTable.rows;
  let urls: string [] = [];
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].cells;
    for (let j = 0; j < cells.length; j++) {
      const anchor = cells[j].querySelector('a[href]');
      if (anchor) {
        const href: string | null = anchor.getAttribute('href');
        if (href) {
          if (href.startsWith('https')) {
            // urls.push(href);
          } else {
            urls.push(`${baseUrl}${href}`);
          }
        }
      }
    }
  }
  return urls;
}

async function getArticleFromUrl(url: string) {
  const page = await fetchPage(url);
  const dom = new JSDOM(page);
  const doc = dom.window.document;
  const font = doc.getElementsByTagName('font');
  const text = font[0].textContent;
  return text;
}

async function collectEssaysToFile(urls: string[], fileHandle: fs.FileHandle) {
  for(const url of urls) {
    let article= await getArticleFromUrl(url);
    if(article) {
      await fileHandle.write(`Essay from ${url}\n`);
      await fileHandle.write(article);
      console.log(`wrote essay from ${url}`);
    }
  }
}

(async () => {
  const fileHandle = await fs.open('./pg-essays.txt', 'w');
  let urls = await getArticles();
  console.log(`Got ${urls.length} article urls`);
  await collectEssaysToFile(urls, fileHandle);
  await fileHandle.close();
})();
