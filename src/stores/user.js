import {atom} from "nanostores"

export const user = atom({
    _id:"",
    name:"",
    email:"",
    password:"",
    phone:"",
    first_name:"",
    last_name:"",
    company_name:"",

    usertype:"witness",
    typeOfConcern:"",
    version:"",
    priorityLevel:"",
    witnessName:"",
    witnessPhone:"",
    witnessRelationshipWithPerson:"",
    personName:"",
    personPhone:"",
    personRelationshipWithPerson:"",
    priorityAddress:"",
    mediaPhotoUpload:"",
    // comments: "",
    caseManager:"",
    geoLong:"",
    geoLat:"",
    createTime:"",
    xanoUserId:"",
    concernCategory:"",
    createCase:"",
    caseStatus:"active",
})

export const witnessUser = atom({
    _id:"",
    name:"",
    email:"",
    password:"",
    phone:"",
    usertype:"witness",
})

export const createCase = atom({
    _id:"",
    name:"",
    witnessName:"",
    witness:"",
})


export const step = atom({
    step:1,
 
})

export const caseState = atom({
    
        isEdit:false,
})


export const login = atom({
    
    login:"",
    usertype:"login",
})

export const users = atom([])

export const reportedConcern = atom({
    _id:"",
    name:"",
    email:"",
    password:"",
    phone:"",
    usertype:"witness",
    typeOfConcern:"",
    concernPlace:"",
    version:"",
    priorityLevel:"",
    witnessName2:"",
    witnessPhone2:"",
    witnessRelationshipWithPerson:"",
    personName:"",
    personPhone:"",
    personRelationshipWithWitness:"",
    priorityAddress:"",
    mediaPhotoUpload:"",
    // comments: "",
    geoLong:"",
    geoLat:"",
    createTime:"",
    xanoUserId:"",
    concernCategory:"",
    // caseStatus:"",
})