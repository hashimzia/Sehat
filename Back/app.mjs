import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { ExpressHandlebars } from 'express-handlebars';
import { fileURLToPath } from 'url';
import path from 'path';
import url from 'url';

import './config.mjs';
import './db.mjs';
import { generateSlots } from './functions.mjs';
import jwt from 'jsonwebtoken'
import axios from 'axios'
import querystring from 'querystring'


// import session from 'express-session';

import { config } from 'dotenv';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import { ConnectionClosedEvent } from 'mongodb';
config()

// import Cookies from 'cookies';
const app = express();
const exhbs = new ExpressHandlebars({ defaultLayout: 'main', extname: '.hbs' });
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));

app.use(ClerkExpressWithAuth())
app.use(loginCheck)
app.engine('hbs', exhbs.engine);
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());





const healthpvdobject = {
  provider_id: '01HV9GW3JNKFZTQTGCQ5GGZV86',
  patient_id: 'user_2fYnCDKa3TOAXA8WFE7tFqFIb8l'
}


function loginCheck(req, res, next) {
  if (!req.auth.userId && req.path !== '/login' && !req.path.includes('api')) {
    return res.redirect('/login')
  }
  next()
}

async function patientCheck(id) {
  const doctor = await HealthProviders.findOne({ userId: id })
  if (doctor) {
    return false
  }
  return true
}



// Configure session middleware
// app.use(session({
//   secret: 'your_secret_key', // Replace 'your_secret_key' with a real secret string
//   resave: false,
//   saveUninitialized: false, // Change to true if you want to save session before anything is assigned to it
//   cookie: { secure: false } // Set to true if using https
// }));

// //Clerk
// import Clerk from "@clerk/clerk-js";

// // Initialize Clerk on the backend
// const clerk = new Clerk(process.env.CLERK_SECRET_KEY);

// // Now you can use `clerk` to manage sessions, authenticate users, etc.
// app.use(clerk.expressWithSession());


app.set('view engine', 'hbs');  // set the view engine to handlebars
const port = 5173;

// maintain case sensitivity, PascalCase for identifiers, lowercase ONLY for collection names
const HealthProviders = mongoose.model('healthproviders');
const Reviews = mongoose.model('reviews');
const HealthProvidersRatings = mongoose.model('healthprovidersratings');
const HealthProvidersSchedule = mongoose.model('healthprovidersschedule');
const BookedSlots = mongoose.model('bookedslots');
const Patient = mongoose.model('patients');
const atv = await BookedSlots.find({});
app.listen(port, () => {
  console.log(`backend listening on port ${port}`)
})

app.get('/', async (req, res) => {
  const isPatient = await patientCheck(req.auth.userId);
  if (isPatient) {
    const userId = req.auth.userId;
    let user = await Patient.findOne({patient_id:userId})
    
    if (!user){
      return res.redirect('/patient-onboarding')
    }
    let slot = await BookedSlots.find({patient_id:userId}).sort({starting_time: -1}).limit(1)
    slot = slot[0]
    if (!slot){
      return res.render('patient-dashboard')
    }
    console.log(user)
    
    const hours = slot.start_time.getHours().toString().padStart(2, '0'); // Ensure two digits for hours
    const minutes = slot.start_time.getMinutes().toString().padStart(2, '0'); // Ensure two digits for minutes
    const time = `${hours}:${minutes}`;
    const date = slot.date.toDateString();
    const providerDetails = await HealthProviders.findOne({provider_id:slot.provider_id})
    const name = providerDetails.first_name + " " +providerDetails.last_name;
    const id = slot._id;
    return res.render('patient-dashboard',{name,time,date,id})
  } else {
    return res.render('doctor-dashboard')
  }

})
app.get('/login', (req, res) => {
  res.render('login', { layout: 'login' });
})
app.get('/appointment-zoom/:slotId', async(req, res) => {
  const slotId = req.params.slotId;
  
  try {
    const slot = await BookedSlots.findById(slotId)
    const providerDetails = await HealthProviders.findOne({provider_id:slot.provider_id})
    const name = providerDetails.first_name + " " +providerDetails.last_name;
    const speciality = providerDetails.specialty;
    const years = providerDetails.years_of_experience;
    const  city= providerDetails.city;
    if (slot){
      res.render('appointment',{slotId,name,years,speciality,city});
    } else {
      res.render('error',{errorCode:404,errorMessage:"Slot not found" })
    }
  }
  catch {
    res.render('error',{errorCode:500,errorMessage:"Incorrect path" })
  }
})
// app.get('/view-appointments', async(req, res) => {
//   const userId = req.auth.userId;
//   console.log(userId)
//   const appointmentsArray=[]
//   const Patient = mongoose.model('patients');
//   let appointments;
//   // try {
//     const isPatient = await patientCheck(userId)
//     if (isPatient){
//       appointments = await BookedSlots.find({patient_id:userId})

