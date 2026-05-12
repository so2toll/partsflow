import type { APIRoute } from "astro";

export const POST: APIRoute = async ({params, request}) => {
    console.log(234343423,params,request)
    // const body = await request.json();
    const { email } = Object.fromEntries(new URL(request.url).searchParams);

    // Get magic token from request body

    // const email = data.email;
    console.log("magicToken adfd", email);

    //https://x8ki-letl-twmt.n7.xano.io/api:0PA0Fq7n
    // Check auth with Xano
    const auth = ` https://x8ki-letl-twmt.n7.xano.io/api:0PA0Fq7n:v1/auth/magic-link?email=${email}`;
    const checkAuth = await fetch(auth)
    .then(res => res.json());

    // const auth = ` https://x8ki-letl-twmt.n7.xano.io/api:0PA0Fq7n:v1/auth/magic-link?email=${email}`;
    // const checkAuth = {message:{success:200}}

console.log("after magic token, this is checkAuth", checkAuth);
    if(checkAuth.message.success){
        console.log("Magic link sent successfully.", );
        return new Response(JSON.stringify({
            message: "success"
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        // return {
        //     statusCode: 200,
        //     body: JSON.stringify({
        //         "message": "success"
        //     }),
        // }
    }else{console.log("Something is wrong with sending this magick link.");

   
        // console.log("Something is wrong with this register information. Send error message to client.");

        return new Response(JSON.stringify({
            message: checkAuth.message
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        // return {
        //     statusCode: 404,
        //     body: JSON.stringify({
        //         "message": checkAuth.message
        //     }),
        // }
    //     return {
    //     statusCode: 404,
    //     body: JSON.stringify({
    //         "message": "failed"
    //     }),
    // } 

    }

    
   
    
}