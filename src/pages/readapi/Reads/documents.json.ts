import type { APIRoute } from "astro";
import Iron from '@hapi/iron';
import neo4j from 'neo4j-driver';
const TOKEN_SECRET = process.env.TOKEN_SECRET


export const post: APIRoute = async ({params, request}) => {
    console.log("these the current params on documents endpoint",params,request)
    // const body = await request.json();
    const { cookie } = Object.fromEntries(new URL(request.url).searchParams);
console.log("the current cookie on server on documents endpoint: ", cookie
)
    // Get magic token from request body

    // const email = data.email;
    
    let unsealedCookie=  await Iron.unseal(cookie, TOKEN_SECRET, Iron.defaults)
    console.log("unsealedCookie on server on documents endpoint: ", unsealedCookie);
    console.log("got to here on documents page login endpoint")
    //get more details from Xano, neo4j or any other data sources if necessary and add to unsealedCookie object.

 let patientId = unsealedCookie.message.id;
  //neo4j data 
//   const driver = neo4j.driver(process.env.NEO4J_URI,
//     neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD), 
//     {/* encrypted: 'ENCRYPTION_OFF' */});
//     console.log("got past neo4j connection  here on dashboard login ")
   
//     // ${unsealedCookieUserRBAC.id}
//     // / ${unsealedCookieUserRBAC.id}
//       const query =
//       `
// //       LOAD CSV WITH HEADERS FROM 'https://docs.google.com/spreadsheets/d/1cxoDTRl7xdSbw1ei61lQcdgl4P3a11IKNxtJ6PPllkM/export?format=csv' as row

// // with row["Provider NPI"] as providerNPI, row["Provider Name"] as firstName, row["Last Name"] as lastName

// // return  providerNPI, firstName, lastName
// // limit 25



// MATCH (n:v1Patient {xanoPatientId:"${patientId}"} )-[PERFORMS]->(e)-[PROVIDER_SELECTED]->(pr)
// WITH n, pr, (e.createdAt) as createTime
// ORDER BY createTime DESC
// LIMIT 1
// WITH pr
// LOAD CSV WITH HEADERS FROM 'https://docs.google.com/spreadsheets/d/1cxoDTRl7xdSbw1ei61lQcdgl4P3a11IKNxtJ6PPllkM/export?format=csv' as row
// WITH row, pr
// WHERE row["Provider NPI"] = pr.providerNPI
// RETURN row, pr

//       `;
    
//     const session = driver.session({database:process.env.NEO4J_USERNAME});
    
//     const response = await session.run(query)
//       .then((result: { records: any[]; }) => {
//         const allRecords: any[] = [];
//         result.records.forEach((record) => {
//     // console.log(4232323,record.get('providerNPI'),99242424); 
//     // let currentRecord = record.get('row').properties;
//     // let newRecord;
//     //    newRecord  = currentRecord["Provider NPI"]
//     // console.log(111334232323,newRecord,4444499242424); 
//           // let test= record.get('n').properties.test
//           let amount = record.get('row')['amount'];
//     let cptCode = record.get('row').cptCode;
//     let type = record.get('row').type;
//     let description = record.get('row')['Description'];
//     let fullName = record.get('row')['Provider Name'];
//     let planName = record.get('row')['Name'];
//     let providerNPI = record.get('row')['Provider NPI'];
//     // let providerNPI = record.get('pr').providerNPI;
//     let providerName = record.get('row')['Provider Name'];
//     let annualInPersonVisits = record.get('row')['Annual In Person Visits'];
//     let monthlyTelehealthVisit = record.get('row')['Monthly Telehealth Visit'];
//   // planName
         
//           // let providerNPI= record.get('providerNPI')
//           // let firstName= record.get('firstName')
//         //  let lastName= record.get('lastName')
//           // let phone= record.get('v').properties.phone 
//         //   let referenceNumber= record.get('v').properties.referenceNumber 
         
        
           
//               allRecords.push(
//                 {
//                   providerName, providerNPI, fullName, description, type, cptCode, amount, planName, annualInPersonVisits, monthlyTelehealthVisit 
                  
               
                 
//               });
              
//           });
//           session.close();
//           driver.close();
//           return allRecords;
//         })
//         .catch((error: any) => {
//           console.error(error);
//         });

const response = {test:"this document page"};
        console.log(2224232323,response,9992424422424);
    //https://x8ki-letl-twmt.n7.xano.io/api:0PA0Fq7n
    // Check auth with Xano
    // const auth = ` https://x8ki-letl-twmt.n7.xano.io/api:0PA0Fq7n:v1/auth/magic-link?email=${email}`;
    
        return {
            statusCode: 200,
            body: JSON.stringify({
                "message": "success",
                "data":unsealedCookie,
                "addOnData":response


            }),
        }
   

    
   
    
}