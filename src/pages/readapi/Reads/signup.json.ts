import type { APIRoute } from "astro";
import Iron from '@hapi/iron';

const TOKEN_SECRET = process.env.TOKEN_SECRET


export const POST: APIRoute = async ({params, request}) => {
    // console.log(234343423,params,request)
    // const body = await request.json();
    // const { cookie } = Object.fromEntries(new URL(request.url).searchParams);

    // Get magic token from request body

    // const email = data.email;
    
    // let unsealedCookie=  await Iron.unseal(cookie, TOKEN_SECRET, Iron.defaults)
// console.log("unsealedCookie on server: ", unsealedCookie);
    //get more details from Xano, neo4j or any other data sources if necessary and add to unsealedCookie object.

    //https://x8ki-letl-twmt.n7.xano.io/api:0PA0Fq7n
    // Check auth with Xano
    // const auth = ` https://x8ki-letl-twmt.n7.xano.io/api:0PA0Fq7n:v1/auth/magic-link?email=${email}`;
    
    return new Response(JSON.stringify({
        message: "success",
       
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

        // return {
        //     statusCode: 200,
        //     body: JSON.stringify({
        //         "message": 'success'
        //     }),
        // }
   

    
   
    
}