//       appointments.forEach( async function (appointment){
//         console.log(appointment)
//         const doctor = await HealthProviders.findOne({provider_id:appointment.provider_id})
//         console.log(doctor)
//         appointmentsArray.push({
//           name: doctor.first_name +" " + doctor.last_name,
//           start_time: appointment.start_time,
//         })

//       }
//       )
//     } else{
//       const doctorId =await  HealthProviders.findById(userId)
//       doctorId= doctorId.provider_id
//       appointments = await BookedSlots.find({provider_id:doctorId})
//       appointments.forEach( async function (appointment){
//         const patient = await Patient.findOne({provider_id:appointment.provider_id})
//         appointmentsArray.push({
//           name: patient.first_name +" " + patient.last_name,
//           start_time: appointment.start_time,
//         })
//       }
//       )
//     }
//     console.log(appointmentsArray)
//     res.render('view-appointments',appointmentsArray)
//   }
  // catch {
  //   res.render('error',{errorCode:500,errorMessage:"Incorrect path" })
  // }
// }
// )

app.get('/view-appointments', async (req, res) => {
  try {
      const userId = req.auth.userId;
      const appointmentsArray = [];
      const Patient = mongoose.model('patients');
      let appointments;

      const isPatient = await patientCheck(userId);

      if (isPatient) {
          appointments = await BookedSlots.find({ patient_id: userId });
      } else {
          let doctorId = await HealthProviders.findOne({userId:userId});
          const providerId = doctorId.provider_id;
          appointments = await BookedSlots.find({ provider_id: providerId });
      }

      for (const appointment of appointments) {
          let name;
          if (isPatient) {
              const doctor = await HealthProviders.findOne({ provider_id: appointment.provider_id });
              name = `${doctor.first_name} ${doctor.last_name}`;
          } else {
              const patient = await Patient.findOne({ patient_id: appointment.patient_id });
              console.log(patient)
              name = patient.name;
          }

          const hours = appointment.start_time.getHours().toString().padStart(2, '0'); // Ensure two digits for hours
            const minutes = appointment.start_time.getMinutes().toString().padStart(2, '0'); // Ensure two digits for minutes
            const time = `${hours}:${minutes}`;
      
          appointmentsArray.push({
              name: name,
              start_time: time,
              date: appointment.start_time.toDateString(),
              id: appointment._id
          });
      }
      if (appointmentsArray.length!=0){
        res.render('view-appointments', { appointmentsArray });
      } else{
        res.render('error',{errorCode:404,errorMessage:"No appointments found"})
      }
  } catch (err) {
      // Handle errors appropriately
      console.error(err);
      res.render('error',{errorCode:500, errorMessage:"Internal server error"})
  }
});



