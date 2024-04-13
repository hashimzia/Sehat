import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import './config.mjs';
import './db.mjs';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const port = 3000;

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
  res.send('Hello World!')
})
// full-text search as defined in db.mjs text index
app.get('/api/searchHealthProviders', async (req, res) => {

    let searchQuery = req.query;
    let answer = await HealthProviders.find({ $text: { $search: searchQuery } });
    res.send(answer);
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
app.post('/api/setProviderAvailabilityByWeekday', async (req, res) => {
  
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

