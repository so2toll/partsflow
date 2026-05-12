import type { APIRoute } from "astro";
import neo4j from "neo4j-driver";

// const ironToken = process.env.ironToken;

export const post: APIRoute = async ({params, request}) => {
    // console.log("this route is working", params);
    // const body = await request.json();
    // console.log(999234234, body);

    // Get magic token from request body

    // const magicToken = body.magicToken;
    // console.log("magicToken adfd", magicToken);

    //https://x8ki-letl-twmt.n7.xano.io/api:0PA0Fq7n
    // Check auth with Xano
    // console.log(234343423,params,request)
    // const body = await request.json();
    const { email } = Object.fromEntries(new URL(request.url).searchParams);
    const { password } = Object.fromEntries(new URL(request.url).searchParams);
    // const email = body.email;
    // const password = body.password;
    const name = "Steven Test";
    // https://x8ki-letl-twmt.n7.xano.io/api:0PA0Fq7n:v1/auth/signup
    const auth = ` https://x8ki-letl-twmt.n7.xano.io/api:0PA0Fq7n:v1/auth/signup?name=${name}&email=${email}&password=${password}`;
    const checkAuth = await fetch(auth, {method:'POST',})
    .then(res => res.json());

    console.log("checkAuth", checkAuth);

    if(checkAuth.message){
        console.log("Something is wrong with this register information. Send error message to client.");
        return {
            statusCode: 404,
            body: JSON.stringify({
                "message": checkAuth.message
            }),
        }
    }else{
        console.log("made it here. check auth registration is good. time to send login email");

        //https://x8ki-letl-twmt.n7.xano.io/api:0PA0Fq7n https://xldy-0jot-laoc.n7.xano.io/api:MeY9vZKV
        // const auth = ` https://x8ki-letl-twmt.n7.xano.io/api:0PA0Fq7n:v1/auth/magic-link?email=${email}`;
        // const checkAuth = await fetch(auth, {method:'POST',})
        // .then(res => res.json());
    
        // console.log("checkAuth", checkAuth); const email = body.email;
        console.log("magicToken adfd", email);
    
        // Check auth with Xano
        const auth = ` https://x8ki-letl-twmt.n7.xano.io/api:0PA0Fq7n:v1/auth/magic-link?email=${email}`;
        const checkAuth = await fetch(auth)
        .then(res => res.json());
    
        // console.log("checkAuth", checkAuth);
    
        if(checkAuth.message.success){
            console.log("Magic link sent successfully.");
            return {
                statusCode: 200,
                body: JSON.stringify({
                    "message": "success"
                }),
            }
        }else{console.log("Something is wrong with sending this magic link.");
            return {
            statusCode: 404,
            body: JSON.stringify({
                "message": "failed"
            }),
        } 
        }
    

    }

    // console.log("made it here. check auth is good", checkAuth);
    return {
        statusCode: 200,
        body: JSON.stringify({
            "message": "success"
        }),
    }
    
}