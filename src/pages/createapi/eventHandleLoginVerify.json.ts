import type { APIRoute } from "astro";
import neo4j from "neo4j-driver";

// const ironToken = process.env.ironToken;

export const POST: APIRoute = async ({params, request}) => {
    console.log(234343423,params,request);
    console.log("ah hoy, the error is actually on this page verify check")
    // const body = await request.json();
    let { magicToken } = Object.fromEntries(new URL(request.url).searchParams);
    console.log("this the current magic token", magicToken);
    magicToken = magicToken.includes('/') ? magicToken.split('/')[1] : magicToken;
    console.log("now this the current magic token", magicToken);
    //Check auth with Xano
    const auth = ` https://x8ki-letl-twmt.n7.xano.io/api:0PA0Fq7n:v1/auth/magic-login?magic_token=${magicToken}`;
    const checkAuth = await fetch(auth, {method:'POST',})
    .then(res => res.json());


    if(checkAuth.message){
        //***may need to  redirect to login here */
        console.log("Something is wrong with this auth magick token. Redirect to login page");
        return {
            statusCode: 404,
            body: JSON.stringify({
                "message": checkAuth.message
            }),
        }
    }

     //get rbac roles and send to client  
    const rbac = `https://x8ki-letl-twmt.n7.xano.io/api:0PA0Fq7n:v1/auth/me?authtoken=${checkAuth}`;
    
    const checkRBAC = await fetch(rbac, {method:'GET',})
    .then(res => res.json());

    console.log("32323 checkRBAC", checkRBAC);
    checkRBAC.authStatus = 'success';
                                                                                                                                                                                                                                                                                                                                                       

    // console.log("made it here. check auth is good", checkAuth);

    return new Response(JSON.stringify({
        message: checkRBAC
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    // return {
    //     statusCode: 200,
    //     body: JSON.stringify({
    //         "message": checkRBAC
    //     }),
    // }
}