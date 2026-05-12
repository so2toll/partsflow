import type { APIRoute } from "astro";
import Iron from '@hapi/iron';
import neo4j from 'neo4j-driver';
const TOKEN_SECRET = process.env.TOKEN_SECRET



export const post: APIRoute = async ({params, request}) => {
  
    const { cookie } = Object.fromEntries(new URL(request.url).searchParams);
  

  let unsealedCookieUserRBAC=  await Iron.unseal(cookie, TOKEN_SECRET, Iron.defaults)
  
//   console.log(111144322323,unsealedCookieUserRBAC);
 
  //neo4j data 
  const driver = neo4j.driver(process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD), 
  {/* encrypted: 'ENCRYPTION_OFF' */});
  
  let patientId = unsealedCookieUserRBAC.id;
  // ${unsealedCookieUserRBAC.id}
      const query =
      `
      // MATCH (n:v1Patient {xanoPatientId:"${patientId}"} )-[PERFORMS]->(e)-[PROVIDER_SELECTED]->(pr)
      // WITH n, pr, (e.createdAt) as createTime
      // ORDER BY createTime DESC
      // LIMIT 1
      // WITH pr
      LOAD CSV WITH HEADERS FROM 'https://docs.google.com/spreadsheets/d/1cxoDTRl7xdSbw1ei61lQcdgl4P3a11IKNxtJ6PPllkM/export?format=csv' as row
      WITH row
      //, pr
      // WHERE row["Provider NPI"] = pr.providerNPI
      RETURN row
      //, pr
      
      `;
    
    const session = driver.session({database:process.env.NEO4J_USERNAME});
    
    const response = await session.run(query)
      .then((result: { records: any[]; }) => {
        const allRecords: any[] = [];
        result.records.forEach((record) => {
  
          let amount = record.get('row')['amount'];
          let cptCode = record.get('row').cptCode;
          let type = record.get('row').type;
          let description = record.get('row')['Description'];
          let providerName = record.get('row')['Provider Name'];
          let planName = record.get('row')['Name'];
          let providerNPI = record.get('row')['Provider NPI'];
          // let providerNPI = record.get('pr').providerNPI;
          // let providerName = record.get('pr').providerName;

            allRecords.push(
              {
             providerName, providerNPI, description, type, cptCode, amount, planName 
                
             
               
            });
            
        });
        session.close();
        driver.close();
        return allRecords;
      })
      .catch((error: any) => {
        console.error(error);
      });
      console.log(3388997772224232323,response,663344322111);
      return {
        statusCode: 200,
        body: JSON.stringify({
          "data": response,
          "message": "success",
        }),
      }
    }
    