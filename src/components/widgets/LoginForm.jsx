import swal from 'sweetalert';
import { useStore } from '@nanostores/react';
// import { nanoid } from 'nanoid';
import { user } from "../../stores/user"
//   import { z } from "zod";


const LoginForm = (isLocal) => {

    const $user = useStore(user);
    isLocal = isLocal.isLocal
    const handleSubmit = async (e) => {
        console.log(234234234, $user);
        console.log(5555234234234, e);
        console.log(55523323424,isLocal)
        e.preventDefault();
        // let currentUrl = 'https://app.data3d.io'
        // let currentUrl = 'http://localhost:3000'

        // try {

        //     const response = await fetch(`${isLocal}/createapi/eventHandleLoginSubmit.json`, {
        //     method: "POST",
        //     headers: {
        //       "Content-Type": "application/json",
        //     },
        //       body: JSON.stringify({
        //               // name: $login.name,
        //               // name: $registerWitnessForm.name,
        //               email: $user.email,
        //               // password: $registerWitnessForm.password,
        //             //   usertype: "form"
        //           })
        //     }).then(response => response.json())
        //       .then(data => {
        //         //   console.log(886868,data, data.message.success,998777 );
        //           if(data.message == 'success'){
        //             // alert("Login Url Sent. Please check your email.")
        //             swal("Login Url Sent", "Please check your email", "success");
        //           }
        //           return data
        //       });

        //           } catch (error) {
        //             console.error(error);
        //           }


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


                    // console.log(65768679, body)
        // const response = await fetch(`${isLocal}/createapi/eventHandleLoginSubmit.json`, {
        //   method: "POST",

        //   body: body
        // })
        // .then(response => response.json())
        //   .then(data => {
        //       console.log(886868,data, data.message,998777 );
        //       if(data.message == 'success'){

        //         swal("Login Url Sent", "Please check your email", "success");


        //         return data

        //       }
        //   });

         console.log(9898798,response);

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
    return (
        <div className="login-form">
            <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#4a5568'
                    }}>
                        Email Address
                    </label>
                    <input
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: '16px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '10px',
                            outline: 'none',
                            transition: 'all 0.3s',
                            backgroundColor: '#f7fafc'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#667eea';
                            e.target.style.backgroundColor = '#fff';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.backgroundColor = '#f7fafc';
                        }}
                        type="email"
                        placeholder="Enter your email"
                        name="email"
                        value={$user.email}
                        onChange={setUser}
                        required
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'white',
                        background: 'linear-gradient(135deg, #667eea 0%, #7cd1f9 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                    }}
                    onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                    }}
                >
                    Send Login Link
                </button>
            </form>
        </div>
    )
  }

  export default LoginForm
