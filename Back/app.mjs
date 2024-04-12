import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import './config.mjs';
import './db.mjs';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
const port = 3000;

// maintain case sensitivity, PascalCase for identifiers, lowercase ONLY for collection names
const HealthProviders = mongoose.model('healthproviders');
const Reviews = mongoose.model('reviews');
const HealthProvidersRatings = mongoose.model('healthprovidersratings');

console.log(mongoose.connection.readyState);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`backend listening on port ${port}`)
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
    
    if (updateResult["acknowledged"] !== true){
      res.status(500).send("Error ocuured while updating healthprovidersratings")
    }
    else{
      res.status(200).send("Review added successfully");
    }
})
