import swal from 'sweetalert';
import { useStore } from '@nanostores/react';
// import { nanoid } from 'nanoid';
import { user } from "../../stores/user"
//   import { z } from "zod";
import { useDisclosure } from '@mantine/hooks';
import { Modal, Button } from '@mantine/core';
import { useState } from 'react';
import { Stepper, Group } from '@mantine/core';

import { THIRD_PARTY } from '../../lib/configs/imageConfig.js';

const AddSourceForm = (isLocal) => {

    const $user = useStore(user);
    isLocal = isLocal.isLocal
    const handleSubmit = async (e) => {
   
                  try {
console.log(44234235,)
                    // let body = await JSON.stringify({email: $user.email}) 
                    const response =   await fetch(
                      `${isLocal}/createapi/eventHandleLoginSubmit.json?email=${$user.email}`,
                      { method: "post" }
                  )
                  .then(response => response.json())
                    .then(data => {
                        console.log(886868,data, data.message,998777 );
                        if(data.message == 'success'){
                        
                          swal("Login Url Sent", "Please check your email", "success");
                          
                          
                          return data
                         
                        }else{
                          swal({
                            title: "Something Went Wrong",
                            text: data.message,
                            icon: "error",
                            button: "Ok",
                          });
                        }
                    });  
            
                  
   
  
        
        
                } catch (error) {
                  console.error(error);
                }

                    user.set({
          _id: "",
          name: "",
          email: "",
          password: "",
        
        });

    }
    
      const setUser = (e) => {
        console.log(e.target.name, e.target.value);
        user.set({
          ...$user,
          [e.target.name]: e.target.value,
        });
      };

     
  const [opened, { open, close }] = useDisclosure(false);
  const [active, setActive] = useState(0);
  const nextStep = () => setActive((current) => (current < 3 ? current + 1 : current));
  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));
  const [backgroundColor, setBackgroundColor] = useState("black");
  const [activeButton, setActiveButton] = useState(null);

  const handleMouseOver = () => {
    setBackgroundColor("#626a7b");
  };

  const handleMouseOut = () => {
    setBackgroundColor("black");
  };

  const handleClick = (buttonName) => {
    setActiveButton(buttonName);
  };

  const kafkaIcon = { __html: THIRD_PARTY.Images.data_sources.kafka };
  const confluentIcon = { __html: THIRD_PARTY.Images.data_sources.confluent };
  const s3Icon = { __html: THIRD_PARTY.Images.data_sources.s3 };
  const remoteUrl = { __html: THIRD_PARTY.Images.data_sources.remoteUrl };
  const bigQueryIcon = { __html: THIRD_PARTY.Images.data_sources.bigQuery };
  const sampleDatasetIcon = { __html: THIRD_PARTY.Images.data_sources.sampleDataset };
  const missingSomethingtIcon = { __html: THIRD_PARTY.Images.data_sources.missingSomething };
  const shopifyIcon = { __html: THIRD_PARTY.Images.data_sources.shopify };

  const buttons = [
    { name: 'Sample Dataset', icon: sampleDatasetIcon },
    { name: 'Amazon S3', icon: s3Icon },
    { name: 'Bigquery', icon: bigQueryIcon },
    { name: 'Kafka', icon: kafkaIcon },
    { name: 'Confluent', icon: confluentIcon },
    { name: 'Shopify', icon: shopifyIcon },
    { name: 'Remote URL', icon: remoteUrl },
    { name: 'Missing Something?', icon: missingSomethingtIcon }
  ];

  const sinks = [
   
    { name: 'Amazon S3', icon: s3Icon },
    { name: 'Bigquery', icon: bigQueryIcon },
   
    { name: 'Remote Webhook', icon: remoteUrl },
    { name: 'Missing Something?', icon: missingSomethingtIcon }
  ];

  return (
    <div className="login-form">
      <Modal opened={opened} onClose={close} title="Add Data Source" size="100%">
        {/* Modal content */}
        <div>
          <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false} orientation="horizontal">
            <Stepper.Step label="Choose your source of data" description="Connect Source">
              <div style={{ textAlign: "center" }}>
                <br/>
                <a href="#" style={{color: "#1f7496", textDecoration:"none"}} >Start a Data Request to Your Techincal Team</a>
                <br /><br />
                --- OR ---<br /><br />
                Choose a Data Source
              </div>
              {buttons.map(button => (
                <button
                  key={button.name}
                  className={`btn btn-outline btn-success ${activeButton === button.name ? 'active' : ''}`}
                  style={{ color: "black", margin: "3%", backgroundColor: activeButton === button.name ? '#36d399' : '' }}
                  onClick={() => handleClick(button.name)}
                >
                  <span dangerouslySetInnerHTML={button.icon} /> {button.name}
                </button>
              ))}
            </Stepper.Step>
            <Stepper.Step label="Second step" description="Add Connection Details">
            <div style={{ textAlign: "center" }}>
              <div>Add Connection Details</div>
                <select className="select select-success w-full max-w-xs">
                  <option disabled selected>Create a Connection </option>
                  <option>Demo Kafka Topic Connection </option>
                  <option>Demo Datawarehouse Connection</option>
                  
                </select>
              <br /><br />
              or
              <br /><br />
              <div><a href="#" style={{color: "#1f7496", textDecoration:"none"}}>Create a New Connection</a></div>
            </div>
            </Stepper.Step>

            <Stepper.Step label="Final step" description="Choose Data ">
              <br/><br/>
         
    <div style={{ textAlign: 'center' }}>
      <div>Choose Which Tables To Add</div>
      <div className="overflow-x-auto" style={{ display: 'flex', justifyContent: 'center' }}>
        <table className="table" style={{ margin: '0 auto' }}>
          <thead>
            <tr>
              <th>
                <label>
                  <input type="checkbox" className="checkbox" />
                </label>
              </th>
              <th>Name</th>
              <th>Connector</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>
                <label>
                  <input type="checkbox" className="checkbox" />
                </label>
              </th>
              <td>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-bold">customers</div>
                  </div>
                </div>
              </td>
              <td>Demo Kafka Topic Connection<br /></td>
            </tr>
            <tr>
              <th>
                <label>
                  <input type="checkbox" className="checkbox" />
                </label>
              </th>
              <td>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-bold">orders</div>
                  </div>
                </div>
              </td>
              <td>Demo Kafka Topic Connection<br /></td>
            </tr>
            <tr>
              <th>
                <label>
                  <input type="checkbox" className="checkbox" />
                </label>
              </th>
              <td>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-bold">transactions</div>
                  </div>
                </div>
              </td>
              <td>Demo Kafka Topic Connection<br /></td>
            </tr>
            <tr>
              <th>
                <label>
                  <input type="checkbox" className="checkbox" />
                </label>
              </th>
              <td>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-bold">sessions</div>
                  </div>
                </div>
              </td>
              <td>Demo Kafka Topic Connection<br /></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  

            </Stepper.Step>
            <Stepper.Step label="Final step" description="Choose Target Destination ">
            <div style={{ textAlign: "center" }}> Choose Where To Store Data </div>
              {sinks.map(button => (
                <button
                  key={button.name}
                  className={`btn btn-outline btn-success ${activeButton === button.name ? 'active' : ''}`}
                  style={{ color: "black", margin: "3%", backgroundColor: activeButton === button.name ? '#36d399' : '' }}
                  onClick={() => handleClick(button.name)}
                >
                  <span dangerouslySetInnerHTML={button.icon} /> {button.name}
                </button>
              ))}
            </Stepper.Step>
            <Stepper.Completed>
              Completed, click back button to get to previous step
            </Stepper.Completed>
          </Stepper>

          <br /><br />

          <Group justify="center" mt="xl" style={{ justifyContent: "center" }}>
            <Button variant="default" onClick={prevStep}>Back</Button>
            <Button
              onClick={nextStep}
              onMouseOver={handleMouseOver}
              onMouseOut={handleMouseOut}
              style={{ backgroundColor }}
            >Next Step</Button>
          </Group>
        </div>
      </Modal>

      <Button
        onClick={open}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        style={{ backgroundColor }}
      >Add Data Source</Button>
    </div>
  );
}

export default AddSourceForm;

 
