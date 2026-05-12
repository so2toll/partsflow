import type { APIRoute } from 'astro';
import { exec } from 'child_process';
import path from 'path';

export const get: APIRoute = async ({ request }) => {
  const query = new URL(request.url).searchParams.get('query') || '';

  const scriptPath = path.resolve('../../deeplake/pdf_search.py');
  const venvPath = path.resolve('../../deeplake/.venv/bin/python');

  console.log(`Script Path: ${scriptPath}`);
  console.log(`Virtual Environment Path: ${venvPath}`);
  
  return new Promise((resolve, reject) => {
    exec(`${venvPath} ${scriptPath} "${query}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${stderr}`);
        reject(new Response(stderr, { status: 500 }));
      }
      resolve(new Response(stdout, { status: 200 }));
    });
  });
};
