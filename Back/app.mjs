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
import session from 'express-session';


const app = express();
const exhbs = new ExpressHandlebars({ defaultLayout: 'main', extname: '.hbs' });
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));

app.engine('hbs', exhbs.engine);
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure session middleware
app.use(session({
  secret: 'your_secret_key', // Replace 'your_secret_key' with a real secret string
  resave: false,
  saveUninitialized: false, // Change to true if you want to save session before anything is assigned to it
  cookie: { secure: false } // Set to true if using https
}));

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


console.log(mongoose.connection.readyState);

app.listen(port, () => {
  console.log(`backend listening on port ${port}`)
})

app.get('/', (req, res) => {
  res.render('home');
})
app.get('/login', (req, res) => {
  res.render('login');
})
app.get('/appointment-booking', (req, res) => {
  res.render('appointment-booking');
})
app.get('/search', (req, res) => {
  res.render('search');
})

// full-text search as defined in db.mjs text index
app.get('/api/searchHealthProviders', async (req, res) => {

    let searchQuery = req.query.query;
    let answer = await HealthProviders.find({ $text: { $search: searchQuery } });
    res.status(200).send(answer);
})

// a review is added to the reviews collection with two identifiers: provider_id and patient_id
// total rating and total reviews are updated in the healthprovidersratings collection
// the healthproviders collection is not altered
app.post('/api/addReview', async (req,res) => {

    const data = req.body;
    const rating_ = parseInt(data.rating);   // convert to number //! check for errors here
    console.log(data);

    // create a new review, timestamp(Date.now()) is automatically added 
    const review = new Reviews({
        provider_id: data.provider_id,
        patient_id: data.patient_id,
        review: data.review,
        rating: rating_, 
    });

    // update the healthprovidersratings collection
    try {
      const savedReview = await review.save();
    }
    catch (err){
      console.error(err);
      functionStatusCode = -2;
      res.status(500).send("Error ocuured while adding review")
    }

    // update the healthprovidersratings collection
    const provider_id = data.provider_id;
    // check if the provider already exists in the healthprovidersratings collection
    let updateResult = await HealthProvidersRatings.updateOne({
        provider_id: provider_id  // find the provider with the given provider_id
        }, {
        $inc: { total_rating: rating_, total_reviews: 1 } // increment total_rating by rating_ and total_reviews by 1
        }, {
        upsert: true    // if the provider does not exist, create a new object 
        });
    
    
    // consider adding rating to the healthproviders collection
    if (updateResult["acknowledged"] !== true){
      res.status(500).send("Error ocuured while updating healthprovidersratings")
    }
    else{
      res.status(200).send("Review added successfully");
    }
})
app.get('/api/getReviews', async (req, res) =>{

    // get all reviews for a given provider_id
    const provider_id = req.query.provider_id;
    let reviews;
    let ratings;
    try{
      reviews = await Reviews.find({provider_id: provider_id});
    }
    catch(err){
      console.error(err);
      res.status(500).send("Error ocuured while fetching reviews")
    }

    // get the total rating and total reviews for the given provider_id
    try{
      ratings = await HealthProvidersRatings.findOne({provider_id: provider_id});
    }
    catch(err){
      console.error(err);
      res.status(500).send("Error ocuured while fetching healthprovidersratings")
    }

    ratings.set("average_rating", ratings["total_rating"] / ratings["total_reviews"], {strict: false});

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

  // check if the provider already exists in the healthprovidersschedule collection
  let updateResult = await HealthProvidersSchedule.updateOne(
    { provider_id: data.provider_id }, // find the provider with the given provider_id
    {
      $set: {
        weekday_availability: data.weekday_availability,
        slot_duration_minutes: data.slot_duration_minutes
      }
    },
    { upsert: true } // if the provider does not exist, create a new object 
  );

  if (updateResult["acknowledged"] !== true){
    res.status(500).send("Error ocuured while updating healthprovidersschedule")
  }
  else{
    res.status(200).send("Provider availability set successfully");
  }
})
app.get('/api/getProviderAvailability', async (req, res) => {
  const provider_id = req.query.provider_id;

  let availability;
  try{
    availability = await HealthProvidersSchedule.findOne({provider_id: provider_id});
  }
  catch(err){
    console.error(err);
    res.status(500).send("Error ocuured while fetching healthprovidersschedule")
  }

  res.status(200).send(availability);
})
app.get('/api/getProviderAvailabilityByDay', async (req, res) => {
  
})

// Existing route that should handle patient ID passed as query parameter
app.get('/patient-dashboard', async (req, res) => {
  const patientId = req.query.patientId; // Correctly capture the patientId from query parameters
  if (!patientId) {
      // If no patientId is provided, render a prompt page or handle the error
      return res.render('patient-id-prompt');
  }

  console.log('Fetching prescriptions for patient ID:', patientId);
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
  console.log('Fetching prescriptions for patient ID:', patientId);
  const Prescription = mongoose.model('prescriptions');

  try {
      const prescriptions = await Prescription.find({ patient_id: patientId }).lean();
      res.render('patient-dashboard', { prescriptions });
  } catch (err) {
      console.error(err);
      res.status(500).send("Error occurred while fetching prescriptions");
  }
});



// POST endpoint to create a new prescription
app.post('/api/createPrescription', async (req, res) => {
  const {
      provider_id,
      patient_id,
      medication_name,
      dosage,
      frequency,
      duration,
      instructions
  } = req.body;

  // Construct medication array from the flat structure
  const medication = [{
      name: medication_name,
      dosage: dosage,
      frequency: frequency,
      duration: duration
  }];


  const newPrescription = new mongoose.model('prescriptions')({
      provider_id,
      patient_id,
      medication,  // this now matches the expected array structure
      instructions
  });

  try {
      const savedPrescription = await newPrescription.save();
      console.log('Saved Prescription:', savedPrescription); // Log the saved prescription
      res.status(200).send({ message: 'Prescription saved successfully', prescriptionId: savedPrescription._id });
  } catch (err) {
      console.error(err);
      res.status(500).send("Error occurred while saving the prescription");
  }
});



// GET endpoint for a patient to view their prescriptions
app.get('/api/viewPrescriptions/:patientId', async (req, res) => {
  const { patientId } = req.params;
  console.log(patientId);
  const Prescription = mongoose.model('prescriptions');

  try {
      const prescriptions = await Prescription.find({ patient_id: patientId });
      res.status(200).send(prescriptions);
  } catch (err) {
      console.error(err);
      res.status(500).send("Error occurred while fetching prescriptions");
  }
});


// homepage
app.get('/home', (req, res) => {
  res.render('home');
})