app.get('/appointment-booking', async (req, res) => {
  const isPatient = await patientCheck(req.auth.userId);
  if (!isPatient) {
    return res.send("Unauthorized")
  }
  res.render('appointment-booking');
})
app.get('/search', async (req, res) => {
  const isPatient = await patientCheck(req.auth.userId);
  const registered = await Patient.findOne({patient_id:req.auth.userId})
  if (!isPatient || !registered) {
    return res.send("Unauthorized")
  }
  res.render('search');
})
app.get('/meeting-end-review', (req, res) => {
  res.render('meeting-end-review');
})

app.get('/prescriptions', (req, res) => {
  res.render('prescriptions');
})
  
app.get('/provider-availability', async (req, res) => {
  const isPatient = await patientCheck(req.auth.userId);
  if (!isPatient) {
    return res.send("Unauthorized")
  }
  res.render('provider-availability');
})
app.get('/doctor-onboarding', async (req, res) => {
  const isPatient = await patientCheck(req.auth.userId);
  if (isPatient) {
    return res.send("Unauthorized")
  }
  res.render('doctor-onboarding');
})
app.get('/doctor-dashboard', async (req, res) => {
  const isPatient = await patientCheck(req.auth.userId);
  if (isPatient) {
    return res.send("Unauthorized")
  }
  res.render('doctor-dashboard');
})
app.get('/create-prescriptions', async (req, res) => {
  const isPatient = await patientCheck(req.auth.userId);
  if (isPatient) {
    return res.send("Unauthorized")
  }
  res.render('create-prescriptions');
})
app.get('/patient-onboarding', async (req, res) => {
  const isPatient = await patientCheck(req.auth.userId);
  if (!isPatient) {
    return res.send("Unauthorized")
  }
  res.render('patient-onboarding');
})
app.get('/view-prescriptions', async (req, res) => {
  const isPatient = await patientCheck(req.auth.userId);
  if (!isPatient) {
    return res.send("Unauthorized")
  }
  const patientId = req.auth.userId;
  const Prescription = mongoose.model('prescriptions');
  Prescription.deleteMany({});
  try {
    let prescriptions = await Prescription.find({ patient_id: patientId }).lean();
    res.render('view-prescriptions',{prescriptions});
  } catch (err) {
    console.error(err);
    res.status(500).send("Error occurred while fetching prescriptions");
  }
})

// full-text search as defined in db.mjs text index
app.get('/api/searchHealthProviders', async (req, res) => {

  let searchQuery = req.query.query;
  let answer = await HealthProviders.find({ $text: { $search: searchQuery } });
  res.status(200).send(answer);
})
app.get('/api/searchHealthProvidersId', async (req, res) => {

  let searchQuery = req.query.query;
  let answer = await HealthProviders.findOne({ provider_id: searchQuery });
  res.status(200).send(answer);
})

