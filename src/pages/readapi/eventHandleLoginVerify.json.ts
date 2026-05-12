import type { APIRoute } from "astro";
import neo4j from "neo4j-driver";

// const ironToken = process.env.ironToken;

export const post: APIRoute = async ({params, request}) => {
    console.log(234343423,params,request)
    // const body = await request.json();
    const { magicToken } = Object.fromEntries(new URL(request.url).searchParams);
    
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
    return {
        statusCode: 200,
        body: JSON.stringify({
            "message": checkRBAC
        }),
    }
}