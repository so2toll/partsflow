import type { APIRoute } from "astro";
import Iron from '@hapi/iron';
import neo4j from 'neo4j-driver';
const TOKEN_SECRET = process.env.TOKEN_SECRET



export const post: APIRoute = async ({params, request}) => {
  
    const { cookie } = Object.fromEntries(new URL(request.url).searchParams);
  

  let unsealedCookieUserRBAC=  await Iron.unseal(cookie, TOKEN_SECRET, Iron.defaults)
  
  console.log(1996511144322323,unsealedCookieUserRBAC);
 
//   MATCH (n:v1Patient {xanoPatientId:"176"} )-[PERFORMS]->(e)-[PROVIDER_SELECTED]->(pr) with n, pr, (e.createdAt) as createTime order by createTime desc limit 1
      
//   LOAD CSV WITH HEADERS FROM 'https://docs.google.com/spreadsheets/d/16HlLnU_d5H0xIeImkk33KHQGNBSyi4d1QI0t2wQW668/export?format=csv' as row
// with row where row["Provider NPI"] = "1083149389", 


// return  row, pr
// // with row  of provider, can pull any other services
// limit 25

  //neo4j data 
  const driver = neo4j.driver(process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD), 
  {/* encrypted: 'ENCRYPTION_OFF' */});
  
  let patientId = unsealedCookieUserRBAC.message.id;

  
  // ${unsealedCookieUserRBAC.id}
  // pr.providerNPI
      const query =
      `
    

      MATCH (n:v1Patient {xanoPatientId:"${patientId}"} )-[PERFORMS]->(e)-[PROVIDER_SELECTED]->(pr)
      WITH n, pr, (e.createdAt) as createTime
      ORDER BY createTime DESC
      LIMIT 1
      WITH pr
      LOAD CSV WITH HEADERS FROM 'https://docs.google.com/spreadsheets/d/1cxoDTRl7xdSbw1ei61lQcdgl4P3a11IKNxtJ6PPllkM/export?format=csv' as row
      WITH row, pr
      WHERE row["Provider NPI"] = pr.providerNPI
      RETURN row, pr

      
      `;
    
    const session = driver.session({database:process.env.NEO4J_USERNAME});
    
    const response = await session.run(query)
      .then((result: { records: any[]; }) => {
        const allRecords: any[] = [];
        result.records.forEach((record) => {
    // console.log(999955444232323,record.get('row'),record.get('pr'), 777799242424); 
    
    let amount = record.get('row')['amount'];
    let cptCode = record.get('row').cptCode;
    let type = record.get('row').type;
    let description = record.get('row')['Description'];
    let fullName = record.get('row')['Provider Name'];
    let planName = record.get('row')['Name'];
    let providerNPI = record.get('row')['Provider NPI'];
    // let providerNPI = record.get('pr').providerNPI;
    let providerName = record.get('pr').providerName;
  // planName
         
            allRecords.push(
              {
                providerName, providerNPI, fullName, description, type, cptCode, amount, planName 
                
             
               
            });
            
        });
        session.close();
        driver.close();
        return allRecords;
      })
      .catch((error: any) => {
        console.error(error);
      });
      console.log(889223772224232323,response, unsealedCookieUserRBAC, 344443444);
      return {
        statusCode: 200,
        body: JSON.stringify({
          "data": response,
          "message": "success",
        }),
      }
    }
    