app.get('/api/verify-doctor', async (req, res) => {
  const { doctorId } = req.query; // Get doctorId from query parameters

  try {
    const doctor = await HealthProviders.findOne({ provider_id: doctorId });
    if (doctor) {
      res.json({ success: true, message: 'Doctor verified successfully.' });
    } else {
      res.status(404).json({ success: false, message: 'Doctor ID not found.' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});
app.post('/api/create-meeting', async (req, res) => {
  let accessToken = await getToken(); // Fetch the access token
  accessToken = accessToken['access_token']
  if (!accessToken) {
    return res.status(500).send('Failed to obtain access token');
  }
  // console.log(req.body)
  let slot = await BookedSlots.findOne({})
  // console.log(slot)
  if (slot.meeting) {
    return res.send(slot.meeting);
  }

  const config = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'Zoom-api-Server2Server-Request',
      'content-type': 'application/json'
    },
  };

  const data = {
    topic: 'New Consultation',
    type: 2, // Type 1 is an instant meeting
    "start_time": "2024-05-07T14:00:00",
    settings: {
      host_video: "false",
      participant_video: "false",
      join_before_host: "true"  // Allow participants to join before the host
    }
  };

  try {
    const response = await axios.post('https://api.zoom.us/v2/users/me/meetings', data, config);
    console.log(response)
    slot.meeting = response.data;
    const sdkJWT = generateZoomMeetingSDKJWT(response.data.id, 1);
    // console.log(sdkJWT)
    response.data.signature = sdkJWT
    // console.log(response.data)
    res.send(response.data);

  } catch (error) {
    console.error('Error creating Zoom meeting:', error);
    res.status(500).send('Failed to create Zoom meeting');
  }
});
app.get('/api/addReview', async (req, res) => {
  res.render('meeting-end-review');
})


// a review is added to the reviews collection with two identifiers: provider_id and patient_id
// total rating and total reviews are updated in the healthprovidersratings collection
// the healthproviders collection is not altered
app.post('/api/addReview', async (req, res) => {

  const data = req.body;
  const rating_ = parseInt(data.rating);   // convert to number //! check for errors here
  
  const patient_id = req.auth.userId;
  const slotId = data.slotId;
  const slot = await BookedSlots.findById(slotId)
  const provider_id_ = slot.provider_id
  
  // create a new review, timestamp(Date.now()) is automatically added 
  const review = new Reviews({
    provider_id: provider_id_,
    patient_id: patient_id,
    review: data.review,
    rating: rating_,
  });

  // update the healthprovidersratings collection
  try {
    const savedReview = await review.save();
  }
  catch (err) {
    console.error(err);
    functionStatusCode = -2;
    res.status(500).send("Error ocuured while adding review")
  }

  // update the healthprovidersratings collection
  const provider_id = provider_id_;
  // check if the provider already exists in the healthprovidersratings collection
  let updateResult = await HealthProvidersRatings.updateOne({
    provider_id: provider_id  // find the provider with the given provider_id
  }, {
    $inc: { total_rating: rating_, total_reviews: 1 } // increment total_rating by rating_ and total_reviews by 1
  }, {
    upsert: true    // if the provider does not exist, create a new object 
  });


  // consider adding rating to the healthproviders collection
  if (updateResult["acknowledged"] !== true) {
    res.status(500).send("Error ocuured while updating healthprovidersratings")
  }
  else {
    res.status(200).send("Review added successfully");
  }
})
app.get('/api/getReviews', async (req, res) => {

  // get all reviews for a given provider_id
  const provider_id = req.query.provider_id;
  let reviews;
  let ratings;
  try {
    reviews = await Reviews.find({ provider_id: provider_id });
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Error ocuured while fetching reviews")
  }

  // get the total rating and total reviews for the given provider_id
  try {
    ratings = await HealthProvidersRatings.findOne({ provider_id: provider_id });
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Error ocuured while fetching healthprovidersratings")
  }

  ratings.set("average_rating", ratings["total_rating"] / ratings["total_reviews"], { strict: false });

  let returnObject = {
    "reviews": reviews,
    "ratings": ratings
  }
  res.status(200).send(returnObject);
});
// Routes for scheduling appointments
// set provider availability by weekday
app.post('/api/setProviderAvailability', async (req, res) => {

  const data = req.body;
  const slot_duration_minutes = 30; // default slot duration is 30 minutes, can be changed later / from the frontend //! not implemented yet
  const weekday_availability = data.weekday_availability;

  // check if the provider already exists in the healthprovidersschedule collection
  let updateResult = await HealthProvidersSchedule.updateOne(
    { provider_id: data.provider_id }, // find the provider with the given provider_id
    {
      $set: {
        weekday_availability: data.weekday_availability,
        slot_duration_minutes: slot_duration_minutes
      }
    },
    { upsert: true } // if the provider does not exist, create a new object 
  );

  if (updateResult["acknowledged"] !== true) {
    res.status(500).send("Error ocuured while updating healthprovidersschedule")
  }
  else {
    res.status(200).send("Provider availability set successfully");
  }
})

app.get('/api/getProviderAvailability', async (req, res) => {
  const provider_id = req.query.provider_id;

  let availability;
  try {
    availability = await HealthProvidersSchedule.findOne({ provider_id: provider_id });
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Error ocuured while fetching healthprovidersschedule")
  }

  res.status(200).send(availability);
})
app.post('/api/getProviderAvailabilityByDay', async (req, res) => {
  const data = req.body;
  const provider_id = data.provider_id;
  const target_date = data.target_date; // format "YYYY-MM-DD"

  res.status(200).send({ provider_id: provider_id, target_date: target_date });
})

app.post('/api/bookSlot', async (req, res) => {
  // book a slot for a patient
  // generate start and end unix timestamps for the slot
  // let start_time = new Date(`${req.body.target_date}T${req.body.start_time}`);
  // let end_time = new Date(`${req.body.target_date}T${req.body.end_time}`);
  // create a new booked slot
  // convert a time string to a Date object
  // remove zulu time from the string


  const bookedSlot = await BookedSlots({
    provider_id: req.body.provider_id,
    patient_id: req.auth.userId,
    date: req.body.target_date,
    start_time: req.body.start_time,
    end_time: req.body.end_time,
    slot_duration_minutes: req.body.slot_duration_minutes
  });

  try {
    const savedReview = await bookedSlot.save();
    res.status(200).send("Slot booked successfully");
  }
  catch (err) {
    console.error(err);
    functionStatusCode = -2;
    res.status(500).send("Error ocuured while adding review")
  }
});

app.get('/api/getOpenSlots', async (req, res) => {
  // get provider schedule 
  // examine for available day
  const provider_id = req.query.provider_id;
  const target_date = req.query.target_date; // format "YYYY-MM-DD"
  const days = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday"
  }

  // resolve date to day
  const date = new Date(target_date);
  const day = days[date.getDay()];

  // get provider schedule
  let schedule;
  try {
    schedule = await HealthProvidersSchedule.findOne({ provider_id: provider_id });
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Error ocuured while fetching healthprovidersschedule")
  }

  // check for availability on the given day  -- if provider is available on fridays, saturdays, sundays
  // console.log(schedule);
  if (schedule === null || schedule === undefined) { return res.send([]); }

  let day_availability = [];
  if (schedule["weekday_availability"] != undefined) {
    day_availability = schedule["weekday_availability"][day];
    if (!day_availability || day_availability.length === 0) {
      return res.status(200).send([]);
    }
  }
  else {
    return res.status(200).send([]);
  }

  // generate start and end times for the given day
  const start_time = new Date(`${target_date}T${day_availability[0].start}`);
  const end_time = new Date(`${target_date}T${day_availability[0].end}`);

  // get booked slots for the given provider_id and target_date
  let bookedSlots;
  try {
    bookedSlots = await BookedSlots.find({ provider_id: provider_id, date: target_date });
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Error ocuured while fetching booked slots")
  }

  let slots = generateSlots(start_time, end_time, schedule.slot_duration_minutes, bookedSlots);
  res.send(slots);
});
// Existing route that should handle patient ID passed as query parameter
app.get('/patient-dashboard', async (req, res) => {
  const isPatient = await patientCheck(req.auth.userId);
  if (!isPatient) {
    return res.send("Unauthorized")
  }
  const patientId = req.auth.userId; // Correctly capture the patientId from query parameters
  if (!patientId) {
    // If no patientId is provided, render a prompt page or handle the error
    return res.render('patient-id-prompt');
  }

  // console.log('Fetching prescriptions for patient ID:', patientId);
  const Prescription = mongoose.model('prescriptions');

  try {
    const prescriptions = await Prescription.find({ patient_id: patientId }).lean();
    res.render('patient-dashboard', { prescriptions });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error occurred while fetching prescriptions");
  }
});


// Serve the specific prescriptions once the patient ID is known
app.get('/patient-dashboard/:patientId', async (req, res) => {
  const { patientId } = req.params;
  // console.log('Fetching prescriptions for patient ID:', patientId);
  const Prescription = mongoose.model('prescriptions');

  try {
    const prescriptions = await Prescription.find({ patient_id: patientId }).lean();
    res.render('patient-dashboard', { prescriptions });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error occurred while fetching prescriptions");
  }
});

app.post('/api/verifyUser',async (req,res)=>{
  const {patient_id} = req.body
  const Patient = mongoose.model('patients');
  let patient = await Patient.findOne({patient_id:patient_id})

  const doctor = await HealthProviders.findOne({userId:req.auth.userId})
  try{
    patient = patient.toObject()
    patient["provider_name"]=doctor.first_name
    res.send(patient)
  } catch {
    res.send({})
  }
})


// POST endpoint to create a new prescription
app.post('/api/createPrescription', async (req, res) => {
  let {
    provider_id,
    patient_id,
    instructions
  } = req.body;

  const provider = await HealthProviders.findOne({userId:req.auth.userId})
  provider_id = provider.provider_id


  const newPrescription = new mongoose.model('prescriptions')({
    provider_id,
    patient_id,
    instructions
  });

  try {
    const savedPrescription = await newPrescription.save();
    // console.log('Saved Prescription:', savedPrescription); // Log the saved prescription
    res.status(200).send({ message: 'Prescription saved successfully', prescriptionId: savedPrescription._id });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error occurred while saving the prescription");
  }
});


app.post('/api/register-patient', async (req, res) => {
  try {
    const { patient_id, name, email, dob, height, blood_group, gender } = req.body;
    const Patient = mongoose.model('patients');
    const newPatient = new Patient({
      patient_id,
      name,
      email,
      dob: new Date(dob), // Ensure the date is correctly formatted
      height,
      blood_group,
      gender
    });

    await newPatient.save(); // Save the new patient to the database
    res.status(201).send({ message: 'Patient registered successfully', patientId: newPatient._id });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).send({ message: 'Failed to register patient', error: error.message });
  }
});

app.get('/api/check-patient', async (req, res) => {
  const patientId = req.query.patientId;
  const Patient = mongoose.model('patients');
  try {
    const patient = await Patient.findOne({ patient_id: patientId });
    if (patient) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error finding patient:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});
// GET endpoint for a patient to view their prescriptions
app.post('/api/viewPrescriptions', async (req, res) => {
  // const { patientId } = req.params;
  
});
// homepage
app.get('/', (req, res) => {
  res.render('home');
});
app.get('/test', (req, res) => {
  res.render('patient-onboarding');
});



const clientId = process.env.ZOOM_CLIENT_ID;
const clientSecret = process.env.ZOOM_CLIENT_SECRET;
const accountId = process.env.ZOOM_ACCOUNT_ID; // Usually found in your Zoom account settings

const getToken = async () => {
  const url = 'https://zoom.us/oauth/token';
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };
  const body = querystring.stringify({
    grant_type: 'account_credentials',
    account_id: accountId
  });

  try {
    const response = await axios.post(url, body, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching Zoom token:', error);
    return null;
  }
};

app.get('/get-token', async (req, res) => {
  const tokenData = await getToken();
  if (tokenData) {
    res.json(tokenData);
  } else {
    res.status(500).send('Failed to get token');
  }
});


function generateZoomMeetingSDKJWT(meetingNumber, role) {
  const iat = Math.floor(Date.now() / 1000); // Current time in seconds since epoch
  const exp = iat + 7200; // Token valid for 2 hours

  const payload = {
    appKey: clientId, // Your Zoom SDK Client ID
    mn: meetingNumber, // Zoom Meeting Number
    role: role, // 0 for participant, 1 for host
    iat: iat,
    exp: exp,
    tokenExp: exp
  };

  const token = jwt.sign(payload, clientSecret, { algorithm: 'HS256' });
  return token;
}